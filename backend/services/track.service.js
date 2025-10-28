const Progress = require('../models/progress.model');
const Track = require('../models/track.model');
const Module = require('../models/module.model');
const Lesson = require('../models/lesson.model');
const {
  prepareTrackMatchingContext,
  findTrackProgressByIdentifier,
  ensureTrackProgressEntry,
  createTrackVariants,
  buildTrackAliases,
  uniqueModuleTrackVariants,
} = require('../utils/track.utils');

async function startTrack(userId, trackId) {
  const track = await Track.findOne({
    status: 'active',
    $or: [{ _id: trackId }, { trackId }],
  });
  if (!track) throw new Error('Track not found');

  let progress = await Progress.findOne({ userId });
  if (!progress) progress = await Progress.create({ userId });

  const trackContext = await prepareTrackMatchingContext(progress);

  // Check prerequisites
  if (track.prerequisites?.length > 0) {
    const prerequisitesCompleted = track.prerequisites.every((prereqId) => {
      const { trackProgress: prereqProgress } = findTrackProgressByIdentifier(
        trackContext,
        prereqId
      );
      const satisfied = prereqProgress && prereqProgress.status === 'completed';
      if (!satisfied) {
        console.log('[TRACK] startTrack: prerequisite not met', {
          userId: String(userId),
          targetTrack: String(track._id),
          prereqId,
          found: !!prereqProgress,
          status: prereqProgress?.status,
        });
      }
      return satisfied;
    });
    if (!prerequisitesCompleted) throw new Error('Prerequisites not completed');
  }

  // Get or create trackProgress
  const { trackProgress } = ensureTrackProgressEntry(
    progress,
    trackContext,
    track._id,
    {
      status: 'unlocked',
      modulesProgress: [],
      startedAt: new Date(),
    }
  );

  // Unlock modules
  const moduleTrackIds = new Set([
    ...uniqueModuleTrackVariants(track),
    ...createTrackVariants(trackId),
  ]);
  const allModules = await Module.find({
    status: 'active',
    trackId: { $in: Array.from(moduleTrackIds) },
  }).sort({ order: 1 });
  allModules.forEach((mod, index) => {
    let moduleProgress = trackProgress.modulesProgress.find(mp => String(mp.moduleId) === String(mod._id));
    if (!moduleProgress) {
      moduleProgress = {
        moduleId: mod._id,
        status: index === 0 ? 'unlocked' : 'locked',
        lessonsProgress: [],
        quizAttempts: [],
        labAttempts: []
      };
      if (index === 0) {
        moduleProgress.startedAt = new Date();
      }
      trackProgress.modulesProgress.push(moduleProgress);
    } else if (index === 0 && moduleProgress.status === 'locked') {
      // Ensure the very first module is available to begin
      moduleProgress.status = 'unlocked';
      moduleProgress.startedAt = moduleProgress.startedAt || new Date();
    }
  });

  progress.currentTrack = track._id;
  progress.currentModule = allModules.length ? allModules[0]._id : null;
  trackProgress.status = 'in_progress';
  progress.lastActivityAt = new Date();
  progress.markModified('tracksProgress');
  await progress.save();

  return { progress, trackProgress, allModules };
}

