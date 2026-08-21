/* ═══════════════════════════════════════════════════════════
   SkillSwap P2P Learning — Mock Data & State Store
   ═══════════════════════════════════════════════════════════ */
import { useState, useCallback, useEffect } from 'react';
import type {
  Course, Enrollment, Lecture, LectureAttendance, Exam, ExamAttempt,
  CertificateRequest, Certificate, ExamStatus, CertificateStatus,
  ApprovalStatus, ChatMessage,
} from './skillswapTypes';

/* ─── Current User ID (matches backend demo user) ─── */
export const CURRENT_USER_ID = 'user-alex';
export const CURRENT_USER_NAME = 'Alex Memon';

export const ADMIN_USER_ID = 'admin-olivia';
export const ADMIN_USER_NAME = 'Olivia Bennett';

/* ─── Users ─── */
export const mockUsers = [
  { id: 'user-alex', name: 'Alex Memon', email: 'user@skillswap.city', location: 'Ahmedabad', avatar: 'A' },
  { id: 'user-sarah', name: 'Sarah Khan', email: 'sarah@skillswap.city', location: 'Mumbai', avatar: 'S' },
  { id: 'user-rahul', name: 'Rahul Verma', email: 'rahul@skillswap.city', location: 'Bangalore', avatar: 'R' },
  { id: 'user-priya', name: 'Priya Nair', email: 'priya@skillswap.city', location: 'Chennai', avatar: 'P' },
  { id: 'admin-olivia', name: 'Olivia Bennett', email: 'admin@skillswap.city', location: 'Mumbai', avatar: 'O' },
];

/* ─── Courses ─── */
export const mockCourses: Course[] = [
  {
    id: 'course-react',
    skillName: 'React Development',
    description: 'Master React from fundamentals to advanced patterns — hooks, state management, component architecture, and production best practices.',
    teacherId: 'user-alex',
    teacherName: 'Alex Memon',
    totalLectures: 12,
    category: 'tech',
    icon: '⚛️',
    enrolledCount: 3,
  },
  {
    id: 'course-photo',
    skillName: 'Photography Basics',
    description: 'Learn composition, lighting, portrait techniques, and post-processing fundamentals to capture stunning photographs.',
    teacherId: 'user-sarah',
    teacherName: 'Sarah Khan',
    totalLectures: 10,
    category: 'photo',
    icon: '📸',
    enrolledCount: 2,
  },
  {
    id: 'course-js',
    skillName: 'JavaScript Fundamentals',
    description: 'Deep dive into JavaScript — closures, prototypes, async/await, ES modules, and modern patterns.',
    teacherId: 'user-alex',
    teacherName: 'Alex Memon',
    totalLectures: 10,
    category: 'tech',
    icon: '💛',
    enrolledCount: 2,
  },
  {
    id: 'course-webdesign',
    skillName: 'Web Design Principles',
    description: 'Color theory, typography, layout systems, responsive design, and UX fundamentals.',
    teacherId: 'user-alex',
    teacherName: 'Alex Memon',
    totalLectures: 8,
    category: 'design',
    icon: '🎨',
    enrolledCount: 1,
  },
  {
    id: 'course-speaking',
    skillName: 'Public Speaking',
    description: 'Overcome stage fright, structure compelling talks, and master audience engagement.',
    teacherId: 'user-priya',
    teacherName: 'Priya Nair',
    totalLectures: 8,
    category: 'language',
    icon: '🗣️',
    enrolledCount: 1,
  },
];

/* ─── Enrollments ─── */
export const initialEnrollments: Enrollment[] = [
  // Alex learning Photography from Sarah — 7/10 lectures done
  {
    id: 'enroll-1',
    courseId: 'course-photo',
    learnerId: 'user-alex',
    learnerName: 'Alex Memon',
    progress: 70,
    lecturesCompleted: 7,
    examStatus: 'locked',
    examScore: null,
    certificateStatus: 'locked',
    enrolledAt: '2026-06-15',
  },
  // Alex learning Public Speaking from Priya — 8/8 lectures done, exam passed, cert requested
  {
    id: 'enroll-2',
    courseId: 'course-speaking',
    learnerId: 'user-alex',
    learnerName: 'Alex Memon',
    progress: 100,
    lecturesCompleted: 8,
    examStatus: 'passed',
    examScore: 90,
    certificateStatus: 'requested',
    enrolledAt: '2026-05-20',
  },
  // Sarah learning React from Alex — 9/12 lectures done
  {
    id: 'enroll-3',
    courseId: 'course-react',
    learnerId: 'user-sarah',
    learnerName: 'Sarah Khan',
    progress: 75,
    lecturesCompleted: 9,
    examStatus: 'locked',
    examScore: null,
    certificateStatus: 'locked',
    enrolledAt: '2026-06-01',
  },
  // Rahul learning React from Alex — all done, exam passed, cert generated
  {
    id: 'enroll-4',
    courseId: 'course-react',
    learnerId: 'user-rahul',
    learnerName: 'Rahul Verma',
    progress: 100,
    lecturesCompleted: 12,
    examStatus: 'passed',
    examScore: 86,
    certificateStatus: 'generated',
    enrolledAt: '2026-05-01',
  },
  // Priya learning React from Alex — 4/12 lectures done
  {
    id: 'enroll-5',
    courseId: 'course-react',
    learnerId: 'user-priya',
    learnerName: 'Priya Nair',
    progress: 33,
    lecturesCompleted: 4,
    examStatus: 'locked',
    examScore: null,
    certificateStatus: 'locked',
    enrolledAt: '2026-07-10',
  },
  // Rahul learning JS from Alex — 6/10 lectures done
  {
    id: 'enroll-6',
    courseId: 'course-js',
    learnerId: 'user-rahul',
    learnerName: 'Rahul Verma',
    progress: 60,
    lecturesCompleted: 6,
    examStatus: 'locked',
    examScore: null,
    certificateStatus: 'locked',
    enrolledAt: '2026-06-20',
  },
  // Priya learning JS from Alex — 2/10
  {
    id: 'enroll-7',
    courseId: 'course-js',
    learnerId: 'user-priya',
    learnerName: 'Priya Nair',
    progress: 20,
    lecturesCompleted: 2,
    examStatus: 'locked',
    examScore: null,
    certificateStatus: 'locked',
    enrolledAt: '2026-07-15',
  },
  // Sarah learning Photography — enrolled in her own? No. Let's do Alex learning from Sarah only.
  // Rahul learning Photography from Sarah — 3/10
  {
    id: 'enroll-8',
    courseId: 'course-photo',
    learnerId: 'user-rahul',
    learnerName: 'Rahul Verma',
    progress: 30,
    lecturesCompleted: 3,
    examStatus: 'locked',
    examScore: null,
    certificateStatus: 'locked',
    enrolledAt: '2026-07-01',
  },
  // Priya learning Web Design from Alex — 8/8 all done, exam passed, cert pending admin approval
  {
    id: 'enroll-9',
    courseId: 'course-webdesign',
    learnerId: 'user-priya',
    learnerName: 'Priya Nair',
    progress: 100,
    lecturesCompleted: 8,
    examStatus: 'passed',
    examScore: 92,
    certificateStatus: 'tutor-approved',
    enrolledAt: '2026-05-10',
  },
];

