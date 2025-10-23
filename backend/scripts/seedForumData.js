const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const User = require('../models/user.model');
const ForumPost = require('../models/forumPost.model');

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

// Create dummy users if they don't exist
const createDummyUsers = async () => {
  const users = [
    {
      fullName: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      password: 'password123',
      age: 22,
      role: 'Learner',
      status: 'active'
    },
    {
      fullName: 'Michael Chen',
      email: 'michael.chen@example.com',
      password: 'password123',
      age: 28,
      role: 'Learner',
      status: 'active'
    },
    {
      fullName: 'Emma Rodriguez',
      email: 'emma.rodriguez@example.com',
      password: 'password123',
      age: 19,
      role: 'Learner',
      status: 'active'
    },
    {
      fullName: 'David Kim',
      email: 'david.kim@example.com',
      password: 'password123',
      age: 25,
      role: 'Learner',
      status: 'active'
    },
    {
      fullName: 'Lisa Anderson',
      email: 'lisa.anderson@example.com',
      password: 'password123',
      age: 31,
      role: 'Learner',
      status: 'active'
    }
  ];

  const createdUsers = [];

  for (const userData of users) {
    let user = await User.findOne({ email: userData.email });

    if (!user) {
      user = new User(userData);
      await user.save();
      console.log(`✅ Created user: ${user.fullName}`);
    } else {
      console.log(`ℹ️  User already exists: ${user.fullName}`);
    }

    createdUsers.push(user);
  }

  return createdUsers;
};

// Seed forum posts and comments
const seedForumData = async () => {
  console.log('🌱 Seeding forum data...\n');

  try {
    await connectDB();

    // Create dummy users
    console.log('\n👥 Creating/verifying dummy users...\n');
    const users = await createDummyUsers();

    // Check if forum posts already exist
    const existingPosts = await ForumPost.countDocuments();

    if (existingPosts > 0) {
      console.log('\n⚠️  Forum posts already exist!');
      console.log(`Current post count: ${existingPosts}`);
      console.log('\nTo reseed, please delete existing posts first or use a clean database.\n');
      process.exit(0);
    }

    console.log('\n📝 Creating forum posts with comments...\n');

    // Post 1: About deepfake detection techniques
    const post1 = new ForumPost({
      content: `Just completed the deepfake detection module and I'm blown away by how sophisticated these fake videos can be! 🤯

I had no idea that deepfakes could be created so easily with modern AI tools. The lesson on detection techniques was super helpful - especially the part about looking for inconsistencies in blinking patterns and lighting.

Has anyone else tried analyzing videos on their own after taking this course? I've been checking YouTube videos and now I'm second-guessing everything I watch! 😅

What detection methods do you find most reliable? I'd love to hear your experiences!`,
      author: users[0]._id,
      comments: [
        {
          content: `I totally relate! After this course, I've become way more skeptical about videos on social media. The blinking pattern technique is interesting but I find checking the lighting and shadows to be more reliable. Deepfakes often mess up the lighting consistency.`,
          author: users[1]._id,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          content: `Great post! I've been using the audio-visual synchronization check that was mentioned in Module 3. Sometimes the lip movements don't match perfectly with the audio in deepfakes. It's subtle but once you know what to look for, it's pretty obvious!`,
          author: users[2]._id,
          createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000) // 1.5 hours ago
        },
        {
          content: `Another tip: check the edges around the face, especially the hairline and jaw. Deepfakes often have slight blurring or artifacts there. The course demo in the lab section really helped me practice spotting these issues!`,
          author: users[3]._id,
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
        },
        {
          content: `This is such an important skill nowadays. I showed my parents some examples from the course and they couldn't believe how real some deepfakes look. We need more awareness about this technology!`,
          author: users[4]._id,
          createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
        }
      ],
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
    });

    await post1.save();
    console.log('✅ Created post 1: "Deepfake Detection Techniques"');

    // Post 2: About ethical concerns and misinformation
    const post2 = new ForumPost({
      content: `The module on ethical implications of deepfakes really got me thinking about the broader impact on society. 🤔

While the technology itself is fascinating, I'm concerned about how it can be weaponized to spread misinformation, especially during elections or to damage someone's reputation.

The case studies we reviewed were eye-opening - from celebrity deepfakes to political manipulation attempts. It makes me wonder: are we doing enough as a society to combat this threat?

I think education (like what Perceptify offers) is crucial, but shouldn't there also be stronger regulations and detection tools built into social media platforms?

Would love to hear everyone's thoughts on this!`,
      author: users[1]._id,
      comments: [
        {
          content: `You're absolutely right about the need for platform-level detection. I read recently that some social media companies are developing AI to detect deepfakes automatically. But it's a cat-and-mouse game - as detection improves, so do the creation techniques.`,
          author: users[0]._id,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
        },
        {
          content: `The ethics module was my favorite part of the course! I think media literacy education is just as important as technical detection. People need to develop a healthy skepticism and verify sources before sharing content. Not everyone can spot technical artifacts in deepfakes.`,
          author: users[4]._id,
          createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000) // 2.5 hours ago
        },
        {
          content: `I agree with both of you. What worries me most is deepfakes being used for fraud - like impersonating CEOs to authorize wire transfers or creating fake evidence in legal cases. The course mentioned some real cases and it's genuinely scary. We need better authentication methods for high-stakes communications.`,
          author: users[2]._id,
          createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000) // 1.5 hours ago
        }
      ],
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
    });

    await post2.save();
    console.log('✅ Created post 2: "Ethical Implications and Misinformation"');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Forum seeding completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📊 Summary:`);
    console.log(`   • Users created/verified: ${users.length}`);
    console.log(`   • Forum posts created: 2`);
    console.log(`   • Total comments created: 7`);
    console.log(`\n💡 Dummy user credentials (password for all: password123):`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.fullName} - ${user.email}`);
    });
    console.log('\n🚀 You can now login and view the forum!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding forum data:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run the script
seedForumData();
