import { useState, useCallback, useRef } from 'react';
import { FileUploadProps } from '../components/file/FileUpload';
import { ValidationResult } from '../components/file/FilePreview';

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  validation?: ValidationResult;
}

export interface UseFileUploadOptions {
  acceptedTypes?: string[];
  maxSize?: number;
  multiple?: boolean;
  autoValidate?: boolean;
  onUpload?: (files: UploadedFile[]) => void;
  onValidation?: (results: ValidationResult[]) => void;
  onError?: (error: string) => void;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const {
    acceptedTypes = ['.yaml', '.yml', '.json'],
    maxSize = 10 * 1024 * 1024, // 10MB
    multiple = true,
    autoValidate = true,
    onUpload,
    onValidation,
    onError
  } = options;

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add files to the upload queue
  const addFiles = useCallback((newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'pending' as const
    }));

    setFiles(prev => [...prev, ...uploadedFiles]);
    
    if (autoValidate) {
      validateFiles(uploadedFiles);
    }

    onUpload?.(uploadedFiles);
  }, [autoValidate, onUpload]);

  // Remove file from queue
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove && fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setUploadProgress(0);
  }, [files]);

  // Validate files
  const validateFiles = useCallback(async (filesToValidate?: UploadedFile[]) => {
    const targetFiles = filesToValidate || files;
    
    const validationResults: ValidationResult[] = [];
    
    for (const uploadedFile of targetFiles) {
      try {
        const content = await uploadedFile.file.text();
        const validationResult = await validateFileContent(content, uploadedFile.file.name);
        
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, validation: validationResult }
            : f
        ));
        
        validationResults.push(validationResult);
      } catch (error) {
        const errorResult: ValidationResult = {
          isValid: false,
          errors: [{
            field: 'file',
            message: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            severity: 'error',
            suggestion: 'Check if the file is accessible and not corrupted'
          }],
          warnings: [],
          info: []
        };
        
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, validation: errorResult }
            : f
        ));
        
        validationResults.push(errorResult);
      }
    }
    
    onValidation?.(validationResults);
  }, [files, onValidation]);

  // Process file upload to server
  const uploadFiles = useCallback(async (filesToUpload?: UploadedFile[]) => {
    const targetFiles = filesToUpload || files.filter(f => f.status === 'pending');
    
    if (targetFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      let uploadedCount = 0;
      
      for (const uploadedFile of targetFiles) {
        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, status: 'uploading' as const }
            : f
        ));

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        setFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, status: 'completed' as const, progress: 100 }
            : f
        ));

        uploadedCount++;
        setUploadProgress((uploadedCount / targetFiles.length) * 100);
      }

      setIsUploading(false);
    } catch (error) {
      setIsUploading(false);
      onError?.(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [files, onError]);

  // Retry upload for specific files
  const retryUpload = useCallback(async (fileIds: string[]) => {
    const filesToRetry = files.filter(f => fileIds.includes(f.id));
    await uploadFiles(filesToRetry);
  }, [files, uploadFiles]);

  // Open file picker
  const openFileDialog = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      addFiles(Array.from(selectedFiles));
    }
    // Reset input to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  }, [addFiles]);

  // Get file statistics
  const getStats = useCallback(() => {
    const totalSize = files.reduce((sum, file) => sum + file.file.size, 0);
    const validFiles = files.filter(f => f.validation?.isValid);
    const invalidFiles = files.filter(f => !f.validation?.isValid);
    const pendingFiles = files.filter(f => f.status === 'pending');
    const uploadingFiles = files.filter(f => f.status === 'uploading');
    const completedFiles = files.filter(f => f.status === 'completed');

    return {
      totalFiles: files.length,
      totalSize,
      validFiles: validFiles.length,
      invalidFiles: invalidFiles.length,
      pendingFiles: pendingFiles.length,
      uploadingFiles: uploadingFiles.length,
      completedFiles: completedFiles.length,
      isUploading,
      uploadProgress
    };
  }, [files, isUploading, uploadProgress]);

  // Get validation summary
  const getValidationSummary = useCallback(() => {
    const allErrors: any[] = [];
    const allWarnings: any[] = [];
    
    files.forEach(file => {
      if (file.validation) {
        allErrors.push(...file.validation.errors);
        allWarnings.push(...file.validation.warnings);
      }
    });

    return {
      totalErrors: allErrors.length,
      totalWarnings: allWarnings.length,
      filesWithErrors: files.filter(f => f.validation?.errors?.length ?? 0 > 0).length,
      filesWithWarnings: files.filter(f => f.validation?.warnings?.length ?? 0 > 0).length,
      isValid: files.length > 0 && files.every(f => f.validation?.isValid)
    };
  }, [files]);

  return {
    // State
    files,
    isUploading,
    uploadProgress,
    
    // Actions
    addFiles,
    removeFile,
    clearFiles,
    validateFiles,
    uploadFiles,
    retryUpload,
    openFileDialog,
    handleFileInputChange,
    
    // Utilities
    getStats,
    getValidationSummary,
    
    // Refs
    fileInputRef
  };
};

