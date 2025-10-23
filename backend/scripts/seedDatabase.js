const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ===== Import Models =====
const Track = require('../models/track.model');
const Module = require('../models/module.model');
const Lesson = require('../models/lesson.model');
const Content = require('../models/content.model');
const Quiz = require('../models/quiz.model');
const Lab = require('../models/lab.model');
const { Badge } = require('../models/badge.model');

// ===== Helper Functions =====
const readJSONFile = (filename) => {
  const filePath = path.join(__dirname, '../collections', filename);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`❌ Error reading ${filename}: ${err.message}`);
    return null;
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    process.exit(1);
  }
};

const clearCollections = async () => {
  console.log('\n🗑️  Clearing existing collections...');
  await Promise.all([
    Track.deleteMany({}),
    Module.deleteMany({}),
    Lesson.deleteMany({}),
    Content.deleteMany({}),
    Quiz.deleteMany({}),
    Lab.deleteMany({}),
    Badge.deleteMany({})
  ]);
  console.log('✅ All collections cleared');
};

// ===== Seeder Functions =====
const seedTracks = async () => {
  console.log('\n📊 Seeding Tracks...');
  const data = readJSONFile('tracks.json');
  if (!data?.tracks) throw new Error('Invalid tracks.json format');
  const tracks = await Track.insertMany(data.tracks.map(({ _id, ...t }) => t));
  console.log(`✅ Inserted ${tracks.length} tracks`);

  // Build mapping
  const trackMap = {};
  data.tracks.forEach((t, i) => {
    trackMap[t._id] = tracks[i]._id;
  });
  return trackMap;
};

const seedModules = async (trackMap) => {
  console.log('\n📚 Seeding Modules...');
  const data = readJSONFile('modules.json');
  if (!data?.modules) throw new Error('Invalid modules.json format');

  const modulesData = data.modules.map(({ _id, ...m }) => ({
    ...m,
    trackId: trackMap[m.trackId] || null
  }));

  const modules = await Module.insertMany(modulesData);
  console.log(`✅ Inserted ${modules.length} modules`);

  // Map JSON _id → actual ObjectId
  const moduleMap = {};
  data.modules.forEach((m, i) => {
    moduleMap[m._id] = modules[i]._id;
  });
  return moduleMap;
};

const seedLessons = async (moduleMap) => {
  console.log('\n📖 Seeding Lessons...');
  const data = readJSONFile('lessons.json');
  if (!data?.lessons) throw new Error('Invalid lessons.json format');

  const lessonsData = [];
  let missing = 0;

  for (const { _id, ...lesson } of data.lessons) {
    const mappedModuleId = moduleMap[lesson.moduleId];
    if (!mappedModuleId) {
      console.warn(`⚠️  Skipping lesson "${lesson.name}" (no match for moduleId: ${lesson.moduleId})`);
      missing++;
      continue;
    }
    lessonsData.push({ ...lesson, moduleId: mappedModuleId });
  }

  if (!lessonsData.length) {
    console.warn('⚠️  No valid lessons found to insert.');
    return;
  }

  const lessons = await Lesson.insertMany(lessonsData);
  console.log(`✅ Inserted ${lessons.length} lessons (${missing} skipped if any missing references)`);
};

const seedContent = async () => {
  console.log('\n🎬 Seeding Content...');
  const data = readJSONFile('content.json');
  if (!data?.contentItems) throw new Error('Invalid content.json format');
  const content = await Content.insertMany(data.contentItems.map(({ _id, ...c }) => c));
  console.log(`✅ Inserted ${content.length} content items`);
};

const createSampleQuizzes = async () => {
  console.log('\n❓ Creating Sample Quizzes...');
  const modules = await Module.find({});
  const quizzes = [];

  for (const module of modules) {
    if (!module.quizId) continue;
    const quiz = {
      quizId: module.quizId,
      moduleId: module._id,
      title: `${module.name} Assessment`,
      description: `Test your understanding of ${module.name}`,
      timeLimit: 1800,
      passingScore: module.passingScore || 70,
      randomizeQuestions: true,
      allowReview: true,
      showResults: true,
      questions: [
        {
          questionId: `${module.quizId}_q1`,
          order: 1,
          questionType: 'multiple_choice',
          questionText: `Which of the following best describes the main concept of ${module.name}?`,
          points: 10,
          options: [
            { optionId: 'a', text: 'Option A', isCorrect: true },
            { optionId: 'b', text: 'Option B', isCorrect: false },
            { optionId: 'c', text: 'Option C', isCorrect: false },
            { optionId: 'd', text: 'Option D', isCorrect: false }
          ]
        },
        {
          questionId: `${module.quizId}_q2`,
          order: 2,
          questionType: 'true_false',
          questionText: `True or False: ${module.name} is important in deepfake detection.`,
          points: 10,
          options: [
            { optionId: 'true', text: 'True', isCorrect: true },
            { optionId: 'false', text: 'False', isCorrect: false }
          ]
        },
        {
          questionId: `${module.quizId}_q3`,
          order: 3,
          questionType: 'multiple_select',
          questionText: `Select all that apply to ${module.name}:`,
          points: 15,
          options: [
            { optionId: 'a', text: 'Concept 1', isCorrect: true },
            { optionId: 'b', text: 'Concept 2', isCorrect: true },
            { optionId: 'c', text: 'Unrelated concept', isCorrect: false },
            { optionId: 'd', text: 'Another unrelated concept', isCorrect: false }
          ]
        }
      ],
      status: 'active'
    };
    quizzes.push(quiz);
  }

  if (quizzes.length) {
    await Quiz.insertMany(quizzes);
    console.log(`✅ Created ${quizzes.length} sample quizzes`);
  } else {
    console.log('⚠️  No modules with quizId found');
  }
};

