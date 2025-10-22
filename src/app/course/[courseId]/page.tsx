// app/course/[courseId]/page.tsx
'use client';
import { useParams, useRouter } from 'next/navigation';
import { getCourse, getProgress, getCourseCompletion, deleteCourse } from '@/lib/storage';
import { getCourseStats } from '@/lib/course-parser';
import { useEffect, useState } from 'react';
import { Course, CourseProgress } from '@/lib/types';

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  
  useEffect(() => {
    if (!courseId) return;
    const loadedCourse = getCourse(courseId);
    if (!loadedCourse) {
      router.push('/');
      return;
    }
    setCourse(loadedCourse);
    setProgress(getProgress(courseId));
  }, [courseId, router]);
  
  if (!course || !progress) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  const stats = getCourseStats(course);
  const completion = getCourseCompletion(courseId);
  
  const handleDelete = () => {
    if (confirm('Delete this course? This cannot be undone.')) {
      deleteCourse(courseId);
      router.push('/');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
            ← Back to Home
          </a>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-5xl font-bold mb-4">{course.courseTitle}</h1>
              <p className="text-xl text-gray-600">{course.courseDescription}</p>
            </div>
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Delete Course
            </button>
          </div>
        </div>
        
        {/* Progress Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Completion" value={`${completion}%`} icon="📊" />
          <StatCard title="Total XP" value={progress.totalXP.toString()} icon="⭐" />
          <StatCard title="Streak" value={`${progress.currentStreak} days`} icon="🔥" />
          <StatCard title="Quizzes" value={progress.quizHistory.length.toString()} icon="✅" />
        </div>
        
        {/* Units Grid */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">Course Units</h2>
          {course.units.map((unit, index) => {
            const unitProgress = progress.unitProgress[unit.unitId];
            const unitCompletion = unitProgress?.completionPercentage || 0;
            
            return (
              <div key={unit.unitId} className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">
                      Unit {index + 1}: {unit.unitTitle}
                    </h3>
                    <p className="text-gray-600">{unit.unitDescription}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-indigo-600">{unitCompletion}%</div>
                    <div className="text-sm text-gray-500">Complete</div>
                  </div>
                </div>
                
                {/* Topics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unit.topics.map(topic => {
                    const isCompleted = progress.completedTopics.includes(topic.topicId);
                    
                    return (
                      <a
                        key={topic.topicId}
                        href={`/course/${courseId}/quiz/${topic.topicId}`}
                        className={`block p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                          isCompleted
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-indigo-500'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-bold text-lg">{topic.topicTitle}</h4>
                          {isCompleted && <span className="text-2xl">✅</span>}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{topic.topicDescription}</p>
                        <div className="text-sm text-gray-500">
                          {topic.mcqs.length} questions
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Quiz History */}
        {progress.quizHistory.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Recent Quiz Results</h2>
            <div className="space-y-3">
              {progress.quizHistory.slice(-5).reverse().map((result, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold">{result.topicTitle}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(result.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{result.percentage}%</div>
                    <div className="text-sm text-gray-500">
                      {result.score}/{result.total} correct
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 text-center">
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  );
}
