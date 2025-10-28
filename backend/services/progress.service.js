const Progress = require('../models/progress.model');
const Lesson = require('../models/lesson.model');
const Module = require('../models/module.model');
const { startTrack } = require('./track.service');
const {
  prepareTrackMatchingContext,
  findTrackProgressByIdentifier,
  uniqueModuleTrackVariants,
  createTrackVariants,
} = require('../utils/track.utils');

// Ensures the entire lesson-progress hierarchy exists for user
async function ensureLessonProgress(userId, lessonId) {
  const lesson = lessonId ? await Lesson.findById(lessonId) : null;
  const module = lesson ? await Module.findById(lesson.moduleId) : null;

  // Get or create Progress doc
  let progress = await Progress.findOne({ userId });
  if (!progress) progress = await Progress.create({ userId, tracksProgress: [] });

  // Ensure tracksProgress is an array
  if (!Array.isArray(progress.tracksProgress)) {
    progress.tracksProgress = [];
  }

  // Ensure nested arrays are arrays
  for (const tp of progress.tracksProgress) {
    if (!Array.isArray(tp.modulesProgress)) {
      tp.modulesProgress = [];
    }
    for (const mp of tp.modulesProgress) {
      if (!Array.isArray(mp.lessonsProgress)) {
        mp.lessonsProgress = [];
      }
      if (!Array.isArray(mp.quizAttempts)) {
        mp.quizAttempts = [];
      }
      if (!Array.isArray(mp.labAttempts)) {
        mp.labAttempts = [];
      }
    }
  }

  if (!lesson) return { progress }; // if only fetching general progress

  let trackContext = await prepareTrackMatchingContext(progress);

  // Track
  let { trackProgress, track: trackDoc } = findTrackProgressByIdentifier(
    trackContext,
    module.trackId
  );
  if (!trackProgress) {
    const started = await startTrack(userId, module.trackId);
    progress = started.progress;
    trackProgress = started.trackProgress;
    trackContext = await prepareTrackMatchingContext(progress);
    const refreshed = findTrackProgressByIdentifier(
      trackContext,
      module.trackId
    );
    if (refreshed.trackProgress) {
      trackProgress = refreshed.trackProgress;
      trackDoc = refreshed.track || trackDoc;
    }
  }

  if (!trackProgress) throw new Error('Please start the track first');

  // Ensure we have an up-to-date module ordering for gating logic
  const moduleTrackVariants = new Set([
    ...createTrackVariants(module.trackId),
    ...(trackDoc ? uniqueModuleTrackVariants(trackDoc) : []),
  ]);
  const modulesInTrack = await Module.find({
    status: 'active',
    trackId: { $in: Array.from(moduleTrackVariants) },
  }).sort({ order: 1 });
  const moduleIndexRaw = modulesInTrack.findIndex(mod => String(mod._id) === String(module._id));
  const moduleIndex = moduleIndexRaw === -1 ? 0 : moduleIndexRaw;

  // Module
  let moduleProgress = trackProgress.modulesProgress.find(mp => String(mp.moduleId) === String(module._id));
  if (!moduleProgress) {
    const previousModuleId = moduleIndex > 0 ? String(modulesInTrack[moduleIndex - 1]._id) : null;
    const previousModuleProgress = previousModuleId
      ? trackProgress.modulesProgress.find(mp => String(mp.moduleId) === previousModuleId)
      : null;
    const canUnlock = moduleIndex === 0 || (previousModuleProgress && previousModuleProgress.status === 'completed');

    moduleProgress = {
      moduleId: module._id,
      status: canUnlock ? 'unlocked' : 'locked',
      lessonsProgress: [],
      quizAttempts: [],
      labAttempts: []
    };
    if (canUnlock) {
      moduleProgress.startedAt = new Date();
    }
    trackProgress.modulesProgress.push(moduleProgress);
  }

  if (moduleProgress.status === 'locked') {
    throw new Error('Module is locked');
  }

  // Lesson
  let lessonProgress = moduleProgress.lessonsProgress.find(lp => String(lp.lessonId) === String(lesson._id));
  if (!lessonProgress) {
    lessonProgress = {
      lessonId: lesson._id,
      status: 'in_progress',
      timeSpent: 0,
      lastPosition: 0,
      completedContentItems: [],
      startedAt: new Date()
    };
    moduleProgress.lessonsProgress.push(lessonProgress);
  }

  progress.markModified('tracksProgress');
  await progress.save();

  return { progress, trackProgress, moduleProgress, lessonProgress, module, lesson };
}

module.exports = { ensureLessonProgress };
