import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SearchFilters {
  subject?: string;
  class?: string;
  author?: string;
  resourceType?: string;
  sortBy?: 'date' | 'popularity' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export const useSearch = () => {
  const { toast } = useToast();
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('resource_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const searchResources = async (query: string, filters: SearchFilters = {}) => {
    setIsLoading(true);
    try {
      let queryBuilder = supabase
        .from('resources')
        .select('*');

      // Text search
      if (query.trim()) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%,author.ilike.%${query}%`);
      }

      // Apply filters
      if (filters.subject) {
        queryBuilder = queryBuilder.eq('subject', filters.subject);
      }
      if (filters.class) {
        queryBuilder = queryBuilder.eq('class', filters.class);
      }
      if (filters.author) {
        queryBuilder = queryBuilder.ilike('author', `%${filters.author}%`);
      }
      if (filters.resourceType) {
        queryBuilder = queryBuilder.eq('resource_type', filters.resourceType);
      }

      // Apply sorting
      const sortColumn = filters.sortBy === 'popularity' ? 'download_count' : 
                        filters.sortBy === 'date' ? 'upload_date' : 'title';
      queryBuilder = queryBuilder.order(sortColumn, { 
        ascending: filters.sortOrder === 'asc' 
      });

      const { data, error } = await queryBuilder;

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error searching resources:', error);
      toast({
        title: "Search failed",
        description: "Unable to search resources",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    results,
    isLoading,
    categories,
    searchResources,
    refetchCategories: fetchCategories
  };
};