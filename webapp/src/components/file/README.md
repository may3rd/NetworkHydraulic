# File Upload and Validation System

This comprehensive file upload and validation system provides seamless configuration management for hydraulic network analysis applications.

## Features

### 📁 File Upload Components
- **Drag-and-Drop Interface**: Intuitive file upload with React Dropzone
- **Multi-Format Support**: YAML, JSON configuration files
- **Visual Feedback**: Progress indicators and file previews
- **File Validation**: Real-time validation during upload process

### 🔍 Validation System
- **Schema Validation**: Yup-based validation schemas for all configuration types
- **Hydraulic Calculations**: Custom validation rules for hydraulic calculations
- **Real-time Feedback**: Immediate validation results with detailed error messages
- **Error Suggestions**: Helpful suggestions for fixing validation issues

### 📋 Configuration Templates
- **Template Gallery**: Pre-built templates for common scenarios
- **Template Management**: Create, edit, delete, and organize templates
- **Import/Export**: Share templates across systems
- **Categorization**: Organize templates by type and complexity

### 💾 File Management
- **Local Storage**: Persistent configuration storage
- **Import/Export**: YAML/JSON file import and export
- **Configuration History**: Track and manage multiple configurations
- **File Organization**: Tag and categorize saved configurations

## Components

### Core Components

#### `FileUpload`
Drag-and-drop file upload component with visual feedback
```tsx
import { FileUpload } from '../components/file';

<FileUpload
  onFileUpload={handleFiles}
  acceptedTypes={['.yaml', '.yml', '.json']}
  maxSize={10 * 1024 * 1024} // 10MB
  multiple={true}
/>
```

#### `FilePreview`
Validation results and file information display
```tsx
import { FilePreview } from '../components/file';

<FilePreview
  file={uploadedFile}
  validation={validationResult}
  onRetry={handleRetry}
  showDetails={true}
/>
```

#### `FileManagement`
Complete file management interface with local storage
```tsx
import { FileManagement } from '../components/file';

<FileManagement
  onFileLoad={handleLoad}
  onFileSave={handleSave}
  supportedFormats={['yaml', 'json']}
/>
```

#### `TemplateSelector`
Template browsing and selection interface
```tsx
import { TemplateSelector } from '../components/file';

<TemplateSelector
  templates={templates}
  onTemplateSelect={handleTemplateSelect}
  showCreateButton={true}
/>
```

#### `FormValidation`
Real-time form validation wrapper
```tsx
import { FormValidation } from '../components/file';
import { fluidSchema } from '../validation';

<FormValidation
  schema={fluidSchema}
  onSubmit={handleSubmit}
  mode="onChange"
>
  {/* Form fields */}
</FormValidation>
```

## Validation System

### Schemas (`src/validation/schemas.ts`)
Comprehensive Yup validation schemas for all configuration types:
- Fluid configuration validation
- Pipe section validation
- Network configuration validation
- Component validation

### Custom Validators (`src/validation/validators.ts`)
Hydraulic-specific validation functions:
- Reynolds number validation
- Velocity limits checking
- Pressure drop validation
- Pipe diameter合理性
- Fluid properties consistency
- Section continuity validation

### Validation Utilities (`src/validation/validationUtils.ts`)
Utility functions for validation processing:
- Configuration validation
- YAML/JSON content validation
- Error formatting and merging
- Configuration sanitization

## Custom Hooks

### `useFileUpload`
Complete file upload management with validation
```tsx
import { useFileUpload } from '../hooks';

const {
  files,
  addFiles,
  validateFiles,
  uploadFiles,
  getStats,
  getValidationSummary
} = useFileUpload({
  acceptedTypes: ['.yaml', '.yml', '.json'],
  maxSize: 10 * 1024 * 1024,
  autoValidate: true,
  onUpload: handleUpload,
  onValidation: handleValidation
});
```

### `useValidation`
Real-time form validation with schema support
```tsx
import { useValidation } from '../hooks';

const {
  validateData,
  getFieldState,
  getValidationSummary,
  hasErrors,
  isValid
} = useValidation({
  schema: fluidSchema,
  validateOnChange: true,
  debounceTime: 300
});
```

### `useTemplates`
Template management with local storage
```tsx
import { useTemplates } from '../hooks';

const {
  templates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  searchTemplates,
  importTemplate,
  exportTemplate
} = useTemplates({
  onTemplateCreate: handleCreate,
  onTemplateUpdate: handleUpdate,
  onTemplateDelete: handleDelete
});
```

## Templates

### Built-in Templates (`src/templates/templates.ts`)
Pre-configured templates for common scenarios:

1. **Basic Liquid Pipeline**: Simple liquid transport system
2. **Gas Transmission Pipeline**: High-pressure gas transmission
3. **Industrial Process System**: Complex multi-branch industrial setup
4. **Cryogenic Liquid System**: Low-temperature liquid systems
5. **Simple Gas Vent System**: Atmospheric vent systems

### Template Features
- **Categorized**: Organized by system type and complexity
- **Searchable**: Find templates by name, description, or tags
- **Featured Templates**: Highlighted templates for common use cases
- **Import/Export**: Share templates between installations

## File Format Support

### YAML Configuration Files
- Full YAML parsing and validation
- Proper indentation checking
- Required section validation
- Schema compliance checking

### JSON Configuration Files
- JSON syntax validation
- Required field checking
- Schema validation
- Structure verification

### Import/Export Functionality
- **Import**: Load configurations from YAML/JSON files
- **Export**: Save configurations to YAML/JSON files
- **Template Export**: Export templates for sharing
- **Batch Operations**: Process multiple files at once

