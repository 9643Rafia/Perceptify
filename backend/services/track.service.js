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

  const trackProgress = progress.tracksProgress.find(tp => String(tp.trackId) === String(module.trackId));
  if (!trackProgress) throw new Error('Please start the track first');

  const modulesInTrack = await Module.find({ trackId: module.trackId, status: 'active' }).sort({ order: 1 });
  const moduleIndexRaw = modulesInTrack.findIndex(mod => String(mod._id) === String(module._id));
  const moduleIndex = moduleIndexRaw === -1 ? 0 : moduleIndexRaw;

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

  moduleProgress.startedAt = moduleProgress.startedAt || new Date();

  let lessonProgress = moduleProgress.lessonsProgress.find(lp => String(lp.lessonId) === String(lesson._id));
  if (!lessonProgress) {
    // Check prerequisites
    if (lesson.prerequisites?.length > 0) {
      const prerequisitesCompleted = lesson.prerequisites.every(prereqId => {
        // Check if it's a module prerequisite (ObjectId format)
        if (prereqId.match(/^[0-9a-fA-F]{24}$/)) {
          // It's a module ObjectId - check if that module is completed
          const prereqModuleProgress = trackProgress.modulesProgress.find(mp => String(mp.moduleId) === String(prereqId));
          return prereqModuleProgress && prereqModuleProgress.status === 'completed';
        } else {
          // It's a lesson prerequisite - check if that lesson is completed
          const prereqProgress = moduleProgress.lessonsProgress.find(lp => String(lp.lessonId) === String(prereqId));
          return prereqProgress && prereqProgress.status === 'completed';
        }
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
