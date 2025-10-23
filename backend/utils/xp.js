exports.addXP = (progressDoc, xp) => {
  progressDoc.totalXP += xp;
  const newLevel = Math.floor(progressDoc.totalXP / 1000) + 1;
  const leveledUp = newLevel > progressDoc.level;
  if (leveledUp) progressDoc.level = newLevel;
  return leveledUp;
};
