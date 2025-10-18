// src/types/courses.ts

export type CourseCategory = 
  | "Web Development"
  | "Data Science"
  | "Design"
  | "Marketing"
  | "Business"
  | "Health & Fitness"
  | "Music";

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced" | "All Levels";

export interface Instructor {
  id: string;
  name: string;
  avatarUrl: string;
  bio: string;
}

export interface Review {
  id: string;
  user: {
    name: string;
    avatarUrl: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: number; // in seconds
  videoUrl: string;
  description: string;
  resources: { title: string; url: string }[];
  isCompleted?: boolean;
}

export interface CourseModule {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  category: CourseCategory;
  level: CourseLevel;
  duration: number; // total duration in hours
  rating: number;
  reviewCount: number;
  price: number;
  instructor: Instructor;
  modules: CourseModule[];
  enrolled?: boolean; // Optional: indicates if the user is enrolled
  progress?: number; // Optional: course completion percentage
}

export interface CourseFilters {
  searchQuery: string;
  categories: CourseCategory[];
  levels: CourseLevel[];
  minRating: number;
}
