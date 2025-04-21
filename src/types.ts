// Define common types used throughout the application

export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  answers?: string[]; // For backward compatibility with embed component
  explanation?: string;
}

export interface CompletionStats {
  totalQuestions: number;
  correctAnswers: number;
  skippedQuestions: number;
  timeSpent: number; // in seconds
}

export interface QuizData {
  id: string;
  name: string;
  text: string;
  questions: Question[] | string; // Can be string (JSON) or parsed array
  totalQuestions: number;
  correctAnswers: number;
  skippedQuestions: number;
  timeSpent: number;
  createdAt: Date;
  timesCompleted: number;
  totalScore: number;
  allowedEmbedDomains: string[];
  userId?: string;
}
