const Lesson = require('../models/lesson.model');
const Module = require('../models/module.model');
const {
  prepareTrackMatchingContext,
  findTrackProgressByIdentifier,
  uniqueModuleTrackVariants,
  createTrackVariants,
  findModuleProgressByIdentifier,
} = require('../utils/track.utils');

// Unlock next lesson
async function unlockNextLesson(progress, module, currentLesson, moduleProgress) {
  const nextLesson = await Lesson.findOne({
    moduleId: module._id,
    order: { $gt: currentLesson.order },
    status: 'active'
  }).sort({ order: 1 });

  if (nextLesson) {
    const exists = moduleProgress.lessonsProgress.some(lp => String(lp.lessonId) === String(nextLesson._id));
    if (!exists) {
      moduleProgress.lessonsProgress.push({
        lessonId: nextLesson._id,
        // lesson progress uses enum ['not_started','in_progress','completed']
        // use 'not_started' when unlocking so it validates against the schema
        status: 'not_started',
        timeSpent: 0,
        lastPosition: 0,
        completedContentItems: []
      });
      progress.currentLesson = nextLesson._id;
      return nextLesson;
    }
  }
  return null;
}

// Unlock next module if all lessons done
async function unlockNextModule(progress, module, moduleProgress) {
  const allDone = moduleProgress.lessonsProgress.every(lp => lp.status === 'completed');
  if (allDone && !module.quizId && !module.requiresLabCompletion) {
    moduleProgress.status = 'completed';
    moduleProgress.completedAt = new Date();

    const trackContext = await prepareTrackMatchingContext(progress);
    const trackMatch = findTrackProgressByIdentifier(trackContext, module.trackId);
    const trackProgress = trackMatch.trackProgress;
    const trackDoc = trackMatch.track;
    if (!trackProgress) return null;

    const moduleTrackVariants = new Set([
      ...createTrackVariants(module.trackId),
      ...(trackDoc ? uniqueModuleTrackVariants(trackDoc) : []),
    ]);

    const nextModule = await Module.findOne({
      trackId: { $in: Array.from(moduleTrackVariants) },
      order: { $gt: module.order },
      status: 'active'
    }).sort({ order: 1 });

    if (nextModule) {
      let nextModuleProgress = findModuleProgressByIdentifier(trackProgress, nextModule);
      if (!nextModuleProgress) {
        nextModuleProgress = {
          moduleId: nextModule._id,
          status: 'unlocked',
          lessonsProgress: [],
          quizAttempts: [],
          labAttempts: [],
          startedAt: new Date()
        };
        trackProgress.modulesProgress.push(nextModuleProgress);
        return nextModule;
      }

      if (nextModuleProgress.status === 'locked' || !nextModuleProgress.status) {
        nextModuleProgress.status = 'unlocked';
        nextModuleProgress.startedAt = nextModuleProgress.startedAt || new Date();
        return nextModule;
      }
    }
  }
  return null;
}

module.exports = { unlockNextLesson, unlockNextModule };
