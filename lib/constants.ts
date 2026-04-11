export const INTEREST_CATEGORIES = [
  {
    label: 'Humor & Content',
    items: ['Dark Humor', 'Dry Humor', 'Absurdist', 'Sarcasm', 'Stand-up', 'Memes', 'Skits', 'POV Videos'],
  },
  {
    label: 'Arts & Culture',
    items: ['Indie Films', 'K-Dramas', 'Anime', 'Photography', 'Painting', 'Architecture', 'Poetry', 'Theatre'],
  },
  {
    label: 'Music',
    items: ['Hip-Hop', 'R&B', 'Indie/Alt', 'Jazz', 'Electronic', 'Pop', 'Classical', 'Lo-fi', 'Metal'],
  },
  {
    label: 'Lifestyle',
    items: ['Fitness', 'Yoga', 'Hiking', 'Cooking', 'Thrifting', 'Travel', 'Gaming', 'Reading', 'Coffee'],
  },
  {
    label: 'Interests & Niche',
    items: ['Astrology', 'True Crime', 'Philosophy', 'Finance', 'Tech', 'Fashion', 'Skincare', 'Motorsport', 'Streetwear'],
  },
  {
    label: 'Social & Values',
    items: ['Activism', 'Environmentalism', 'Spirituality', 'Minimalism', 'Entrepreneurship', 'Mental Health', 'Community'],
  },
]

export const VIBE_OPTIONS = [
  { label: 'Witty & Clever', emoji: '🧠', desc: 'You make people think and laugh' },
  { label: 'Chill & Laid-back', emoji: '😌', desc: 'No drama, good vibes only' },
  { label: 'Ambitious', emoji: '🚀', desc: 'Driven and goal-oriented' },
  { label: 'Adventurous', emoji: '🌍', desc: 'Always down for something new' },
  { label: 'Deep & Thoughtful', emoji: '🌊', desc: 'You love meaningful conversations' },
  { label: 'Playful & Goofy', emoji: '🎭', desc: 'Life\'s too short to be serious' },
  { label: 'Romantic', emoji: '🌹', desc: 'You appreciate love in the details' },
  { label: 'Creative', emoji: '🎨', desc: 'You see art in everything' },
  { label: 'Curious', emoji: '🔭', desc: 'Always learning, always questioning' },
  { label: 'Loyal & Caring', emoji: '🤝', desc: 'Your people know you\'re there for them' },
]

export const FACE_FEATURES = [
  {
    label: 'Face Shape',
    options: ['Oval', 'Round', 'Square', 'Heart', 'Diamond', 'Oblong'],
  },
  {
    label: 'Eyes',
    options: ['Almond eyes', 'Doe eyes', 'Hooded eyes', 'Upturned eyes', 'Deep-set', 'Wide-set'],
  },
  {
    label: 'Jawline',
    options: ['Defined jawline', 'Soft jaw', 'Strong jaw', 'Sharp chin'],
  },
  {
    label: 'Features',
    options: ['High cheekbones', 'Full lips', 'Thin lips', 'Strong brows', 'Freckles', 'Dimples', 'Button nose', 'Aquiline nose'],
  },
  {
    label: 'Skin Tone',
    options: ['Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Brown', 'Deep'],
  },
  {
    label: 'Build Indicators',
    options: ['Athletic', 'Slim', 'Curvy', 'Petite', 'Tall features'],
  },
]

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
