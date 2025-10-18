import React from 'react';
import { Search, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCoursesStore } from '@/store/coursesStore';
import { CourseCategory } from '@/types/courses';

const FEATURED_CATEGORIES: CourseCategory[] = [
  'Web Development',
  'Data Science',
  'Design',
  'Marketing',
  'Business',
  'Health & Fitness',
  'Music',
];

const CourseHero: React.FC = () => {
  const { filters, setFilters, courses } = useCoursesStore();
  
  const featuredCourse = courses[0];
  
  const handleCategoryClick = (category: CourseCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [category];
    setFilters({ categories: newCategories });
  };
  
  return (
    <div className="space-y-6">
      {/* Featured Course Banner */}
      {featuredCourse && (
        <div className="relative rounded-lg overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-border">
          <div className="grid md:grid-cols-2 gap-6 p-8">
            <div className="flex flex-col justify-center space-y-4">
              <Badge className="w-fit bg-primary/20 text-primary">
                <Tag className="w-3 h-3 mr-1" />
                Featured Course
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold">
                {featuredCourse.title}
              </h1>
              <p className="text-muted-foreground">
                {featuredCourse.description}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <img
                    src={featuredCourse.instructor.avatarUrl}
                    alt={featuredCourse.instructor.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{featuredCourse.instructor.name}</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <span className="text-amber-500">
                  ★ {featuredCourse.rating}
                </span>
                <span className="text-muted-foreground">•</span>
                {/* mockCourses don't include enrolled count; omit for now */}
              </div>
              <Button size="lg" className="w-fit">
                Explore Course
              </Button>
            </div>
            <div className="hidden md:block">
              <img
                src={featuredCourse.thumbnailUrl}
                alt={featuredCourse.title}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search courses by name, instructor, or skill..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
            className="pl-12 pr-4 py-6 text-base"
          />
        </div>
      </div>
      
      {/* Category Tags */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground">
          Browse by Category
        </h2>
        <div className="flex flex-wrap gap-2">
          {FEATURED_CATEGORIES.map(category => (
            <Badge
              key={category}
              variant={filters.categories.includes(category) ? "default" : "outline"}
              className="cursor-pointer hover:bg-primary/10 transition-colors px-4 py-2"
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseHero;
