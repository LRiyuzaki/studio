'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Course, CourseProgress } from '@/lib/types';
import { getCourse, getProgress, deleteCourse, resetProgress } from '@/lib/storage';
import { getCourseStats } from '@/lib/course-parser';
import { useFirebase, useUser } from '@/firebase';
import PrivateRoute from '@/components/auth/private-route';

function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { firestore } = useFirebase();
  const { user } = useUser();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  
  useEffect(() => {
    if (!courseId || !user || !firestore) return;

    async function loadCourseData() {
      const loadedCourse = await getCourse(firestore, courseId);
      if (!loadedCourse || loadedCourse.ownerId !== user.uid) {
        router.push('/');
        return;
      }
      setCourse(loadedCourse);

      const loadedProgress = await getProgress(firestore, user.uid, courseId);
      setProgress(loadedProgress);
    }
    
    loadCourseData();
  }, [courseId, user, firestore, router]);
  
  if (!course || !progress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-xl">Loading course...</p>
        </div>
      </div>
    );
  }
  
  const stats = getCourseStats(course);
  
  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${course.courseTitle}"?`)) {
      await deleteCourse(firestore, courseId);
      router.push('/');
    }
  };

  const handleResetProgress = async () => {
    if (confirm(`Are you sure you want to reset progress for "${course.courseTitle}"?`)) {
      const newProgress = await resetProgress(firestore, user!.uid, courseId);
      setProgress(newProgress);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-6xl mx-auto p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <a href="/" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
                ← Back to Library
              </a>
              <h1 className="text-4xl lg:text-5xl font-bold mb-2 text-gray-800">{course.courseTitle}</h1>
              <p className="text-xl text-gray-600">{course.courseDescription}</p>
            </div>
            <div className="flex gap-3">
              <a href={`/course/${courseId}/quiz`} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg text-center">
                Start Comprehensive Quiz
              </a>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3 bg-blue-100 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{progress.totalXP}</div>
                <div className="text-sm text-blue-800">Total XP</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.totalUnits}</div>
              <div className="text-sm text-purple-800">Units</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.totalTopics}</div>
              <div className="text-sm text-green-800">Topics</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.totalMCQs}</div>
              <div className="text-sm text-orange-800">Questions</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto p-8">
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-gray-800">Course Content</h2>
          {course.units.map((unit, unitIndex) => {
            const unitProgress = progress.unitProgress[unit.unitId];
            const unitCompletion = unitProgress?.completionPercentage || 0;
            return (
              <div key={unit.unitId} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                <div className="p-6 bg-blue-50 border-b border-blue-200">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-2 text-gray-800">Unit {unitIndex + 1}: {unit.unitTitle}</h3>
                      <p className="text-gray-600">{unit.unitDescription}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-3xl font-bold text-blue-600">{unitCompletion}%</div>
                      <div className="text-sm text-gray-500">Complete</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${unitCompletion}%` }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {unit.topics.map(topic => {
                      const isCompleted = progress.completedTopics.includes(topic.topicId);
                      return (
                        <a key={topic.topicId} href={`/course/${courseId}/quiz/${topic.topicId}`}
                          className={`block p-6 rounded-xl border-2 transition-all hover:shadow-lg ${isCompleted ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-blue-500'}`}>
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-bold text-lg flex-1">{topic.topicTitle}</h4>
                            {isCompleted && <span className="text-2xl ml-2 flex-shrink-0" title="Completed">✅</span>}
                          </div>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{topic.topicDescription}</p>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">{topic.mcqs.length} question{topic.mcqs.length !== 1 ? 's' : ''}</span>
                          </div>
                          {!isCompleted && <div className="mt-3 text-xs text-blue-600 font-semibold">Start Learning →</div>}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 flex justify-end gap-3 flex-wrap">
          <button onClick={handleResetProgress} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            Reset Progress
          </button>
          <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Delete Course
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CoursePageContainer() {
    return <PrivateRoute><CoursePage /></PrivateRoute>;
}
