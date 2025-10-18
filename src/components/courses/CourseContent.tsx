import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { CheckCircle, PlayCircle } from 'lucide-react';
import { Course } from '@/types/courses';

interface CourseContentProps {
  course: Course;
  onLessonClick: (lessonId: string) => void;
  currentLessonId?: string;
}

const CourseContent: React.FC<CourseContentProps> = ({ course, onLessonClick, currentLessonId }) => {
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-xl font-bold mb-4">Course Content</h3>
      <Accordion type="multiple" defaultValue={course.modules.map(m => m.id)} className="w-full">
        {course.modules.map((module) => (
          <AccordionItem value={module.id} key={module.id}>
            <AccordionTrigger>{module.title}</AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-1">
                {module.lessons.map(lesson => (
                  <li key={lesson.id}>
                    <Button
                      variant={lesson.id === currentLessonId ? "secondary" : "ghost"}
                      className="w-full justify-start h-auto py-2"
                      onClick={() => onLessonClick(lesson.id)}
                    >
                      <div className="flex items-center gap-3">
                        {lesson.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <PlayCircle className="w-5 h-5 text-muted-foreground" />
                        )}
                        <div className="text-left">
                          <p className="font-semibold">{lesson.title}</p>
                          <p className="text-xs text-muted-foreground">{Math.floor(lesson.duration / 60)}m {lesson.duration % 60}s</p>
                        </div>
                      </div>
                    </Button>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default CourseContent;
