const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const Track = require('../models/track.model');
const Module = require('../models/module.model');
const Lesson = require('../models/lesson.model');
const Content = require('../models/content.model');
const Quiz = require('../models/quiz.model');
const Lab = require('../models/lab.model');
const { Badge } = require('../models/badge.model');

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

// Read JSON file helper
const readJSONFile = (filename) => {
  try {
    const filePath = path.join(__dirname, '../collections', filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`❌ Error reading ${filename}:`, error.message);
    return null;
  }
};

// Clear all collections
const clearCollections = async () => {
  console.log('\n🗑️  Clearing existing collections...');
  try {
    await Track.deleteMany({});
    await Module.deleteMany({});
    await Lesson.deleteMany({});
    await Content.deleteMany({});
    await Quiz.deleteMany({});
    await Lab.deleteMany({});
    await Badge.deleteMany({});
    console.log('✅ All collections cleared');
  } catch (error) {
    console.error('❌ Error clearing collections:', error.message);
    throw error;
  }
};

// Seed Tracks
const seedTracks = async () => {
  console.log('\n📊 Seeding Tracks...');
  try {
    const data = readJSONFile('tracks.json');
    if (!data || !data.tracks) {
      throw new Error('Invalid tracks.json format');
    }

    // Remove _id fields and let MongoDB generate them
    const tracksData = data.tracks.map(track => {
      const { _id, ...rest } = track;
      return rest;
    });

    const tracks = await Track.insertMany(tracksData);
    console.log(`✅ Inserted ${tracks.length} tracks`);
    return tracks;
  } catch (error) {
    console.error('❌ Error seeding tracks:', error.message);
    throw error;
  }
};

// Seed Modules
const seedModules = async () => {
  console.log('\n📚 Seeding Modules...');
  try {
    const data = readJSONFile('modules.json');
    if (!data || !data.modules) {
      throw new Error('Invalid modules.json format');
    }

    // Remove _id fields and let MongoDB generate them
    const modulesData = data.modules.map(module => {
      const { _id, ...rest } = module;
      return rest;
    });

    const modules = await Module.insertMany(modulesData);
    console.log(`✅ Inserted ${modules.length} modules`);
    return modules;
  } catch (error) {
    console.error('❌ Error seeding modules:', error.message);
    throw error;
  }
};

// Seed Lessons
const seedLessons = async () => {
  console.log('\n📖 Seeding Lessons...');
  try {
    const data = readJSONFile('lessons.json');
    if (!data || !data.lessons) {
      throw new Error('Invalid lessons.json format');
    }

    // Remove _id fields and let MongoDB generate them
    const lessonsData = data.lessons.map(lesson => {
      const { _id, ...rest } = lesson;
      return rest;
    });

    const lessons = await Lesson.insertMany(lessonsData);
    console.log(`✅ Inserted ${lessons.length} lessons`);
    return lessons;
  } catch (error) {
    console.error('❌ Error seeding lessons:', error.message);
    throw error;
  }
};

// Seed Content
const seedContent = async () => {
  console.log('\n🎬 Seeding Content...');
  try {
    const data = readJSONFile('content.json');
    if (!data || !data.contentItems) {
      throw new Error('Invalid content.json format');
    }

    // Remove _id fields and let MongoDB generate them
    const contentData = data.contentItems.map(content => {
      const { _id, ...rest } = content;
      return rest;
    });

    const content = await Content.insertMany(contentData);
    console.log(`✅ Inserted ${content.length} content items`);
    return content;
  } catch (error) {
    console.error('❌ Error seeding content:', error.message);
    throw error;
  }
};

