import React from 'react';
import { Course } from '@/types/courses';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <Card>
      <CardHeader className="p-0">
        <img src={course.thumbnailUrl} alt={course.title} className="rounded-t-lg object-cover h-48 w-full" />
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <Badge variant="secondary">{course.category}</Badge>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.539 1.118l-3.368-2.448a1 1 0 00-1.175 0l-3.368 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.24 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
            </svg>
            <span className="ml-1 font-semibold">{course.rating}</span>
            <span className="text-sm text-muted-foreground ml-1">({course.reviewCount})</span>
          </div>
        </div>
        <CardTitle className="text-lg font-bold mb-2">{course.title}</CardTitle>
        <p className="text-sm text-muted-foreground mb-4">by {course.instructor.name}</p>
        {course.enrolled && course.progress !== undefined && (
          <div className="mb-4">
            <Progress value={course.progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{course.progress}% complete</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <p className="text-lg font-bold">${course.price}</p>
        <Button>{course.enrolled ? 'Continue' : 'Enroll'}</Button>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