const createSampleLabs = async () => {
  console.log('\n🔬 Creating Sample Labs...');
  const modules = await Module.find({ requiresLabCompletion: true });
  const labs = modules.map((module) => ({
    labId: `lab_${module.moduleId}`,
    moduleId: module._id,
    title: `${module.name} - Practical Lab`,
    description: `Hands-on tasks for ${module.name}`,
    labType: 'visual_detection',
    instructions: `Complete lab challenges for ${module.name}`,
    timeLimit: 45,
    passingScore: 70,
    challenges: [
      {
        challengeId: `${module.moduleId}_ch1`,
        title: 'Video Analysis Challenge',
        description: 'Analyze a video and determine if it is a deepfake',
        mediaUrl: '/media/labs/sample-video-1.mp4',
        mediaType: 'video',
        isDeepfake: true,
        points: 50,
        order: 1
      }
    ],
    status: 'active'
  }));

  if (!labs.length) {
    const fallback = await Module.findOne({});
    labs.push({
      labId: 'lab_sample_001',
      moduleId: fallback?._id || null,
      title: 'Intro Deepfake Detection Lab',
      description: 'Practice identifying deepfakes',
      labType: 'visual_detection',
      timeLimit: 30,
      passingScore: 70,
      challenges: [
        {
          challengeId: 'sample_ch1',
          title: 'Basic Video Analysis',
          description: 'Determine if this video is a deepfake',
          mediaUrl: '/media/labs/intro-video-1.mp4',
          mediaType: 'video',
          isDeepfake: true,
          points: 100,
          order: 1
        }
      ],
      status: 'active'
    });
  }

  await Lab.insertMany(labs);
  console.log(`✅ Created ${labs.length} labs`);
};

const createSampleBadges = async () => {
  console.log('\n🏆 Creating Sample Badges...');
  const badges = [
    { badgeId: 'badge_first_steps', name: 'First Steps', description: 'Complete your first lesson', icon: '🎯', category: 'completion', rarity: 'common', criteria: { type: 'lessons_completed', value: 1 } },
    { badgeId: 'badge_quiz_master', name: 'Quiz Master', description: 'Score 100% on any quiz', icon: '🎓', category: 'mastery', rarity: 'rare', criteria: { type: 'quiz_score', value: 100 } },
    { badgeId: 'badge_beginner_track', name: 'Foundation Expert', description: 'Complete Beginner Track', icon: '⭐', category: 'completion', rarity: 'rare', criteria: { type: 'track_completion', value: 'track_beginner' } }
  ];
  await Badge.insertMany(badges);
  console.log(`✅ Created ${badges.length} badges`);
};

// ===== Verification =====
const verifyDatabase = async () => {
  console.log('\n🔍 Verifying Database...');
  const counts = await Promise.all([
    Track.countDocuments(),
    Module.countDocuments(),
    Lesson.countDocuments(),
    Content.countDocuments(),
    Quiz.countDocuments(),
    Lab.countDocuments(),
    Badge.countDocuments()
  ]);
  console.log(`Tracks: ${counts[0]} | Modules: ${counts[1]} | Lessons: ${counts[2]} | Content: ${counts[3]} | Quizzes: ${counts[4]} | Labs: ${counts[5]} | Badges: ${counts[6]}`);
  console.log('✅ Verification complete');
};

// ===== Main Seeder =====
const seedDatabase = async () => {
  console.log('🌱 Starting Database Seeding...');
  await connectDB();
  await clearCollections();

  const trackMap = await seedTracks();
  const moduleMap = await seedModules(trackMap);
  await seedLessons(moduleMap);
  await seedContent();
  await createSampleQuizzes();
  await createSampleLabs();
  await createSampleBadges();
  await verifyDatabase();

  console.log('\n🎉 Database seeding completed successfully!\n');
  process.exit(0);
};

seedDatabase();
