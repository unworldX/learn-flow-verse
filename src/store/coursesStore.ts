import { create } from 'zustand';
import { Course, CourseFilters, CourseCategory, CourseLevel } from '@/types/courses';

// Mock Data (replace with API calls later)
const mockCourses: Course[] = [
  {
    id: '1',
    title: 'React for Beginners',
    description: 'A comprehensive guide to learning React from scratch.',
    thumbnailUrl: '/placeholder.svg',
    category: 'Web Development',
    level: 'Beginner',
    duration: 10,
    rating: 4.5,
    reviewCount: 1500,
    price: 49.99,
    instructor: { id: '1', name: 'John Doe', avatarUrl: '/placeholder.svg', bio: 'React expert' },
    modules: [],
    enrolled: true,
    progress: 30,
  },
  {
    id: '2',
    title: 'Advanced TypeScript',
    description: 'Master the advanced concepts of TypeScript.',
    thumbnailUrl: '/placeholder.svg',
    category: 'Web Development',
    level: 'Advanced',
    duration: 15,
    rating: 4.8,
    reviewCount: 2500,
    price: 79.99,
    instructor: { id: '2', name: 'Jane Smith', avatarUrl: '/placeholder.svg', bio: 'TypeScript guru' },
    modules: [],
  },
  {
    id: '3',
    title: 'UI/UX Design Fundamentals',
    description: 'Learn the basics of UI/UX design.',
    thumbnailUrl: '/placeholder.svg',
    category: 'Design',
    level: 'Beginner',
    duration: 8,
    rating: 4.7,
    reviewCount: 1800,
    price: 39.99,
    instructor: { id: '3', name: 'Peter Jones', avatarUrl: '/placeholder.svg', bio: 'Design lead' },
    modules: [],
  },
  {
    id: '4',
    title: 'Data Science with Python',
    description: 'An in-depth course on data science using Python.',
    thumbnailUrl: '/placeholder.svg',
    category: 'Data Science',
    level: 'Intermediate',
    duration: 20,
    rating: 4.9,
    reviewCount: 3500,
    price: 99.99,
    instructor: { id: '4', name: 'Mary Green', avatarUrl: '/placeholder.svg', bio: 'Data scientist' },
    modules: [],
    enrolled: true,
    progress: 75,
  },
];


export interface CoursesState {
  courses: Course[];
  filters: CourseFilters;
  activeCategory: CourseCategory | 'All';
  selectedCourse: Course | null;
  setSearchQuery: (query: string) => void;
  setCategory: (category: CourseCategory | 'All') => void;
  setFilters: (filters: Partial<CourseFilters>) => void;
  setSelectedCourse: (course: Course | null) => void;
}

export const useCoursesStore = create<CoursesState>((set) => ({
  courses: mockCourses,
  filters: {
    searchQuery: '',
    categories: [],
    levels: [],
    minRating: 0,
  },
  activeCategory: 'All',
  selectedCourse: null,
  setSearchQuery: (query) => set((state) => ({ filters: { ...state.filters, searchQuery: query } })),
  setCategory: (category) => set({ activeCategory: category }),
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  setSelectedCourse: (course) => set({ selectedCourse: course }),
}));
