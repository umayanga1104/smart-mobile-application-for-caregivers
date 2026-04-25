import {
  Activity,
  Apple,
  Brain,
  Clock,
  Droplets,
  Heart,
  Moon,
  Users,
  Zap,
} from 'lucide-react-native';

export const MOCK_HEALTH_TIPS = {
  nutrition: [{ title: 'Hydration Matters', description: 'Drink at least 8 glasses of water daily to maintain optimal hydration.' }],
  exercise: [{ title: 'Daily Movement', description: 'Aim for at least 30 minutes of physical activity every day.' }],
  sleep: [{ title: 'Sleep Schedule', description: 'Maintain a consistent sleep schedule by going to bed at the same time.' }],
  stress_management: [{ title: 'Meditation', description: 'Practice 10 minutes of meditation daily to reduce stress.' }],
  self_care: [{ title: 'Self-Care Routine', description: 'Dedicate time daily for activities that make you happy.' }],
  patient_care: [{ title: 'Patient Support', description: 'Show empathy and listen actively to patient concerns.' }],
  communication: [{ title: 'Clear Communication', description: 'Use clear language when speaking with others.' }],
  daily_routine: [{ title: 'Morning Routine', description: 'Start your day with a healthy and consistent morning routine.' }],
  emotional_wellbeing: [{ title: 'Emotional Awareness', description: 'Practice recognizing and naming your emotions.' }],
};

export const getMockTip = (category) => {
  const tips = MOCK_HEALTH_TIPS[category];
  if (tips && tips.length > 0) return tips[0];
  return { title: 'Wellness Tip', description: 'Focus on your overall health and well-being today.' };
};

const ICON_COLOR_MAP = {
  nutrition: { icon: Apple, color: '#FF9500' },
  exercise: { icon: Activity, color: '#30D158' },
  sleep: { icon: Moon, color: '#BF5AF2' },
  self_care: { icon: Heart, color: '#FF453A' },
  stress_management: { icon: Brain, color: '#0A84FF' },
  patient_care: { icon: Droplets, color: '#FF2D55' },
  communication: { icon: Users, color: '#5AC8FA' },
  daily_routine: { icon: Clock, color: '#FFCC00' },
  emotional_wellbeing: { icon: Zap, color: '#FF9500' },
};

const DEFAULT_ICONS_COLORS = [
  { icon: Droplets, color: '#0A84FF' },
  { icon: Activity, color: '#30D158' },
  { icon: Moon, color: '#BF5AF2' },
  { icon: Heart, color: '#FF453A' },
  { icon: Apple, color: '#FF9500' },
  { icon: Brain, color: '#5AC8FA' },
  { icon: Zap, color: '#FFCC00' },
];

export const getIconAndColor = (category, index) => {
  if (ICON_COLOR_MAP[category]) return ICON_COLOR_MAP[category];
  return DEFAULT_ICONS_COLORS[index % DEFAULT_ICONS_COLORS.length];
};
