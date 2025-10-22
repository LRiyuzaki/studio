// app/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { validateAndParseCourseJSON, getCourseStats } from '@/lib/course-parser';
import { saveCourse, getCourses } from '@/lib/storage';
import { Course } from '@/lib/types';

export default function HomePage() {
  const [error, setError] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const router = useRouter();

  useEffect(() => {
    setCourses(getCourses());
  }, []);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setError('');
    
    try {
      const text = await file.text();
      const course = validateAndParseCourseJSON(text);
      saveCourse(course);
      setCourses(getCourses()); // Refresh course list
      router.push(`/course/${course.courseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse JSON file');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            MCQ Course Platform
          </h1>
          <p className="text-xl text-gray-600">
            Upload a JSON file to create your interactive course
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Upload Course JSON</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-indigo-500 transition-colors">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer block"
            >
              <div className="text-6xl mb-4">📄</div>
              <p className="text-lg font-semibold mb-2">
                {uploading ? 'Processing...' : 'Click to upload JSON file'}
              </p>
              <p className="text-sm text-gray-500">
                Course structure with units, topics, and MCQs
              </p>
            </label>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <p className="font-semibold">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <details className="mt-6">
            <summary className="cursor-pointer font-semibold text-gray-700 hover:text-indigo-600">
              📋 View JSON Format Example
            </summary>
            <pre className="mt-4 p-4 bg-gray-50 rounded-lg text-xs overflow-x-auto">
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
          </details>
        </div>
        
        {courses.length > 0 && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold mb-6">Your Courses</h2>
            <div className="grid gap-4">
              {courses.map(course => {
                const stats = getCourseStats(course);
                return (
                  <a
                    key={course.courseId}
                    href={`/course/${course.courseId}`}
                    className="block p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all"
                  >
                    <h3 className="text-xl font-bold mb-2">{course.courseTitle}</h3>
                    <p className="text-gray-600 mb-4">{course.courseDescription}</p>
                    <div className="flex gap-6 text-sm text-gray-500">
                      <span>📚 {stats.totalUnits} units</span>
                      <span>📖 {stats.totalTopics} topics</span>
                      <span>❓ {stats.totalMCQs} questions</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
