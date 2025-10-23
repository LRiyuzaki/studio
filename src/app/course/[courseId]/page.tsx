'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Course, CourseProgress } from '@/lib/types';
import { getCourse, getProgress, getCourseCompletion, deleteCourse, getCourses, resetProgress } from '@/lib/storage';
import { getCourseStats } from '@/lib/course-parser';

/**
 * The main page for displaying a single course, including its units, topics, and user progress.
 * @returns {JSX.Element} The course dashboard page component.
 */
export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  
  useEffect(() => {
    if (!courseId) return;

    async function loadCourseData() {
      // This is a check to see if the user has deleted the course they are currently viewing
      const allCourses = await getCourses();
      if (!allCourses.some(c => c.courseId === courseId)) {
        router.push('/');
        return;
      }
      const loadedCourse = await getCourse(courseId);
      // This is the primary load path
      if (!loadedCourse) {
        router.push('/');
        return;
      }
      setCourse(loadedCourse);

      const loadedProgress = getProgress(courseId);
      setProgress(loadedProgress);
    }
    
    loadCourseData();
  }, [courseId, router]);
  
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
  
  /**
   * Handles the deletion of the current course.
   * Prompts the user for confirmation before deleting.
   */
  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${course.courseTitle}"? This will also delete all progress.`)) {
      await deleteCourse(courseId);
      router.push('/');
    }
  };

  /**
   * Handles resetting the user's progress for the current course.
   * Prompts the user for confirmation.
   */
  const handleResetProgress = async () => {
    if (confirm(`Are you sure you want to reset all progress for "${course.courseTitle}"? This action cannot be undone.`)) {
      const newProgress = resetProgress(courseId);
      setProgress(newProgress);
      // Force a re-render by creating a new object
      setCourse(currentCourse => currentCourse ? { ...currentCourse } : null);
    }
  };
  
  /**
   * Handles exporting the user's progress for the current course as a JSON file.
   */
  const handleExportProgress = () => {
    const data = {
      course: course.courseTitle,
      progress: progress,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course.courseId}-progress.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <a href="/" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
                ← Back to Library
              </a>
              <h1 className="text-4xl lg:text-5xl font-bold mb-2">{course.courseTitle}</h1>
              <p className="text-xl text-gray-600">{course.courseDescription}</p>
            </div>
             <div className="flex gap-3">
               <a
                href={`/course/${courseId}/quiz`}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg text-center"
              >
                Start Comprehensive Quiz
              </a>
            </div>
          </div>
          
          {/* Course Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <CompletionStat courseId={courseId} />
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
        
        {/* Course Units */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold">Course Content</h2>
          
          {course.units.map((unit, unitIndex) => {
            const unitProgress = progress.unitProgress[unit.unitId];
            const unitCompletion = unitProgress?.completionPercentage || 0;
            
            return (
              <div key={unit.unitId} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Unit Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-2 text-gray-800">
                        Unit {unitIndex + 1}: {unit.unitTitle}
                      </h3>
                      <p className="text-gray-600">{unit.unitDescription}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-3xl font-bold text-blue-600">{unitCompletion}%</div>
                      <div className="text-sm text-gray-500">Complete</div>
                    </div>
                  </div>
                   <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-500 h-2.5 rounded-full" 
                          style={{ width: `${unitCompletion}%` }}
                        ></div>
                      </div>
                    </div>
                </div>
                
                {/* Topics Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {unit.topics.map(topic => {
                      const isCompleted = progress.completedTopics.includes(topic.topicId);
                      const topicQuiz = progress.quizHistory
                        .filter(q => q.topicId === topic.topicId)
                        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
                      
                      return (
                        <a
                          key={topic.topicId}
                          href={`/course/${courseId}/quiz/${topic.topicId}`}
                          className={`block p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
                            isCompleted
                              ? 'border-green-500 bg-green-50 hover:border-green-600'
                              : 'border-gray-200 hover:border-blue-500'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-bold text-lg flex-1">{topic.topicTitle}</h4>
                            {isCompleted && (
                              <span className="text-2xl ml-2 flex-shrink-0" title="Completed">
                                ✅
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {topic.topicDescription}
                          </p>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">
                              {topic.mcqs.length} question{topic.mcqs.length !== 1 ? 's' : ''}
                            </span>
                            
                            {topicQuiz && (
                              <span className={`font-semibold ${
                                topicQuiz.percentage >= 80 ? 'text-green-600' :
                                topicQuiz.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {topicQuiz.percentage}%
                              </span>
                            )}
                          </div>
                          
                          {!isCompleted && (
                            <div className="mt-3 text-xs text-blue-600 font-semibold">
                              Start Learning →
                            </div>
                          )}
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
            <button
                onClick={handleExportProgress}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Export Progress
              </button>
              <button
                onClick={handleResetProgress}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Reset Progress
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Delete Course
              </button>
        </div>
      </div>
    </div>
  );
}

/**
 * A client component that fetches and displays the overall completion percentage for a course.
 * @param {{ courseId: string }} props - The props for the component.
 * @param {string} props.courseId - The ID of the course to fetch completion for.
 * @returns {JSX.Element} The completion status card.
 */
function CompletionStat({ courseId }: { courseId: string }) {
  const [completion, setCompletion] = useState(0);

  useEffect(() => {
    async function fetchCompletion() {
      const value = await getCourseCompletion(courseId);
      setCompletion(value);
    }
    fetchCompletion();
  }, [courseId]);

  return (
    <div className="text-center p-3 bg-blue-50 rounded-lg">
      <div className="text-2xl font-bold text-blue-600">{completion}%</div>
      <div className="text-sm text-blue-800">Complete</div>
    </div>
  );
}
