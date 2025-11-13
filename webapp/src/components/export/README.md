# Export and Reporting Components

This directory contains comprehensive export and reporting features for the hydraulic network web application. The components provide professional report generation with multiple formats, customizable templates, and seamless integration with calculation results.

## Features

### 📤 Multiple Export Formats
- **PDF** - Professional documents with charts and formatting
- **Excel** - Multi-sheet workbooks with formulas and charts
- **CSV** - Data analysis compatible format
- **JSON** - Structured data for APIs and integrations
- **XML** - Schema-validated XML export
- **HTML** - Web-ready documents
- **Images** - Charts and network diagrams as PNG, SVG, JPG

### 📋 Report Templates
- **Executive Summary** - High-level overview with key metrics
- **Detailed Technical** - Comprehensive analysis with all calculations
- **Calculation Report** - Complete results with raw data
- **Comparison Report** - Side-by-side scenario comparison
- **One-Page Summary** - Quick reference format
- **Custom Templates** - User-defined layouts

### ⚡ Advanced Features
- Batch export for multiple calculations
- Export progress tracking and status updates
- Customizable report content and layout
- Export scheduling and automation
- Email export delivery
- Export history and version management
- Compression for large exports
- Watermarking and security features

## Component Structure

```
src/components/export/
├── index.ts                    # Main exports
├── types.ts                    # TypeScript definitions
├── ExportOptions.tsx          # Main export interface
├── ReportGenerator.tsx        # Template-based report generation
├── ExportProgress.tsx         # Progress tracking
├── ExportHistory.tsx          # Export history management
├── BatchExport.tsx            # Batch export functionality
└── README.md                  # This documentation
```

### Core Components

#### ExportOptions
The main export interface that provides format selection, content options, and advanced settings.

**Key Features:**
- Format selection (PDF, Excel, CSV, JSON, XML, HTML, Images)
- Content customization (charts, network diagrams, raw data)
- Quality settings and compression options
- Security features (watermarking, encryption)
- Email delivery configuration
- Cloud storage integration

**Usage:**
```tsx
<ExportOptions
  calculationId="calc-123"
  calculationName="Pipeline Network Analysis"
  onExport={(options) => handleExport(options)}
  availableFormats={['pdf', 'excel', 'csv']}
  defaultOptions={{ format: 'pdf', template: 'executive_summary' }}
/>
```

#### ReportGenerator
Template-based report generation with professional layouts and branding.

**Key Features:**
- Professional report templates
- Custom section selection and ordering
- Layout and branding customization
- Real-time preview
- Template saving and management

**Usage:**
```tsx
<ReportGenerator
  calculationId="calc-123"
  calculationName="Pipeline Network Analysis"
  onGenerate={(template, options) => handleReportGeneration(template, options)}
  defaultTemplate="executive_summary"
/>
```

#### ExportProgress
Real-time export progress tracking with detailed status information.

**Key Features:**
- Real-time progress updates
- Step-by-step processing status
- Error handling and retry logic
- Compact and detailed views
- Cancel and retry functionality

**Usage:**
```tsx
<ExportProgress
  job={exportJob}
  onCancel={(jobId) => handleCancel(jobId)}
  onRetry={(jobId) => handleRetry(jobId)}
  onDownload={(jobId) => handleDownload(jobId)}
  showDetails={true}
  compact={false}
/>
```

## Templates Directory

```
src/components/export/templates/
├── index.ts                    # Template exports
├── types.ts                    # Template type definitions
├── ExecutiveSummaryReport.tsx  # Executive summary template
├── DetailedTechnicalReport.tsx # Detailed technical template
├── CalculationReport.tsx       # Complete calculation template
├── ComparisonReport.tsx        # Comparison report template
├── OnePageReport.tsx           # One-page summary template
└── PrintLayout.tsx             # Print-optimized layout
```

### Template Features

#### ExecutiveSummaryReport
Professional executive summary with key metrics, critical conditions, and recommendations.

**Sections:**
- Key performance metrics
- Critical conditions alerts
- Performance analysis
- Optimization recommendations
- Calculation summary table

#### DetailedTechnicalReport
Comprehensive technical analysis with detailed calculations and raw data.

**Sections:**
- Complete executive summary
- Detailed calculation results
- Network diagram visualization
- Pressure and velocity profiles
- Loss breakdown analysis
- Methodology documentation
- Appendices with raw data

## Services Directory

