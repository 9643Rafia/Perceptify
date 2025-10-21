const Track = require('../models/track.model');
const Module = require('../models/module.model');
const Lesson = require('../models/lesson.model');
const Content = require('../models/content.model');
const Progress = require('../models/progress.model');

// ========== TRACK CONTROLLERS ==========

// Get all tracks
exports.getTracks = async (req, res) => {
  try {
    const tracks = await Track.find({ status: 'active' }).sort({ order: 1 });
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single track with modules
exports.getTrackById = async (req, res) => {
  try {
    const { trackId } = req.params;

    const track = await Track.findOne({ _id: trackId, status: 'active' });

    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    // Get modules for this track
    const modules = await Module.find({ trackId: track._id, status: 'active' }).sort({ order: 1 });

    // Get user progress if authenticated
    let progress = null;
    if (req.user) {
      progress = await Progress.findOne({ userId: req.user._id });
    }

    res.json({
      track,
      modules,
      progress: progress ? progress.tracksProgress.find(tp => tp.trackId === track._id) : null
    });
  } catch (error) {
    console.error('Error fetching track:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ========== MODULE CONTROLLERS ==========

// Get modules by track
exports.getModulesByTrack = async (req, res) => {
  try {
    const { trackId } = req.params;

    const modules = await Module.find({ trackId, status: 'active' }).sort({ order: 1 });

    // Get user progress if authenticated
    let userProgress = null;
    if (req.user) {
      const progress = await Progress.findOne({ userId: req.user._id });
      if (progress) {
        const trackProgress = progress.tracksProgress.find(tp => tp.trackId === trackId);
        if (trackProgress) {
          userProgress = trackProgress.modulesProgress;
        }
      }
    }

    res.json({ modules, userProgress });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single module with lessons
exports.getModuleById = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const module = await Module.findOne({ _id: moduleId, status: 'active' });

    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Get lessons for this module
    const lessons = await Lesson.find({ moduleId: module._id, status: 'active' }).sort({ order: 1 });

    // Get user progress if authenticated
    let moduleProgress = null;
    if (req.user) {
      const progress = await Progress.findOne({ userId: req.user._id });
      if (progress) {
        const trackProgress = progress.tracksProgress.find(tp => tp.trackId === module.trackId);
        if (trackProgress) {
          moduleProgress = trackProgress.modulesProgress.find(mp => mp.moduleId === module._id);
        }
      }
    }

    res.json({
      module,
      lessons,
      progress: moduleProgress
    });
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ========== LESSON CONTROLLERS ==========

// Get lessons by module
exports.getLessonsByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const lessons = await Lesson.find({ moduleId, status: 'active' }).sort({ order: 1 });

    // Get user progress if authenticated
    let lessonsProgress = null;
    if (req.user) {
      const progress = await Progress.findOne({ userId: req.user._id });
      if (progress) {
        const module = await Module.findById(moduleId);
        if (module) {
          const trackProgress = progress.tracksProgress.find(tp => tp.trackId === module.trackId);
          if (trackProgress) {
            const moduleProgress = trackProgress.modulesProgress.find(mp => mp.moduleId === moduleId);
            if (moduleProgress) {
              lessonsProgress = moduleProgress.lessonsProgress;
            }
          }
        }
      }
    }

    res.json({ lessons, lessonsProgress });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single lesson with content
exports.getLessonById = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findOne({ _id: lessonId, status: 'active' });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Get content for this lesson
    const content = await Content.find({ lessonId: lesson._id, status: 'active' }).sort({ order: 1 });

    // Get user progress if authenticated
    let lessonProgress = null;
    if (req.user) {
      const progress = await Progress.findOne({ userId: req.user._id });
      if (progress) {
        const module = await Module.findById(lesson.moduleId);
        if (module) {
          const trackProgress = progress.tracksProgress.find(tp => tp.trackId === module.trackId);
          if (trackProgress) {
            const moduleProgress = trackProgress.modulesProgress.find(mp => mp.moduleId === lesson.moduleId);
            if (moduleProgress) {
              lessonProgress = moduleProgress.lessonsProgress.find(lp => lp.lessonId === lesson._id);
            }
          }
        }
      }
    }

    res.json({
      lesson,
      content,
      progress: lessonProgress
    });
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ========== CONTENT CONTROLLERS ==========

// Get content item by ID
exports.getContentById = async (req, res) => {
  try {
    const { contentId } = req.params;

    const content = await Content.findOne({ _id: contentId, status: 'active' });

    if (!content) {
      return res.status(404).json({ message: 'Content not found' });
    }

    res.json(content);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get learning path (next lesson/module recommendation)
exports.getNextContent = async (req, res) => {
  try {
    const userId = req.user._id;

    const progress = await Progress.findOne({ userId });

    if (!progress || !progress.currentLesson) {
      // Return first lesson of first module of first track
      const firstTrack = await Track.findOne({ status: 'active' }).sort({ order: 1 });
      if (!firstTrack) {
        return res.status(404).json({ message: 'No tracks available' });
      }

      const firstModule = await Module.findOne({ trackId: firstTrack._id, status: 'active' }).sort({ order: 1 });
      if (!firstModule) {
        return res.status(404).json({ message: 'No modules available' });
      }

      const firstLesson = await Lesson.findOne({ moduleId: firstModule._id, status: 'active' }).sort({ order: 1 });
      if (!firstLesson) {
        return res.status(404).json({ message: 'No lessons available' });
      }

      return res.json({
        type: 'lesson',
        track: firstTrack,
        module: firstModule,
        lesson: firstLesson
      });
    }

    // Find next content based on current progress
    const currentLesson = await Lesson.findById(progress.currentLesson);
    const currentModule = await Module.findById(currentLesson.moduleId);

    // Get next lesson in the same module
    const nextLesson = await Lesson.findOne({
      moduleId: currentModule._id,
      order: { $gt: currentLesson.order },
      status: 'active'
    }).sort({ order: 1 });

    if (nextLesson) {
      const track = await Track.findOne({ _id: currentModule.trackId });
      return res.json({
        type: 'lesson',
        track,
        module: currentModule,
        lesson: nextLesson
      });
    }

    // No more lessons in this module, check for module quiz
    if (currentModule.quizId) {
      // Check if quiz is completed
      const trackProgress = progress.tracksProgress.find(tp => tp.trackId === currentModule.trackId);
      const moduleProgress = trackProgress?.modulesProgress.find(mp => mp.moduleId === currentModule._id);

      if (!moduleProgress || moduleProgress.quizAttempts.length === 0 || !moduleProgress.quizAttempts.some(qa => qa.passed)) {
        return res.json({
          type: 'quiz',
          track: await Track.findOne({ _id: currentModule.trackId }),
          module: currentModule,
          quizId: currentModule.quizId
        });
      }
    }

    // Move to next module
    const nextModule = await Module.findOne({
      trackId: currentModule.trackId,
      order: { $gt: currentModule.order },
      status: 'active'
    }).sort({ order: 1 });

    if (nextModule) {
      const firstLessonOfNextModule = await Lesson.findOne({
        moduleId: nextModule._id,
        status: 'active'
      }).sort({ order: 1 });

      return res.json({
        type: 'lesson',
        track: await Track.findOne({ _id: nextModule.trackId }),
        module: nextModule,
        lesson: firstLessonOfNextModule
      });
    }

    // All modules completed in this track
    res.json({
      type: 'completed',
      message: 'Track completed! Congratulations!'
    });

  } catch (error) {
    console.error('Error getting next content:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
