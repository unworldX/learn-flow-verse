import React from 'react';
import { useCoursesStore } from '@/store/coursesStore';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import CourseDetails from './CourseDetails';

const CourseDetailsPanel: React.FC = () => {
  const { selectedCourse, setSelectedCourse } = useCoursesStore();

  if (!selectedCourse) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20 rounded-lg">
        <div className="text-center">
          <p className="text-lg font-semibold">Select a course to see details</p>
          <p className="text-sm text-muted-foreground">
            Choose a course from the list to view its curriculum and information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-y-auto">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10"
        onClick={() => setSelectedCourse(null)}
      >
        <X className="w-5 h-5" />
      </Button>
      <CourseDetails course={selectedCourse} />
    </div>
  );
};

export default CourseDetailsPanel;
