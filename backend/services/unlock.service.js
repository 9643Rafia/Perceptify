const Lesson = require('../models/lesson.model');
const Module = require('../models/module.model');

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

    const nextModule = await Module.findOne({
      trackId: module.trackId,
      order: { $gt: module.order },
      status: 'active'
    }).sort({ order: 1 });

    if (nextModule) {
      const trackProgress = progress.tracksProgress.find(tp => String(tp.trackId) === String(module.trackId));
      if (!trackProgress) return null;

      let nextModuleProgress = trackProgress.modulesProgress.find(mp => String(mp.moduleId) === String(nextModule._id));
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
