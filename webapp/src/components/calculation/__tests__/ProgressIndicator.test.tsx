/**
 * Unit tests for ProgressIndicator component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProgressIndicator from '../ProgressIndicator';

describe('ProgressIndicator', () => {
  it('renders progress indicator with default values', () => {
    render(<ProgressIndicator progress={0} status="idle" />);
    
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('shows running progress', () => {
    render(<ProgressIndicator progress={45.5} status="running" />);
    
    expect(screen.getByText('Running...')).toBeInTheDocument();
    expect(screen.getByText('45.5%')).toBeInTheDocument();
  });

  it('shows completed state', () => {
    render(<ProgressIndicator progress={100} status="completed" />);
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<ProgressIndicator progress={0} status="error" error="Test error" />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('formats progress correctly', () => {
    render(<ProgressIndicator progress={75.25} status="running" />);
    
    expect(screen.getByText('75.3%')).toBeInTheDocument();
  });

  it('shows indeterminate progress when progress is undefined', () => {
    render(<ProgressIndicator progress={undefined} status="running" />);
    
    expect(screen.getByText('Running...')).toBeInTheDocument();
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });
});