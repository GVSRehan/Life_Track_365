
export interface Task {
  id: string;
  title: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  category: TaskCategory;
  date: string; // YYYY-MM-DD format
  acknowledged?: 'going' | 'not-going' | null;
  createdAt: Date;
}

export type TaskCategory = 'sleep' | 'meditate' | 'yoga' | 'study' | 'work' | 'meet' | 'journey';

export interface CategoryConfig {
  name: string;
  color: string;
  bgColor: string;
  notifyBefore: number; // minutes
  notifyAfter: number; // minutes
}

export const TASK_CATEGORIES: Record<TaskCategory, CategoryConfig> = {
  sleep: {
    name: 'Sleep',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    notifyBefore: 15,
    notifyAfter: 15
  },
  meditate: {
    name: 'Meditate',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    notifyBefore: 15,
    notifyAfter: 15
  },
  yoga: {
    name: 'Yoga',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    notifyBefore: 15,
    notifyAfter: 15
  },
  study: {
    name: 'Study',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    notifyBefore: 5,
    notifyAfter: 5
  },
  work: {
    name: 'Work',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    notifyBefore: 5,
    notifyAfter: 5
  },
  meet: {
    name: 'Meet',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    notifyBefore: 5,
    notifyAfter: 5
  },
  journey: {
    name: 'Journey',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    notifyBefore: 5,
    notifyAfter: 5
  }
};