async function startLesson(userId, lessonId) {
  const lesson = await Lesson.findOne({ _id: lessonId, status: 'active' });
  if (!lesson) throw new Error('Lesson not found');

  const module = await Module.findById(lesson.moduleId);
  if (!module) throw new Error('Module not found');

  const progress = await Progress.findOne({ userId });
  if (!progress) throw new Error('Please start the track first');

  const trackContext = await prepareTrackMatchingContext(progress);

  let { trackProgress, track: trackDoc } = findTrackProgressByIdentifier(
    trackContext,
    module.trackId
  );

  if (!trackProgress) {
    const fallbackMatch = findTrackProgressByIdentifier(
      trackContext,
      module.trackId?.toString?.() || module.trackId
    );
    trackProgress = fallbackMatch.trackProgress;
    trackDoc = fallbackMatch.track || trackDoc;
  }

  if (!trackProgress) throw new Error('Please start the track first');

  if (!trackDoc) {
    trackDoc =
      (module.trackId &&
        (await Track.findOne({
          status: 'active',
          $or: [{ _id: module.trackId }, { trackId: module.trackId }],
        }).lean())) ||
      null;
    if (trackDoc) {
      buildTrackAliases(trackDoc).forEach((alias) => {
        if (!trackContext.aliasMap.has(alias)) {
          trackContext.aliasMap.set(alias, trackDoc);
        }
      });
    }
  }

  console.log('[TRACK] startLesson: incoming request', {
    userId: String(userId),
    lessonId: String(lessonId),
    moduleId: String(module._id),
    moduleCode: module.moduleId,
    trackId: String(module.trackId),
    lessonPrereqs: lesson.prerequisites || [],
  });

  console.log('[TRACK] startLesson: existing module progresses', {
    trackId: String(trackProgress.trackId),
    modulesProgress: (trackProgress.modulesProgress || []).map((mp) => ({
      moduleId: String(mp.moduleId),
      status: mp.status,
      lessonsProgressCount: mp.lessonsProgress?.length || 0,
    })),
  });

  const moduleTrackVariants = new Set([
    ...(trackDoc ? uniqueModuleTrackVariants(trackDoc) : []),
    ...createTrackVariants(module.trackId),
  ]);

  const modulesInTrack = await Module.find({
    status: 'active',
    trackId: { $in: Array.from(moduleTrackVariants) },
  }).sort({ order: 1 });

  const moduleIndexRaw = modulesInTrack.findIndex(
    (mod) => String(mod._id) === String(module._id)
  );
  const moduleIndex = moduleIndexRaw === -1 ? 0 : moduleIndexRaw;

  const buildModuleAliases = (modDoc) => {
    const aliases = new Set();
    if (!modDoc) return aliases;

    const rawId = String(modDoc._id || '').trim();
    if (rawId) {
      aliases.add(rawId);
      aliases.add(rawId.toLowerCase());
    }

    const moduleCode = String(modDoc.moduleId || '').trim();
    if (moduleCode) {
      const lower = moduleCode.toLowerCase();
      aliases.add(moduleCode);
      aliases.add(lower);
      aliases.add(lower.replace(/^mod[-_]?/, 'module_'));
      aliases.add(moduleCode.replace(/^MOD[-_]?/i, 'module_'));
      aliases.add(lower.replace(/^module[-_]?/, 'module_'));
      aliases.add(lower.replace(/[^a-z0-9]/g, ''));
      aliases.add(moduleCode.replace(/[^a-zA-Z0-9]/g, ''));
    }

    return aliases;
  };

  const createLookupVariants = (value) => {
    if (value === undefined || value === null) return [];
    const raw = String(value).trim();
    if (!raw) return [];
    const lower = raw.toLowerCase();
    return Array.from(
      new Set([
        raw,
        lower,
        raw.replace(/^MOD[-_]?/i, 'module_'),
        lower.replace(/^mod[-_]?/, 'module_'),
        raw.replace(/^MODULE[-_]?/i, 'module_'),
        lower.replace(/^module[-_]?/, 'module_'),
        raw.replace(/[^a-zA-Z0-9]/g, ''),
        lower.replace(/[^a-z0-9]/g, ''),
      ])
    ).filter(Boolean);
  };

  const moduleAliasMap = new Map();
  modulesInTrack.forEach((modDoc) => {
    buildModuleAliases(modDoc).forEach((alias) => {
      if (!moduleAliasMap.has(alias)) {
        moduleAliasMap.set(alias, modDoc);
      }
    });
  });

  console.log('[TRACK] startLesson: module alias map prepared', {
    trackId: String(trackProgress.trackId),
    modules: modulesInTrack.map((modDoc) => ({
      id: String(modDoc._id),
      code: modDoc.moduleId,
      aliases: Array.from(buildModuleAliases(modDoc)),
    })),
  });

  const findModuleProgressFor = (modDoc) => {
    if (!modDoc) return null;
    const targetAliases = buildModuleAliases(modDoc);
    return (
      trackProgress.modulesProgress?.find((mp) => {
        const mpAliases = new Set(createLookupVariants(mp.moduleId));
        for (const alias of targetAliases) {
          if (mpAliases.has(alias)) return true;
        }
        return false;
      }) || null
    );
  };

  let moduleProgress =
    trackProgress.modulesProgress.find(
      (mp) => String(mp.moduleId) === String(module._id)
    ) || findModuleProgressFor(module);

  console.log('[TRACK] startLesson: resolved moduleProgress', {
    moduleId: String(module._id),
    moduleCode: module.moduleId,
    status: moduleProgress?.status,
    lessonsCount: moduleProgress?.lessonsProgress?.length || 0,
    moduleAliases: Array.from(buildModuleAliases(module)),
  });

  if (moduleProgress?.lessonsProgress?.length) {
    console.log('[TRACK] startLesson: existing lessonsProgress snapshot', {
      lessons: moduleProgress.lessonsProgress.map((lp) => ({
        lessonId: String(lp.lessonId),
        status: lp.status,
        completedAt: lp.completedAt,
      })),
    });
  }

  if (!moduleProgress) {
    const previousModuleId =
      moduleIndex > 0 ? String(modulesInTrack[moduleIndex - 1]._id) : null;
    const previousModuleProgress = previousModuleId
      ? trackProgress.modulesProgress.find(
          (mp) => String(mp.moduleId) === previousModuleId
        )
      : null;
    const canUnlock =
      moduleIndex === 0 ||
      (previousModuleProgress && previousModuleProgress.status === 'completed');

    moduleProgress = {
      moduleId: module._id,
      status: canUnlock ? 'unlocked' : 'locked',
      lessonsProgress: [],
      quizAttempts: [],
      labAttempts: [],
    };
    if (canUnlock) {
      moduleProgress.startedAt = new Date();
    }
    trackProgress.modulesProgress.push(moduleProgress);
  }

  if (moduleProgress.status === 'locked') {
    throw new Error('Module is locked');
  }

  moduleProgress.startedAt = moduleProgress.startedAt || new Date();

  let lessonProgress = moduleProgress.lessonsProgress.find(
    (lp) => String(lp.lessonId) === String(lesson._id)
  );

  if (!lessonProgress) {
    if (lesson.prerequisites?.length > 0) {
      const checkResults = [];
      const prerequisitesCompleted = lesson.prerequisites.every((prereqId) => {
        const trackMatch = findTrackProgressByIdentifier(
          trackContext,
          prereqId
        );
        if (trackMatch.trackProgress) {
          const ok = trackMatch.trackProgress.status === 'completed';
          checkResults.push({
            prereqId,
            type: 'track',
            ok,
            status: trackMatch.trackProgress.status,
          });
          return ok;
        }

        if (prereqId.match(/^[0-9a-fA-F]{24}$/)) {
          const variants = createLookupVariants(prereqId);
          const moduleDoc =
            variants.map((v) => moduleAliasMap.get(v)).find(Boolean) ||
            modulesInTrack.find((m) => String(m._id) === String(prereqId)) ||
            null;
          console.log('[TRACK] startLesson: module prerequisite check (ObjectId)', {
            prereqId,
            variants,
            foundModule: moduleDoc
              ? { id: String(moduleDoc._id), code: moduleDoc.moduleId }
              : null,
          });
          const prereqModuleProgress = moduleDoc
            ? findModuleProgressFor(moduleDoc)
            : trackProgress.modulesProgress.find(
                (mp) => String(mp.moduleId) === String(prereqId)
              );
          console.log('[TRACK] startLesson: module prerequisite progress', {
            prereqId,
            status: prereqModuleProgress?.status,
            exists: !!prereqModuleProgress,
          });
          const ok =
            prereqModuleProgress && prereqModuleProgress.status === 'completed';
          checkResults.push({ prereqId, type: 'module_objectId', ok });
          return ok;
        }

        const variants = createLookupVariants(prereqId);
        const variantSet = new Set(variants);
        for (const variant of variants) {
          const prereqModuleDoc = moduleAliasMap.get(variant);
          if (prereqModuleDoc) {
            const prereqModuleProgress = findModuleProgressFor(
              prereqModuleDoc
            );
            console.log('[TRACK] startLesson: module code prerequisite check', {
              prereqId,
              variant,
              module: {
                id: String(prereqModuleDoc._id),
                code: prereqModuleDoc.moduleId,
              },
              status: prereqModuleProgress?.status,
            });
            if (
              prereqModuleProgress &&
              prereqModuleProgress.status === 'completed'
            ) {
              checkResults.push({ prereqId, type: 'module_code', ok: true });
              return true;
            }
            checkResults.push({ prereqId, type: 'module_code', ok: false });
            return false;
          }
        }

        const allModuleProgresses = trackProgress.modulesProgress || [];
        for (const mp of allModuleProgresses) {
          const matchedLesson = (mp.lessonsProgress || []).find((lp) => {
            const lessonVariants = createLookupVariants(lp.lessonId);
            return lessonVariants.some((v) => variantSet.has(v));
          });
          if (matchedLesson) {
            console.log('[TRACK] startLesson: lesson prerequisite match', {
              prereqId,
              moduleId: String(mp.moduleId),
              lessonId: matchedLesson.lessonId,
              status: matchedLesson.status,
            });
          }
          if (matchedLesson && matchedLesson.status === 'completed') {
            checkResults.push({ prereqId, type: 'lesson', ok: true });
            return true;
          }
        }

        checkResults.push({ prereqId, type: 'unknown', ok: false });
        return false;
      });

      console.log('[TRACK] startLesson: prerequisite summary', {
        lessonId: String(lesson._id),
        lessonName: lesson.title || lesson.name,
        results: checkResults,
        passed: prerequisitesCompleted,
      });

      if (!prerequisitesCompleted) {
        console.log(
          '[TRACK] startLesson: blocking lesson start due to unmet prerequisites',
          {
            lessonId: String(lesson._id),
            lessonName: lesson.title || lesson.name,
          }
        );
        throw new Error('Prerequisites not completed');
      }
    }

    lessonProgress = {
      lessonId: lesson._id,
      status: 'in_progress',
      timeSpent: 0,
      lastPosition: 0,
      completedContentItems: [],
      startedAt: new Date(),
    };
    moduleProgress.lessonsProgress.push(lessonProgress);
  } else {
    lessonProgress.status = 'in_progress';
  }

  progress.currentLesson = lesson._id;
  moduleProgress.status = 'in_progress';
  trackProgress.status = 'in_progress';
  progress.lastActivityAt = new Date();
  progress.markModified('tracksProgress');
  await progress.save();

  return { progress, trackProgress, moduleProgress, lessonProgress };
}

module.exports = { startTrack, startLesson };
