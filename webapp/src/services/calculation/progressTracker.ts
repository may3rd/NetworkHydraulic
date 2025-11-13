import type { CalculationRequest } from '../../types/models';

export interface ProgressUpdate {
  progress: number;
  message: string;
  stage: string;
  timestamp: Date;
  estimatedTime: number | undefined;
  elapsedTime: number | undefined;
}

export interface CalculationProgress {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  message: string;
  stage: string;
  startTime?: Date;
  endTime?: Date;
  estimatedDuration?: number;
  updates: ProgressUpdate[];
  result?: any;
  error: string | undefined;
}

export interface ProgressTrackerConfig {
  updateInterval?: number; // milliseconds
  maxUpdates?: number;
  enableLogging?: boolean;
}

export class ProgressTracker {
  private progress: Map<string, CalculationProgress> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private config: ProgressTrackerConfig;

  constructor(config: ProgressTrackerConfig = {}) {
    this.config = {
      updateInterval: 1000, // 1 second
      maxUpdates: 100,
      enableLogging: false,
      ...config,
    };
  }

  /**
   * Start tracking progress for a calculation
   */
  startTracking(taskId: string, request?: CalculationRequest): CalculationProgress {
    const existing = this.progress.get(taskId);
    if (existing) {
      return existing;
    }

    const progress: CalculationProgress = {
      taskId,
      status: 'pending',
      progress: 0,
      message: 'Task created',
      stage: 'initialization',
      startTime: new Date(),
      estimatedDuration: this.estimateCalculationTime(request),
      updates: [],
      error: undefined,
    };

    this.progress.set(taskId, progress);
    
    if (this.config.enableLogging) {
      console.log(`[ProgressTracker] Started tracking task ${taskId}`);
    }

    return progress;
  }

  /**
   * Update progress for a calculation
   */
  updateProgress(
    taskId: string,
    progressPercent: number,
    message: string,
    stage: string
  ): CalculationProgress | null {
    const progress = this.progress.get(taskId);
    if (!progress) {
      if (this.config.enableLogging) {
        console.warn(`[ProgressTracker] Task ${taskId} not found for progress update`);
      }
      return null;
    }

    const now = new Date();
    const elapsed = progress.startTime ? Math.floor((now.getTime() - progress.startTime.getTime()) / 1000) : 0;

    const update: ProgressUpdate = {
      progress: progressPercent,
      message,
      stage,
      timestamp: now,
      elapsedTime: elapsed,
      estimatedTime: progress.estimatedDuration,
    };

    // Update progress
    progress.progress = Math.min(100, Math.max(0, progressPercent));
    progress.message = message;
    progress.stage = stage;
    progress.updates.push(update);

    // Keep only recent updates
    if (progress.updates.length > this.config.maxUpdates!) {
      progress.updates = progress.updates.slice(-this.config.maxUpdates!);
    }

    if (this.config.enableLogging) {
      console.log(`[ProgressTracker] Task ${taskId}: ${progressPercent.toFixed(1)}% - ${message}`);
    }

    return progress;
  }

  /**
   * Complete tracking for a calculation
   */
  completeTracking(taskId: string, success: boolean, result?: any, error?: string): CalculationProgress | null {
    const progress = this.progress.get(taskId);
    if (!progress) {
      return null;
    }

    progress.status = success ? 'completed' : 'error';
    progress.endTime = new Date();
    progress.result = result;
    progress.error = error ?? undefined;

    // Final update
    this.updateProgress(
      taskId,
      success ? 100 : 0,
      success ? 'Calculation completed successfully' : `Calculation failed: ${error || 'Unknown error'}`,
      success ? 'completed' : 'error'
    );

    // Clear timer
    const timer = this.timers.get(taskId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(taskId);
    }

    if (this.config.enableLogging) {
      const duration = progress.startTime && progress.endTime 
        ? Math.floor((progress.endTime.getTime() - progress.startTime.getTime()) / 1000)
        : 0;
      console.log(`[ProgressTracker] Task ${taskId} completed in ${duration}s with status: ${success ? 'success' : 'error'}`);
    }

    return progress;
  }

