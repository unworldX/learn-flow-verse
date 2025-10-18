import React from 'react';
import { BookOpen, PlayCircle, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { useCoursesStore } from '@/store/coursesStore';
import { Course } from '@/types/courses';

const MyCourses: React.FC = () => {
  const { courses } = useCoursesStore();

  const enrolledCourses = courses.filter(c => c.enrolled);

  if (enrolledCourses.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Enrolled Courses Yet</h3>
        <p className="text-muted-foreground mb-6">
          Start learning by enrolling in a course.
        </p>
        {/* Optional: Add a button to browse courses */}
        {/* <Button onClick={() => navigate('/courses')}>Browse Courses</Button> */}
      </div>
    );
  }

  const inProgress = enrolledCourses.filter(c => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100);
  const notStarted = enrolledCourses.filter(c => !c.progress || c.progress === 0);
  const completed = enrolledCourses.filter(c => c.progress === 100);

  const renderCourseCard = (course: Course) => {
    const progressPercentage = course.progress || 0;

    return (
      <Card key={course.id} className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full sm:w-48 h-auto object-cover rounded-md aspect-video"
            />
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg mb-1">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  By {course.instructor.name}
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <Progress value={progressPercentage} className="w-full" />
                  <span className="text-sm font-semibold">{progressPercentage}%</span>
                </div>
              </div>
              <Button className="w-full sm:w-auto self-start">
                <PlayCircle className="w-4 h-4 mr-2" />
                {progressPercentage > 0 ? 'Resume' : 'Start'} Learning
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-8">
      {inProgress.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Continue Watching</h2>
          <div className="space-y-4">
            {inProgress.map(renderCourseCard)}
          </div>
        </div>
      )}

      {notStarted.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Not Started</h2>
          <div className="space-y-4">
            {notStarted.map(renderCourseCard)}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            Completed Courses
          </h2>
          <div className="space-y-4">
            {completed.map(renderCourseCard)}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;