/* ─── Lectures ─── */
function generateLectures(courseId: string, titles: string[], completedCount: number): Lecture[] {
  return titles.map((title, i) => ({
    id: `${courseId}-lec-${i + 1}`,
    courseId,
    title,
    description: `Lecture ${i + 1}: ${title}`,
    order: i + 1,
    duration: `${40 + Math.floor(Math.random() * 20)} min`,
    scheduledAt: new Date(2026, 5, 15 + i * 3).toISOString(),
    status: i < completedCount ? 'completed' as const : i === completedCount ? 'upcoming' as const : 'upcoming' as const,
  }));
}

export const mockLectures: Lecture[] = [
  ...generateLectures('course-react', [
    'Introduction to React & JSX',
    'Components & Props',
    'State & Lifecycle',
    'Handling Events',
    'Conditional Rendering',
    'Lists & Keys',
    'Forms & Controlled Components',
    'React Hooks — useState & useEffect',
    'Custom Hooks',
    'Context API & State Management',
    'React Router & Navigation',
    'Production Build & Deployment',
  ], 9),
  ...generateLectures('course-photo', [
    'Camera Basics & Settings',
    'Understanding Exposure Triangle',
    'Composition Rules',
    'Natural Light Photography',
    'Portrait Photography',
    'Landscape & Street Photography',
    'Studio Lighting Setup',
    'Post-Processing with Lightroom',
    'Color Grading & Editing',
    'Building Your Portfolio',
  ], 7),
  ...generateLectures('course-js', [
    'Variables, Types & Operators',
    'Functions & Scope',
    'Objects & Arrays',
    'Closures & Prototypes',
    'DOM Manipulation',
    'Async JavaScript — Callbacks & Promises',
    'Async/Await & Error Handling',
    'ES6+ Modules',
    'Design Patterns',
    'Testing & Debugging',
  ], 6),
  ...generateLectures('course-webdesign', [
    'Design Thinking & UX Principles',
    'Color Theory & Palettes',
    'Typography Fundamentals',
    'Layout & Grid Systems',
    'Responsive Design',
    'UI Components & Systems',
    'Accessibility Best Practices',
    'Design Portfolio Review',
  ], 8),
  ...generateLectures('course-speaking', [
    'Overcoming Stage Fright',
    'Structuring Your Talk',
    'Storytelling Techniques',
    'Body Language & Presence',
    'Vocal Projection & Clarity',
    'Engaging Your Audience',
    'Handling Q&A Sessions',
    'Final Presentation & Feedback',
  ], 8),
];