// Helper function to validate file content
const validateFileContent = async (content: string, filename: string): Promise<ValidationResult> => {
  try {
    // Basic file format validation
    const fileExtension = filename.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !['yaml', 'yml', 'json'].includes(fileExtension)) {
      return {
        isValid: false,
        errors: [{
          field: 'file.format',
          message: `Unsupported file format: ${fileExtension}`,
          severity: 'error',
          suggestion: 'Supported formats: YAML, JSON'
        }],
        warnings: [],
        info: []
      };
    }

    // JSON validation
    if (fileExtension === 'json') {
      try {
        JSON.parse(content);
        return {
          isValid: true,
          errors: [],
          warnings: [],
          info: [{
            field: 'json',
            message: 'Valid JSON format',
            severity: 'info'
          }]
        };
      } catch (error) {
        return {
          isValid: false,
          errors: [{
            field: 'json.syntax',
            message: `Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`,
            severity: 'error',
            suggestion: 'Check JSON syntax and structure'
          }],
          warnings: [],
          info: []
        };
      }
    }

    // YAML validation (basic structure check)
    if (fileExtension === 'yaml' || fileExtension === 'yml') {
      // Basic YAML structure validation
      const lines = content.split('\n');
      let hasErrors = false;
      const errors: any[] = [];

      // Check for tabs (YAML should use spaces)
      if (content.includes('\t')) {
        errors.push({
          field: 'yaml.indentation',
          message: 'YAML should use spaces for indentation, not tabs',
          severity: 'warning',
          suggestion: 'Replace tabs with spaces (typically 2 spaces per level)'
        });
      }

      // Check for common configuration patterns
      let hasNetwork = false;
      let hasFluid = false;
      let hasSections = false;

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('network:')) hasNetwork = true;
        if (trimmedLine.startsWith('fluid:')) hasFluid = true;
        if (trimmedLine.startsWith('sections:')) hasSections = true;
      }

      if (!hasNetwork) {
        errors.push({
          field: 'yaml.structure',
          message: 'Missing network configuration',
          severity: 'warning',
          suggestion: 'Add network section with name and direction'
        });
      }

      if (!hasFluid) {
        errors.push({
          field: 'yaml.structure',
          message: 'Missing fluid configuration',
          severity: 'warning',
          suggestion: 'Add fluid section with phase, temperature, and pressure'
        });
      }

      if (!hasSections) {
        errors.push({
          field: 'yaml.structure',
          message: 'Missing pipe sections',
          severity: 'warning',
          suggestion: 'Add sections array with at least one pipe section'
        });
      }

      return {
        isValid: errors.filter(e => e.severity === 'error').length === 0,
        errors: errors.filter(e => e.severity === 'error'),
        warnings: errors.filter(e => e.severity === 'warning'),
        info: [{
          field: 'yaml',
          message: 'YAML structure appears valid',
          severity: 'info'
        }]
      };
    }

    return {
      isValid: false,
      errors: [{
        field: 'file',
        message: 'Unknown file format',
        severity: 'error',
        suggestion: 'Supported formats: YAML, JSON'
      }],
      warnings: [],
      info: []
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [{
        field: 'file',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
        suggestion: 'Check file format and content'
      }],
      warnings: [],
      info: []
    };
  }
};

export default useFileUpload;