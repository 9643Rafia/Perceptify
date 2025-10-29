const { startTrack, startLesson } = require('../services/track.service');

exports.startTrack = async (req, res) => {
  try {
    const { trackId } = req.params;
    const userId = req.user.id;
    const { progress, allModules } = await startTrack(userId, trackId);

    res.json({
      success: true,
      message: 'Track started successfully',
      modulesCount: allModules.length,
      progress
    });
  } catch (err) {
    console.error('Error starting track:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.startLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;
    const { progress, lessonProgress } = await startLesson(userId, lessonId);

    res.json({
      success: true,
      message: 'Lesson started successfully',
      progress: lessonProgress
    });
  } catch (err) {
    console.error('Error starting lesson:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};
