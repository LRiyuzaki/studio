/**
 * @fileOverview Manages the in-memory cache for the application.
 * This service provides a two-layer cache: a fast in-memory Map for instant access,
 * and a fallback to the persistent Dexie (IndexedDB) storage. It is the single
 * source of truth for data access within the application.
 */
import { db } from './db';
import type { Course, CourseProgress } from './types';
import { getCourses as fetchCourses, getProgress as fetchProgress } from './storage';
import { Firestore } from 'firebase/firestore';

// In-memory caches for instant data access.
export const courseCache = new Map<string, Course>();
export const progressCache = new Map<string, CourseProgress>();

/**
 * Retrieves a single course, using the cache-first strategy.
 * @param {string} courseId - The ID of the course to retrieve.
 * @returns {Promise<Course | undefined>} The course object or undefined if not found.
 */
export async function getCourse(courseId: string): Promise<Course | undefined> {
  if (courseCache.has(courseId)) {
    return courseCache.get(courseId);
  }
  const courseFromDb = await db.courses.get(courseId);
  if (courseFromDb) {
    courseCache.set(courseId, courseFromDb);
  }
  return courseFromDb;
}

/**
 * Retrieves all courses for a user, using the cache-first strategy.
 * @param {string} userId - The ID of the user whose courses to retrieve.
 * @returns {Promise<Course[]>} An array of course objects.
 */
export async function getCourses(userId: string): Promise<Course[]> {
  // First, check if the cache contains courses for this user.
  const cachedCourses = Array.from(courseCache.values()).filter(c => c.ownerId === userId);
  if (cachedCourses.length > 0) {
    return cachedCourses;
  }
  
  // If not, fall back to Dexie.
  const coursesFromDb = await db.courses.where('ownerId').equals(userId).toArray();
  if (coursesFromDb.length > 0) {
    coursesFromDb.forEach(course => courseCache.set(course.courseId, course));
  }
  return coursesFromDb;
}

/**
 * Retrieves a user's progress for a course, using a cache-first strategy.
 * @param {string} courseId - The ID of the course.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<CourseProgress | undefined>} The progress object or undefined if not found.
 */
export async function getProgress(courseId: string, userId: string): Promise<CourseProgress | undefined> {
  if (progressCache.has(courseId)) {
    return progressCache.get(courseId);
  }
  const progressFromDb = await db.progress.get(courseId);
  if (progressFromDb && progressFromDb.userId === userId) {
    progressCache.set(courseId, progressFromDb);
  }
  return progressFromDb;
}


/**
 * Preloads all essential data for a user into the in-memory cache.
 * This function is intended to be called once on application startup after login.
 * @param {Firestore} firestore - The Firestore service instance.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<void>} A promise that resolves when preloading is complete.
 */
export async function preloadAllData(firestore: Firestore, userId: string): Promise<void> {
  console.log('Preloading all user data into memory...');
  
  // Fetch courses and progress from the primary source (Firestore via storage functions)
  // This also updates Dexie via the `storage` functions.
  const [courses, allProgress] = await Promise.all([
    fetchCourses(firestore, userId),
    Promise.all(
      (await fetchCourses(firestore, userId)).map(course => 
        fetchProgress(firestore, userId, course.courseId)
      )
    )
  ]);

  // Populate the in-memory cache
  courses.forEach(course => courseCache.set(course.courseId, course));
  allProgress.forEach(progress => {
    if (progress) {
      progressCache.set(progress.courseId, progress);
    }
  });

  console.log(`Preloading complete. Cached ${courseCache.size} courses and ${progressCache.size} progress items.`);
}
