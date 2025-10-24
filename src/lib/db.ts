import Dexie, { Table } from 'dexie';
import { Course, CourseProgress } from './types';

export class AppDatabase extends Dexie {
  courses!: Table<Course>;
  progress!: Table<CourseProgress>;

  constructor() {
    super('EaizyLearnDB');
    this.version(1).stores({
      courses: '&courseId, ownerId, createdAt',
      progress: '&courseId, userId, totalXP',
    });
  }
}

export const db = new AppDatabase();