```
src/services/export/
├── index.ts           # Service exports
├── types.ts           # Service type definitions
├── pdfExport.ts       # PDF export service
├── excelExport.ts     # Excel export service
├── csvExport.ts       # CSV export service
├── jsonExport.ts      # JSON export service
└── [other services]
```

### Export Services

#### PDF Export Service
Professional PDF document generation with charts, tables, and formatting.

**Features:**
- Multiple page layouts (portrait, landscape)
- Professional styling and branding
- Chart and table integration
- Watermark and security options
- Compression and optimization

#### CSV Export Service
Data analysis compatible CSV export with flexible formatting.

**Features:**
- Configurable delimiters and encoding
- Header and metadata inclusion
- Data validation and escaping
- Large dataset optimization

## TypeScript Types

The export system includes comprehensive TypeScript definitions:

- **Export Formats**: `pdf`, `excel`, `csv`, `json`, `xml`, `html`, `png`, `svg`, `jpg`
- **Export Status**: `pending`, `processing`, `completed`, `failed`, `cancelled`
- **Report Templates**: `executive_summary`, `detailed_technical`, `calculation_report`, etc.
- **Quality Settings**: Image resolution, chart quality, compression levels
- **Security Options**: Watermarking, encryption, access controls

## Integration Examples

### Basic Export Flow
```tsx
import { ExportOptions, ExportProgress } from '../components/export';

function ExportPage({ calculationId, calculationName }) {
  const [exportJob, setExportJob] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (options) => {
    setIsExporting(true);
    
    try {
      const job = await exportService.createJob(calculationId, options);
      setExportJob(job);
      
      // Monitor progress
      const progress = await exportService.monitorProgress(job.id);
      setExportJob(progress);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <ExportOptions
        calculationId={calculationId}
        calculationName={calculationName}
        onExport={handleExport}
        isLoading={isExporting}
      />
      
      {exportJob && (
        <ExportProgress
          job={exportJob}
          onDownload={(jobId) => downloadExport(jobId)}
          onCancel={(jobId) => cancelExport(jobId)}
        />
      )}
    </div>
  );
}
```

### Report Generation
```tsx
import { ReportGenerator } from '../components/export';

function ReportPage({ calculationId, calculationName, result }) {
  const handleReportGeneration = async (template, options) => {
    const reportData = {
      calculationId,
      calculationName,
      result,
      template,
      branding: {
        primaryColor: '#1976d2',
        companyName: 'My Company',
        logoUrl: '/logo.png'
      }
    };

    const exportedReport = await reportService.generate(reportData, options);
    downloadFile(exportedReport.downloadUrl, exportedReport.fileName);
  };

  return (
    <ReportGenerator
      calculationId={calculationId}
      calculationName={calculationName}
      onGenerate={handleReportGeneration}
      defaultTemplate="executive_summary"
    />
  );
}
```

## Best Practices

### Performance Optimization
- Use compression for large exports
- Implement streaming for very large datasets
- Cache frequently used templates
- Optimize chart rendering for PDF exports

### Security Considerations
- Validate all user inputs
- Implement proper access controls
- Use encryption for sensitive data
- Add watermarks to prevent unauthorized sharing

### User Experience
- Provide clear progress feedback
- Offer multiple format options
- Enable batch operations for efficiency
- Implement retry logic for failed exports

## Error Handling

The export system includes comprehensive error handling:

```tsx
// Handle export errors
const handleExportError = (error) => {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      showToast('Please check your export options', 'error');
      break;
    case 'FORMAT_NOT_SUPPORTED':
      showToast('Selected format is not available', 'warning');
      break;
    case 'FILE_TOO_LARGE':
      showToast('File size exceeds limit. Try reducing data or enabling compression.', 'warning');
      break;
    case 'PERMISSION_DENIED':
      showToast('You do not have permission to export this data', 'error');
      break;
    default:
      showToast('Export failed. Please try again.', 'error');
  }
};
```

## Future Enhancements

- Real-time collaboration on reports
- AI-powered report generation
- Advanced chart customization
- Integration with BI tools
- Mobile-responsive export formats
- Voice-controlled report generation

## Contributing

When adding new export formats or templates:

1. Update the TypeScript type definitions
2. Implement the export service interface
3. Create the corresponding React components
4. Add comprehensive error handling
5. Include unit tests and documentation
6. Follow the existing code style and patterns

## License

This export and reporting system is part of the NetworkHydraulic web application and follows the same licensing terms.