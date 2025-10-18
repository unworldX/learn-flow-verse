import React from 'react';
import { useCoursesStore } from '@/store/coursesStore';
import CourseCard from './CourseCard';
import { useNavigate } from 'react-router-dom';

const CourseGrid: React.FC = () => {
  const { courses, filters, activeCategory } = useCoursesStore();
  const navigate = useNavigate();

  const filteredCourses = courses.filter(course => {
    const categoryMatch = activeCategory === 'All' || course.category === activeCategory;
    const searchMatch = course.title.toLowerCase().includes(filters.searchQuery.toLowerCase());
    const levelMatch = filters.levels.length === 0 || filters.levels.includes(course.level);
    const ratingMatch = course.rating >= filters.minRating;

    return categoryMatch && searchMatch && levelMatch && ratingMatch;
  });

  const handleCourseClick = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      {filteredCourses.map(course => (
        <div key={course.id} onClick={() => handleCourseClick(course.id)} className="cursor-pointer">
          <CourseCard course={course} />
        </div>
      ))}
    </div>
  );
};

export default CourseGrid;