/* ─── Exams ─── */
export const mockExams: Exam[] = [
  {
    id: 'exam-react',
    courseId: 'course-react',
    title: 'React Development — Final Assessment',
    description: 'This exam covers all 12 lectures. You have 30 minutes to answer 20 multiple-choice questions. You need 60% to pass.',
    timeLimit: 30,
    passingScore: 60,
    questions: [
      { id: 'q1', question: 'What is JSX in React?', options: ['A JavaScript XML syntax extension', 'A CSS framework', 'A database query language', 'A testing library'], correctAnswer: 0 },
      { id: 'q2', question: 'Which hook is used for side effects in React?', options: ['useState', 'useEffect', 'useContext', 'useRef'], correctAnswer: 1 },
      { id: 'q3', question: 'What is the virtual DOM?', options: ['A real DOM copy', 'A lightweight JS representation of the DOM', 'A CSS rendering engine', 'A browser API'], correctAnswer: 1 },
      { id: 'q4', question: 'How do you pass data from parent to child component?', options: ['State', 'Props', 'Context', 'Refs'], correctAnswer: 1 },
      { id: 'q5', question: 'What does useState return?', options: ['A single value', 'An array with value and setter', 'An object', 'A promise'], correctAnswer: 1 },
      { id: 'q6', question: 'Which method is used to render a React element into the DOM?', options: ['ReactDOM.render()', 'React.createElement()', 'document.render()', 'React.mount()'], correctAnswer: 0 },
      { id: 'q7', question: 'What is a controlled component?', options: ['A component with no state', 'A form element whose value is controlled by React state', 'A component wrapped in HOC', 'A server-side component'], correctAnswer: 1 },
      { id: 'q8', question: 'What is the purpose of keys in React lists?', options: ['Styling', 'Help React identify changed items', 'Sorting', 'Filtering'], correctAnswer: 1 },
      { id: 'q9', question: 'What is React.memo used for?', options: ['Memoizing components to prevent unnecessary re-renders', 'Creating memos', 'Storing data', 'Routing'], correctAnswer: 0 },
      { id: 'q10', question: 'Which hook replaces componentDidMount?', options: ['useState', 'useEffect with empty deps', 'useLayoutEffect', 'useMemo'], correctAnswer: 1 },
      { id: 'q11', question: 'What is the Context API used for?', options: ['Routing', 'Styling', 'Global state management', 'API calls'], correctAnswer: 2 },
      { id: 'q12', question: 'What is a custom hook?', options: ['A built-in React function', 'A reusable function that uses React hooks', 'A CSS-in-JS library', 'A testing utility'], correctAnswer: 1 },
      { id: 'q13', question: 'What does useRef return?', options: ['A state value', 'A mutable ref object', 'A callback', 'A context'], correctAnswer: 1 },
      { id: 'q14', question: 'How do you handle forms in React?', options: ['Using jQuery', 'Using controlled or uncontrolled components', 'Using CSS', 'Using Web Workers'], correctAnswer: 1 },
      { id: 'q15', question: 'What is React Router used for?', options: ['State management', 'Client-side routing', 'API calls', 'Styling'], correctAnswer: 1 },
      { id: 'q16', question: 'What is the difference between state and props?', options: ['No difference', 'State is mutable and local, props are read-only from parent', 'Props are mutable', 'State comes from parent'], correctAnswer: 1 },
      { id: 'q17', question: 'What is lazy loading in React?', options: ['Loading components on demand', 'Slow rendering', 'Pre-loading all components', 'Server-side rendering'], correctAnswer: 0 },
      { id: 'q18', question: 'What tool is commonly used to create React apps?', options: ['Webpack only', 'Create React App or Vite', 'Gulp', 'Grunt'], correctAnswer: 1 },
      { id: 'q19', question: 'What is StrictMode in React?', options: ['A production mode', 'A development tool for highlighting potential problems', 'A CSS mode', 'A testing framework'], correctAnswer: 1 },
      { id: 'q20', question: 'What are React fragments used for?', options: ['Adding styles', 'Grouping elements without adding extra DOM nodes', 'Creating portals', 'Managing state'], correctAnswer: 1 },
    ],
  },
  {
    id: 'exam-photo',
    courseId: 'course-photo',
    title: 'Photography Basics — Final Assessment',
    description: 'This exam covers all 10 lectures on photography fundamentals. You have 25 minutes for 15 questions. Pass mark: 60%.',
    timeLimit: 25,
    passingScore: 60,
    questions: [
      { id: 'pq1', question: 'What are the three elements of the exposure triangle?', options: ['Aperture, Shutter Speed, ISO', 'Focus, Zoom, Flash', 'Lens, Body, Sensor', 'Brightness, Contrast, Saturation'], correctAnswer: 0 },
      { id: 'pq2', question: 'What does a low f-stop number mean?', options: ['Small aperture, deep DOF', 'Large aperture, shallow DOF', 'Slow shutter speed', 'High ISO'], correctAnswer: 1 },
      { id: 'pq3', question: 'What is the rule of thirds?', options: ['Using three cameras', 'Dividing frame into 9 equal sections for composition', 'Taking three shots', 'Using three light sources'], correctAnswer: 1 },
      { id: 'pq4', question: 'What does ISO control?', options: ['Focus', 'Sensor sensitivity to light', 'Color temperature', 'Shutter speed'], correctAnswer: 1 },
      { id: 'pq5', question: 'What is golden hour in photography?', options: ['Midnight', 'The hour after sunrise or before sunset', 'Noon', 'Any time with clouds'], correctAnswer: 1 },
      { id: 'pq6', question: 'What is bokeh?', options: ['A camera brand', 'The aesthetic quality of out-of-focus areas', 'A type of lens', 'A filter'], correctAnswer: 1 },
      { id: 'pq7', question: 'What does white balance adjust?', options: ['Brightness', 'Color temperature to appear natural', 'Contrast', 'Sharpness'], correctAnswer: 1 },
      { id: 'pq8', question: 'What is RAW format?', options: ['A compressed image', 'An unprocessed image file with maximum data', 'A video format', 'A social media format'], correctAnswer: 1 },
      { id: 'pq9', question: 'What is leading lines composition?', options: ['Using lines to guide the viewer\'s eye', 'Drawing on photos', 'Using rulers', 'Straight horizon'], correctAnswer: 0 },
      { id: 'pq10', question: 'What is a prime lens?', options: ['A zoom lens', 'A fixed focal length lens', 'A fish-eye lens', 'A macro lens'], correctAnswer: 1 },
      { id: 'pq11', question: 'What does a polarizing filter do?', options: ['Adds blur', 'Reduces reflections and enhances colors', 'Changes focus', 'Adds bokeh'], correctAnswer: 1 },
      { id: 'pq12', question: 'What is fill light used for?', options: ['Main illumination', 'Reducing shadows created by the key light', 'Background lighting', 'Creating silhouettes'], correctAnswer: 1 },
      { id: 'pq13', question: 'What is shutter speed measured in?', options: ['Pixels', 'Seconds or fractions of seconds', 'Megapixels', 'Lumens'], correctAnswer: 1 },
      { id: 'pq14', question: 'What is post-processing?', options: ['Taking photos', 'Editing images after capture', 'Setting up equipment', 'Printing photos'], correctAnswer: 1 },
      { id: 'pq15', question: 'What makes a strong portfolio?', options: ['Quantity over quality', 'Consistent style and your best work', 'Random photos', 'Only selfies'], correctAnswer: 1 },
    ],
  },
  {
    id: 'exam-speaking',
    courseId: 'course-speaking',
    title: 'Public Speaking — Final Assessment',
    description: 'This exam covers all 8 lectures. 15 questions in 20 minutes. Pass mark: 60%.',
    timeLimit: 20,
    passingScore: 60,
    questions: [
      { id: 'sq1', question: 'What is the most common cause of stage fright?', options: ['Lack of sleep', 'Fear of judgment', 'Bad microphone', 'Room temperature'], correctAnswer: 1 },
      { id: 'sq2', question: 'What is the recommended structure for a talk?', options: ['Random order', 'Opening, body, conclusion', 'Only body', 'Only conclusion'], correctAnswer: 1 },
      { id: 'sq3', question: 'Why is storytelling effective in speaking?', options: ['It wastes time', 'It creates emotional connection', 'It confuses people', 'It replaces facts'], correctAnswer: 1 },
      { id: 'sq4', question: 'What percentage of communication is non-verbal?', options: ['10%', '30%', 'Over 50%', '5%'], correctAnswer: 2 },
      { id: 'sq5', question: 'What is vocal projection?', options: ['Whispering', 'Speaking loudly and clearly to reach all listeners', 'Singing', 'Using a microphone'], correctAnswer: 1 },
      { id: 'sq6', question: 'How should you handle difficult Q&A?', options: ['Ignore questions', 'Acknowledge, think, respond honestly', 'Get angry', 'Leave the stage'], correctAnswer: 1 },
      { id: 'sq7', question: 'What is the purpose of pausing during a speech?', options: ['To waste time', 'To emphasize points and let audience absorb', 'To remember lines', 'To show nervousness'], correctAnswer: 1 },
      { id: 'sq8', question: 'What makes an effective opening?', options: ['Apologizing', 'A compelling hook — story, question, or statistic', 'Reading notes', 'Silence'], correctAnswer: 1 },
      { id: 'sq9', question: 'What is audience engagement?', options: ['Ignoring the crowd', 'Actively involving listeners through interaction', 'Reading from slides', 'Speaking fast'], correctAnswer: 1 },
      { id: 'sq10', question: 'Why is eye contact important?', options: ['It\'s not', 'Builds trust and connection with audience', 'Scares people', 'Required by law'], correctAnswer: 1 },
      { id: 'sq11', question: 'What is the power pose?', options: ['A yoga pose', 'A confident posture that reduces anxiety', 'A dance move', 'A sitting position'], correctAnswer: 1 },
      { id: 'sq12', question: 'How should slides be designed?', options: ['Full of text', 'Minimal with key visuals', 'No slides ever', 'Only animations'], correctAnswer: 1 },
      { id: 'sq13', question: 'What is the 10-20-30 rule?', options: ['A diet plan', '10 slides, 20 min, 30pt font', 'A workout', 'A reading method'], correctAnswer: 1 },
      { id: 'sq14', question: 'How do you build credibility as a speaker?', options: ['Lying', 'Sharing expertise, citing sources, being authentic', 'Dressing expensively', 'Speaking loudly'], correctAnswer: 1 },
      { id: 'sq15', question: 'What is the best way to end a speech?', options: ['Just stop talking', 'A strong call to action or memorable closing', 'Say "that\'s it"', 'Apologize'], correctAnswer: 1 },
    ],
  },
  {
    id: 'exam-js',
    courseId: 'course-js',
    title: 'JavaScript Fundamentals — Final Assessment',
    description: 'Covers all 10 lectures. 15 questions, 25 minutes. Pass mark: 60%.',
    timeLimit: 25,
    passingScore: 60,
    questions: [
      { id: 'jq1', question: 'What is a closure in JavaScript?', options: ['A CSS property', 'A function that remembers its outer scope', 'A loop type', 'An HTML tag'], correctAnswer: 1 },
      { id: 'jq2', question: 'What does "let" do differently from "var"?', options: ['Nothing', 'Block-scoped instead of function-scoped', 'Creates constants', 'Is slower'], correctAnswer: 1 },
      { id: 'jq3', question: 'What is a Promise?', options: ['A commitment', 'An object representing eventual completion of async operation', 'A loop', 'A variable'], correctAnswer: 1 },
      { id: 'jq4', question: 'What is the prototype chain?', options: ['A blockchain', 'How objects inherit properties from other objects', 'A CSS chain', 'A build tool'], correctAnswer: 1 },
      { id: 'jq5', question: 'What does async/await do?', options: ['Makes code synchronous', 'Syntactic sugar for Promises', 'Replaces functions', 'Creates threads'], correctAnswer: 1 },
      { id: 'jq6', question: 'What is event bubbling?', options: ['Creating animations', 'Events propagating from child to parent elements', 'A sorting algorithm', 'A CSS effect'], correctAnswer: 1 },
      { id: 'jq7', question: 'What is destructuring?', options: ['Deleting variables', 'Extracting values from objects/arrays into variables', 'Breaking code', 'A design pattern'], correctAnswer: 1 },
      { id: 'jq8', question: 'What are ES modules?', options: ['Old syntax', 'import/export system for code organization', 'A framework', 'A testing tool'], correctAnswer: 1 },
      { id: 'jq9', question: 'What does Array.map() return?', options: ['Nothing', 'A new array with transformed elements', 'A boolean', 'A string'], correctAnswer: 1 },
      { id: 'jq10', question: 'What is "this" in JavaScript?', options: ['Always window', 'A reference to the execution context', 'A variable name', 'A reserved keyword only'], correctAnswer: 1 },
      { id: 'jq11', question: 'What is the difference between == and ===?', options: ['No difference', '=== checks type and value, == only value', '== is faster', '=== is deprecated'], correctAnswer: 1 },
      { id: 'jq12', question: 'What is a callback function?', options: ['A phone call', 'A function passed as argument to another function', 'A return statement', 'An error'], correctAnswer: 1 },
      { id: 'jq13', question: 'What is the spread operator?', options: ['...', 'A math operator', 'A loop', '&&'], correctAnswer: 0 },
      { id: 'jq14', question: 'What does JSON.parse() do?', options: ['Converts object to string', 'Converts JSON string to JavaScript object', 'Deletes JSON', 'Creates HTML'], correctAnswer: 1 },
      { id: 'jq15', question: 'What is a template literal?', options: ['A template engine', 'String using backticks with embedded expressions', 'A function', 'An HTML template'], correctAnswer: 1 },
    ],
  },
  {
    id: 'exam-webdesign',
    courseId: 'course-webdesign',
    title: 'Web Design Principles — Final Assessment',
    description: '15 questions, 20 minutes. Pass mark: 60%.',
    timeLimit: 20,
    passingScore: 60,
    questions: [
      { id: 'wq1', question: 'What is design thinking?', options: ['Only about visuals', 'A human-centered approach to problem solving', 'A coding methodology', 'A business strategy'], correctAnswer: 1 },
      { id: 'wq2', question: 'What are complementary colors?', options: ['Same colors', 'Colors opposite on the color wheel', 'Adjacent colors', 'Black and white'], correctAnswer: 1 },
      { id: 'wq3', question: 'What is typography hierarchy?', options: ['Random fonts', 'Organizing text by size and weight to guide reading', 'Using one font', 'All caps'], correctAnswer: 1 },
      { id: 'wq4', question: 'What is a grid system?', options: ['A spreadsheet', 'A framework for consistent layout structure', 'A color system', 'A font'], correctAnswer: 1 },
      { id: 'wq5', question: 'What does responsive design mean?', options: ['Fast design', 'Design that adapts to different screen sizes', 'Animated design', 'Dark mode'], correctAnswer: 1 },
      { id: 'wq6', question: 'What is a design system?', options: ['A single page', 'A collection of reusable components and standards', 'A color', 'A font'], correctAnswer: 1 },
      { id: 'wq7', question: 'What is WCAG?', options: ['A design tool', 'Web Content Accessibility Guidelines', 'A CSS framework', 'A JavaScript library'], correctAnswer: 1 },
      { id: 'wq8', question: 'What is whitespace in design?', options: ['A bug', 'Empty space that helps content breathe', 'White background', 'A CSS error'], correctAnswer: 1 },
      { id: 'wq9', question: 'What is a serif font?', options: ['A sans-serif', 'A font with small decorative strokes', 'A monospace font', 'An icon font'], correctAnswer: 1 },
      { id: 'wq10', question: 'What is contrast in design?', options: ['Low visibility', 'Difference between elements to create visual interest', 'Same colors', 'Blurring'], correctAnswer: 1 },
      { id: 'wq11', question: 'What is a wireframe?', options: ['A finished design', 'A basic structural outline of a page', 'A photograph', 'A code file'], correctAnswer: 1 },
      { id: 'wq12', question: 'What is UX?', options: ['User Exercise', 'User Experience', 'User Extension', 'User Example'], correctAnswer: 1 },
      { id: 'wq13', question: 'What is mobile-first design?', options: ['Desktop only', 'Designing for mobile screens first then scaling up', 'An app', 'A plugin'], correctAnswer: 1 },
      { id: 'wq14', question: 'What is a style guide?', options: ['A fashion magazine', 'Document defining visual standards for a brand', 'A tutorial', 'A code linter'], correctAnswer: 1 },
      { id: 'wq15', question: 'What makes a good portfolio?', options: ['Quantity', 'Curated quality work showing process and results', 'All projects ever', 'Only logos'], correctAnswer: 1 },
    ],
  },
];

