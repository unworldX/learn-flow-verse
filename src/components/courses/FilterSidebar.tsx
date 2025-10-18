import React from 'react';
import { useCoursesStore } from '@/store/coursesStore';
import { CourseLevel } from '@/types/courses';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

const levels: CourseLevel[] = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

interface Props { onClose?: () => void }
const FilterSidebar: React.FC<Props> = ({ onClose }) => {
  const { filters, setFilters } = useCoursesStore();

  const handleLevelChange = (level: CourseLevel) => {
    const newLevels = filters.levels.includes(level)
      ? filters.levels.filter((l) => l !== level)
      : [...filters.levels, level];
  setFilters({ levels: newLevels });
  };

  const handleRatingChange = (value: number[]) => {
    setFilters({ minRating: value[0] });
  };

  return (
    <aside className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Level</h3>
        {levels.map((level) => (
          <div key={level} className="flex items-center space-x-2 mb-2">
            <Checkbox
              id={level}
              checked={filters.levels.includes(level)}
              onCheckedChange={() => handleLevelChange(level)}
            />
            <Label htmlFor={level}>{level}</Label>
          </div>
        ))}
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-3">Rating</h3>
        <div className="flex justify-between items-center mb-2">
          <Label>Min Rating: {filters.minRating.toFixed(1)}</Label>
        </div>
        <Slider
          min={0}
          max={5}
          step={0.1}
          value={[filters.minRating]}
          onValueChange={handleRatingChange}
        />
      </div>
    </aside>
  );
};

export default FilterSidebar;
