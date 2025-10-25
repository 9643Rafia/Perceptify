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

exports.updateLessonProgress = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { timeSpent, lastPosition, completedContentItems } = req.body;
    const userId = req.user.id; // ✅ you confirmed .id is correct

    const { progress, lessonProgress } = await ensureLessonProgress(userId, lessonId);

    // --- TIME (absolute total per lesson) ---
    if (typeof timeSpent === 'number' && !Number.isNaN(timeSpent)) {
      const reported = Math.max(0, Math.floor(timeSpent));
      const prev = Math.max(0, Math.floor(Number(lessonProgress.timeSpent || 0)));
      const next = Math.max(prev, reported);           // keep the max (absolute total)

      // delta to add to top-level only if total increased
      const delta = next - prev;
      lessonProgress.timeSpent = next;
      if (delta > 0) {
        progress.totalTimeSpent = Math.max(0, Number(progress.totalTimeSpent || 0)) + delta;
      }
    }

    // --- POSITION (allow 0) ---
    if (typeof lastPosition === 'number' && !Number.isNaN(lastPosition)) {
      lessonProgress.lastPosition = lastPosition;
    }

    // --- COMPLETED CONTENT (merge uniquely) ---
    if (Array.isArray(completedContentItems)) {
      const current = Array.isArray(lessonProgress.completedContentItems)
        ? lessonProgress.completedContentItems
        : [];
      const merged = Array.from(new Set([...current, ...completedContentItems]));
      lessonProgress.completedContentItems = merged;
    }

    // --- META / SAVE ---
    progress.lastActivityAt = new Date();
    progress.updateStreak?.(); // safe call if method exists
    progress.markModified('tracksProgress');
    await progress.save();

    res.json({ success: true, message: 'Progress saved', progress: lessonProgress });
  } catch (err) {
    console.error('Error updating lesson progress:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

exports.completeLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { timeSpent } = req.body;
    const userId = req.user.id;

    const { progress, lessonProgress, moduleProgress, module, lesson } =
      await ensureLessonProgress(userId, lessonId);

    // --- Mark complete ---
    lessonProgress.status = 'completed';
    lessonProgress.completedAt = new Date();

    // --- TIME (absolute total per lesson with delta to top-level) ---
    if (typeof timeSpent === 'number' && !Number.isNaN(timeSpent)) {
      const reported = Math.max(0, Math.floor(timeSpent));
      const prev = Math.max(0, Math.floor(Number(lessonProgress.timeSpent || 0)));
      const next = Math.max(prev, reported);
      const delta = next - prev;
      lessonProgress.timeSpent = next;
      if (delta > 0) {
        progress.totalTimeSpent = Math.max(0, Number(progress.totalTimeSpent || 0)) + delta;
      }
    }

    // --- Award XP ---
    const xpEarned = 50;
    const leveledUp = typeof progress.addXP === 'function' ? progress.addXP(xpEarned) : false;

    // --- Unlock next items ---
    const nextLesson = await unlockNextLesson(progress, module, lesson, moduleProgress);
    const nextModule = await unlockNextModule(progress, module, moduleProgress);

    // --- Save ---
    progress.lastActivityAt = new Date();
    progress.updateStreak?.();
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

