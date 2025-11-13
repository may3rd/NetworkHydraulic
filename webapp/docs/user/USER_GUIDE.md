# User Guide

Welcome to the Hydraulic Network Web Application! This guide will help you get started with creating, analyzing, and managing hydraulic networks using our powerful web-based tool.

## Table of Contents

- [Getting Started](#getting-started)
- [Understanding the Interface](#understanding-the-interface)
- [Creating Your First Network](#creating-your-first-network)
- [Running Calculations](#running-calculations)
- [Viewing Results](#viewing-results)
- [Managing Configurations](#managing-configurations)
- [Exporting and Reporting](#exporting-and-reporting)
- [Tips and Best Practices](#tips-and-best-practices)

## Getting Started

### System Requirements

Our application works best with:
- **Browser**: Latest version of Chrome, Firefox, Safari, or Edge
- **Internet Connection**: Stable connection for API communication
- **Screen Resolution**: Minimum 1280x720 for optimal experience

### Creating an Account

1. **Visit the Application**: Go to the application URL provided by your administrator
2. **Sign Up**: Click "Sign Up" and fill in your information
3. **Verify Email**: Check your email for a verification link
4. **Log In**: Use your credentials to access the application

### Initial Setup

Upon first login, you'll be guided through a quick setup process:
1. **Profile Setup**: Add your professional details
2. **Preferences**: Set your preferred units and display options
3. **Tutorial**: Optional walkthrough of key features

## Understanding the Interface

### Main Navigation

The application uses a sidebar navigation system:

```
🏠 Dashboard
📊 Configuration
  ├── Fluid Properties
  ├── Network Settings
  ├── Pipe Sections
  └── Boundary Conditions
⚡ Results
💾 History
📤 Export
⚙️ Settings
```

### Dashboard Overview

The dashboard provides:
- **Quick Actions**: Start new calculations or access recent work
- **System Status**: API connectivity and system health
- **Recent Activity**: Your latest calculations and modifications
- **Help Resources**: Links to documentation and support

### Configuration Interface

The configuration interface is divided into logical sections:

#### 1. Fluid Properties
- **Fluid Type**: Select from common fluids or define custom properties
- **Physical Properties**: Density, viscosity, temperature
- **Phase Information**: Liquid, gas, or multiphase

#### 2. Network Settings
- **Calculation Model**: Steady-state or transient analysis
- **Flow Direction**: Automatic detection or manual specification
- **Boundary Conditions**: Pressure or flow rate specifications
- **Convergence Criteria**: Calculation precision settings

#### 3. Pipe Sections
- **Section Definition**: Diameter, length, material, roughness
- **Fittings and Valves**: Add elbows, tees, valves, and other components
- **Elevation Profile**: Height changes along the pipeline
- **Insulation Properties**: Thermal characteristics

#### 4. Advanced Options
- **Numerical Methods**: Solver selection and parameters
- **Output Units**: Customizable unit systems
- **Design Margins**: Safety factors and design considerations

## Creating Your First Network

### Step 1: Define Fluid Properties

1. **Navigate to Configuration > Fluid Properties**
2. **Select Fluid Type**: Choose from the dropdown or select "Custom"
3. **Enter Properties**:
   - **Density**: Mass per unit volume (kg/m³)
   - **Viscosity**: Dynamic viscosity (Pa·s)
   - **Temperature**: Operating temperature (°C)
4. **Save**: Click "Save Fluid Properties"

*Tip: For water at 20°C, use density = 998 kg/m³ and viscosity = 0.001 Pa·s*

### Step 2: Configure Network Settings

1. **Go to Configuration > Network Settings**
2. **Calculation Model**: Select "Steady State" for basic analysis
3. **Flow Direction**: Choose "Auto" for automatic detection
4. **Boundary Conditions**:
   - **Inlet Pressure**: Upstream pressure (Pa)
   - **Outlet Pressure**: Downstream pressure (Pa)
5. **Convergence Criteria**: Use default values for initial calculations
6. **Save Settings**

### Step 3: Add Pipe Sections

1. **Navigate to Configuration > Pipe Sections**
2. **Add Section**: Click "Add Pipe Section"
3. **Enter Section Details**:
   - **Name**: Descriptive name (e.g., "Main Supply Line")
   - **Diameter**: Internal diameter (m)
   - **Length**: Section length (m)
   - **Roughness**: Pipe material roughness (m)
   - **Material**: Select from common materials
4. **Add Fittings**: Click "Add Fitting" and select:
   - **Type**: Elbow, tee, reducer, etc.
   - **Quantity**: Number of fittings
5. **Add Valves**: Include control valves, check valves, etc.
6. **Repeat**: Add all necessary pipe sections
7. **Save Configuration**

### Step 4: Validate Configuration

1. **Click "Validate Configuration"**
2. **Review Warnings**: Address any validation warnings
3. **Fix Errors**: Correct any configuration errors
4. **Configuration Status**: Ensure it shows "Valid"

## Running Calculations

### Starting a Calculation

1. **Navigate to the Results Page**
2. **Review Configuration**: Ensure your configuration is loaded
3. **Start Calculation**: Click "Start Calculation"
4. **Monitor Progress**: Watch the progress indicator
5. **Wait for Completion**: Calculations typically take 10-60 seconds

### Understanding Progress Updates

The progress indicator shows:
- **Percentage Complete**: Overall calculation progress
- **Current Phase**: What calculation step is running
- **Time Remaining**: Estimated completion time
- **Iteration Count**: Number of solver iterations

### Calculation Status

Monitor calculation status through:
- **Progress Bar**: Visual progress indication
- **Status Messages**: Detailed step descriptions
- **Real-time Updates**: WebSocket-based live updates
- **Error Notifications**: Immediate error reporting

### Handling Calculation Issues

If a calculation fails:
1. **Check Error Message**: Review the specific error
2. **Review Configuration**: Look for invalid inputs
3. **Adjust Settings**: Modify convergence criteria if needed
4. **Retry**: Attempt the calculation again
5. **Contact Support**: If issues persist

## Viewing Results

### Results Dashboard

The results dashboard displays:
- **Summary Metrics**: Key performance indicators
- **Pressure Profile**: Pressure changes throughout the network
- **Flow Characteristics**: Velocity and flow rate information
- **Component Analysis**: Individual section performance

### Key Results Sections

#### 1. Summary Information
- **Mass Flow Rate**: Total system flow (kg/s)
- **Volumetric Flow Rate**: Volume flow rate (m³/s)
- **Total Pressure Drop**: System-wide pressure loss (Pa)
- **Pump Power Required**: Energy requirements (W)

#### 2. Section-by-Section Analysis
Each pipe section shows:
- **Pressure Drop**: Individual section losses
- **Velocity**: Flow velocity in the section
- **Reynolds Number**: Flow regime indicator
- **Friction Factor**: Pipe friction characteristics
- **Head Loss**: Energy loss due to friction

#### 3. Component Analysis
- **Fitting Losses**: Pressure losses in fittings
- **Valve Performance**: Valve pressure drops
- **Elevation Effects**: Height-related pressure changes

### Interactive Charts

#### Pressure Profile Chart
- **X-axis**: Distance along the pipeline
- **Y-axis**: Pressure (absolute or gauge)
- **Features**: Hover for details, zoom for specific sections

#### Velocity Profile Chart
- **X-axis**: Distance along the pipeline
- **Y-axis**: Flow velocity
- **Features**: Critical velocity indicators, color-coded zones

#### Network Diagram
- **Visual Layout**: Topological view of the network
- **Interactive Elements**: Click sections for details
- **Color Coding**: Pressure or velocity visualization

### Results Interpretation

#### Understanding Pressure Drop
- **Friction Loss**: Due to pipe roughness and length
- **Fitting Loss**: Due to bends, valves, and restrictions
- **Elevation Loss**: Due to height changes
- **Total Loss**: Sum of all pressure losses

#### Flow Regime Analysis
- **Laminar Flow**: Reynolds number < 2000
- **Turbulent Flow**: Reynolds number > 4000
- **Transition Zone**: Between 2000-4000

#### Performance Evaluation
- **Efficiency**: Compare actual vs. theoretical performance
- **Bottlenecks**: Identify high-pressure-drop sections
- **Optimization Opportunities**: Areas for improvement

## Managing Configurations

### Configuration Library

Access your saved configurations:
1. **Navigate to History**
2. **View List**: See all saved configurations
3. **Filter Options**: Sort by date, name, or status
4. **Search**: Find specific configurations

### Loading Previous Configurations

1. **Go to History Page**
2. **Select Configuration**: Click on the desired configuration
3. **Load**: Click "Load Configuration"
4. **Review**: Check that all settings loaded correctly
5. **Modify**: Make any necessary changes
6. **Save**: Save as new configuration if needed

### Configuration Templates

Create reusable templates:
1. **Design Template**: Create a base configuration
2. **Save as Template**: Use "Save as Template" option
3. **Template Library**: Access templates from any project
4. **Customize**: Modify templates for specific applications

### Sharing Configurations

Share configurations with team members:
1. **Export Configuration**: Download as JSON or YAML
2. **Import Configuration**: Upload and load shared files
3. **Version Control**: Track changes over time
4. **Collaboration**: Work together on complex networks

## Exporting and Reporting

### Export Options

#### 1. Raw Data Export
- **CSV Format**: Spreadsheet-compatible data
- **JSON Format**: Machine-readable structured data
- **YAML Format**: Human-readable configuration data

#### 2. Report Generation
- **Executive Summary**: High-level overview
- **Technical Report**: Detailed analysis with charts
- **Calculation Report**: Complete mathematical results
- **Compliance Report**: Regulatory requirement documentation

### Export Process

1. **Navigate to Export Page**
2. **Select Format**: Choose desired export format
3. **Customize Content**: Select which sections to include
4. **Generate Report**: Create the export file
5. **Download**: Save to your local system

### Report Customization

#### Executive Summary
- **Project Information**: Title, description, date
- **Key Metrics**: Top-level performance indicators
- **Recommendations**: High-level suggestions
- **Cost Analysis**: Budget impact summary

#### Technical Report
- **Complete Analysis**: All calculation results
- **Charts and Graphs**: Visual data representation
- **Component Details**: Individual element analysis
- **Mathematical Models**: Underlying equations and methods

### Sharing Reports

1. **PDF Export**: Professional document format
2. **Email Integration**: Direct email sending
3. **Cloud Storage**: Integration with cloud services
4. **Print Options**: Printable report formats

## Tips and Best Practices

### Configuration Best Practices

#### 1. Accurate Fluid Properties
- **Use Reliable Sources**: Reference engineering handbooks
- **Temperature Effects**: Account for temperature variations
- **Phase Changes**: Consider vapor pressure and cavitation
- **Contaminants**: Factor in fluid impurities

#### 2. Proper Pipe Modeling
- **Accurate Dimensions**: Use actual pipe specifications
- **Material Properties**: Select correct roughness values
- **Fitting Quantities**: Count all fittings and valves
- **Elevation Data**: Include accurate height measurements

#### 3. Boundary Conditions
- **Realistic Pressures**: Use actual system pressures
- **Flow Rates**: Base on system requirements
- **Transient Effects**: Consider startup and shutdown
- **Safety Margins**: Include appropriate factors

### Calculation Optimization

#### 1. Convergence Settings
- **Default Values**: Start with recommended settings
- **Tight Tolerance**: Use for critical applications
- **Relax Criteria**: For preliminary analysis
- **Iteration Limits**: Balance accuracy and speed

#### 2. Numerical Methods
- **Steady State**: For constant flow conditions
- **Transient Analysis**: For time-varying flows
- **Solver Selection**: Choose appropriate algorithms
- **Grid Resolution**: Balance detail and performance

### Results Analysis

#### 1. Data Validation
- **Reasonableness Check**: Verify results make sense
- **Comparison**: Compare with similar systems
- **Conservation Laws**: Check mass and energy balance
- **Unit Consistency**: Ensure proper units throughout

#### 2. Performance Assessment
- **Efficiency Analysis**: Identify energy losses
- **Bottleneck Detection**: Find limiting components
- **Optimization Potential**: Areas for improvement
- **Cost-Benefit**: Economic impact analysis

### Troubleshooting Common Issues

#### 1. Convergence Problems
- **Check Input Data**: Verify all parameters are valid
- **Adjust Tolerance**: Relax convergence criteria
- **Simplify Model**: Remove unnecessary complexity
- **Step-wise Approach**: Build model incrementally

#### 2. Unreasonable Results
- **Unit Verification**: Check for unit conversion errors
- **Parameter Review**: Verify input parameter ranges
- **Model Validation**: Compare with known systems
- **Expert Consultation**: Seek experienced advice

#### 3. Performance Issues
- **Model Simplification**: Reduce unnecessary detail
- **Hardware Upgrade**: Consider system requirements
- **Network Optimization**: Improve connection quality
- **Batch Processing**: Process multiple scenarios efficiently

### Learning Resources

#### Documentation
- **User Manual**: Comprehensive feature documentation
- **Video Tutorials**: Step-by-step video guides
- **FAQ Section**: Common questions and answers
- **Technical Papers**: In-depth technical information

#### Training
- **Webinars**: Live online training sessions
- **Workshops**: In-person training events
- **Certification**: Professional certification programs
- **User Community**: Peer-to-peer learning

#### Support
- **Help Desk**: Technical support team
- **User Forums**: Community discussion
- **Knowledge Base**: Self-service support
- **Training Materials**: Self-paced learning

---

For additional help or specific questions about using the Hydraulic Network Web Application, please refer to our [Support Guide](SUPPORT.md) or contact our support team.