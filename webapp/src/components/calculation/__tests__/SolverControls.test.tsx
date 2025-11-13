/**
 * Unit tests for SolverControls component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { SolverControls } from '../SolverControls';
import { useCalculationStore } from '../../../stores/calculation';

// Mock Zustand store
jest.mock('../../../stores/calculation');
const mockUseCalculationStore = useCalculationStore as jest.MockedFunction<typeof useCalculationStore>;

describe('SolverControls', () => {
  const mockOnValidate = jest.fn();
  const mockOnCalculate = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnPause = jest.fn();
  const mockOnResume = jest.fn();
  const mockOnRetry = jest.fn();

  const defaultProps = {
    onValidate: mockOnValidate,
    onCalculate: mockOnCalculate,
    onCancel: mockOnCancel,
    onPause: mockOnPause,
    onResume: mockOnResume,
    onRetry: mockOnRetry,
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCalculationStore.mockReturnValue({
      status: 'idle',
      progress: 0,
      error: null,
    });
  });

  it('renders solver controls correctly in idle state', () => {
    render(<SolverControls {...defaultProps} />);
    
    expect(screen.getByText('Calculation Controls')).toBeInTheDocument();
    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    expect(screen.queryByText('Pause')).not.toBeInTheDocument();
  });

  it('shows running state with progress', () => {
    mockUseCalculationStore.mockReturnValue({
      status: 'running',
      progress: 45.5,
      error: null,
    });
    
    render(<SolverControls {...defaultProps} />);
    
    expect(screen.getByText('Running... 45.5%')).toBeInTheDocument();
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('shows completed state', () => {
    mockUseCalculationStore.mockReturnValue({
      status: 'completed',
      progress: 100,
      error: null,
    });
    
    render(<SolverControls {...defaultProps} />);
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseCalculationStore.mockReturnValue({
      status: 'error',
      progress: 0,
      error: 'Calculation failed',
    });
    
    render(<SolverControls {...defaultProps} />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('calls onValidate and onCalculate when start is clicked', async () => {
    mockUseCalculationStore.mockReturnValue({
      status: 'idle',
      progress: 0,
      error: null,
    });
    
    mockOnValidate.mockResolvedValue(true);
    
    render(<SolverControls {...defaultProps} />);
    
    const startButton = screen.getByText('Start');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockOnValidate).toHaveBeenCalledTimes(1);
    });
    
    expect(mockOnCalculate).toHaveBeenCalledTimes(1);
  });

  it('does not call onCalculate when validation fails', async () => {
    mockUseCalculationStore.mockReturnValue({
      status: 'idle',
      progress: 0,
      error: null,
    });
    
    mockOnValidate.mockResolvedValue(false);
    
    render(<SolverControls {...defaultProps} />);
    
    const startButton = screen.getByText('Start');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockOnValidate).toHaveBeenCalledTimes(1);
    });
    
    expect(mockOnCalculate).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel is clicked', async () => {
    mockUseCalculationStore.mockReturnValue({
      status: 'running',
      progress: 50,
      error: null,
    });
    
    render(<SolverControls {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onPause when pause is clicked', () => {
    mockUseCalculationStore.mockReturnValue({
      status: 'running',
      progress: 50,
      error: null,
    });
    
    render(<SolverControls {...defaultProps} />);
    
    const pauseButton = screen.getByText('Pause');
    fireEvent.click(pauseButton);
    
    expect(mockOnPause).toHaveBeenCalledTimes(1);
  });

  it('calls onRetry when retry is clicked', async () => {
    mockUseCalculationStore.mockReturnValue({
      status: 'error',
      progress: 0,
      error: 'Test error',
    });
    
    render(<SolverControls {...defaultProps} />);
    
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    
    await waitFor(() => {
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });
  });

  it('disables start button when disabled prop is true', () => {
    mockUseCalculationStore.mockReturnValue({
      status: 'idle',
      progress: 0,
      error: null,
    });
    
    render(<SolverControls {...defaultProps} disabled={true} />);
    
    const startButton = screen.getByText('Start');
    expect(startButton).toBeDisabled();
  });

  it('shows button tooltips', () => {
    mockUseCalculationStore.mockReturnValue({
      status: 'idle',
      progress: 0,
      error: null,
    });
    
    render(<SolverControls {...defaultProps} />);
    
    const startButton = screen.getByText('Start');
    expect(startButton.closest('[title]')).toHaveAttribute('title', 'Start calculation');
  });

  it('shows correct button group aria-label', () => {
    mockUseCalculationStore.mockReturnValue({
      status: 'idle',
      progress: 0,
      error: null,
    });
    
    render(<SolverControls {...defaultProps} />);
    
    expect(screen.getByLabelText('calculation controls')).toBeInTheDocument();
  });

  it('handles completed state with retry and new buttons', async () => {
    mockUseCalculationStore.mockReturnValue({
      status: 'completed',
      progress: 100,
      error: null,
    });
    
    render(<SolverControls {...defaultProps} />);
    
    const newButton = screen.getByText('New');
    const retryButton = screen.getByText('Retry');
    
    expect(newButton).toBeInTheDocument();
    expect(retryButton).toBeInTheDocument();
    
    // Test new button
    fireEvent.click(newButton);
    await waitFor(() => {
      expect(mockOnValidate).toHaveBeenCalledTimes(1);
    });
    
    // Reset mocks for retry test
    jest.clearAllMocks();
    mockOnValidate.mockResolvedValue(true);
    
    // Test retry button
    fireEvent.click(retryButton);
    await waitFor(() => {
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });
  });
});