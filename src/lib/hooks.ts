'use client';

import useSWR from 'swr';
import { useFirebase, useUser } from '@/firebase';
import { getCourses, getCourse, getProgress, getOverallStats } from './storage';

// SWR requires a fetcher function that returns the data
const fetcher = async (fetchFn: () => Promise<any>) => {
    return await fetchFn();
};

export function useCourses() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    
    const { data, error, isLoading, mutate } = useSWR(
        user ? ['courses', user.uid] : null,
        () => fetcher(() => getCourses(firestore, user!.uid))
    );

    return {
        courses: data,
        isLoading,
        error,
        mutate,
    };
}

export function useCourse(courseId: string) {
    const { firestore } = useFirebase();
    const { user } = useUser();

    const { data, error, isLoading, mutate } = useSWR(
        user && courseId ? ['course', courseId, user.uid] : null,
        () => fetcher(() => getCourse(firestore, courseId)),
        { shouldRetryOnError: false } // To prevent retrying on permission errors
    );

    return {
        course: data,
        isLoading,
        error,
        mutate,
    };
}


export function useProgress(courseId: string) {
    const { firestore } = useFirebase();
    const { user } = useUser();
    
    const { data, error, isLoading, mutate } = useSWR(
        user && courseId ? ['progress', user.uid, courseId] : null,
        () => fetcher(() => getProgress(firestore, user!.uid, courseId))
    );

    return {
        progress: data,
        isLoading,
        error,
        mutate,
    };
}

export function useOverallStats() {
    const { firestore } = useFirebase();
    const { user } = useUser();

    const { data, error, isLoading, mutate } = useSWR(
        user ? ['overallStats', user.uid] : null,
        () => fetcher(() => getOverallStats(firestore, user!.uid))
    );

    return {
        stats: data,
        isLoading,
        error,
        mutate,
    };
}
