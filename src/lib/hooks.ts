
'use client';

import useSWR from 'swr';
import { useFirebase, useUser } from '@/firebase';
import { 
  getCourses as getCoursesFromStore, 
  getCourse as getCourseFromStore, 
  getProgress as getProgressFromStore, 
  getOverallStats 
} from './storage';
import { courseCache, progressCache } from './cache';
import { Course, CourseProgress } from './types';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

/**
 * A generic SWR fetcher function.
 * @template T
 * @param {() => Promise<T>} fetchFn The asynchronous function that fetches data.
 * @returns {Promise<T>} The data returned by the fetch function.
 */
const fetcher = async <T>(fetchFn: () => Promise<T>): Promise<T> => {
    return await fetchFn();
};

/**
 * Fetches all courses for the currently logged-in user using a cache-first strategy.
 * It leverages Dexie's live queries for real-time UI updates from the local DB.
 * SWR is used for revalidation against Firestore in the background.
 * @returns {{ courses: Course[] | undefined; isLoading: boolean; error: any; mutate: any; }} The courses, loading state, error, and mutate function.
 */
export function useCourses() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();

    // Use Dexie's useLiveQuery for an observable, real-time stream from IndexedDB.
    const liveCourses = useLiveQuery(() => 
        user ? db.courses.where('ownerId').equals(user.uid).toArray() : [],
        [user?.uid]
    );

    // Use SWR to revalidate data from Firestore in the background.
    const { error, mutate, isLoading: isSWRFetching } = useSWR(
        !isUserLoading && user && firestore ? ['courses', user.uid] : null,
        () => getCoursesFromStore(firestore!, user!.uid)
    );

    // Prefer the live query data as it's faster and reactive.
    const courses = liveCourses;
    const isLoading = isUserLoading || (courses === undefined && isSWRFetching && !error);

    return {
        courses,
        isLoading,
        error,
        mutate,
    };
}


/**
 * Fetches a single course by its ID using a cache-first strategy.
 * @param {string} courseId The ID of the course to fetch.
 * @returns {{ course: Course | null | undefined; isLoading: boolean; error: any; mutate: any; }} The course, loading state, error, and mutate function.
 */
export function useCourse(courseId: string) {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    
    // Use Dexie's live query for real-time updates from IndexedDB.
    const liveCourse = useLiveQuery(() => 
      courseId ? db.courses.get(courseId) : undefined,
      [courseId]
    );

    // SWR for background fetching and validation from the primary source (Firestore).
    const { error, mutate, isLoading: isSWRLoading } = useSWR(
        !isUserLoading && user && firestore && courseId ? ['course', courseId, user.uid] : null,
        () => getCourseFromStore(firestore!, user!.uid, courseId),
        { revalidateOnFocus: false }
    );
    
    // Prefer live query data, but fall back to SWR data if it's not ready.
    const course = liveCourse;
    const isLoading = isUserLoading || (course === undefined && isSWRLoading && !error);

    return {
        course,
        isLoading,
        error,
        mutate,
    };
}


/**
 * Fetches the progress for a specific course for the logged-in user.
 * @param {string} courseId The ID of the course to fetch progress for.
 * @returns {{ progress: CourseProgress | undefined; isLoading: boolean; error: any; mutate: any; }} The progress data, loading state, error, and mutate function.
 */
export function useProgress(courseId: string) {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    
    // Use Dexie's live query for real-time updates from IndexedDB.
    const liveProgress = useLiveQuery(() => 
        courseId ? db.progress.get(courseId) : undefined,
        [courseId]
    );

    // SWR for background fetching and validation.
    const { error, mutate, isLoading: isSWRLoading } = useSWR(
        !isUserLoading && user && firestore && courseId ? ['progress', user.uid, courseId] : null,
        () => getProgressFromStore(firestore!, user!.uid, courseId),
        { revalidateOnFocus: false }
    );
        
    const progress = liveProgress;
    const isLoading = isUserLoading || (progress === undefined && isSWRLoading && !error);
    
    return {
        progress,
        isLoading,
        error,
        mutate,
    };
}

/**
 * Fetches overall statistics (total courses, quizzes, XP) for the logged-in user.
 * It waits for the user to be loaded before fetching.
 * @returns {{ stats: { totalCourses: number; totalQuizzes: number; totalXP: number; } | undefined; isLoading: boolean; error: any; mutate: any; }} The overall stats, loading state, error, and mutate function.
 */
export function useOverallStats() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();

    // Only fetch if the user and firestore are loaded and present
    const { data, error, isLoading, mutate } = useSWR(
        !isUserLoading && user && firestore ? ['overallStats', user.uid] : null,
        () => fetcher(() => getOverallStats(firestore!, user!.uid))
    );

    return {
        stats: data,
        isLoading: isUserLoading || isLoading,
        error,
        mutate,
    };
}
