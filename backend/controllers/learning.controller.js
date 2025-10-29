const Track = require('../models/track.model');
const Module = require('../models/module.model');
const Lesson = require('../models/lesson.model');
const Content = require('../models/content.model');
const Quiz = require('../models/quiz.model');
const Progress = require('../models/progress.model');
const Lab = require('../models/lab.model');
const {
  prepareTrackMatchingContext,
  findTrackProgressByIdentifier,
  uniqueModuleTrackVariants,
  createTrackVariants,
  areAllTrackModulesCompleted,
  findModuleProgressByIdentifier,
} = require('../utils/track.utils');

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
    console.log('🎯 GET TRACK BY ID - trackId:', trackId);

    // Track is stored by _id; accept both ObjectId and string
    const track = await Track.findOne({ _id: trackId, status: 'active' });
    console.log('🎯 GET TRACK BY ID - Found track:', track);

    if (!track) {
      console.log('❌ GET TRACK BY ID - Track not found');
      return res.status(404).json({ message: 'Track not found' });
    }

    const moduleTrackVariants = uniqueModuleTrackVariants(track);
    if (!moduleTrackVariants.length) {
      moduleTrackVariants.push(String(track._id));
      if (track.trackId) moduleTrackVariants.push(String(track.trackId));
    }

    const modules = await Module.find({
      trackId: { $in: Array.from(new Set(moduleTrackVariants)) },
      status: 'active'
    }).sort({ order: 1 });
    console.log('🎯 GET TRACK BY ID - Found modules:', modules.length);

    // Get user progress if authenticated
    let trackProgress = null;
    if (req.user) {
      const progress = await Progress.findOne({ userId: req.user._id });
      console.log('🎯 GET TRACK BY ID - User progress loaded:', !!progress);

      if (progress) {
        const context = await prepareTrackMatchingContext(progress);
        const match = findTrackProgressByIdentifier(context, track._id) ||
          findTrackProgressByIdentifier(context, track.trackId);

        if (match.trackProgress) {
          const computedCompleted = await areAllTrackModulesCompleted(
            match.trackProgress,
            match.track || track,
            match.track?.trackId || track.trackId || track._id
          );

          const normalizedModules = (match.trackProgress.modulesProgress || []).map((mp) => ({
            ...mp.toObject?.() || mp,
            moduleId: String(mp.moduleId),
          }));

          trackProgress = {
            ...match.trackProgress.toObject?.() || match.trackProgress,
            status: computedCompleted ? 'completed' : match.trackProgress.status,
            modulesProgress: normalizedModules,
          };
        }
      }
    }

    const response = { track, modules, progress: trackProgress };
    console.log('🎯 GET TRACK BY ID - Sending response (progress found?):', !!trackProgress);
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

    const trackIdVariants = Array.from(new Set(createTrackVariants(trackId)));
    const modules = await Module.find({
      trackId: trackIdVariants.length ? { $in: trackIdVariants } : trackId,
      status: 'active'
    }).sort({ order: 1 });

    // Build userProgress = the module progress array for this track (if any)
    let userProgress = null;

    if (req.user) {
      const progress = await Progress.findOne({ userId: req.user._id });

      if (progress) {
        const context = await prepareTrackMatchingContext(progress);
        const match = findTrackProgressByIdentifier(context, trackId);
        if (match.trackProgress?.modulesProgress?.length) {
          userProgress = match.trackProgress.modulesProgress.map(mp => ({
            ...mp.toObject?.() || mp,
            moduleId: String(mp.moduleId),
          }));
        } else {
          userProgress = [];
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

    // Default empty moduleProgress structure
    let moduleProgress = {
      moduleId: module._id,
      lessonsProgress: [],
      quizAttempts: [],
      labAttempts: [],
      bestQuizScore: 0,
      bestLabScore: 0,
      status: 'not_started'
    };
    if (req.user) {
      const progress = await Progress.findOne({ userId: req.user._id });
      console.log('🎯 Fetched user progress for module:', progress);
      if (progress) {
        const context = await prepareTrackMatchingContext(progress);
        const match = findTrackProgressByIdentifier(context, module.trackId);

        if (match.trackProgress?.modulesProgress?.length) {
          const foundModule = findModuleProgressByIdentifier(
            match.trackProgress,
            module
          );
          if (foundModule) {
            moduleProgress = foundModule.toObject?.() || foundModule;
          }
        }
      }
    }

    const lab = await Lab.findOne({
      status: 'active',
      $or: [
        { moduleId: String(module._id) },
        { moduleId: module.moduleId },
      ],
    }).lean();

    const labSummary = lab
      ? {
          labId: lab.labId,
          title: lab.title,
          description: lab.description,
          labType: lab.labType,
          passingScore: lab.passingScore,
          attempts: lab.attempts,
        }
      : null;

    console.log('🎯 Final moduleProgress (after robust string match):', moduleProgress);

    res.status(200).json({
      module,
      lessons,
      progress: moduleProgress,
      lab: labSummary
    });
  } catch (error) {
    console.error('❌ Error fetching module:', error);
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
          const trackContext = await prepareTrackMatchingContext(progress);
          const match = findTrackProgressByIdentifier(trackContext, module.trackId);
          const trackProgress = match.trackProgress;
          if (trackProgress) {
            const moduleProgressDoc = findModuleProgressByIdentifier(trackProgress, module);
            if (moduleProgressDoc?.lessonsProgress?.length) {
              const moduleProgress =
                moduleProgressDoc.toObject?.() || moduleProgressDoc;
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
    // Log detailed info for each content item including quizId presence and whether the quiz exists
    for (const c of content) {
      try {
        console.log('   - content:', String(c._id), 'contentId:', c.contentId, 'type:', c.type, 'quizId:', c.quizId, 'url:', c.url);
        if (c.type === 'quiz') {
          if (c.quizId) {
            const quizExists = await Quiz.exists({ quizId: String(c.quizId) });
            console.log(`       -> quizId present: ${c.quizId} | quizExists: ${quizExists ? 'yes' : 'no'}`);
          } else {
            console.log('       -> quizId MISSING for this content item');
          }
        }
      } catch (logErr) {
        console.warn('       -> error checking quiz existence for content', c.contentId || c._id, logErr.message || logErr);
      }
    }

    // Get user progress if authenticated
    let lessonProgress = null;
    if (req.user) {
      const progress = await Progress.findOne({ userId: req.user._id });
      if (progress) {
        const module = await Module.findById(lesson.moduleId);
        if (module) {
          const trackContext = await prepareTrackMatchingContext(progress);
          const match = findTrackProgressByIdentifier(trackContext, module.trackId);
          const trackProgress = match.trackProgress;
          if (trackProgress) {
            const moduleProgressDoc = findModuleProgressByIdentifier(trackProgress, module);
            if (moduleProgressDoc?.lessonsProgress?.length) {
              const moduleProgress =
                moduleProgressDoc.toObject?.() || moduleProgressDoc;
              const lessonsArray = moduleProgress.lessonsProgress || [];
              lessonProgress = lessonsArray.find(
                lp =>
                  String(lp.lessonId) === String(lesson._id) ||
                  String(lp.lessonId) === String(lesson.lessonId)
              );
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

    const trackContext = await prepareTrackMatchingContext(progress);

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
      const { trackProgress } = findTrackProgressByIdentifier(
        trackContext,
        currentModule.trackId
      );
      const moduleProgress = trackProgress
        ? findModuleProgressByIdentifier(trackProgress, currentModule)
        : null;
      const quizAttempts = Array.isArray(moduleProgress?.quizAttempts)
        ? moduleProgress.quizAttempts
        : [];

      if (
        !quizAttempts.length ||
        !quizAttempts.some((qa) => qa && qa.passed)
      ) {
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
