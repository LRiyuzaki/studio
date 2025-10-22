'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { validateAndParseCourseJSON, getCourseStats } from '@/lib/course-parser';
import { saveCourse, getCourses, getOverallStats } from '@/lib/storage';
import { Course } from '@/lib/types';

export default function HomePage() {
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [overallStats, setOverallStats] = useState({ totalCourses: 0, totalQuizzes: 0, totalXP: 0 });
  const router = useRouter();
  
  useEffect(() => {
    async function loadInitialData() {
      setCourses(await getCourses());
      setOverallStats(await getOverallStats());
    }
    loadInitialData();
  }, []);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setError('');
    
    try {
      const text = await file.text();
      const course = validateAndParseCourseJSON(text);
      await saveCourse(course);
      
      setCourses(await getCourses());
      setOverallStats(await getOverallStats());
      
      router.push(`/course/${course.courseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse JSON file');
    } finally {
      setUploading(false);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
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
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            CourseMaster
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Transform your JSON course content into interactive learning experiences
          </p>
          <p className="text-gray-500">
            Upload structured JSON files to create courses with units, topics, and MCQs
          </p>
        </div>
        
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard title="Total Courses" value={overallStats.totalCourses.toString()} icon="📚" />
          <StatCard title="Quizzes Taken" value={overallStats.totalQuizzes.toString()} icon="✅" />
          <StatCard title="Total XP" value={overallStats.totalXP.toString()} icon="⭐" />
        </div>
        
        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Upload Course JSON</h2>
          
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              type="file"
              id="file-upload"
              accept=".json"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            
            <div className="text-6xl mb-6">📤</div>
            <p className="text-2xl font-semibold mb-3">
              {uploading ? 'Processing Your Course...' : 'Drag & Drop or Click to Upload'}
            </p>
            <p className="text-gray-500 mb-4">
              Upload a JSON file with your course structure
            </p>
            <button 
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Choose File'}
            </button>
          </div>
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-semibold text-red-800">Error:</p>
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {/* JSON Format Guide */}
          <details className="mt-8">
            <summary className="cursor-pointer text-lg font-semibold text-gray-700 hover:text-blue-600">
              📋 JSON Format Specification
            </summary>
            <div className="mt-4 p-6 bg-gray-50 rounded-lg">
              <p className="mb-4">Your JSON file should follow this structure (flat list of questions):</p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "questions": [
    {
      "question_id": "94850116",
      "topic": "Use of Prior Returns",
      "question_text": "Layla is self-employed...",
      "options": [
        { "id": "A", "text": "...", "is_correct": false },
        { "id": "B", "text": "...", "is_correct": false },
        { "id": "C", "text": "...", "is_correct": true },
        { "id": "D", "text": "...", "is_correct": false }
      ],
      "correct_answer": "C",
      "study_unit": { "number": 1, "name": "..." },
      "explanation": "...",
      "difficulty": 2
    }
  ]
}`}
              </pre>
            </div>
          </details>
        </div>
        
        {/* Course Library */}
        {courses.length > 0 && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-3xl font-bold mb-8">Your Course Library</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => {
                const stats = getCourseStats(course);
                return (
                  <CourseCard key={course.courseId} course={course} stats={stats} />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-3xl font-bold text-gray-800">{value}</div>
      <div className="text-gray-600">{title}</div>
    </div>
  );
}

function CourseCard({ course, stats }: { course: Course; stats: any }) {
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
        Created: {new Date(course.createdAt).toLocaleDateString()}
      </div>
    </a>
  );
}
