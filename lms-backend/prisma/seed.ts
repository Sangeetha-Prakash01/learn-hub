import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with premium content...');

  // 1. CLEAR EXISTING DATA (Optional, but good for clean seed)
  // await prisma.videoProgress.deleteMany();
  // await prisma.enrollment.deleteMany();
  // await prisma.video.deleteMany();
  // await prisma.section.deleteMany();
  // await prisma.subject.deleteMany();

  // 2. USERS
  const adminHash = await bcrypt.hash('admin123', 10);
  const instrHash = await bcrypt.hash('instructor123', 10);
  const studentHash = await bcrypt.hash('student123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lms.com' },
    update: {},
    create: { email: 'admin@lms.com', passwordHash: adminHash, name: 'Admin User', role: Role.ADMIN },
  });

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@lms.com' },
    update: {},
    create: { email: 'instructor@lms.com', passwordHash: instrHash, name: 'John Instructor', role: Role.INSTRUCTOR },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@lms.com' },
    update: {},
    create: { email: 'student@lms.com', passwordHash: studentHash, name: 'Jane Student', role: Role.STUDENT },
  });

  // 3. SEEDING COURSES (10 COURSES)
  const coursesData = [
    { title: 'React JS Tutorial', slug: 'react-js-tutorial', price: 29.99, yt: 'PkZNo7MFNFg', thumb: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=640', desc: 'Master React.js from scratch. Built for modern web development.' },
    { title: 'JavaScript Basics', slug: 'javascript-basics', price: 0, yt: 'W6NZfCO5SIk', thumb: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=640', desc: 'Learn the core concepts of JavaScript, the language of the web.' },
    { title: 'CSS Complete Guide', slug: 'css-complete-guide', price: 19.99, yt: 'HcOc7P5BMi4', thumb: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=640', desc: 'Become a CSS master and build beautiful, responsive websites.' },
    { title: 'Node.js Beginner', slug: 'node-js-beginner', price: 39.99, yt: 'PkZNo7MFNFg', thumb: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=640', desc: 'Start your backend journey with Node.js and Express.' },
    { title: 'Git & GitHub', slug: 'git-github-mastery', price: 0, yt: 'hrTQipWp6co', thumb: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=640', desc: 'Master version control with Git and collaborate on GitHub.' },
    { title: 'Leadership Skills', slug: 'leadership-skills', price: 49.99, yt: 'tqC1WwWKtfE', thumb: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=640', desc: 'Essential leadership skills for the modern workplace.' },
    { title: 'Communication Skills', slug: 'communication-skills', price: 49.99, yt: 'HAnw168huqA', thumb: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=640', desc: 'Improve your professional and personal communication.' },
    { title: 'Data Analysis Basics', slug: 'data-analysis-basics', price: 0, yt: 'PSNXoAs2FtQ', thumb: 'https://images.unsplash.com/photo-1551288049-bbda10be2305?w=640', desc: 'Introduction to data analysis with modern tools.' },
    { title: 'Workplace Safety', slug: 'workplace-safety', price: 0, yt: 'W--iI196xjA', thumb: 'https://images.unsplash.com/photo-1521791136064-7986c29535ad?w=640', desc: 'Essential safety protocols for every professional environment.' },
    { title: 'HR Fundamentals', slug: 'hr-fundamentals', price: 59.99, yt: 'aPEUKLxxh_k', thumb: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=640', desc: 'Understanding Human Resources management and best practices.' },
  ];

  for (const c of coursesData) {
    const subject = await prisma.subject.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        description: c.desc,
        thumbnail: c.thumb,
        price: c.price,
        isPublished: true,
      },
      create: {
        title: c.title,
        slug: c.slug,
        description: c.desc,
        thumbnail: c.thumb,
        price: c.price,
        isPublished: true,
        instructorId: instructor.id,
      },
    });

    // Create 1 Section for each
    const section = await prisma.section.upsert({
      where: { subjectId_orderIndex: { subjectId: subject.id, orderIndex: 0 } },
      update: { title: 'Introduction' },
      create: { subjectId: subject.id, title: 'Introduction', orderIndex: 0 },
    });

    // Add 1 Video for each (the one provided)
    await prisma.video.upsert({
      where: { sectionId_orderIndex: { sectionId: section.id, orderIndex: 0 } },
      update: {
        title: `Welcome to ${c.title}`,
        youtubeUrl: `https://www.youtube.com/embed/${c.yt.split('v=')[1] || c.yt.split('/').pop()?.split('?')[0]}`,
        isFree: c.price === 0,
        durationSeconds: 600,
        description: `This is the introductory lesson for ${c.title}.`,
      },
      create: {
        sectionId: section.id,
        title: `Welcome to ${c.title}`,
        youtubeUrl: `https://www.youtube.com/embed/${c.yt.split('v=')[1] || c.yt.split('/').pop()?.split('?')[0]}`,
        orderIndex: 0,
        isFree: c.price === 0,
        durationSeconds: 600,
        description: `This is the introductory lesson for ${c.title}.`,
      },
    });
  }

  // 4. BADGES
  const badges = [
    { name: 'Welcome Boarder', icon: 'UserPlus', desc: 'Joined the LearnHub community!' },
    { name: 'Fast Learner', icon: 'Zap', desc: 'Completed your first lesson in record time.' },
    { name: 'Knowledge Junkie', icon: 'BookOpen', desc: 'Enrolled in 5 or more courses.' },
    { name: 'Mastermind', icon: 'Trophy', desc: 'Completed a full course with 100% progress.' },
    { name: 'Early Bird', icon: 'Clock', desc: 'Logged in and studied before 8 AM.' },
  ];

  for (const b of badges) {
    await prisma.badge.upsert({
      where: { id: badges.indexOf(b) + 1 },
      update: { name: b.name, description: b.desc, icon: b.icon },
      create: { name: b.name, description: b.desc, icon: b.icon },
    });
  }

  // Award 'Welcome Boarder' to demo student
  const welcomeBadge = await prisma.badge.findFirst({ where: { name: 'Welcome Boarder' } });
  if (welcomeBadge) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: student.id, badgeId: welcomeBadge.id } },
      update: {},
      create: { userId: student.id, badgeId: welcomeBadge.id },
    });
  }

  console.log('✅ Premium Seed complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
