import Dexie, { Table } from 'dexie';
import { Course } from './types';

/**
 * A Dexie-based IndexedDB wrapper for storing course data.
 * This class defines the database schema.
 */
export class CourseDB extends Dexie {
  /**
   * The table for storing Course objects. The key is the courseId string.
   * @type {Table<Course, string>}
   */
  courses!: Table<Course, string>; 

  constructor() {
    super('CourseDB');
    this.version(1).stores({
      courses: '&courseId, courseTitle'
    });
  }
}

/**
 * The singleton instance of the CourseDB.
 * @type {CourseDB}
 */
export const db = new CourseDB();
