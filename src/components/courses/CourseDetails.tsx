import React from 'react';
import { PlayCircle, CheckCircle, Lock } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Course } from '@/types/courses';

interface CourseDetailsProps {
  course: Course;
}

const CourseDetails: React.FC<CourseDetailsProps> = ({ course }) => {
  if (!course) {
    return <div>Course not found</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">{course.title}</h2>
      <p className="text-muted-foreground mb-6">{course.description}</p>
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Course Curriculum</h3>
        <Accordion type="single" collapsible className="w-full">
          {course.modules.map((module, index) => (
            <AccordionItem value={`item-${index}`} key={module.id}>
              <AccordionTrigger>{module.title}</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {module.lessons.map(lesson => (
                    <li key={lesson.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                      <div className="flex items-center gap-2">
                        {lesson.isCompleted ? <CheckCircle className="w-5 h-5 text-green-500" /> : <PlayCircle className="w-5 h-5 text-muted-foreground" />}
                        <span>{lesson.title}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{lesson.duration}m</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <Button size="lg" className="w-full">
        {course.enrolled ? 'Continue Learning' : 'Enroll Now'}
      </Button>
    </div>
  );
};

export default CourseDetails;
