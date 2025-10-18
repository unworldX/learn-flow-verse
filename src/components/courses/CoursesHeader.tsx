import React from 'react';
import { Input } from '@/components/ui/input';
import { useCoursesStore } from '@/store/coursesStore';
import { CourseCategory } from '@/types/courses';
import { cn } from '@/lib/utils';

const categories: (CourseCategory | 'All')[] = ['All', 'Web Development', 'Data Science', 'Design', 'Marketing', 'Business', 'Health & Fitness', 'Music'];

const CoursesHeader: React.FC = () => {
  const { filters, setSearchQuery, activeCategory, setCategory } = useCoursesStore();

  return (
    <div className="mb-6">
      <div className="relative mb-4">
        <Input
          placeholder="Search courses..."
          value={filters.searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setCategory(category)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap",
              activeCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CoursesHeader;
