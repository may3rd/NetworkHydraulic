import { useState, useCallback, useEffect } from 'react';
import { Template } from '../templates/templates';

export interface UseTemplatesOptions {
  onTemplateCreate?: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onTemplateUpdate?: (templateId: string, updates: Partial<Template>) => void;
  onTemplateDelete?: (templateId: string) => void;
}

export const useTemplates = (options: UseTemplatesOptions = {}) => {
  const {
    onTemplateCreate,
    onTemplateUpdate,
    onTemplateDelete
  } = options;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load templates from localStorage
  const loadTemplates = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);
      
      const stored = localStorage.getItem('hydraulic_templates');
      if (stored) {
        const parsed = JSON.parse(stored);
        const loadedTemplates: Template[] = parsed.map((template: any) => ({
          ...template,
          createdAt: new Date(template.createdAt),
          updatedAt: new Date(template.updatedAt)
        }));
        setTemplates(loadedTemplates);
      }
    } catch (err) {
      const errorMessage = 'Failed to load templates';
      setError(errorMessage);
      console.error('Error loading templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = useCallback((templateList: Template[]) => {
    try {
      localStorage.setItem('hydraulic_templates', JSON.stringify(templateList));
    } catch (err) {
      const errorMessage = 'Failed to save templates';
      setError(errorMessage);
      console.error('Error saving templates:', err);
    }
  }, []);

  // Create a new template
  const createTemplate = useCallback((templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTemplate: Template = {
        ...templateData,
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedTemplates = [...templates, newTemplate];
      setTemplates(updatedTemplates);
      saveTemplates(updatedTemplates);

      onTemplateCreate?.(templateData);
      return newTemplate;
    } catch (err) {
      const errorMessage = 'Failed to create template';
      setError(errorMessage);
      console.error('Error creating template:', err);
      return null;
    }
  }, [templates, saveTemplates, onTemplateCreate]);

  // Update an existing template
  const updateTemplate = useCallback((templateId: string, updates: Partial<Template>) => {
    try {
      const updatedTemplates = templates.map(template => 
        template.id === templateId 
          ? { ...template, ...updates, updatedAt: new Date() }
          : template
      );

      setTemplates(updatedTemplates);
      saveTemplates(updatedTemplates);

      onTemplateUpdate?.(templateId, updates);
      return updatedTemplates.find(t => t.id === templateId) || null;
    } catch (err) {
      const errorMessage = 'Failed to update template';
      setError(errorMessage);
      console.error('Error updating template:', err);
      return null;
    }
  }, [templates, saveTemplates, onTemplateUpdate]);

  // Delete a template
  const deleteTemplate = useCallback((templateId: string) => {
    try {
      const updatedTemplates = templates.filter(template => template.id !== templateId);
      setTemplates(updatedTemplates);
      saveTemplates(updatedTemplates);

      onTemplateDelete?.(templateId);
      return true;
    } catch (err) {
      const errorMessage = 'Failed to delete template';
      setError(errorMessage);
      console.error('Error deleting template:', err);
      return false;
    }
  }, [templates, saveTemplates, onTemplateDelete]);

  // Find a template by ID
  const findTemplate = useCallback((templateId: string): Template | undefined => {
    return templates.find(template => template.id === templateId);
  }, [templates]);

  // Search templates by query
  const searchTemplates = useCallback((query: string): Template[] => {
    if (!query.trim()) return templates;

    const lowerQuery = query.toLowerCase();
    return templates.filter(template => 
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }, [templates]);

  // Get templates by category
  const getTemplatesByCategory = useCallback((category: string): Template[] => {
    if (category === 'all') return templates;
    return templates.filter(template => template.category === category as any);
  }, [templates]);

  // Get templates by complexity
  const getTemplatesByComplexity = useCallback((complexity: string): Template[] => {
    if (complexity === 'all') return templates;
    return templates.filter(template => template.complexity === complexity as any);
  }, [templates]);

  // Get featured templates
  const getFeaturedTemplates = useCallback((): Template[] => {
    return templates.filter(template => template.isFeatured);
  }, [templates]);

  // Import template from JSON
  const importTemplate = useCallback((templateJson: string, name?: string): boolean => {
    try {
      const parsedTemplate = JSON.parse(templateJson);
      
      // Validate required fields
      if (!parsedTemplate.network || !parsedTemplate.fluid || !parsedTemplate.sections) {
        throw new Error('Invalid template format: missing required sections (network, fluid, sections)');
      }

      const importName = name || parsedTemplate.name || `Imported Template ${Date.now()}`;

      const newTemplate: Omit<Template, 'id' | 'createdAt' | 'updatedAt'> = {
        name: importName,
        description: parsedTemplate.description || 'Imported template',
        category: 'custom',
        complexity: 'medium',
        tags: ['imported', 'custom'],
        content: parsedTemplate,
        author: 'User',
        version: '1.0',
        isFeatured: false
      };

      return !!createTemplate(newTemplate);
    } catch (err) {
      const errorMessage = `Failed to import template: ${err instanceof Error ? err.message : 'Invalid JSON'}`;
      setError(errorMessage);
      console.error('Error importing template:', err);
      return false;
    }
  }, [createTemplate]);

  // Export template to JSON
  const exportTemplate = useCallback((templateId: string): string | null => {
    try {
      const template = findTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      return JSON.stringify(template.content, null, 2);
    } catch (err) {
      const errorMessage = `Failed to export template: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMessage);
      console.error('Error exporting template:', err);
      return null;
    }
  }, [findTemplate]);

  // Get template statistics
  const getTemplateStats = useCallback(() => {
    const stats = {
      total: templates.length,
      byCategory: {
        basic: templates.filter(t => t.category === 'basic').length,
        liquid: templates.filter(t => t.category === 'liquid').length,
        gas: templates.filter(t => t.category === 'gas').length,
        industrial: templates.filter(t => t.category === 'industrial').length,
        advanced: templates.filter(t => t.category === 'advanced').length,
        custom: templates.filter(t => t.category === 'custom').length
      },
      byComplexity: {
        simple: templates.filter(t => t.complexity === 'simple').length,
        medium: templates.filter(t => t.complexity === 'medium').length,
        complex: templates.filter(t => t.complexity === 'complex').length
      },
      featured: templates.filter(t => t.isFeatured).length,
      averageAge: 0 // Calculate average age in days
    };

    if (templates.length > 0) {
      const now = new Date();
      const totalAge = templates.reduce((sum, template) => {
        return sum + (now.getTime() - template.createdAt.getTime());
      }, 0);
      stats.averageAge = Math.round(totalAge / (templates.length * 24 * 60 * 60 * 1000));
    }

    return stats;
  }, [templates]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize templates on mount
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return {
    // State
    templates,
    isLoading,
    error,

    // CRUD Operations
    createTemplate,
    updateTemplate,
    deleteTemplate,
    findTemplate,

    // Search and Filter
    searchTemplates,
    getTemplatesByCategory,
    getTemplatesByComplexity,
    getFeaturedTemplates,

    // Import/Export
    importTemplate,
    exportTemplate,

    // Utilities
    getTemplateStats,
    clearError,
    loadTemplates
  };
};

export default useTemplates;