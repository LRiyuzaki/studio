'use client';

import useSWR from 'swr';
import { useUser } from '@/firebase';
import { getCourses, getCourse, getProgress, getOverallStats } from './storage';
import { Course, CourseProgress } from './types';

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
 * It automatically re-fetches the data if the user changes.
 * @returns {{ courses: Course[] | undefined; isLoading: boolean; error: any; mutate: any; }} The courses, loading state, error, and mutate function from SWR.
 */
export function useCourses() {
    const { user } = useUser();
    
    const { data, error, isLoading, mutate } = useSWR(
        user ? ['courses', user.uid] : null,
        () => fetcher(() => getCourses(user!.uid))
    );

    return {
        courses: data,
        isLoading,
        error,
        mutate,
    };
}

/**
 * Fetches a single course by its ID for the logged-in user.
 * @param {string} courseId The ID of the course to fetch.
 * @returns {{ course: Course | null | undefined; isLoading: boolean; error: any; mutate: any; }} The course, loading state, error, and mutate function.
 */
export function useCourse(courseId: string) {
    const { user } = useUser();

    const { data, error, isLoading, mutate } = useSWR(
        user && courseId ? ['course', courseId, user.uid] : null,
        () => fetcher(() => getCourse(user!.uid, courseId)),
        { shouldRetryOnError: false } // Prevent retrying on permission errors
    );

    return {
        course: data,
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
    const { user } = useUser();
    
    const { data, error, isLoading, mutate } = useSWR(
        user && courseId ? ['progress', user.uid, courseId] : null,
        () => fetcher(() => getProgress(user!.uid, courseId))
    );

    return {
        progress: data,
        isLoading,
        error,
        mutate,
    };
}

/**
 * Fetches overall statistics (total courses, quizzes, XP) for the logged-in user.
 * @returns {{ stats: { totalCourses: number; totalQuizzes: number; totalXP: number; } | undefined; isLoading: boolean; error: any; mutate: any; }} The overall stats, loading state, error, and mutate function.
 */
export function useOverallStats() {
    const { user } = useUser();

    const { data, error, isLoading, mutate } = useSWR(
        user ? ['overallStats', user.uid] : null,
        () => fetcher(() => getOverallStats(user!.uid))
    );

    return {
        stats: data,
        isLoading,
        error,
        mutate,
    };
}
