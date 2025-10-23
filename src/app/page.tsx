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

export default function HomePage() {
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  
  const { courses, isLoading: areCoursesLoading } = useCourses();
  const { stats, isLoading: areStatsLoading } = useOverallStats();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      setError('You must be logged in to upload a course.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const text = await file.text();
      const course = validateAndParseCourseJSON(text);
      await saveCourse(course, user.uid);
      router.push(`/course/${course.courseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse JSON file');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!user) {
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

  const isLoading = isUserLoading || areCoursesLoading || areStatsLoading;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Header />
        
        {isLoading ? (
          <div className="text-center p-12"><Spinner /></div>
        ) : user ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <StatCard title="Total Courses" value={stats?.totalCourses?.toString() ?? '0'} icon={<MortarboardIcon />} />
              <StatCard title="Quizzes Taken" value={stats?.totalQuizzes?.toString() ?? '0'} icon={<CheckmarkIcon />} />
              <StatCard title="Total XP" value={stats?.totalXP?.toString() ?? '0'} icon={<StarIcon />} />
            </div>

            <div className="bg-white rounded-2xl shadow-2xl p-8 mb-12">
              <h2 className="text-3xl font-bold mb-6 text-center">Upload Course JSON</h2>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input type="file" id="file-upload" accept=".json" onChange={handleFileUpload} disabled={uploading} className="hidden" />
                <div className="text-6xl mb-6 flex justify-center">{uploading ? <Spinner /> : <UploadIcon />}</div>
                <p className="text-2xl font-semibold mb-3">{uploading ? 'Processing...' : 'Drag & Drop or Click to Upload'}</p>
                <p className="text-gray-500 mb-4">Upload a JSON file to create a new course.</p>
                <button disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition disabled:opacity-50">
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

            {courses && courses.length > 0 && (
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <h2 className="text-3xl font-bold mb-8">Your Course Library</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map(course => {
                    const stats = getCourseStats(course);
                    return <CourseCard key={course.courseId} course={course} stats={stats} />;
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-2xl">
            <LoginOrSignupForm />
          </div>
        )}
      </div>
    </main>
  );
}

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

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 text-center">
      <div className="h-12 w-12 mx-auto mb-3 flex items-center justify-center">{icon}</div>
      <div className="text-3xl font-bold text-gray-800">{value}</div>
      <div className="text-gray-600">{title}</div>
    </div>
  );
}

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

const MortarboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 9L12 14 2 9" fill="#e0f2fe" />
    <path d="M12 14L6 11" stroke="#0284c7" />
    <path d="M18 11L12 14" stroke="#0284c7" />
    <path d="M2 9h20v2H2z" fill="#0ea5e9"/>
    <path d="M6 11v4a6 6 0 006 6 6 6 0 006-6v-4" stroke="#0284c7"/>
    <path d="M2 9v2l10 5 10-5V9" fill="none" stroke="#0ea5e9"/>
    <path d="M4 11.5L12 16l8-4.5" stroke="#0284c7" />
  </svg>
);

const CheckmarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" fill="#dcfce7" stroke="#16a34a"/>
      <polyline points="22 4 12 14.01 9 11.01" stroke="#16a34a" fill="none" strokeWidth="3"/>
  </svg>
);

const StarIcon = () => (
  <svg xmlns="http://www.w3
.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="#fef9c3" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none">
    <path d="M14 12L12 10L10 12" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 10V16.5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20.5 16C20.5 18.25 20.5 19.375 19.9375 20.1875C19.375 21 18.25 21 16 21H8C5.75 21 4.625 21 4.0625 20.1875C3.5 19.375 3.5 18.25 3.5 16" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 16H18.5C20.433 16 21.4 15.033 21.4 13.1C21.4 11.167 20.433 10.2 18.5 10.2H17.5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 16H5.5C3.567 16 2.6 15.033 2.6 13.1C2.6 11.167 3.567 10.2 5.5 10.2H6.5" stroke="#3b82f6" strokeWidth="1.so" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 10C12 7.75 12 6.625 12.5625 5.8125C13.125 5 14.25 5 16.5 5H17.5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 10C12 7.75 12 6.625 11.4375 5.8125C10.875 5 9.75 5 7.5 5H6.5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

    