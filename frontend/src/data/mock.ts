/* ─── Skill Category Color Map ─── */
export type SkillCategory = 'tech' | 'design' | 'music' | 'language' | 'fitness' | 'photo' | 'cooking' | 'business' | 'academics' | 'hobby';

export const skillCategoryMap: Record<string, SkillCategory> = {
  'Web Development': 'tech', 'React': 'tech', 'Python': 'tech', 'JavaScript': 'tech',
  'HTML/CSS': 'tech', 'Node.js': 'tech', 'UI/UX': 'tech', 'Digital Marketing': 'business',
  'Graphic Design': 'design', 'UI Design': 'design', 'Photoshop': 'design', 'Figma': 'design', 'Illustration': 'design',
  'Guitar': 'music', 'Piano': 'music', 'Singing': 'music', 'Music Production': 'music',
  'Spoken English': 'language', 'Spanish': 'language', 'French': 'language', 'Japanese': 'language', 'Public Speaking': 'language',
  'Fitness': 'fitness', 'Yoga': 'fitness', 'Meditation': 'fitness',
  'Photography': 'photo', 'Video Editing': 'photo', 'Lightroom': 'photo',
  'Cooking': 'cooking', 'Baking': 'cooking',
  'Excel': 'business', 'Content Writing': 'business', 'SEO': 'business',
};

export function getSkillCategory(skill: string): SkillCategory {
  return skillCategoryMap[skill] || 'tech';
}

/* ─── Popular Skills ─── */
export const popularSkills = [
  { icon: '💻', name: 'Web Development', count: 234, category: 'tech' as SkillCategory },
  { icon: '🎨', name: 'Graphic Design', count: 189, category: 'design' as SkillCategory },
  { icon: '🎸', name: 'Guitar', count: 156, category: 'music' as SkillCategory },
  { icon: '📸', name: 'Photography', count: 142, category: 'photo' as SkillCategory },
  { icon: '🗣️', name: 'Spoken English', count: 198, category: 'language' as SkillCategory },
  { icon: '🏋️', name: 'Fitness', count: 167, category: 'fitness' as SkillCategory },
  { icon: '📱', name: 'Digital Marketing', count: 121, category: 'business' as SkillCategory },
  { icon: '🍳', name: 'Cooking', count: 98, category: 'cooking' as SkillCategory },
];

/* ─── Featured Swappers ─── */
export const featuredSwappers = [
  {
    name: 'Aarav Sharma',
    location: 'Ahmedabad',
    avatar: 'A',
    offers: ['HTML/CSS', 'React'],
    wants: ['Guitar', 'Photography'],
    rating: 4.8,
    exchanges: 12,
    online: true,
  },
  {
    name: 'Riya Patel',
    location: 'Mumbai',
    avatar: 'R',
    offers: ['Guitar', 'Singing'],
    wants: ['Web Development', 'Python'],
    rating: 4.9,
    exchanges: 8,
    online: true,
  },
  {
    name: 'Arjun Rao',
    location: 'Bangalore',
    avatar: 'A',
    offers: ['Photography', 'Video Editing'],
    wants: ['Graphic Design', 'UI/UX'],
    rating: 4.7,
    exchanges: 15,
    online: false,
  },
  {
    name: 'Meera Iyer',
    location: 'Chennai',
    avatar: 'M',
    offers: ['Spoken English', 'French'],
    wants: ['Cooking', 'Yoga'],
    rating: 5.0,
    exchanges: 20,
    online: true,
  },
];

/* ─── Live Feed Activities ─── */
export const liveFeedItems = [
  { id: 1, type: 'offer' as const, user: 'Aman', action: 'just offered', skill: 'Web Development', time: '2 min ago' },
  { id: 2, type: 'looking' as const, user: 'Priya', action: 'is looking for', skill: 'Guitar lessons', time: '5 min ago' },
  { id: 3, type: 'completed' as const, user: 'Rahul', action: 'completed a skill exchange', skill: 'Python ↔ Photography', time: '8 min ago' },
  { id: 4, type: 'available' as const, user: 'Meera', action: 'is currently available for', skill: 'Spoken English', time: '12 min ago' },
  { id: 5, type: 'offer' as const, user: 'Vikram', action: 'just offered', skill: 'Graphic Design', time: '15 min ago' },
  { id: 6, type: 'completed' as const, user: 'Ananya', action: 'completed a skill exchange', skill: 'Guitar ↔ Cooking', time: '20 min ago' },
  { id: 7, type: 'looking' as const, user: 'Rohit', action: 'is looking for', skill: 'UI/UX Design', time: '25 min ago' },
  { id: 8, type: 'available' as const, user: 'Sneha', action: 'is currently available for', skill: 'Photography', time: '30 min ago' },
];

