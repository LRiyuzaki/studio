/**
 * Represents an entire course, including its metadata and hierarchical content structure.
 */
export interface Course {
  /** A unique identifier for the course. */
  courseId: string;
  /** The main title of the course. */
  courseTitle: string;
  /** A brief description of the course content. */
  courseDescription: string;
  /** An array of Unit objects that make up the course. */
  units: Unit[];
  /** The ISO 8601 timestamp of when the course was created. */
  createdAt: string;
  /** The UID of the user who owns this course. */
  ownerId: string;
}

/**
 * Represents a single unit within a course. A unit contains multiple topics.
 */
export interface Unit {
  /** A unique identifier for the unit. */
  unitId: string;
  /** The title of the unit. */
  unitTitle: string;
  /** A brief description of the unit's content. */
  unitDescription: string;
  /** An array of Topic objects within this unit. */
  topics: Topic[];
}

/**
 * Represents a single topic within a unit. A topic contains multiple MCQs.
 */
export interface Topic {
  /** A unique identifier for the topic. */
  topicId: string;
  /** The title of the topic. */
  topicTitle: string;
  /** A brief description of the topic. */
  topicDescription: string;
  /** An array of Multiple-Choice Questions for this topic. */
  mcqs: MCQ[];
}

/**
 * Represents a single Multiple-Choice Question.
 */
export interface MCQ {
  /** A unique identifier for the question. */
  questionId: string;
  /** The text of the question. */
  question: string;
  /** An array of possible answers (as strings). */
  options: string[];
  /** The letter of the correct option (e.g., 'A', 'B', 'C'). */
  correct: string;
  /** An explanation for the correct answer. */
  explanation?: string;
  /** The difficulty level of the question. */
  difficulty?: 'easy' | 'medium' | 'hard';
  /** The points awarded for answering the question correctly. */
  points?: number;
}

/**
 * Tracks a user's progress throughout an entire course. Stored in Firestore.
 */
export interface CourseProgress {
  /** The ID of the course this progress belongs to. */
  courseId: string;
  /** The ID of the user this progress belongs to. */
  userId: string;
  /** An array of topic IDs that the user has mastered (answered 100% correct). */
  completedTopics: string[];
  /** An object mapping unit IDs to their completion statistics. */
  unitProgress: Record<string, UnitProgress>;
  /** The total experience points earned by the user in this course. */
  totalXP: number;
  /** A history of all quiz attempts for this course. */
  quizHistory: QuizResult[];
  /** The user's current level, calculated from totalXP. */
  level: number;
  /** The user's current study streak. */
  currentStreak: number;
  /** The ISO 8601 timestamp of the user's last study session. */
  lastStudyDate: string;
}

/**
 * Tracks a user's progress within a single unit.
 */
export interface UnitProgress {
  /** The percentage of topics completed within this unit. */
  completionPercentage: number;
}

/**
 * Stores the result of a single quiz attempt.
 */
export interface QuizResult {
  /** The ID of the topic this quiz was for ('all' for comprehensive quiz). */
  topicId: string;
  /** The title of the topic. */
  topicTitle: string;
  /** The number of questions answered correctly. */
  score: number;
  /** The total number of questions in the quiz. */
  total: number;
  /** The calculated percentage score. */
  percentage: number;
  /** An array of the user's answers for each question. */
  answers: (string | null)[];
  /** The ISO 8601 timestamp of when the quiz was completed. */
  completedAt: string;
  /** The mode the quiz was taken in. */
  mode: QuizMode;
  /** The total time spent on the quiz in seconds. */
  timeSpent: number;
  /** The ID of the unit this topic belongs to ('all-units' for comprehensive). */
  unitId: string;
  /** For comprehensive quizzes, a breakdown of scores per unit. */
  unitScores?: Record<string, { score: number; total: number }>;
}

/**
 * Defines the available modes for taking a quiz.
 * - `practice`: Instant feedback on answers.
 * - `exam`: Results shown only at the end.
 */
export type QuizMode = 'practice' | 'exam';

/**
 * Represents the state of an active quiz session.
 */
export interface QuizState {
  /** The index of the current question. */
  currentIndex: number;
  /** The current score. */
  score: number;
  /** An array of answers given by the user. */
  answers: (string | null)[];
  /** The timestamp when the quiz started. */
  startTime: number;
  /** Whether the quiz has been finished. */
  finished: boolean;
  /** The mode the quiz is being taken in. */
  mode: QuizMode;
  /** The time limit per question in exam mode. */
  timePerQuestion?: number;
}

/**
 * Encapsulates all parameters for the `updateProgressAfterQuiz` function.
 */
export interface UpdateProgressParams {
  userId: string;
  courseId: string;
  topicId: string;
  score: number;
  total: number;
  answers: (string | null)[];
  mode: QuizMode;
  timeSpent: number;
}