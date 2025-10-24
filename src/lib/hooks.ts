
'use client';

import useSWR from 'swr';
import { useFirebase, useUser } from '@/firebase';
import { 
  getCourses as getCoursesFromStore, 
  getCourse as getCourseFromStore, 
  getProgress as getProgressFromStore, 
  getOverallStats 
} from './storage';
import { Course } from '@/lib/types';
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
 * It leverages Dexie's live queries for real-time UI updates from the local DB,
 * which is populated by the preloading mechanism on login. SWR is used for
 * potential background revalidation.
 * @returns {{ courses: Course[] | undefined; isLoading: boolean; error: any; }} The courses, loading state, and error.
 */
export function useCourses() {
    const { user, isUserLoading } = useUser();

    // useLiveQuery provides a reactive stream from the local Dexie database.
    // The data is available almost instantly if it was preloaded.
    const liveCourses = useLiveQuery(() => 
        user ? db.courses.where('ownerId').equals(user.uid).toArray() : [],
        [user?.uid], // Dependency array ensures it re-runs if the user changes
        [] // Default value
    );

    // The primary loading state depends on the user session and if liveCourses has been populated.
    const isLoading = isUserLoading || (user && liveCourses.length === 0);

    return {
        courses: liveCourses,
        isLoading,
        error: null, // Errors would be handled at a higher level
    };
}


/**
 * Fetches a single course by its ID using a cache-first strategy.
 * It prioritizes reading from Dexie's live query for instant data access.
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
        !isUserLoading && user && firestore && courseId ? ['course', courseId] : null,
        () => getCourseFromStore(firestore!, user!.uid, courseId),
        { revalidateOnFocus: false }
    );
    
    // isLoading is true if the user is loading OR if the live query hasn't returned a result yet.
    const isLoading = isUserLoading || (courseId && liveCourse === undefined && isSWRLoading);

    return {
        course: liveCourse,
        isLoading,
        error,
        mutate,
    };
}


/**
 * Fetches the progress for a specific course for the logged-in user.
 * It prioritizes reading from Dexie's live query for instant data access.
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
        
    const isLoading = isUserLoading || (courseId && liveProgress === undefined && isSWRLoading);
    
    return {
        progress: liveProgress,
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
