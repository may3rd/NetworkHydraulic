# Calculation Guide

This guide provides comprehensive information on running hydraulic calculations, understanding the calculation process, and interpreting results in the Hydraulic Network Web Application.

## Table of Contents

- [Calculation Overview](#calculation-overview)
- [Starting Calculations](#starting-calculations)
- [Monitoring Progress](#monitoring-progress)
- [Understanding Results](#understanding-results)
- [Calculation Methods](#calculation-methods)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting Calculations](#troubleshooting-calculations)
- [Advanced Calculation Features](#advanced-calculation-features)

## Calculation Overview

Hydraulic calculations solve the fundamental equations of fluid flow to determine pressure, velocity, and flow rate distributions throughout a piping network. The application uses sophisticated numerical methods to provide accurate and reliable results.

### Types of Calculations

#### 1. Steady-State Analysis

**Description**: Flow conditions that do not change with time

**Applications**:
- Design calculations for new systems
- Capacity evaluation of existing systems
- Pressure drop calculations
- Pump sizing and selection
- System optimization studies

**Characteristics**:
- Faster calculation times
- Simpler setup requirements
- Time-independent results
- Most commonly used analysis type

**Mathematical Basis**:
- Conservation of mass (continuity equation)
- Conservation of momentum (Navier-Stokes equations)
- Conservation of energy (Bernoulli's equation)
- Appropriate boundary conditions

#### 2. Transient Analysis

**Description**: Flow conditions that change with time

**Applications**:
- Startup and shutdown analysis
- Valve operation studies
- Water hammer analysis
- Surge protection design
- Emergency scenario modeling

**Characteristics**:
- Longer calculation times
- More complex setup
- Time-dependent results
- Requires time history data

**Mathematical Basis**:
- Time-dependent Navier-Stokes equations
- Method of characteristics (for surge analysis)
- Finite difference methods
- Appropriate initial and boundary conditions

### Calculation Process

#### 1. Preprocessing

**Mesh Generation**: Discretize the network into calculation elements
**Property Assignment**: Assign fluid and pipe properties to elements
**Boundary Setup**: Apply boundary conditions
**Initial Guess**: Generate starting values for iterative solution

#### 2. Solution Phase

**Equation Formation**: Create system of equations for the network
**Numerical Solution**: Solve equations using iterative methods
**Convergence Check**: Verify solution accuracy
**Iteration Control**: Manage solution process

#### 3. Postprocessing

**Result Calculation**: Compute derived quantities
**Visualization**: Generate charts and diagrams
**Report Generation**: Create summary reports
**Export Options**: Prepare data for external use

## Starting Calculations

### Prerequisites

Before starting a calculation, ensure:

1. **Valid Configuration**
   - All required fields completed
   - Configuration validation passed
   - Fluid properties defined
   - Pipe sections specified
   - Boundary conditions set

2. **System Readiness**
   - Application connected to backend
   - No system errors or warnings
   - Sufficient computational resources

3. **User Preparation**
   - Clear understanding of analysis objectives
   - Appropriate calculation parameters selected
   - Backup of current configuration

### Calculation Setup

#### 1. Configuration Review

**Navigate to Results Page**
1. Click on "Results" in the main navigation
2. Review loaded configuration summary
3. Verify all parameters are correct
4. Check configuration status indicator

**Configuration Summary Check**
- Fluid properties: Density, viscosity, temperature
- Network settings: Calculation model, convergence criteria
- Pipe sections: Count, total length, components
- Boundary conditions: Pressure and flow specifications

#### 2. Calculation Parameters

**Convergence Tolerance**
- **Loose (1e-4)**: Faster, less accurate - for preliminary studies
- **Standard (1e-6)**: Balanced speed and accuracy - for most applications
- **Tight (1e-8)**: Slower, highly accurate - for final design

**Maximum Iterations**
- **50-100**: Simple networks with few components
- **100-300**: Moderate complexity networks
- **300-1000**: Complex networks or difficult convergence cases

**Numerical Method**
- **Newton-Raphson**: Fast convergence, requires good initial guess
- **Successive Substitution**: Slower but more robust convergence

#### 3. Advanced Options

**Output Control**
- **Result Detail Level**: Summary, detailed, or comprehensive
- **Intermediate Results**: Save iteration history
- **Convergence History**: Track solution progress
- **Error Analysis**: Detailed error reporting

**Performance Options**
- **Parallel Processing**: Use multiple CPU cores (if available)
- **Memory Management**: Control memory usage for large problems
- **Disk Usage**: Temporary file management

### Starting the Calculation

#### Step-by-Step Process

1. **Final Configuration Check**
   ```
   Configuration Status: ✅ Valid
   Fluid Properties: ✅ Complete
   Pipe Sections: ✅ 15 sections defined
   Boundary Conditions: ✅ Set
   ```

2. **Review Calculation Settings**
   ```
   Calculation Model: Steady-State
   Convergence Tolerance: 1e-6 (Standard)
   Maximum Iterations: 200
   Numerical Method: Newton-Raphson
   ```

3. **Start Calculation**
   - Click "Start Calculation" button
   - Confirm calculation start (if prompted)
   - Monitor initial progress

4. **Monitor Progress**
   - Watch progress bar and status messages
   - Check for any warnings or errors
   - Allow adequate time for completion

#### Calculation Initiation

**Backend Communication**
- Configuration sent to calculation engine
- Preprocessing begins immediately
- WebSocket connection established for progress updates
- Initial validation performed

**Progress Indicators**
- **Status Message**: "Initializing calculation..."
- **Progress Bar**: Shows initialization progress
- **Time Estimate**: Initial time to completion estimate
- **Memory Usage**: Current memory consumption

### Multiple Calculation Scenarios

#### Scenario Manager

For comparing different operating conditions:

1. **Create Base Configuration**
   - Set up complete network model
   - Validate configuration
   - Save as template

2. **Create Variations**
   - Duplicate base configuration
   - Modify specific parameters
   - Create multiple scenarios

3. **Batch Processing**
   - Queue multiple scenarios
   - Process sequentially or in parallel
   - Compare results across scenarios

#### Parameter Studies

**Flow Rate Variation**
- Set up range of flow rates
- Automatic calculation for each point
- Generate performance curves

**Fluid Property Variation**
- Temperature effects on viscosity
- Different fluid types
- Concentration effects

**Operating Condition Variation**
- Different inlet pressures
- Variable demand patterns
- Equipment configuration changes

## Monitoring Progress

### Real-Time Progress Tracking

#### Progress Bar Components

**Overall Progress**
- **Percentage Complete**: 0-100% of total calculation
- **Current Phase**: Which calculation step is active
- **Time Elapsed**: Time since calculation started
- **Estimated Time Remaining**: Predicted completion time

**Phase Breakdown**
- **Preprocessing**: 5-15% of total time
- **Solution**: 70-90% of total time
- **Postprocessing**: 5-25% of total time

#### Detailed Progress Information

**Current Iteration**
```
Iteration: 45 of 200 maximum
Residual Error: 2.3e-7 (target: 1e-6)
Convergence: ✅ Achieved
Phase: Solving momentum equations
```

**Performance Metrics**
```
Calculation Rate: 150 iterations/second
Memory Usage: 2.1 GB of 8 GB available
CPU Usage: 75% of available capacity
Network Status: Connected
```

### Progress Messages

#### Informational Messages

**Normal Progress**
- "Building system matrices..."
- "Solving continuity equations..."
- "Updating pressure field..."
- "Checking convergence criteria..."

**Completion Messages**
- "Convergence achieved in 52 iterations"
- "Postprocessing results..."
- "Generating reports..."
- "Calculation completed successfully"

#### Warning Messages

**Performance Warnings**
- "Calculation taking longer than expected"
- "High memory usage detected"
- "Network connection unstable"
- "Consider relaxing convergence criteria"

**Convergence Warnings**
- "Slow convergence detected"
- "Oscillating solution pattern"
- "Near convergence but not achieved"
- "Consider different numerical method"

#### Error Messages

**Input Errors**
- "Invalid configuration detected"
- "Boundary conditions incompatible"
- "Fluid properties out of range"
- "Pipe section geometry invalid"

**System Errors**
- "Calculation engine not responding"
- "Network connection lost"
- "Insufficient memory available"
- "Calculation timeout exceeded"

### Monitoring Tools

#### WebSocket Connection Status

**Connection Indicators**
- **Connected**: Green indicator, real-time updates active
- **Disconnected**: Red indicator, no updates received
- **Reconnecting**: Yellow indicator, attempting reconnection

**Connection Management**
- Automatic reconnection attempts
- Connection quality monitoring
- Fallback to polling if WebSocket fails
- Manual connection reset option

#### Performance Monitoring

**Real-Time Metrics**
- CPU utilization percentage
- Memory consumption
- Network bandwidth usage
- Calculation iteration rate

**Historical Data**
- Previous calculation times
- Performance trends
- Resource usage patterns
- Optimization opportunities

### Progress Visualization

#### Calculation Timeline

Visual representation of calculation phases:
```
[████████████████████░░░░] 80% Complete
Preprocess | Solve | Postprocess
    15%    |  65%  |    20%
```

#### Convergence History

Graph showing error reduction over iterations:
```
Log(Error)
    |
1e-3 | *
    |  *
1e-4 |   * *
    |      * *
1e-5 |         * *
    |            * *
1e-6 |              ******
    +--------------------- Iteration
      0   20   40   60   80  100
```

#### Resource Usage

Real-time resource consumption display:
```
Memory: [████████░░] 80% (6.4/8 GB)
CPU:    [█████░░░░░] 50% (4/8 cores)
Disk:   [███░░░░░░░] 30% (30/100 GB)
```

## Understanding Results

### Results Overview

Calculation results are organized into logical categories for easy interpretation and analysis.

#### Summary Results

**Key Performance Indicators**
- **Total Flow Rate**: System-wide flow capacity
- **Total Pressure Drop**: Overall system resistance
- **Pump Power Required**: Energy consumption estimate
- **Maximum Velocity**: Highest flow velocity in system
- **Minimum Pressure**: Lowest pressure point

**System Efficiency Metrics**
- **Hydraulic Efficiency**: Ratio of useful to input energy
- **Pressure Recovery**: Pressure regain in recovery sections
- **Flow Distribution**: Flow split in branching networks
- **Energy Loss Distribution**: Where energy is lost

#### Detailed Results

**Per-Section Analysis**
Each pipe section includes:
- Pressure drop across section
- Flow velocity profile
- Reynolds number and flow regime
- Friction factor and head loss
- Fitting and valve losses

**Component Analysis**
Individual components show:
- Pressure loss across component
- Flow coefficient (Cv, K-factor)
- Performance characteristics
- Operating conditions

### Result Interpretation

#### Pressure Analysis

**Pressure Profile Understanding**
- **Static Pressure**: Fluid pressure at rest
- **Dynamic Pressure**: Pressure due to fluid motion
- **Total Pressure**: Sum of static and dynamic
- **Pressure Drop**: Difference between two points

**Pressure Trend Analysis**
- **Expected Behavior**: Pressure should decrease in flow direction
- **Abnormal Patterns**: Pressure increases without pumps
- **Critical Points**: Locations of minimum pressure
- **Safety Margins**: Pressure above vapor pressure

#### Velocity Analysis

**Velocity Distribution**
- **Laminar Flow**: Smooth, parabolic velocity profile
- **Turbulent Flow**: Fluctuating, flatter velocity profile
- **Transition Zone**: Between laminar and turbulent
- **Critical Velocities**: Maximum recommended velocities

**Velocity Considerations**
- **Erosion**: High velocities cause pipe wear
- **Noise**: High velocities increase noise levels
- **Air Entrainment**: Very high velocities can entrain air
- **Minimum Velocity**: Prevent sedimentation

#### Flow Regime Analysis

**Reynolds Number Interpretation**
- **Re < 2000**: Laminar flow regime
- **2000 < Re < 4000**: Transition zone
- **Re > 4000**: Turbulent flow regime

**Flow Regime Effects**
- **Friction Factor**: Different correlations for each regime
- **Pressure Drop**: Turbulent flow has higher losses
- **Heat Transfer**: Turbulent flow enhances heat transfer
- **Mixing**: Turbulent flow improves mixing

### Results Validation

#### Conservation Laws Check

**Mass Conservation**
- Total flow into system = Total flow out
- Flow at each junction balances
- No mass creation or destruction
- Check for calculation errors

**Energy Conservation**
- Energy input = Energy output + Losses
- Pump work = Pressure increase + Friction losses
- Check for unreasonable energy gains
- Verify thermodynamic consistency

#### Reasonableness Check

**Order of Magnitude**
- Compare with similar systems
- Check against engineering experience
- Verify against handbook values
- Look for calculation errors

**Trend Analysis**
- Pressure decreases in flow direction
- Velocity increases in smaller pipes
- Friction losses increase with flow rate
- Reynolds number trends with velocity

#### Boundary Condition Verification

**Applied Conditions**
- Inlet pressure matches specification
- Outlet conditions satisfied
- Flow rates balance at boundaries
- No unexpected boundary effects

**Internal Consistency**
- No pressure discontinuities
- Smooth transitions between sections
- Continuous velocity profiles
- Compatible component interactions

### Advanced Result Analysis

#### Sensitivity Analysis

**Parameter Variation**
- Change input parameters systematically
- Observe effect on results
- Identify critical parameters
- Quantify uncertainty

**Sensitivity Coefficients**
- Calculate derivatives of results with respect to inputs
- Identify most influential parameters
- Guide measurement and design priorities
- Quantify result uncertainty

#### Optimization Analysis

**Performance Indicators**
- Identify bottlenecks and inefficiencies
- Find optimal operating conditions
- Suggest system improvements
- Quantify optimization potential

**Cost-Benefit Analysis**
- Calculate energy costs
- Estimate improvement benefits
- Compare alternative designs
- Support economic decisions

## Calculation Methods

### Numerical Solution Techniques

#### 1. Newton-Raphson Method

**Mathematical Basis**
- Iterative solution of nonlinear equations
- Uses derivative information for fast convergence
- Quadratic convergence near solution

**Algorithm Steps**
1. **Initial Guess**: Start with approximate solution
2. **Residual Calculation**: Compute equation residuals
3. **Jacobian Matrix**: Calculate derivative matrix
4. **Correction**: Solve for solution improvement
5. **Update**: Apply correction to solution
6. **Convergence Check**: Verify solution accuracy

**Advantages**
- Fast convergence (quadratic)
- Well-established method
- Good for well-conditioned problems
- Efficient for moderate-sized systems

**Disadvantages**
- Requires good initial guess
- Sensitive to parameter values
- May diverge for difficult problems
- Jacobian calculation can be expensive

#### 2. Successive Substitution

**Mathematical Basis**
- Fixed-point iteration method
- Simpler convergence characteristics
- More robust for difficult problems

**Algorithm Steps**
1. **Initial Guess**: Start with approximate solution
2. **Direct Substitution**: Plug guess into equations
3. **New Estimate**: Calculate improved solution
4. **Update**: Replace old guess with new estimate
5. **Convergence Check**: Verify solution accuracy

**Advantages**
- More robust convergence
- Less sensitive to initial guess
- Simpler implementation
- Better for difficult problems

**Disadvantages**
- Slower convergence (linear)
- May require more iterations
- Less efficient for simple problems
- Convergence not guaranteed

### Solution Algorithms

#### 1. Simultaneous Solution

**Description**: Solve all equations together

**Method**: Matrix-based solution of coupled equations
**Storage**: Requires full matrix storage
**Solution**: Direct or iterative matrix solvers
**Use**: Small to medium-sized systems

**Advantages**
- Fastest convergence
- Most accurate solution
- Handles strong coupling well
- Mature solution methods

**Disadvantages**
- High memory requirements
- Complex implementation
- Difficult for very large systems
- Matrix conditioning issues

#### 2. Sequential Solution

**Description**: Solve equations one after another

**Method**:逐个 solve equations in sequence
**Storage**: Lower memory requirements
**Solution**: Iterative improvement of individual equations
**Use**: Large systems, specialized applications

**Advantages**
- Lower memory requirements
- Simpler implementation
- Better for large systems
- Easier parallelization

**Disadvantages**
- Slower convergence
- May miss strong couplings
- More iterations required
- Convergence issues possible

### Convergence Acceleration

#### 1. Under-Relaxation

**Purpose**: Improve convergence stability
**Method**: Apply partial corrections
**Factor**: 0.1 to 1.0 (typically 0.7-0.9)
**Effect**: Slower but more stable convergence

**Implementation**
```
new_value = old_value + factor * (calculated_correction)
```

#### 2. Over-Relaxation

**Purpose**: Accelerate convergence
**Method**: Apply amplified corrections
**Factor**: 1.0 to 1.9 (typically 1.2-1.5)
**Effect**: Faster convergence for well-behaved problems

**Risk**: May cause divergence if factor too high

#### 3. Adaptive Methods

**Purpose**: Automatically adjust convergence parameters
**Method**: Monitor convergence behavior
**Adjustment**: Change factors based on progress
**Benefit**: Optimal convergence for different problem types

## Performance Optimization

### Calculation Speed Optimization

#### 1. Model Simplification

**Component Reduction**
- Remove unnecessary fittings
- Combine short pipe sections
- Simplify complex geometries
- Use equivalent components

**Network Simplification**
- Eliminate small branches
- Combine parallel paths
- Remove insignificant details
- Use symmetry when possible

#### 2. Convergence Optimization

**Initial Guess Quality**
- Use results from similar calculations
- Apply physical reasoning for estimates
- Use analytical approximations
- Leverage previous solutions

**Convergence Parameters**
- Adjust tolerance for problem complexity
- Set appropriate iteration limits
- Choose suitable numerical methods
- Use acceleration techniques

#### 3. Hardware Optimization

**CPU Utilization**
- Use multi-core processing when available
- Optimize for specific CPU architecture
- Minimize context switching
- Use efficient numerical libraries

**Memory Management**
- Control memory allocation
- Use appropriate data structures
- Minimize memory fragmentation
- Implement memory pooling

### Accuracy Optimization

#### 1. Numerical Accuracy

**Discretization Error**
- Use appropriate mesh density
- Balance accuracy with computational cost
- Use higher-order methods when beneficial
- Implement adaptive meshing

**Round-off Error**
- Use double precision arithmetic
- Minimize numerical operations
- Use stable numerical algorithms
- Implement error checking

#### 2. Physical Modeling Accuracy

**Fluid Property Accuracy**
- Use accurate property correlations
- Consider temperature and pressure effects
- Include property variations
- Validate against experimental data

**Component Modeling**
- Use manufacturer data when available
- Include component interactions
- Model non-ideal behavior
- Validate component models

## Troubleshooting Calculations

### Common Calculation Problems

#### 1. Convergence Issues

**Symptoms**
- Calculation runs for maximum iterations
- Solution oscillates without converging
- Residual error remains high
- Calculation terminates with error

**Causes**
- Poor initial guess
- Inappropriate convergence criteria
- Numerical instabilities
- Physical impossibilities

**Solutions**
- Improve initial guess
- Relax convergence tolerance
- Use different numerical method
- Simplify model

#### 2. Long Calculation Times

**Symptoms**
- Calculation takes much longer than expected
- Progress seems very slow
- System appears unresponsive
- High resource usage

**Causes**
- Complex model with many components
- Tight convergence criteria
- Poor numerical conditioning
- Inefficient solution method

**Solutions**
- Simplify model where possible
- Use loose convergence for initial runs
- Check for numerical issues
- Use more efficient methods

#### 3. Unreasonable Results

**Symptoms**
- Results don't match expectations
- Physical impossibilities
- Large errors in conservation laws
- Unexpected trends

**Causes**
- Input data errors
- Model setup mistakes
- Boundary condition issues
- Numerical errors

**Solutions**
- Verify input data
- Check model setup
- Review boundary conditions
- Validate against known solutions

### Error Diagnosis

#### 1. Error Message Analysis

**Reading Error Messages**
- Understand specific error description
- Identify location of problem
- Note any suggested solutions
- Check for related issues

**Common Error Types**
- **Input Errors**: Invalid data or parameters
- **Convergence Errors**: Solution method failures
- **System Errors**: Hardware or software issues
- **Logic Errors**: Model setup problems

#### 2. Diagnostic Tools

**Convergence History**
- Plot residual error vs. iteration
- Identify convergence patterns
- Check for oscillations or divergence
- Analyze convergence rate

**Solution Monitoring**
- Track key variables during solution
- Identify problematic variables
- Monitor constraint satisfaction
- Check for numerical instabilities

#### 3. Validation Checks

**Conservation Laws**
- Check mass balance
- Verify energy conservation
- Validate momentum equations
- Check thermodynamic consistency

**Boundary Conditions**
- Verify applied conditions
- Check constraint satisfaction
- Validate boundary interactions
- Ensure proper condition setup

### Problem-Solving Strategies

#### 1. Systematic Approach

**Step 1: Problem Identification**
- Clearly define the problem
- Identify symptoms and causes
- Determine problem scope
- Set resolution objectives

**Step 2: Information Gathering**
- Collect relevant data
- Review calculation setup
- Check input parameters
- Analyze error messages

**Step 3: Hypothesis Generation**
- Develop possible causes
- Prioritize likely causes
- Consider multiple factors
- Use systematic elimination

**Step 4: Testing and Verification**
- Test hypotheses systematically
- Implement changes carefully
- Monitor effects of changes
- Verify problem resolution

#### 2. Escalation Process

**Level 1: User Resolution**
- Basic troubleshooting steps
- Parameter adjustments
- Model simplification
- Method changes

**Level 2: Expert Assistance**
- Detailed analysis
- Advanced techniques
- Specialized knowledge
- Alternative approaches

**Level 3: Developer Support**
- Software issues
- Algorithm problems
- System limitations
- Custom solutions

## Advanced Calculation Features

### Transient Analysis

#### Time-Dependent Calculations

**Applications**
- Startup and shutdown sequences
- Valve operation transients
- Pump trip scenarios
- Water hammer analysis

**Setup Requirements**
- Initial conditions specification
- Time step definition
- Boundary condition time histories
- Transient property variations

#### Method of Characteristics

**Description**: Specialized method for transient flow
**Applications**: Water hammer, surge analysis
**Advantages**: Accurate for wave propagation
**Complexity**: More complex setup and interpretation

### Optimization Calculations

#### Parameter Optimization

**Objective Functions**
- Minimize pressure drop
- Minimize energy consumption
- Maximize flow capacity
- Optimize component sizing

**Optimization Methods**
- Gradient-based methods
- Genetic algorithms
- Simulated annealing
- Particle swarm optimization

#### Design Optimization

**Design Variables**
- Pipe diameters
- Component selection
- Operating conditions
- System configuration

**Constraints**
- Pressure limits
- Velocity limits
- Flow requirements
- Cost limitations

### Uncertainty Analysis

#### Monte Carlo Methods

**Description**: Statistical analysis of input uncertainties
**Process**: Random sampling of input parameters
**Output**: Probability distributions of results
**Use**: Risk assessment and reliability analysis

#### Sensitivity Analysis

**Local Sensitivity**
- Derivatives at base conditions
- Linear approximation of effects
- Quick calculation for screening
- Limited to small variations

**Global Sensitivity**
- Effects over wide parameter ranges
- Nonlinear effects included
- More computationally intensive
- Comprehensive uncertainty assessment

---

For additional help with calculation issues or specific questions about running hydraulic analyses, please refer to our [Troubleshooting Guide](../TROUBLESHOOTING.md) or contact our support team.