// Create sample quizzes
const createSampleQuizzes = async () => {
  console.log('\n❓ Creating sample quizzes...');
  try {
    const modules = await Module.find({});
    const quizzes = [];

    // Create a quiz for each module that has a quizId
    for (const module of modules) {
      if (module.quizId) {
        const quiz = {
          quizId: module.quizId,
          moduleId: module._id,
          title: `${module.name} Assessment`,
          description: `Test your understanding of ${module.name}`,
          timeLimit: 1800, // 30 minutes
          passingScore: module.passingScore || 70,
          randomizeQuestions: true,
          allowReview: true,
          showResults: true,
          questions: [
            {
              questionId: `${module.quizId}_q1`,
              questionType: 'multiple_choice',
              questionText: `Which of the following best describes the main concept of ${module.name}?`,
              points: 10,
              order: 1,
              options: [
                { optionId: 'a', text: 'Option A', isCorrect: true },
                { optionId: 'b', text: 'Option B', isCorrect: false },
                { optionId: 'c', text: 'Option C', isCorrect: false },
                { optionId: 'd', text: 'Option D', isCorrect: false }
              ],
              explanation: 'This is the correct answer based on the module content.'
            },
            {
              questionId: `${module.quizId}_q2`,
              questionType: 'true_false',
              questionText: `True or False: ${module.name} is an important topic in deepfake detection.`,
              points: 10,
              order: 2,
              options: [
                { optionId: 'true', text: 'True', isCorrect: true },
                { optionId: 'false', text: 'False', isCorrect: false }
              ],
              explanation: 'This statement is true.'
            },
            {
              questionId: `${module.quizId}_q3`,
              questionType: 'multiple_select',
              questionText: 'Select all that apply to the concepts covered in this module:',
              points: 15,
              order: 3,
              options: [
                { optionId: 'a', text: 'Concept 1', isCorrect: true },
                { optionId: 'b', text: 'Concept 2', isCorrect: true },
                { optionId: 'c', text: 'Unrelated concept', isCorrect: false },
                { optionId: 'd', text: 'Another unrelated concept', isCorrect: false }
              ],
              explanation: 'Concepts 1 and 2 are the correct answers.'
            }
          ],
          status: 'active'
        };
        quizzes.push(quiz);
      }
    }

    if (quizzes.length > 0) {
      const insertedQuizzes = await Quiz.insertMany(quizzes);
      console.log(`✅ Created ${insertedQuizzes.length} sample quizzes`);
      return insertedQuizzes;
    } else {
      console.log('⚠️  No modules with quizId found');
      return [];
    }
  } catch (error) {
    console.error('❌ Error creating sample quizzes:', error.message);
    throw error;
  }
};

// Create sample labs
const createSampleLabs = async () => {
  console.log('\n🔬 Creating sample labs...');
  try {
    const modules = await Module.find({ requiresLabCompletion: true });
    const labs = [];

    for (const module of modules) {
      const lab = {
        labId: `lab_${module.moduleId}`,
        moduleId: module._id,
        title: `${module.name} - Practical Lab`,
        description: `Hands-on deepfake detection challenges for ${module.name}`,
        labType: 'visual_detection',
        instructions: `Complete the following challenges to test your understanding of ${module.name}. Analyze each media file carefully and provide your verdict.`,
        timeLimit: 45,
        passingScore: 70,
        challenges: [
          {
            challengeId: `${module.moduleId}_ch1`,
            title: 'Video Analysis Challenge',
            description: 'Analyze this video and determine if it is a deepfake',
            mediaUrl: '/media/labs/sample-video-1.mp4',
            mediaType: 'video',
            isDeepfake: true,
            artifacts: ['Unnatural facial movements around the mouth', 'Inconsistent lighting on the face vs background'],
            points: 50,
            order: 1
          },
          {
            challengeId: `${module.moduleId}_ch2`,
            title: 'Image Detection Challenge',
            description: 'Examine this image for signs of manipulation',
            mediaUrl: '/media/labs/sample-image-1.jpg',
            mediaType: 'image',
            isDeepfake: false,
            artifacts: [],
            points: 50,
            order: 2
          }
        ],
        status: 'active'
      };
      labs.push(lab);
    }

    // Create at least one lab if none exist
    if (labs.length === 0) {
      // Get first module for default lab
      const firstModule = await Module.findOne({});
      labs.push({
        labId: 'lab_sample_001',
        moduleId: firstModule ? firstModule._id : null,
        title: 'Introduction to Deepfake Detection Lab',
        description: 'Practice identifying deepfakes with guided examples',
        labType: 'visual_detection',
        instructions: 'Complete the following challenge to practice deepfake detection. Analyze the video carefully.',
        timeLimit: 30,
        passingScore: 70,
        challenges: [
          {
            challengeId: 'sample_ch1',
            title: 'Basic Video Analysis',
            description: 'Determine if this video contains a deepfake',
            mediaUrl: '/media/labs/intro-video-1.mp4',
            mediaType: 'video',
            isDeepfake: true,
            artifacts: ['Unnatural facial movements'],
            points: 100,
            order: 1
          }
        ],
        status: 'active'
      });
    }

    const insertedLabs = await Lab.insertMany(labs);
    console.log(`✅ Created ${insertedLabs.length} sample labs`);
    return insertedLabs;
  } catch (error) {
    console.error('❌ Error creating sample labs:', error.message);
    throw error;
  }
};

