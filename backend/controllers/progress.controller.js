const { ensureLessonProgress } = require('../services/progress.service');
const { unlockNextLesson, unlockNextModule } = require('../services/unlock.service');
const Module = require('../models/module.model');
const Track = require('../models/track.model');
const Progress = require('../models/progress.model');
const {
  areAllTrackModulesCompleted,
  createTrackVariants,
  collectModuleIdentifierVariants,
  findModuleProgressByIdentifier,
} = require('../utils/track.utils');

exports.getUserProgress = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    let progress = await Progress.findOne({ userId: req.user.id });
    if (!progress) {
      progress = await Progress.create({ userId: req.user.id, tracksProgress: [] });
    }

    if (!Array.isArray(progress.tracksProgress)) {
      progress.tracksProgress = [];
    }

    let progressChanged = false;

    // Normalise nested arrays on the existing progress document
    for (const tp of progress.tracksProgress) {
      if (!Array.isArray(tp.modulesProgress)) {
        tp.modulesProgress = [];
        progressChanged = true;
      }
      for (const mp of tp.modulesProgress) {
        if (!Array.isArray(mp.lessonsProgress)) {
          mp.lessonsProgress = [];
          progressChanged = true;
        }
        if (!Array.isArray(mp.quizAttempts)) {
          mp.quizAttempts = [];
          progressChanged = true;
        }
        if (!Array.isArray(mp.labAttempts)) {
          mp.labAttempts = [];
          progressChanged = true;
        }
      }
    }

    // Load canonical track/module data
    const [tracks, modules] = await Promise.all([
      Track.find({ status: 'active' }).sort({ order: 1 }).lean(),
      Module.find({ status: 'active' }).lean(),
    ]);

    const trackById = new Map();
    const trackAliasMap = new Map();
    const addTrackAlias = (value, track) => {
      if (value === undefined || value === null) return;
      const variants = createTrackVariants(value);
      variants.forEach((variant) => {
        if (variant && !trackAliasMap.has(variant)) {
          trackAliasMap.set(variant, track);
        }
      });
      const raw = String(value).trim();
      if (raw && !trackAliasMap.has(raw)) {
        trackAliasMap.set(raw, track);
      }
    };
    tracks.forEach((track) => {
      trackById.set(String(track._id), track);
      addTrackAlias(track._id, track);
      addTrackAlias(track.trackId, track);
      addTrackAlias(track.id, track);
      addTrackAlias(track.legacyId, track);
      addTrackAlias(track.slug, track);
      addTrackAlias(track.name, track);
      if (typeof track.order === 'number') {
        addTrackAlias(`track_${track.order}`, track);
        addTrackAlias(`track${track.order}`, track);
      }
    });

    const moduleAliasMap = new Map();
    const addModuleAlias = (value, mod) => {
      if (value === undefined || value === null) return;
      const variants = collectModuleIdentifierVariants(value);
      variants.forEach((variant) => {
        if (variant && !moduleAliasMap.has(variant)) {
          moduleAliasMap.set(variant, mod);
        }
      });
      const raw = String(value).trim();
      if (raw && !moduleAliasMap.has(raw)) {
        moduleAliasMap.set(raw, mod);
      }
    };
    modules.forEach((mod) => {
      addModuleAlias(mod, mod);
      addModuleAlias(mod._id, mod);
      addModuleAlias(mod.moduleId, mod);
      addModuleAlias(mod.slug, mod);
      addModuleAlias(mod.code, mod);
    });

    const resolveTrackByIdentifier = (identifier) => {
      if (identifier === undefined || identifier === null) return null;
      const variants = createTrackVariants(identifier);
      for (const variant of variants) {
        if (trackAliasMap.has(variant)) return trackAliasMap.get(variant);
      }
      const direct = trackById.get(String(identifier));
      if (direct) return direct;
      return null;
    };

    const resolveTrackFromModules = (tp) => {
      if (!Array.isArray(tp.modulesProgress)) return null;
      for (const mp of tp.modulesProgress) {
        const moduleVariants = collectModuleIdentifierVariants(mp.moduleId || mp);
        for (const variant of moduleVariants) {
          if (moduleAliasMap.has(variant)) {
            const modDoc = moduleAliasMap.get(variant);
            const trackDoc =
              trackById.get(String(modDoc.trackId)) ||
              resolveTrackByIdentifier(modDoc.trackId);
            if (trackDoc) return trackDoc;
          }
        }
      }
      return null;
    };

    const mergeTrackProgressEntries = (target, source) => {
      if (!Array.isArray(target.modulesProgress)) target.modulesProgress = [];
      if (!Array.isArray(source.modulesProgress)) return;

      const normalizeKey = (value) => {
        const variants = collectModuleIdentifierVariants(value);
        return variants.length ? variants[0] : String(value || '').toLowerCase();
      };

      const moduleMap = new Map();
      target.modulesProgress.forEach((mp) => {
        moduleMap.set(normalizeKey(mp.moduleId), mp);
      });

      source.modulesProgress.forEach((mp) => {
        const key = normalizeKey(mp.moduleId);
        if (!moduleMap.has(key)) {
          target.modulesProgress.push(mp);
          moduleMap.set(key, mp);
        } else {
          const existing = moduleMap.get(key);
          if (mp.status === 'completed' && existing.status !== 'completed') {
            existing.status = 'completed';
            existing.completedAt = existing.completedAt || mp.completedAt;
          }
          if (!existing.startedAt && mp.startedAt) {
            existing.startedAt = mp.startedAt;
          }
          if (
            Array.isArray(mp.lessonsProgress) &&
            mp.lessonsProgress.length
          ) {
            if (!Array.isArray(existing.lessonsProgress)) {
              existing.lessonsProgress = [...mp.lessonsProgress];
            } else {
              const lessonMap = new Map(
                existing.lessonsProgress.map((lp) => [String(lp.lessonId), lp])
              );
              mp.lessonsProgress.forEach((lp) => {
                const lessonKey = String(lp.lessonId);
                if (!lessonMap.has(lessonKey)) {
                  existing.lessonsProgress.push(lp);
                  lessonMap.set(lessonKey, lp);
                } else {
                  const existingLesson = lessonMap.get(lessonKey);
                  if (
                    lp.status === 'completed' &&
                    existingLesson.status !== 'completed'
                  ) {
                    existingLesson.status = 'completed';
                    existingLesson.completedAt =
                      existingLesson.completedAt || lp.completedAt;
                  }
                }
              });
            }
          }
        }
      });

      if (source.status === 'completed' && target.status !== 'completed') {
        target.status = 'completed';
        target.completedAt = target.completedAt || source.completedAt || new Date();
      }
      if (!target.startedAt && source.startedAt) {
        target.startedAt = source.startedAt;
      }
    };

    // Canonicalise track progress entries (align IDs, merge duplicates)
    const canonicalMap = new Map();
    const canonicalList = [];

    for (const tp of progress.tracksProgress) {
      let trackDoc =
        resolveTrackByIdentifier(tp.trackId) || resolveTrackFromModules(tp);

      if (trackDoc && String(tp.trackId) !== String(trackDoc._id)) {
        tp.trackId = String(trackDoc._id);
        progressChanged = true;
      }

      const key = String(tp.trackId);

      if (canonicalMap.has(key)) {
        const existing = canonicalMap.get(key);
        mergeTrackProgressEntries(existing, tp);
        progressChanged = true;
      } else {
        canonicalMap.set(key, tp);
        canonicalList.push(tp);
      }
    }

    if (canonicalList.length !== progress.tracksProgress.length) {
      progress.tracksProgress = canonicalList;
    }

    const progressByTrackId = new Map(
      progress.tracksProgress.map((tp) => [String(tp.trackId), tp])
    );

    const resolvePrereqDocs = (prereqs) =>
      (Array.isArray(prereqs) ? prereqs : [])
        .map((id) => resolveTrackByIdentifier(id))
        .filter(Boolean);

    for (const track of tracks) {
      const key = String(track._id);
      const prereqDocs = resolvePrereqDocs(track.prerequisites);
      const prereqsMet = prereqDocs.every((doc) => {
        const prereqProgress = progressByTrackId.get(String(doc._id));
        return prereqProgress && prereqProgress.status === 'completed';
      });

      let trackProgress = progressByTrackId.get(key);
      if (!trackProgress) {
        trackProgress = {
          trackId: key,
          status: prereqsMet ? 'unlocked' : 'locked',
          modulesProgress: [],
          overallScore: 0,
          startedAt: prereqsMet ? new Date() : null,
          completedAt: null,
        };
        progress.tracksProgress.push(trackProgress);
        progressByTrackId.set(key, trackProgress);
        progressChanged = true;
      } else if (String(trackProgress.trackId) !== key) {
        trackProgress.trackId = key;
        progressChanged = true;
      }

      const allModulesDone = await areAllTrackModulesCompleted(
        trackProgress,
        track,
        track._id
      );

      if (allModulesDone) {
        if (trackProgress.status !== 'completed') {
          trackProgress.status = 'completed';
          trackProgress.completedAt = trackProgress.completedAt || new Date();
          if (!trackProgress.startedAt) {
            trackProgress.startedAt = trackProgress.completedAt;
          }
          progressChanged = true;
        }
        continue;
      }

      const hasActiveModules =
        Array.isArray(trackProgress.modulesProgress) &&
        trackProgress.modulesProgress.some(
          (mp) => mp.status && mp.status !== 'locked'
        );

      if (!prereqsMet) {
        if (trackProgress.status === 'unlocked') {
          trackProgress.status = 'locked';
          progressChanged = true;
        }
      } else {
        const desiredStatus = hasActiveModules ? 'in_progress' : 'unlocked';
        if (trackProgress.status !== desiredStatus) {
          trackProgress.status = desiredStatus;
          if (desiredStatus !== 'locked' && !trackProgress.startedAt) {
            trackProgress.startedAt = new Date();
          }
          progressChanged = true;
        }
      }
    }

    if (progressChanged) {
      progress.markModified('tracksProgress');
      await progress.save();
    }

    res.json(progress.toObject());
  } catch (err) {
    console.error('Error fetching user progress:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.updateLessonProgress = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { timeSpent, lastPosition, completedContentItems } = req.body;
    const userId = req.user.id; // ✅ you confirmed .id is correct

    const { progress, lessonProgress } = await ensureLessonProgress(userId, lessonId);

    // --- TIME (absolute total per lesson) ---
    if (typeof timeSpent === 'number' && !Number.isNaN(timeSpent)) {
      const reported = Math.max(0, Math.floor(timeSpent));
      const prev = Math.max(0, Math.floor(Number(lessonProgress.timeSpent || 0)));
      const next = Math.max(prev, reported);           // keep the max (absolute total)

      // delta to add to top-level only if total increased
      const delta = next - prev;
      lessonProgress.timeSpent = next;
      if (delta > 0) {
        progress.totalTimeSpent = Math.max(0, Number(progress.totalTimeSpent || 0)) + delta;
      }
    }

    // --- POSITION (allow 0) ---
    if (typeof lastPosition === 'number' && !Number.isNaN(lastPosition)) {
      lessonProgress.lastPosition = lastPosition;
    }

    // --- COMPLETED CONTENT (merge uniquely) ---
    if (Array.isArray(completedContentItems)) {
      const current = Array.isArray(lessonProgress.completedContentItems)
        ? lessonProgress.completedContentItems
        : [];
      const merged = Array.from(new Set([...current, ...completedContentItems]));
      lessonProgress.completedContentItems = merged;
    }

    // --- META / SAVE ---
    progress.lastActivityAt = new Date();
    progress.updateStreak?.(); // safe call if method exists
    progress.markModified('tracksProgress');
    await progress.save();

    res.json({ success: true, message: 'Progress saved', progress: lessonProgress });
  } catch (err) {
    console.error('Error updating lesson progress:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.completeLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { timeSpent } = req.body;
    const userId = req.user.id;

    const { progress, lessonProgress, moduleProgress, module, lesson } =
      await ensureLessonProgress(userId, lessonId);

    // --- Mark complete ---
    lessonProgress.status = 'completed';
    lessonProgress.completedAt = new Date();

    // --- TIME (absolute total per lesson with delta to top-level) ---
    if (typeof timeSpent === 'number' && !Number.isNaN(timeSpent)) {
      const reported = Math.max(0, Math.floor(timeSpent));
      const prev = Math.max(0, Math.floor(Number(lessonProgress.timeSpent || 0)));
      const next = Math.max(prev, reported);
      const delta = next - prev;
      lessonProgress.timeSpent = next;
      if (delta > 0) {
        progress.totalTimeSpent = Math.max(0, Number(progress.totalTimeSpent || 0)) + delta;
      }
    }

    // --- Award XP ---
    const xpEarned = 50;
    const leveledUp = typeof progress.addXP === 'function' ? progress.addXP(xpEarned) : false;

    // --- Unlock next items ---
    const nextLesson = await unlockNextLesson(progress, module, lesson, moduleProgress);
    const nextModule = await unlockNextModule(progress, module, moduleProgress);

    // --- Save ---
    progress.lastActivityAt = new Date();
    progress.updateStreak?.();
    progress.markModified('tracksProgress');
    await progress.save();

    res.json({
      success: true,
      message: 'Lesson completed successfully',
      xpEarned,
      leveledUp,
      totalXP: progress.totalXP,
      level: progress.level,
      nextLessonId: nextLesson ? nextLesson._id : null,
      nextModuleId: nextModule ? nextModule._id : null,
    });
  } catch (err) {
    console.error('Error completing lesson:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};
