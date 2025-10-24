
'use client';

import useSWR from 'swr';
import { useFirebase, useUser } from '@/firebase';
import { getCourses, getCourse, getProgress, getOverallStats } from './storage';
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
 * It automatically re-fetches the data if the user changes and waits for the user to be loaded.
 * It uses a combination of Dexie for local caching and SWR for fetching from Firestore.
 * @returns {{ courses: Course[] | undefined; isLoading: boolean; error: any; mutate: any; }} The courses, loading state, error, and mutate function from SWR.
 */
export function useCourses() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();

    // Use Dexie's live query for instant UI updates from the local cache.
    const localCourses = useLiveQuery(() => user ? db.courses.where('ownerId').equals(user.uid).toArray() : [], [user?.uid]);
    
    // Use SWR to fetch from Firestore and update the cache in the background.
    const { data, error, mutate, isLoading: isSWRFetching } = useSWR(
        !isUserLoading && user && firestore ? ['courses', user.uid] : null,
        () => fetcher(() => getCourses(firestore!, user!.uid))
    );

    const courses = localCourses ?? data;
    const isLoading = isUserLoading || (!courses && isSWRFetching && !error);

    return {
        courses,
        isLoading,
        error,
        mutate,
    };
}

/**
 * Fetches a single course by its ID for the logged-in user.
 * It uses a combination of Dexie for local caching and SWR for fetching from Firestore.
 * @param {string} courseId The ID of the course to fetch.
 * @returns {{ course: Course | null | undefined; isLoading: boolean; error: any; mutate: any; }} The course, loading state, error, and mutate function.
 */
export function useCourse(courseId: string) {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();

    // Live query from Dexie for instant data
    const localCourse = useLiveQuery(() => db.courses.get(courseId), [courseId]);

    // SWR for background fetching and validation
    const { data, error, mutate, isLoading: isSWRLoading } = useSWR(
        !isUserLoading && user && firestore && courseId ? ['course', courseId] : null,
        () => fetcher(() => getCourse(firestore!, user!.uid, courseId)),
        { revalidateOnFocus: false }
    );
    
    // Prefer SWR data if available, fall back to local cache.
    const course = data ?? localCourse;
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
 * It uses a combination of Dexie for local caching and SWR for fetching from Firestore.
 * @param {string} courseId The ID of the course to fetch progress for.
 * @returns {{ progress: CourseProgress | undefined; isLoading: boolean; error: any; mutate: any; }} The progress data, loading state, error, and mutate function.
 */
export function useProgress(courseId: string) {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    
    // Live query from Dexie for instant data
    const localProgress = useLiveQuery(() => db.progress.get(courseId), [courseId]);

    // SWR for background fetching and validation
    const { data, error, mutate, isLoading: isSWRLoading } = useSWR(
        !isUserLoading && user && firestore && courseId ? ['progress', user.uid, courseId] : null,
        () => fetcher(() => getProgress(firestore!, user!.uid, courseId)),
        { revalidateOnFocus: false }
    );
        
    const progress = data ?? localProgress;
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
