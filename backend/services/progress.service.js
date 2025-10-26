const Progress = require('../models/progress.model');
const Lesson = require('../models/lesson.model');
const Module = require('../models/module.model');

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

  // Track
  let trackProgress = progress.tracksProgress.find(tp => String(tp.trackId) === String(module.trackId));
  if (!trackProgress) {
    trackProgress = { trackId: module.trackId, status: 'unlocked', modulesProgress: [], startedAt: new Date() };
    progress.tracksProgress.push(trackProgress);
  }

  // Module
  let moduleProgress = trackProgress.modulesProgress.find(mp => String(mp.moduleId) === String(module._id));
  if (!moduleProgress) {
    moduleProgress = {
      moduleId: module._id,
      status: 'unlocked',
      lessonsProgress: [],
      quizAttempts: [],
      labAttempts: [],
      startedAt: new Date()
    };
    trackProgress.modulesProgress.push(moduleProgress);
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
