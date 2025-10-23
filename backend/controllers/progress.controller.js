const { ensureLessonProgress } = require('../services/progress.service');
const { unlockNextLesson, unlockNextModule } = require('../services/unlock.service');

exports.getUserProgress = async (req, res) => {
  try {
    const progress = await ensureLessonProgress(req.user.id); // creates if not exists
    res.json(progress);
  } catch (err) {
    console.error('Error fetching user progress:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ✅ Update lesson progress (autosave)
exports.updateLessonProgress = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { timeSpent, lastPosition, completedContentItems } = req.body;
    const userId = req.user.id;

    const { progress, lessonProgress } = await ensureLessonProgress(userId, lessonId);

    if (timeSpent) {
      lessonProgress.timeSpent = timeSpent;
      progress.totalTimeSpent += timeSpent;
    }
    if (lastPosition) lessonProgress.lastPosition = lastPosition;
    if (completedContentItems) lessonProgress.completedContentItems = completedContentItems;

    progress.lastActivityAt = new Date();
    progress.updateStreak();
    progress.markModified('tracksProgress');
    await progress.save();

    res.json({ success: true, message: 'Progress saved', progress: lessonProgress });
  } catch (err) {
    console.error('Error updating lesson progress:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

// ✅ Complete lesson
exports.completeLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { timeSpent } = req.body;
    const userId = req.user.id;

    const { progress, lessonProgress, moduleProgress, module, lesson } = await ensureLessonProgress(userId, lessonId);

    // Mark complete
    lessonProgress.status = 'completed';
    lessonProgress.completedAt = new Date();
    if (timeSpent) {
      lessonProgress.timeSpent = timeSpent;
      progress.totalTimeSpent += timeSpent;
    }

    // Award XP
    const xpEarned = 50;
    const leveledUp = progress.addXP(xpEarned);

    // Unlock next items
    const nextLesson = await unlockNextLesson(progress, module, lesson, moduleProgress);
    const nextModule = await unlockNextModule(progress, module, moduleProgress);

    progress.lastActivityAt = new Date();
    progress.updateStreak();
    progress.markModified('tracksProgress');
    await progress.save();

    res.json({
      success: true,
      message: 'Lesson completed successfully',
      xpEarned,
      leveledUp,
      totalXP: progress.totalXP,
      level: progress.level,
      nextLessonId: nextLesson ? nextLesson._id : null,
      nextModuleId: nextModule ? nextModule._id : null,
    });
  } catch (err) {
    console.error('Error completing lesson:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};