  /**
   * Get progress for a calculation
   */
  getProgress(taskId: string): CalculationProgress | null {
    return this.progress.get(taskId) || null;
  }

  /**
   * Get all tracked calculations
   */
  getAllProgress(): CalculationProgress[] {
    return Array.from(this.progress.values());
  }

  /**
   * Remove progress tracking for a calculation
   */
  removeProgress(taskId: string): boolean {
    const timer = this.timers.get(taskId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(taskId);
    }

    const removed = this.progress.delete(taskId);
    
    if (this.config.enableLogging && removed) {
      console.log(`[ProgressTracker] Removed tracking for task ${taskId}`);
    }

    return removed;
  }

  /**
   * Clear all progress tracking
   */
  clearAllProgress(): void {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
    
    // Clear all progress
    this.progress.clear();
    
    if (this.config.enableLogging) {
      console.log('[ProgressTracker] Cleared all progress tracking');
    }
  }

  /**
   * Start periodic updates for a calculation
   */
  startPeriodicUpdates(taskId: string, intervalMs?: number): void {
    const progress = this.progress.get(taskId);
    if (!progress) {
      return;
    }

    // Clear existing timer
    const existingTimer = this.timers.get(taskId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    const updateInterval = intervalMs || this.config.updateInterval!;
    
    const timer = setInterval(() => {
      const currentProgress = this.progress.get(taskId);
      if (!currentProgress || currentProgress.status === 'completed' || currentProgress.status === 'error') {
        // Stop timer if calculation is complete
        clearInterval(timer);
        this.timers.delete(taskId);
        return;
      }

      // Send periodic update (you can customize this logic)
      const now = new Date();
      const elapsed = currentProgress.startTime ? Math.floor((now.getTime() - currentProgress.startTime.getTime()) / 1000) : 0;
      
      if (currentProgress.estimatedDuration) {
        const estimatedProgress = Math.min(100, (elapsed / currentProgress.estimatedDuration) * 100);
        this.updateProgress(
          taskId,
          estimatedProgress,
          `Calculation running (${elapsed}s elapsed)`,
          currentProgress.stage
        );
      }
    }, updateInterval);

    this.timers.set(taskId, timer);
  }

  /**
   * Estimate calculation time based on request complexity
   */
  private estimateCalculationTime(request?: CalculationRequest): number {
    if (!request) {
      return 30; // Default 30 seconds
    }

    const sectionsCount = request.configuration.sections?.length || 0;
    const complexityMultiplier = sectionsCount > 50 ? 2 : sectionsCount > 10 ? 1.5 : 1;
    
    // Base time estimates (in seconds)
    const baseTime = 5;
    const perSectionTime = 0.5;
    const totalEstimatedTime = baseTime + (sectionsCount * perSectionTime);
    
    return totalEstimatedTime * complexityMultiplier;
  }

  /**
   * Get progress statistics
   */
  getStatistics(): {
    totalTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageCompletionTime: number;
  } {
    const allProgress = this.getAllProgress();
    const completed = allProgress.filter(p => p.status === 'completed');
    const failed = allProgress.filter(p => p.status === 'error');
    const running = allProgress.filter(p => p.status === 'running');
    
    const completionTimes = completed
      .filter(p => p.startTime && p.endTime)
      .map(p => Math.floor((p.endTime!.getTime() - p.startTime!.getTime()) / 1000));
    
    const averageCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0;

    return {
      totalTasks: allProgress.length,
      runningTasks: running.length,
      completedTasks: completed.length,
      failedTasks: failed.length,
      averageCompletionTime,
    };
  }
}

// Export singleton instance
export const progressTracker = new ProgressTracker({
  enableLogging: process.env.NODE_ENV === 'development',
});