/* ─── Explore Page Users ─── */
export const exploreUsers = [
  {
    name: 'Aarav Sharma', location: 'Ahmedabad', avatar: 'A',
    skillOffered: 'Web Development', skillWanted: 'Guitar',
    rating: 4.8, exchanges: 12, availability: 'Mon–Fri, 6–9 PM',
    distance: '2.4 km', level: 'Advanced', online: true, mode: 'Both',
  },
  {
    name: 'Riya Patel', location: 'Mumbai', avatar: 'R',
    skillOffered: 'Guitar', skillWanted: 'Web Development',
    rating: 4.9, exchanges: 8, availability: 'Weekends',
    distance: '1.2 km', level: 'Intermediate', online: true, mode: 'Offline',
  },
  {
    name: 'Arjun Rao', location: 'Bangalore', avatar: 'A',
    skillOffered: 'Photography', skillWanted: 'Graphic Design',
    rating: 4.7, exchanges: 15, availability: 'Evenings',
    distance: '3.1 km', level: 'Advanced', online: false, mode: 'Online',
  },
  {
    name: 'Meera Iyer', location: 'Chennai', avatar: 'M',
    skillOffered: 'Spoken English', skillWanted: 'Cooking',
    rating: 5.0, exchanges: 20, availability: 'Flexible',
    distance: '0.8 km', level: 'Expert', online: true, mode: 'Both',
  },
  {
    name: 'Karan Mehta', location: 'Delhi', avatar: 'K',
    skillOffered: 'Python', skillWanted: 'Public Speaking',
    rating: 4.6, exchanges: 5, availability: 'Weekday evenings',
    distance: '4.5 km', level: 'Advanced', online: false, mode: 'Online',
  },
  {
    name: 'Ananya Desai', location: 'Pune', avatar: 'A',
    skillOffered: 'Cooking', skillWanted: 'Photography',
    rating: 4.8, exchanges: 9, availability: 'Weekends',
    distance: '1.9 km', level: 'Intermediate', online: true, mode: 'Offline',
  },
];

/* ─── Community Posts ─── */
export const communityPosts = [
  {
    id: 1, user: 'Aarav Sharma', avatar: 'A', time: '2 hours ago',
    content: 'I just completed my first skill swap! 🎉 Taught HTML/CSS basics and learned some amazing guitar chords. This platform is incredible!',
    likes: 24, comments: 8,
  },
  {
    id: 2, user: 'Priya Nair', avatar: 'P', time: '5 hours ago',
    content: 'Looking for someone who can teach me Python. I can offer Graphic Design skills in return. DM me if interested! 🐍🎨',
    likes: 15, comments: 12,
  },
  {
    id: 3, user: 'Rahul Verma', avatar: 'R', time: '1 day ago',
    content: 'Shoutout to @Meera for the amazing Spoken English sessions! My presentation skills have improved so much. Highly recommend her! ⭐',
    likes: 42, comments: 6,
  },
];

/* ─── Explore Categories ─── */
export const exploreCategories = [
  { name: 'Technology', icon: '💻', count: 342 },
  { name: 'Design', icon: '🎨', count: 218 },
  { name: 'Music', icon: '🎵', count: 167 },
  { name: 'Languages', icon: '🗣️', count: 289 },
  { name: 'Fitness', icon: '🏋️', count: 145 },
  { name: 'Photography', icon: '📸', count: 132 },
  { name: 'Cooking', icon: '🍳', count: 98 },
  { name: 'Business', icon: '💼', count: 176 },
  { name: 'Academics', icon: '📚', count: 203 },
  { name: 'Hobbies', icon: '🎯', count: 87 },
];

/* ─── Dashboard Stats (admin) ─── */
export const growth = [
  { m: 'Jan', v: 28 }, { m: 'Feb', v: 42 }, { m: 'Mar', v: 38 },
  { m: 'Apr', v: 61 }, { m: 'May', v: 57 }, { m: 'Jun', v: 76 }, { m: 'Jul', v: 89 },
];

export const metrics = [
  ['Community', '12,486', '+18.4%', 'people'],
  ['In the loop', '8,294', '68% of members', 'pulse'],
  ['Skills shared', '2,318', '+184 this week', 'spark'],
  ['Needs a nudge', '186', 'Requests waiting', 'clock'],
];

export const people = [
  ['Aisha Patel', 'Product design', 'Today, 09:40', 'Active'],
  ['Noah Williams', 'Japanese lessons', 'Today, 09:15', 'Active'],
  ['Sofia Chen', 'Portrait photography', 'Yesterday', 'Review'],
];

export const requests = [
  ['Marcus Lee', 'React ↔ UI design', '2h ago', 'Pending'],
  ['Elena Rossi', 'Spanish ↔ Photography', '4h ago', 'Matched'],
  ['James Okoro', 'Python ↔ Copywriting', 'Yesterday', 'Pending'],
];
