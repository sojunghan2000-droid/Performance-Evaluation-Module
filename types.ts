export enum Category {
  PLANNING = '적정 계획 수립',
  OPERATION = '적정 업무 운영',
  QUALITY = '품질 관리', // Added for variety
}

export type TaskType = 'PLANNING' | 'DEVELOPMENT';

export interface Assignee {
  id: string;
  name: string;
  department: string;
}

export interface Task {
  id: string;
  assigneeId: string;
  name: string;
  type: TaskType;
}

export interface MetricConfig {
  id: string;
  category: Category;
  name: string;
  description: string;
  weight: number; // Percentage (0-100)
  criteria: string;
  calculateScore: (input: number) => number;
  formatInput: (value: number) => string;
  inputUnit: string;
  placeholder: string;
}

export interface MetricData {
  configId: string;
  inputValue: number;
}

// Store data per task
export interface TaskEvaluationData {
  metrics: Record<string, MetricData>;
  qualitativeScore: number;
  qualitativeOpinion: string;
}

export interface CalculatedMetric {
  config: MetricConfig;
  rawScore: number;
  weightedScore: number;
  inputValue: number;
}

export interface EvaluationResult {
  quantTotalWeighted: number; // Sum of weighted scores (out of 100)
  quantConverted: number; // Converted to 70 points
  qualConverted: number; // Converted to 30 points
  finalScore: number; // Total out of 100
  grade: string; // S, A, B, C
  breakdown: CalculatedMetric[]; // Only for single task view
  qualitativeOpinion?: string;
  // For comprehensive view
  isComprehensive?: boolean;
  taskSummaries?: {
    taskName: string;
    finalScore: number;
    quantConverted: number;
    qualConverted: number;
  }[];
}