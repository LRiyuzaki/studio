import Dexie, { type EntityTable } from 'dexie';
import type { Quiz } from './types';

/**
 * Represents a pending generation request in the sync queue.
 */
export interface GenerationRequest {
  id?: number; // Primary key, auto-incremented
  quiz: Quiz;
  status: 'QUEUED' | 'SYNCING' | 'FAILED';
  timestamp: number;
}

/**
 * Defines the schema for our IndexedDB database using Dexie.
 */
class QuizCraftDatabase extends Dexie {
  // Define tables (object stores).
  // The 'quizzes' table will cache quiz data.
  // The 'syncQueue' table will hold pending requests when offline.
  quizzes!: EntityTable<Quiz, 'id'>;
  syncQueue!: EntityTable<GenerationRequest, 'id'>;

  constructor() {
    super('QuizCraftDatabase');
    this.version(1).stores({
      // The 'id' property is the primary key.
      quizzes: '&id', 
      // '++id' makes it an auto-incrementing primary key.
      syncQueue: '++id', 
    });
  }
}

export const db = new QuizCraftDatabase();
