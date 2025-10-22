const Track = require('../models/track.model');
const Module = require('../models/module.model');
const Lesson = require('../models/lesson.model');
const Content = require('../models/content.model');
const Progress = require('../models/progress.model');

// ========== TRACK CONTROLLERS ==========

// Get all tracks
exports.getTracks = async (req, res) => {
  try {
    console.log('🎯 GET TRACKS - Starting...')
    const tracks = await Track.find({ status: 'active' }).sort({ order: 1 });
    console.log('🎯 GET TRACKS - Found tracks:', tracks.length)
    console.log('🎯 GET TRACKS - Tracks data:', tracks)
    res.json(tracks);
  } catch (error) {
    console.error('❌ GET TRACKS - Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single track with modules
exports.getTrackById = async (req, res) => {
  try {
    const { trackId } = req.params;
    console.log('🎯 GET TRACK BY ID - trackId:', trackId)

    const track = await Track.findOne({ _id: trackId, status: 'active' });
    console.log('🎯 GET TRACK BY ID - Found track:', track)

    if (!track) {
      console.log('❌ GET TRACK BY ID - Track not found')
      return res.status(404).json({ message: 'Track not found' });
    }

    // Get modules for this track
    const modules = await Module.find({ trackId: track._id, status: 'active' }).sort({ order: 1 });
    console.log('🎯 GET TRACK BY ID - Found modules:', modules.length)
    console.log('🎯 GET TRACK BY ID - Modules data:', modules)

    // Get user progress if authenticated
    let progress = null;
    if (req.user) {
      progress = await Progress.findOne({ userId: req.user._id });
      console.log('🎯 GET TRACK BY ID - User progress:', progress)
    }

    const response = {
      track,
      modules,
      progress: progress ? progress.tracksProgress.find(tp => tp.trackId === track._id) : null
    }
    console.log('🎯 GET TRACK BY ID - Sending response:', response)
    res.json(response);
  } catch (error) {
    console.error('❌ GET TRACK BY ID - Error:', error);
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
      // Content documents in the collections may reference the lesson using different id formats:
      // - the Lesson._id (ObjectId as string)
      // - the Lesson.lessonId (external id like 'LES-1.1.1')
      // - legacy/normalized ids used in collections (e.g. 'lesson_1.1.1')
      // or the lesson may list content items by external contentId values in lesson.contentItems.
      const contentQueryOr = [];

      // Build a list of possible lesson id values to match against Content.lessonId (which is stored as String)
      const possibleLessonIds = [];
      possibleLessonIds.push(String(lesson._id));
      if (lesson.lessonId) {
        possibleLessonIds.push(String(lesson.lessonId));

        // normalized variant: convert 'LES-1.1.1' -> 'lesson_1.1.1' (lowercase, replace prefix and dashes)
        const normalized = String(lesson.lessonId).toLowerCase().replace(/^les[-_]/, 'lesson_').replace(/-/g, '_');
        if (!possibleLessonIds.includes(normalized)) {
          possibleLessonIds.push(normalized);
        }
      }

      // Add a single $or clause that matches any of the possible lessonId strings
      if (possibleLessonIds.length > 0) {
        contentQueryOr.push({ lessonId: { $in: possibleLessonIds } });
      }

      // Also match explicit contentItems references by contentId or by _id if they look like ObjectId strings
      if (Array.isArray(lesson.contentItems) && lesson.contentItems.length > 0) {
        contentQueryOr.push({ contentId: { $in: lesson.contentItems } });
        const possibleObjectIds = lesson.contentItems.filter(ci => /^[0-9a-fA-F]{24}$/.test(ci));
        if (possibleObjectIds.length > 0) {
          contentQueryOr.push({ _id: { $in: possibleObjectIds } });
        }
      }

      // Diagnostic: build the actual query object and log it so we can see what the running server is searching for
      const queryObj = {
        $and: [
          { $or: contentQueryOr },
          { status: 'active' }
        ]
      };

      console.log('🔍 GET LESSON BY ID - possibleLessonIds:', possibleLessonIds);
      console.log('🔍 GET LESSON BY ID - contentQueryOr:', JSON.stringify(contentQueryOr));
      console.log('🔍 GET LESSON BY ID - queryObj:', JSON.stringify(queryObj));

      const content = await Content.find(queryObj).sort({ order: 1 });

      console.log('🎯 GET LESSON BY ID - lesson._id:', String(lesson._id), 'lesson.lessonId:', lesson.lessonId);
      console.log('🎯 GET LESSON BY ID - content items matched:', content.length);
      content.forEach(c => console.log('   - content:', String(c._id), 'contentId:', c.contentId, 'url:', c.url));

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
                lessonProgress = moduleProgress.lessonsProgress.find(lp => String(lp.lessonId) === String(lesson._id) || String(lp.lessonId) === String(lesson.lessonId));
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