## Validation Features

### Real-time Validation
- **Field-level**: Validate individual fields as user types
- **Form-level**: Validate entire forms on submission
- **Configuration**: Validate complete hydraulic configurations
- **File Upload**: Validate files during upload process

### Error Handling
- **Detailed Messages**: Clear, actionable error messages
- **Field Mapping**: Errors mapped to specific form fields
- **Severity Levels**: Error, warning, and info message types
- **Suggestions**: Helpful suggestions for fixing issues

### Hydraulic Calculation Validation
- **Flow Consistency**: Ensure mass/energy balance
- **Pressure Limits**: Check pressure drop limits
- **Velocity Ranges**: Validate velocity in acceptable ranges
- **Component Compatibility**: Check component specifications

## Integration

### Zustand Store Integration
The system integrates with existing Zustand stores for state management:
```tsx
// Example integration with configuration store
const useConfiguration = create((set, get) => ({
  config: null,
  updateConfig: (newConfig) => {
    const validationResult = validateConfiguration(newConfig);
    if (validationResult.isValid) {
      set({ config: newConfig });
    } else {
      // Handle validation errors
    }
  }
}));
```

### API Integration
Ready for backend API integration:
```tsx
// Example API upload
const uploadConfig = async (files: File[]) => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  
  const response = await fetch('/api/upload-config', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};
```

## Usage Examples

### Basic File Upload
```tsx
import React from 'react';
import { FileUpload, FilePreview } from '../components/file';

const ConfigurationUploader = () => {
  const [files, setFiles] = React.useState([]);
  const [validationResults, setValidationResults] = React.useState([]);

  const handleFileUpload = (uploadedFiles) => {
    setFiles(uploadedFiles);
    // Trigger validation
  };

  return (
    <div>
      <FileUpload
        onFileUpload={handleFileUpload}
        acceptedTypes={['.yaml', '.yml', '.json']}
      />
      
      {files.map((file, index) => (
        <FilePreview
          key={index}
          file={file}
          validation={validationResults[index]}
        />
      ))}
    </div>
  );
};
```

### Template Management
```tsx
import React from 'react';
import { TemplateManager } from '../components/file';
import { useTemplates } from '../hooks';
import templates from '../templates/templates';

const TemplateManagerPage = () => {
  const templateHook = useTemplates();

  const handleTemplateSelect = (template) => {
    // Apply template to configuration
  };

  return (
    <TemplateManager
      templates={[...templates, ...templateHook.templates]}
      onTemplateSelect={handleTemplateSelect}
      onTemplateCreate={templateHook.createTemplate}
      onTemplateUpdate={templateHook.updateTemplate}
      onTemplateDelete={templateHook.deleteTemplate}
    />
  );
};
```

## Error Handling

### File Upload Errors
- **Invalid Format**: Unsupported file types
- **Size Limits**: Files exceeding size limits
- **Corruption**: Unreadable or corrupted files
- **Network Issues**: Upload failures

### Validation Errors
- **Schema Violations**: Configuration doesn't match schema
- **Calculation Errors**: Hydraulic calculations fail
- **Inconsistency**: Internal configuration conflicts
- **Missing Data**: Required fields not provided

### User Feedback
- **Toast Notifications**: Success/error messages
- **Inline Messages**: Field-specific error display
- **Progress Indicators**: Upload and processing status
- **Summary Reports**: Comprehensive validation results

## Performance Considerations

### File Processing
- **Chunked Uploads**: Large file handling
- **Progressive Validation**: Validate as files upload
- **Memory Management**: Efficient file handling
- **Caching**: Store validation results

### Validation Performance
- **Debouncing**: Prevent excessive validation
- **Selective Validation**: Only validate changed fields
- **Async Processing**: Non-blocking validation
- **Error Batching**: Group related errors

## Browser Support

### Supported Browsers
- **Chrome**: Version 80+
- **Firefox**: Version 75+
- **Safari**: Version 13+
- **Edge**: Version 80+

### Features Requiring Modern Browsers
- **File API**: Drag-and-drop file upload
- **Local Storage**: Configuration persistence
- **Web Workers**: Background validation (optional)
- **Async/Await**: Modern JavaScript features

## Security Considerations

### File Upload Security
- **Type Validation**: Only allow YAML/JSON files
- **Size Limits**: Prevent large file uploads
- **Content Validation**: Validate file contents
- **Sanitization**: Clean user input

### Data Security
- **Local Storage**: Client-side data only
- **No Auto-upload**: User-controlled uploads
- **Input Validation**: Prevent injection attacks
- **Error Handling**: No sensitive data in errors

## Future Enhancements

### Planned Features
- **Cloud Sync**: Sync configurations across devices
- **Version Control**: Track configuration changes
- **Collaboration**: Share configurations with team members
- **Advanced Templates**: Template inheritance and variables
- **Validation Plugins**: Custom validation rules
- **Batch Processing**: Process multiple configurations
- **Export Formats**: Additional export formats (PDF, Excel)

### Integration Possibilities
- **Backend APIs**: Full server integration
- **Database Storage**: Server-side persistence
- **Authentication**: User-specific configurations
- **Audit Logging**: Track configuration changes
- **API Endpoints**: RESTful configuration management

## Contributing

### Development Setup
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Run tests: `npm test`
4. Build for production: `npm run build`

### Code Standards
- **TypeScript**: Full type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Testing**: Jest and React Testing Library
- **Documentation**: JSDoc comments

### Testing
```bash
# Run all tests
npm test

# Run specific test file
npm test -- ValidationUtils.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## License

This file upload and validation system is part of the NetworkHydraulic web application and follows the same licensing terms.