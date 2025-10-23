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
        status: 'unlocked',
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
      const exists = trackProgress.modulesProgress.some(mp => String(mp.moduleId) === String(nextModule._id));
      if (!exists) {
        trackProgress.modulesProgress.push({
          moduleId: nextModule._id,
          status: 'unlocked',
          lessonsProgress: [],
          quizAttempts: [],
          labAttempts: []
        });
        return nextModule;
      }
    }
  }
  return null;
}

module.exports = { unlockNextLesson, unlockNextModule };
