
'use client';

import useSWR from 'swr';
import { useFirebase, useUser } from '@/firebase';
import { 
  getCourses as getCoursesFromStore, 
  getCourse as getCourseFromStore, 
  getProgress as getProgressFromStore, 
  getOverallStats 
} from './storage';
import { 
  courseCache, 
  progressCache, 
  getCourse as getCourseFromCache, 
  getCourses as getCoursesFromCache, 
  getProgress as getProgressFromCache 
} from './cache';
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
 * Fetches all courses for the currently logged-in user.
 * It uses a combination of an in-memory cache, Dexie for local persistence,
 * and SWR for fetching from Firestore.
 * @returns {{ courses: Course[] | undefined; isLoading: boolean; error: any; mutate: any; }} The courses, loading state, error, and mutate function from SWR.
 */
export function useCourses() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();

    // Use SWR for fetching, which will now use our cache-aware storage functions.
    // The key ensures re-fetching when user changes.
    const { data, error, mutate, isLoading: isSWRFetching } = useSWR(
        !isUserLoading && user && firestore ? ['courses', user.uid] : null,
        () => getCoursesFromStore(firestore!, user!.uid)
    );

    // For initial render and immediate updates, try to read from in-memory cache.
    const initiallyCachedCourses = user ? Array.from(courseCache.values()).filter(c => c.ownerId === user.uid) : [];
    
    // SWR data is the most up-to-date, fall back to memory cache.
    const courses = data ?? (initiallyCachedCourses.length > 0 ? initiallyCachedCourses : undefined);

    const isLoading = isUserLoading || (!courses && isSWRFetching && !error);

    return {
        courses,
        isLoading,
        error,
        mutate,
    };
}


/**
 * Fetches a single course by its ID.
 * It uses the in-memory cache first, then Dexie, then falls back to SWR fetching from Firestore.
 * @param {string} courseId The ID of the course to fetch.
 * @returns {{ course: Course | null | undefined; isLoading: boolean; error: any; mutate: any; }} The course, loading state, error, and mutate function.
 */
export function useCourse(courseId: string) {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    
    // For initial render, try a synchronous read from the in-memory cache.
    const initiallyCachedCourse = courseCache.get(courseId);

    // SWR for background fetching and validation from the primary source.
    const { data, error, mutate, isLoading: isSWRLoading } = useSWR(
        !isUserLoading && user && firestore && courseId ? ['course', courseId, user.uid] : null,
        () => getCourseFromStore(firestore!, user!.uid, courseId),
        { revalidateOnFocus: false }
    );
    
    // SWR data is the most up-to-date, fall back to memory cache.
    const course = data ?? initiallyCachedCourse;
    
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
 * It uses the in-memory cache first, then Dexie, then SWR.
 * @param {string} courseId The ID of the course to fetch progress for.
 * @returns {{ progress: CourseProgress | undefined; isLoading: boolean; error: any; mutate: any; }} The progress data, loading state, error, and mutate function.
 */
export function useProgress(courseId: string) {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    
    // For initial render, try a synchronous read from the in-memory cache.
    const initiallyCachedProgress = progressCache.get(courseId);

    // SWR for background fetching and validation.
    const { data, error, mutate, isLoading: isSWRLoading } = useSWR(
        !isUserLoading && user && firestore && courseId ? ['progress', user.uid, courseId] : null,
        () => getProgressFromStore(firestore!, user!.uid, courseId),
        { revalidateOnFocus: false }
    );
        
    const progress = data ?? initiallyCachedProgress;
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
