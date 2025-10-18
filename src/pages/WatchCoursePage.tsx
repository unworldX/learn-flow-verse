import React, { useState } from 'react';
import { BookOpen, Heart, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCoursesStore } from '@/store/coursesStore';
import CourseHero from '@/components/courses/CourseHero';
import CourseGrid from '@/components/courses/CourseGrid';
import FilterSidebar from '@/components/courses/FilterSidebar';
import MyCourses from '@/components/courses/MyCourses';
import CourseCard from '@/components/courses/CourseCard';

/**
 * Video Courses Page
 * * Main hub for browsing, enrolling, and tracking progress for video courses.
 * Features:
 * - Hero banner with featured course
 * - Global search and category filters
 * - Responsive course grid with sorting
 * - Filter sidebar (desktop) / sheet (mobile)
 * - My Courses tab with progress tracking
 * - Wishlist tab
 */
const VideoCourses = () => {
  const { courses } = useCoursesStore();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'my-courses' | 'wishlist'>('all');
  // Placeholder wishlist: use courses not enrolled as wishlist candidates
  const wishlistCourses = courses.filter(c => !c.enrolled);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-2">Video Courses</h1>
          <p className="text-muted-foreground">
            Learn new skills with expert-led video courses
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'my-courses' | 'wishlist')} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <BookOpen className="w-4 h-4" />
                All Courses
              </TabsTrigger>
              <TabsTrigger value="my-courses" className="gap-2">
                <BookOpen className="w-4 h-4" />
                My Courses
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="gap-2">
                <Heart className="w-4 h-4" />
                Wishlist ({wishlistCourses.length})
              </TabsTrigger>
            </TabsList>
            
            {/* Mobile Filter Button */}
            {activeTab === 'all' && (
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0">
                  <FilterSidebar onClose={() => setMobileFiltersOpen(false)} />
                </SheetContent>
              </Sheet>
            )}
          </div>
          
          {/* All Courses Tab */}
          <TabsContent value="all" className="space-y-8 mt-6">
            <CourseHero />
            <div className="grid lg:grid-cols-[280px_1fr] gap-6">
              <aside className="hidden lg:block sticky top-6 h-fit">
                <FilterSidebar />
              </aside>
              <main>
                <CourseGrid />
              </main>
            </div>
          </TabsContent>
          
          {/* My Courses Tab */}
          <TabsContent value="my-courses" className="mt-6">
            <MyCourses />
          </TabsContent>
          
          {/* Wishlist Tab */}
          <TabsContent value="wishlist" className="mt-6">
            {wishlistCourses.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Your Wishlist is Empty</h3>
                <p className="text-muted-foreground mb-6">
                  Save courses you're interested in for later
                </p>
                <Button onClick={() => setActiveTab('all')}>
                  Browse Courses
                </Button>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">My Wishlist</h2>
                  <p className="text-muted-foreground">
                    {wishlistCourses.length} {wishlistCourses.length === 1 ? 'course' : 'courses'} saved
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {wishlistCourses.map(course => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VideoCourses;
