
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateAndParseCourseJSON, getCourseStats } from '@/lib/course-parser';
import { saveCourse } from '@/lib/storage';
import { Course } from '@/lib/types';
import { useFirebase, useUser } from '@/firebase';
import LoginOrSignupForm from '@/components/auth/LoginOrSignupForm';
import { useCourses, useOverallStats } from '@/lib/hooks';
import Spinner from '@/components/Spinner';
import { GraduationCap, CheckCircle2, Star, Upload } from 'lucide-react';

/**
 * The main component for the homepage.
 * It handles course uploads, displays user stats, and lists available courses.
 * It also conditionally renders the login/signup form if the user is not authenticated.
 * @returns {JSX.Element} The rendered homepage component.
 */
export default function HomePage() {
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  
  const { courses, isLoading: areCoursesLoading, mutate: mutateCourses } = useCourses();
  const { stats, isLoading: areStatsLoading } = useOverallStats();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !firestore) {
      setError('You must be logged in to upload a course.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const text = await file.text();
      let course = validateAndParseCourseJSON(text);
      
      // If the course title was auto-generated, prompt the user for a better one.
      if (course.courseTitle.startsWith('Course generated-')) {
        const newTitle = prompt('Please enter a title for your new course:', course.courseTitle);
        if (newTitle) {
          course.courseTitle = newTitle;
        }
      }

      await saveCourse(firestore, course, user.uid);
      await mutateCourses(); // Revalidate the courses list to update all caches
      
      router.push(`/course/${course.courseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse JSON file');
    } finally {
      // Ensure the input value is cleared to allow re-uploading the same file
      if (e.target) {
        e.target.value = '';
      }
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!user || !firestore) {
      setError('Please log in to upload a course.');
      return;
    }
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      const input = document.createElement('input');
      input.type = 'file';
      input.files = e.dataTransfer.files;
      handleFileUpload({ target: input } as any);
    } else {
      setError('Please drop a valid JSON file.');
    }
  };

  // Centralized loading check
  const isLoading = isUserLoading || areCoursesLoading || areStatsLoading;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <Header />
        
        {isUserLoading ? (
          <div className="text-center p-12"><Spinner /></div>
        ) : user ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              <StatCard title="Total Courses" value={stats?.totalCourses?.toString() ?? '0'} icon={<GraduationCap className="h-10 w-10 text-blue-500" />} />
              <StatCard title="Quizzes Taken" value={stats?.totalQuizzes?.toString() ?? '0'} icon={<CheckCircle2 className="h-10 w-10 text-green-500" />} />
              <StatCard title="Total XP" value={stats?.totalXP?.toString() ?? '0'} icon={<Star className="h-10 w-10 text-yellow-500" />} />
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">Upload Course JSON</h2>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-8 sm:p-12 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input type="file" id="file-upload" accept=".json" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                <div className="text-5xl sm:text-6xl mb-6 flex justify-center">{uploading ? <Spinner /> : <Upload className="h-14 w-14 text-blue-500" />}</div>
                <p className="text-xl sm:text-2xl font-semibold mb-3">{uploading ? 'Processing...' : 'Drag & Drop or Click to Upload'}</p>
                <p className="text-gray-500 mb-4">Upload a JSON file to create a new course.</p>
                <button disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 sm:py-3 sm:px-8 rounded-lg transition disabled:opacity-50">
                  {uploading ? 'Uploading...' : 'Choose File'}
                </button>
              </div>
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-semibold text-red-800">Error:</p>
                  <p className="text-red-700">{error}</p>
                </div>
              )}
            </div>
            
            {isLoading ? <div className="text-center p-12"><Spinner /></div> : (
              <>
                {courses && courses.length > 0 ? (
                  <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-8">Your Course Library</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {courses.map(course => {
                        const stats = getCourseStats(course);
                        return <CourseCard key={course.courseId} course={course} stats={stats} />;
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 px-6 bg-white rounded-2xl shadow-xl">
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">Your Library is Empty</h3>
                    <p className="text-gray-600">Upload a course JSON file to get started!</p>
                  </div>
                )}
              </>
            )}

          </>
        ) : (
          <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-2xl">
            <LoginOrSignupForm />
          </div>
        )}
      </div>
    </main>
  );
}

/**
 * Renders the header section of the homepage.
 * It displays the application title and a sign-out button if the user is authenticated.
 * @returns {JSX.Element} The rendered header component.
 */
function Header() {
    const { user, isUserLoading } = useUser();
    const { auth } = useFirebase();
  
    return (
      <header className="flex justify-between items-center mb-12">
          <div className="flex-grow">
            <div className="text-center">
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                EAIZY Learn
              </h1>
              <p className="text-xl text-gray-600">
                Your personal Plug and play app for creating and mastering MCQ and mock Exams.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
              {user && auth && !isUserLoading && (
                  <button onClick={() => auth.signOut()} className="bg-red-500 text-white px-4 py-2 rounded-lg">Sign Out</button>
              )}
          </div>
      </header>
    )
}

/**
 * Displays a statistic card with a title, value, and icon.
 * @param {{ title: string; value: string; icon: React.ReactNode }} props - The props for the StatCard component.
 * @returns {JSX.Element} The rendered StatCard component.
 */
function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center justify-center">
      <div className="h-12 w-12 mb-3 flex items-center justify-center">{icon}</div>
      <div className="text-3xl font-bold text-gray-800">{value}</div>
      <div className="text-gray-600">{title}</div>
    </div>
  );
}

/**
 * Displays a card with information about a course.
 * @param {{ course: Course; stats: any }} props - The props for the CourseCard component.
 * @returns {JSX.Element} The rendered CourseCard component.
 */
function CourseCard({ course, stats }: { course: Course; stats: any }) {
  const date = course.createdAt ? new Date(course.createdAt) : null;
  const dateString = date ? date.toLocaleDateString() : 'N/A';

  return (
    <a
      href={`/course/${course.courseId}`}
      className="block p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-xl transition-all bg-white"
    >
      <h3 className="text-xl font-bold mb-2 line-clamp-2">{course.courseTitle}</h3>
      <p className="text-gray-600 mb-4 line-clamp-2">{course.courseDescription}</p>
      <div className="flex justify-between text-sm text-gray-500">
        <span>📚 {stats.totalUnits} units</span>
        <span>📖 {stats.totalTopics} topics</span>
        <span>❓ {stats.totalMCQs} questions</span>
      </div>
      <div className="mt-3 text-xs text-gray-400">
        Created: {dateString}
      </div>
    </a>
  );
}
