import Dexie, { Table } from 'dexie';
import { Course } from './types';

export class CourseDB extends Dexie {
  courses!: Table<Course, string>; 

  constructor() {
    super('CourseDB');
    this.version(1).stores({
      courses: '&courseId, courseTitle'
    });
  }
}

export const db = new CourseDB();
