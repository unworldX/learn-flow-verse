import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CoursesHeader from '@/components/courses/CoursesHeader';
import CourseGrid from '@/components/courses/CourseGrid';
import MyCourses from '@/components/courses/MyCourses';
import FilterSidebar from '@/components/courses/FilterSidebar';

const CoursesPage: React.FC = () => {
  return (
    <Tabs defaultValue="all-courses" className="h-[calc(100vh-var(--app-header-height,0px))] flex flex-col">
      <div className="p-6 border-b">
        <div className="flex justify-end items-center">
          <TabsList>
            <TabsTrigger value="all-courses">All Courses</TabsTrigger>
            <TabsTrigger value="my-courses">My Courses</TabsTrigger>
          </TabsList>
        </div>
      </div>
      <TabsContent value="all-courses" className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6 p-6">
          <FilterSidebar />
          <div>
            <CoursesHeader />
            <CourseGrid />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="my-courses" className="p-6 flex-1">
        <MyCourses />
      </TabsContent>
    </Tabs>
  );
};

export default CoursesPage;