// Create sample badges
const createSampleBadges = async () => {
  console.log('\n🏆 Creating sample badges...');
  try {
    const badges = [
      {
        badgeId: 'badge_first_steps',
        name: 'First Steps',
        description: 'Complete your first lesson',
        icon: '🎯',
        category: 'completion',
        rarity: 'common',
        criteria: {
          type: 'lessons_completed',
          value: 1
        }
      },
      {
        badgeId: 'badge_knowledge_seeker',
        name: 'Knowledge Seeker',
        description: 'Complete 10 lessons',
        icon: '📚',
        category: 'achievement',
        rarity: 'common',
        criteria: {
          type: 'lessons_completed',
          value: 10
        }
      },
      {
        badgeId: 'badge_quiz_master',
        name: 'Quiz Master',
        description: 'Score 100% on any quiz',
        icon: '🎓',
        category: 'mastery',
        rarity: 'rare',
        criteria: {
          type: 'quiz_score',
          value: 100
        }
      },
      {
        badgeId: 'badge_streak_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        icon: '🔥',
        category: 'streak',
        rarity: 'common',
        criteria: {
          type: 'streak',
          value: 7
        }
      },
      {
        badgeId: 'badge_beginner_track',
        name: 'Foundation Expert',
        description: 'Complete the Beginner Track',
        icon: '⭐',
        category: 'completion',
        rarity: 'rare',
        criteria: {
          type: 'track_completion',
          value: 'track_beginner'
        }
      },
      {
        badgeId: 'badge_intermediate_track',
        name: 'Detection Specialist',
        description: 'Complete the Intermediate Track',
        icon: '🌟',
        category: 'completion',
        rarity: 'epic',
        criteria: {
          type: 'track_completion',
          value: 'track_intermediate'
        }
      },
      {
        badgeId: 'badge_advanced_track',
        name: 'Deepfake Expert',
        description: 'Complete the Advanced Track',
        icon: '💎',
        category: 'completion',
        rarity: 'legendary',
        criteria: {
          type: 'track_completion',
          value: 'track_advanced'
        }
      },
      {
        badgeId: 'badge_xp_1000',
        name: 'Rising Star',
        description: 'Earn 1000 XP',
        icon: '⚡',
        category: 'achievement',
        rarity: 'common',
        criteria: {
          type: 'total_xp',
          value: 1000
        }
      },
      {
        badgeId: 'badge_xp_5000',
        name: 'Power Learner',
        description: 'Earn 5000 XP',
        icon: '💫',
        category: 'achievement',
        rarity: 'epic',
        criteria: {
          type: 'total_xp',
          value: 5000
        }
      },
      {
        badgeId: 'badge_lab_detective',
        name: 'Lab Detective',
        description: 'Complete 5 lab challenges',
        icon: '🔍',
        category: 'achievement',
        rarity: 'rare',
        criteria: {
          type: 'lab_score',
          value: 5
        }
      }
    ];

    const insertedBadges = await Badge.insertMany(badges);
    console.log(`✅ Created ${insertedBadges.length} badges`);
    return insertedBadges;
  } catch (error) {
    console.error('❌ Error creating badges:', error.message);
    throw error;
  }
};

// Verify database integrity
const verifyDatabase = async () => {
  console.log('\n🔍 Verifying database integrity...');
  try {
    const trackCount = await Track.countDocuments();
    const moduleCount = await Module.countDocuments();
    const lessonCount = await Lesson.countDocuments();
    const contentCount = await Content.countDocuments();
    const quizCount = await Quiz.countDocuments();
    const labCount = await Lab.countDocuments();
    const badgeCount = await Badge.countDocuments();

    console.log('\n📊 Database Summary:');
    console.log(`   Tracks: ${trackCount}`);
    console.log(`   Modules: ${moduleCount}`);
    console.log(`   Lessons: ${lessonCount}`);
    console.log(`   Content Items: ${contentCount}`);
    console.log(`   Quizzes: ${quizCount}`);
    console.log(`   Labs: ${labCount}`);
    console.log(`   Badges: ${badgeCount}`);

    // Verify relationships
    console.log('\n🔗 Verifying relationships...');

    // Check if all tracks have modules
    const tracks = await Track.find({});
    for (const track of tracks) {
      const modules = await Module.find({ trackId: track._id });
      console.log(`   Track "${track.name}": ${modules.length} modules`);
    }

    // Check if all modules have lessons
    const modules = await Module.find({});
    for (const module of modules.slice(0, 5)) { // Show first 5 only
      const lessons = await Lesson.find({ moduleId: module._id });
      console.log(`   Module "${module.name}": ${lessons.length} lessons`);
    }

    console.log('\n✅ Database verification complete!');
  } catch (error) {
    console.error('❌ Error verifying database:', error.message);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  console.log('🌱 Starting database seeding process...');
  console.log('=====================================\n');

  try {
    // Connect to MongoDB
    await connectDB();

    // Clear existing data
    await clearCollections();

    // Seed data in order (maintaining referential integrity)
    await seedTracks();
    await seedModules();
    await seedLessons();
    await seedContent();
    await createSampleQuizzes();
    await createSampleLabs();
    await createSampleBadges();

    // Verify everything
    await verifyDatabase();

    console.log('\n=====================================');
    console.log('🎉 Database seeding completed successfully!');
    console.log('=====================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run the seeder
seedDatabase();
