const Progress = require('../models/progress.model');
const Track = require('../models/track.model');
const Module = require('../models/module.model');
const Lesson = require('../models/lesson.model');

async function startTrack(userId, trackId) {
  const track = await Track.findOne({ _id: trackId, status: 'active' });
  if (!track) throw new Error('Track not found');

  let progress = await Progress.findOne({ userId });
  if (!progress) progress = await Progress.create({ userId });

  // Check prerequisites
  if (track.prerequisites?.length > 0) {
    const prerequisitesCompleted = track.prerequisites.every(prereqId => {
      const prereqProgress = progress.tracksProgress.find(tp => String(tp.trackId) === String(prereqId));
      return prereqProgress && prereqProgress.status === 'completed';
    });
    if (!prerequisitesCompleted) throw new Error('Prerequisites not completed');
  }

  // Get or create trackProgress
  let trackProgress = progress.tracksProgress.find(tp => String(tp.trackId) === String(track._id));
  if (!trackProgress) {
    trackProgress = {
      trackId: track._id,
      status: 'unlocked',
      modulesProgress: [],
      startedAt: new Date()
    };
    progress.tracksProgress.push(trackProgress);
  }

  // Unlock modules
  const allModules = await Module.find({ trackId: track._id, status: 'active' }).sort({ order: 1 });
  for (const mod of allModules) {
    const exists = trackProgress.modulesProgress.some(mp => String(mp.moduleId) === String(mod._id));
    if (!exists) {
      trackProgress.modulesProgress.push({
        moduleId: mod._id,
        status: 'unlocked',
        lessonsProgress: [],
        quizAttempts: [],
        labAttempts: [],
        startedAt: new Date()
      });
    }
  }

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

  const trackProgress = progress.tracksProgress.find(tp => String(tp.trackId) === String(module.trackId));
  if (!trackProgress) throw new Error('Please start the track first');

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

  let lessonProgress = moduleProgress.lessonsProgress.find(lp => String(lp.lessonId) === String(lesson._id));
  if (!lessonProgress) {
    // Check prerequisites
    if (lesson.prerequisites?.length > 0) {
      const prerequisitesCompleted = lesson.prerequisites.every(prereqId => {
        const prereqProgress = moduleProgress.lessonsProgress.find(lp => String(lp.lessonId) === String(prereqId));
        return prereqProgress && prereqProgress.status === 'completed';
      });
      if (!prerequisitesCompleted) throw new Error('Prerequisites not completed');
    }

    lessonProgress = {
      lessonId: lesson._id,
      status: 'in_progress',
      timeSpent: 0,
      lastPosition: 0,
      completedContentItems: [],
      startedAt: new Date()
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