/* ─── Initial Exam Attempts ─── */
export const initialExamAttempts: ExamAttempt[] = [
  // Rahul passed React exam
  {
    id: 'attempt-1',
    examId: 'exam-react',
    courseId: 'course-react',
    learnerId: 'user-rahul',
    learnerName: 'Rahul Verma',
    answers: [0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1, 0, 1, 1, 1],
    score: 86,
    status: 'passed',
    startedAt: '2026-07-15T10:00:00',
    submittedAt: '2026-07-15T10:24:00',
  },
  // Alex passed Public Speaking exam
  {
    id: 'attempt-2',
    examId: 'exam-speaking',
    courseId: 'course-speaking',
    learnerId: 'user-alex',
    learnerName: 'Alex Memon',
    answers: [1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    score: 90,
    status: 'passed',
    startedAt: '2026-08-10T14:00:00',
    submittedAt: '2026-08-10T14:18:00',
  },
  // Priya passed Web Design exam
  {
    id: 'attempt-3',
    examId: 'exam-webdesign',
    courseId: 'course-webdesign',
    learnerId: 'user-priya',
    learnerName: 'Priya Nair',
    answers: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    score: 92,
    status: 'passed',
    startedAt: '2026-08-05T09:00:00',
    submittedAt: '2026-08-05T09:16:00',
  },
];

/* ─── Certificate Requests ─── */
export const initialCertificateRequests: CertificateRequest[] = [
  // Rahul — React cert fully generated
  {
    id: 'certreq-1',
    courseId: 'course-react',
    courseName: 'React Development',
    learnerId: 'user-rahul',
    learnerName: 'Rahul Verma',
    teacherId: 'user-alex',
    teacherName: 'Alex Memon',
    examScore: 86,
    tutorApproval: 'approved',
    adminApproval: 'approved',
    status: 'generated',
    certificateId: 'SS-2026-000124',
    requestedAt: '2026-07-20',
    generatedAt: '2026-07-25',
  },
  // Alex — Public Speaking cert requested (tutor pending)
  {
    id: 'certreq-2',
    courseId: 'course-speaking',
    courseName: 'Public Speaking',
    learnerId: 'user-alex',
    learnerName: 'Alex Memon',
    teacherId: 'user-priya',
    teacherName: 'Priya Nair',
    examScore: 90,
    tutorApproval: 'pending',
    adminApproval: 'pending',
    status: 'requested',
    certificateId: null,
    requestedAt: '2026-08-15',
    generatedAt: null,
  },
  // Priya — Web Design cert, tutor approved, admin pending
  {
    id: 'certreq-3',
    courseId: 'course-webdesign',
    courseName: 'Web Design Principles',
    learnerId: 'user-priya',
    learnerName: 'Priya Nair',
    teacherId: 'user-alex',
    teacherName: 'Alex Memon',
    examScore: 92,
    tutorApproval: 'approved',
    adminApproval: 'pending',
    status: 'tutor-approved',
    certificateId: null,
    requestedAt: '2026-08-10',
    generatedAt: null,
  },
];

/* ─── Certificates (generated) ─── */
export const initialCertificates: Certificate[] = [
  {
    id: 'cert-1',
    certificateId: 'SS-2026-000124',
    courseId: 'course-react',
    courseName: 'React Development',
    learnerId: 'user-rahul',
    learnerName: 'Rahul Verma',
    teacherId: 'user-alex',
    teacherName: 'Alex Memon',
    examScore: 86,
    completedAt: '2026-07-15',
    issuedAt: '2026-07-25',
  },
];

/* ─── Mock Chat Messages ─── */
export const mockChatMessages: ChatMessage[] = [
  { id: 'msg-1', senderName: 'Alex Memon', senderId: 'user-alex', text: 'Welcome everyone! Let\'s get started.', timestamp: '10:01 AM' },
  { id: 'msg-2', senderName: 'Sarah Khan', senderId: 'user-sarah', text: 'Excited for this lecture! 🎉', timestamp: '10:02 AM' },
  { id: 'msg-3', senderName: 'Rahul Verma', senderId: 'user-rahul', text: 'Can you explain hooks again?', timestamp: '10:05 AM' },
  { id: 'msg-4', senderName: 'Alex Memon', senderId: 'user-alex', text: 'Sure! Hooks let you use state in functional components.', timestamp: '10:06 AM' },
  { id: 'msg-5', senderName: 'Priya Nair', senderId: 'user-priya', text: 'That makes sense, thanks!', timestamp: '10:08 AM' },
];

/* ═══════════════════════════════════════════════════════════
   Learning Store — localStorage-backed state management
   ═══════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'skillswap-learning-store';

interface LearningStoreState {
  enrollments: Enrollment[];
  examAttempts: ExamAttempt[];
  certificateRequests: CertificateRequest[];
  certificates: Certificate[];
  lectures: Lecture[];
}

function loadState(): LearningStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    enrollments: initialEnrollments,
    examAttempts: initialExamAttempts,
    certificateRequests: initialCertificateRequests,
    certificates: initialCertificates,
    lectures: mockLectures,
  };
}

function saveState(state: LearningStoreState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetLearningStore() {
  localStorage.removeItem(STORAGE_KEY);
}

export function useLearningStore() {
  const [state, setState] = useState<LearningStoreState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  /* ─── Enrollment helpers ─── */
  const getMyLearning = useCallback((userId: string) => {
    return state.enrollments.filter(e => e.learnerId === userId);
  }, [state.enrollments]);

  const getMyTeachingCourses = useCallback((userId: string) => {
    return mockCourses.filter(c => c.teacherId === userId);
  }, []);

  const getCourseEnrollments = useCallback((courseId: string) => {
    return state.enrollments.filter(e => e.courseId === courseId);
  }, [state.enrollments]);

  const getEnrollment = useCallback((courseId: string, learnerId: string) => {
    return state.enrollments.find(e => e.courseId === courseId && e.learnerId === learnerId);
  }, [state.enrollments]);

  /* ─── Lecture helpers ─── */
  const getCourseLectures = useCallback((courseId: string) => {
    return state.lectures.filter(l => l.courseId === courseId).sort((a, b) => a.order - b.order);
  }, [state.lectures]);

  const completeLecture = useCallback((courseId: string, lectureId: string, learnerId: string) => {
    setState(prev => {
      const lectures = prev.lectures.map(l =>
        l.id === lectureId ? { ...l, status: 'completed' as const } : l
      );
      const courseLectures = lectures.filter(l => l.courseId === courseId);
      const completedCount = courseLectures.filter(l => l.status === 'completed').length;
      const total = courseLectures.length;
      const progress = Math.round((completedCount / total) * 100);

      const enrollments = prev.enrollments.map(e => {
        if (e.courseId === courseId && e.learnerId === learnerId) {
          const newExamStatus: ExamStatus = progress === 100 ? 'eligible' : e.examStatus;
          return { ...e, lecturesCompleted: completedCount, progress, examStatus: e.examStatus === 'locked' ? newExamStatus : e.examStatus };
        }
        return e;
      });

      return { ...prev, lectures, enrollments };
    });
  }, []);

  /* ─── Exam helpers ─── */
  const getExam = useCallback((courseId: string) => {
    return mockExams.find(e => e.courseId === courseId) || null;
  }, []);

  const getExamAttempt = useCallback((courseId: string, learnerId: string) => {
    return state.examAttempts.find(a => a.courseId === courseId && a.learnerId === learnerId) || null;
  }, [state.examAttempts]);

  const requestExam = useCallback((courseId: string, learnerId: string, learnerName: string) => {
    setState(prev => ({
      ...prev,
      enrollments: prev.enrollments.map(e =>
        e.courseId === courseId && e.learnerId === learnerId
          ? { ...e, examStatus: 'requested' as ExamStatus }
          : e
      ),
    }));
  }, []);

  const scheduleExam = useCallback((courseId: string, learnerId: string) => {
    setState(prev => ({
      ...prev,
      enrollments: prev.enrollments.map(e =>
        e.courseId === courseId && e.learnerId === learnerId
          ? { ...e, examStatus: 'scheduled' as ExamStatus }
          : e
      ),
    }));
  }, []);

  const submitExam = useCallback((courseId: string, learnerId: string, learnerName: string, answers: (number | null)[]) => {
    const exam = mockExams.find(e => e.courseId === courseId);
    if (!exam) return;

    let correct = 0;
    answers.forEach((a, i) => {
      if (a === exam.questions[i]?.correctAnswer) correct++;
    });
    const score = Math.round((correct / exam.questions.length) * 100);
    const passed = score >= exam.passingScore;

    const attempt: ExamAttempt = {
      id: `attempt-${Date.now()}`,
      examId: exam.id,
      courseId,
      learnerId,
      learnerName,
      answers,
      score,
      status: passed ? 'passed' : 'failed',
      startedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      examAttempts: [...prev.examAttempts, attempt],
      enrollments: prev.enrollments.map(e =>
        e.courseId === courseId && e.learnerId === learnerId
          ? {
              ...e,
              examStatus: passed ? 'passed' as ExamStatus : 'failed' as ExamStatus,
              examScore: score,
              certificateStatus: passed ? 'eligible' as CertificateStatus : e.certificateStatus,
            }
          : e
      ),
    }));

    return { score, passed };
  }, []);

  const markExamResult = useCallback((courseId: string, learnerId: string, passed: boolean) => {
    setState(prev => ({
      ...prev,
      enrollments: prev.enrollments.map(e =>
        e.courseId === courseId && e.learnerId === learnerId
          ? {
              ...e,
              examStatus: passed ? 'passed' as ExamStatus : 'failed' as ExamStatus,
              certificateStatus: passed ? 'eligible' as CertificateStatus : e.certificateStatus,
            }
          : e
      ),
    }));
  }, []);

  /* ─── Certificate helpers ─── */
  const getCertificateRequests = useCallback((filter?: { teacherId?: string; learnerId?: string }) => {
    let reqs = state.certificateRequests;
    if (filter?.teacherId) reqs = reqs.filter(r => r.teacherId === filter.teacherId);
    if (filter?.learnerId) reqs = reqs.filter(r => r.learnerId === filter.learnerId);
    return reqs;
  }, [state.certificateRequests]);

  const requestCertificate = useCallback((courseId: string, learnerId: string, learnerName: string) => {
    const course = mockCourses.find(c => c.id === courseId);
    if (!course) return;
    const enrollment = state.enrollments.find(e => e.courseId === courseId && e.learnerId === learnerId);
    if (!enrollment) return;

    const req: CertificateRequest = {
      id: `certreq-${Date.now()}`,
      courseId,
      courseName: course.skillName,
      learnerId,
      learnerName,
      teacherId: course.teacherId,
      teacherName: course.teacherName,
      examScore: enrollment.examScore || 0,
      tutorApproval: 'pending',
      adminApproval: 'pending',
      status: 'requested',
      certificateId: null,
      requestedAt: new Date().toISOString().split('T')[0],
      generatedAt: null,
    };

    setState(prev => ({
      ...prev,
      certificateRequests: [...prev.certificateRequests, req],
      enrollments: prev.enrollments.map(e =>
        e.courseId === courseId && e.learnerId === learnerId
          ? { ...e, certificateStatus: 'requested' as CertificateStatus }
          : e
      ),
    }));
  }, [state.enrollments]);

  const approveCertificateTutor = useCallback((requestId: string) => {
    setState(prev => {
      const req = prev.certificateRequests.find(r => r.id === requestId);
      if (!req) return prev;
      return {
        ...prev,
        certificateRequests: prev.certificateRequests.map(r =>
          r.id === requestId ? { ...r, tutorApproval: 'approved' as ApprovalStatus, status: 'tutor-approved' as CertificateStatus } : r
        ),
        enrollments: prev.enrollments.map(e =>
          e.courseId === req.courseId && e.learnerId === req.learnerId
            ? { ...e, certificateStatus: 'tutor-approved' as CertificateStatus }
            : e
        ),
      };
    });
  }, []);

  const rejectCertificateTutor = useCallback((requestId: string) => {
    setState(prev => {
      const req = prev.certificateRequests.find(r => r.id === requestId);
      if (!req) return prev;
      return {
        ...prev,
        certificateRequests: prev.certificateRequests.map(r =>
          r.id === requestId ? { ...r, tutorApproval: 'rejected' as ApprovalStatus, status: 'rejected' as CertificateStatus } : r
        ),
        enrollments: prev.enrollments.map(e =>
          e.courseId === req.courseId && e.learnerId === req.learnerId
            ? { ...e, certificateStatus: 'rejected' as CertificateStatus }
            : e
        ),
      };
    });
  }, []);

  const approveCertificateAdmin = useCallback((requestId: string) => {
    setState(prev => {
      const req = prev.certificateRequests.find(r => r.id === requestId);
      if (!req) return prev;
      return {
        ...prev,
        certificateRequests: prev.certificateRequests.map(r =>
          r.id === requestId ? { ...r, adminApproval: 'approved' as ApprovalStatus, status: 'admin-approved' as CertificateStatus } : r
        ),
        enrollments: prev.enrollments.map(e =>
          e.courseId === req.courseId && e.learnerId === req.learnerId
            ? { ...e, certificateStatus: 'admin-approved' as CertificateStatus }
            : e
        ),
      };
    });
  }, []);

  const rejectCertificateAdmin = useCallback((requestId: string) => {
    setState(prev => {
      const req = prev.certificateRequests.find(r => r.id === requestId);
      if (!req) return prev;
      return {
        ...prev,
        certificateRequests: prev.certificateRequests.map(r =>
          r.id === requestId ? { ...r, adminApproval: 'rejected' as ApprovalStatus, status: 'rejected' as CertificateStatus } : r
        ),
        enrollments: prev.enrollments.map(e =>
          e.courseId === req.courseId && e.learnerId === req.learnerId
            ? { ...e, certificateStatus: 'rejected' as CertificateStatus }
            : e
        ),
      };
    });
  }, []);

  const generateCertificate = useCallback((requestId: string) => {
    setState(prev => {
      const req = prev.certificateRequests.find(r => r.id === requestId);
      if (!req) return prev;
      const certId = `SS-2026-${String(prev.certificates.length + 200).padStart(6, '0')}`;
      const cert: Certificate = {
        id: `cert-${Date.now()}`,
        certificateId: certId,
        courseId: req.courseId,
        courseName: req.courseName,
        learnerId: req.learnerId,
        learnerName: req.learnerName,
        teacherId: req.teacherId,
        teacherName: req.teacherName,
        examScore: req.examScore,
        completedAt: req.requestedAt,
        issuedAt: new Date().toISOString().split('T')[0],
      };
      return {
        ...prev,
        certificates: [...prev.certificates, cert],
        certificateRequests: prev.certificateRequests.map(r =>
          r.id === requestId ? { ...r, status: 'generated' as CertificateStatus, certificateId: certId, generatedAt: cert.issuedAt } : r
        ),
        enrollments: prev.enrollments.map(e =>
          e.courseId === req.courseId && e.learnerId === req.learnerId
            ? { ...e, certificateStatus: 'generated' as CertificateStatus }
            : e
        ),
      };
    });
  }, []);

  const verifyCertificate = useCallback((certId: string) => {
    return state.certificates.find(c => c.certificateId === certId) || null;
  }, [state.certificates]);

  const getMyCertificates = useCallback((userId: string) => {
    return state.certificates.filter(c => c.learnerId === userId);
  }, [state.certificates]);

  return {
    ...state,
    courses: mockCourses,
    exams: mockExams,
    // Enrollment
    getMyLearning,
    getMyTeachingCourses,
    getCourseEnrollments,
    getEnrollment,
    // Lectures
    getCourseLectures,
    completeLecture,
    // Exams
    getExam,
    getExamAttempt,
    requestExam,
    scheduleExam,
    submitExam,
    markExamResult,
    // Certificates
    getCertificateRequests,
    requestCertificate,
    approveCertificateTutor,
    rejectCertificateTutor,
    approveCertificateAdmin,
    rejectCertificateAdmin,
    generateCertificate,
    verifyCertificate,
    getMyCertificates,
  };
}
