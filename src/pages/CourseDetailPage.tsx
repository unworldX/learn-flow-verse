import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCoursesStore } from '@/store/coursesStore';
import CourseDetails from '@/components/courses/CourseDetails';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { courses } = useCoursesStore();
  const navigate = useNavigate();
  const course = courses.find(c => c.id === courseId);

  if (!course) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Courses
      </Button>
      <CourseDetails course={course} />
    </div>
  );
};

export default CourseDetailPage;
