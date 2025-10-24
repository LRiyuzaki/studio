import React, { useState, useMemo } from 'react';
import type { Course, CourseProgress, MCQ, PracticeMode, Unit, Topic } from '../types';

interface CourseViewProps {
  course: Course;
  progress: CourseProgress;
  onStartQuiz: (questions: MCQ[], mode: 'topic' | 'unit' | 'all', id: string, title: string) => void;
  onBackToHome: () => void;
  onDeleteCourse: () => void;
  onResetProgress: () => void;
  onGoToProfile: () => void;
}

const CourseView: React.FC<CourseViewProps> = ({
  course,
  progress,
  onStartQuiz,
  onBackToHome,
  onDeleteCourse,
  onResetProgress,
  onGoToProfile,
}) => {
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('by-topic');
  const [showSettings, setShowSettings] = useState(false);

  const { totalTopics, completedTopicsCount, completionPercentage } = useMemo(() => {
    const totalTopics = course.units.reduce((acc, unit) => acc + unit.topics.length, 0);
    const completedTopicsCount = progress.completedTopics.length;
    const completionPercentage = totalTopics > 0 ? Math.round((completedTopicsCount / totalTopics) * 100) : 0;
    return { totalTopics, completedTopicsCount, completionPercentage };
  }, [course, progress]);

  const handleStartTopicQuiz = (topic: Topic) => {
    onStartQuiz(topic.mcqs, 'topic', topic.topicId, topic.topicTitle);
  };

  const handleStartUnitQuiz = (unit: Unit) => {
    const allUnitMcqs = unit.topics.flatMap(topic => topic.mcqs);
    // shuffle mcqs
    const shuffledMcqs = [...allUnitMcqs].sort(() => Math.random() - 0.5);
    onStartQuiz(shuffledMcqs, 'unit', unit.unitId, unit.unitTitle);
  };

  const handleStartFullQuiz = () => {
    const allCourseMcqs = course.units.flatMap(unit => unit.topics.flatMap(topic => topic.mcqs));
    const shuffledMcqs = [...allCourseMcqs].sort(() => Math.random() - 0.5);
    onStartQuiz(shuffledMcqs, 'all', 'all-shuffled', `${course.courseTitle} - Full Quiz`);
  };
  
  const renderTopic = (topic: Topic, unitId: string) => {
    const isCompleted = progress.completedTopics.includes(topic.topicId);
    return (
        <div key={topic.topicId}
             className={`p-4 rounded-lg flex justify-between items-center transition-all ${isCompleted ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
            <div className="flex items-center">
                <span className={`mr-3 text-lg ${isCompleted ? 'text-green-500' : 'text-slate-400'}`}>{isCompleted ? '✓' : '○'}</span>
                <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100">{topic.topicTitle}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{topic.mcqs.length} questions</p>
                </div>
            </div>
            <button onClick={() => handleStartTopicQuiz(topic)}
                    className="bg-[#20B2AA] text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition text-sm">
                Practice
            </button>
        </div>
    );
  };

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <header className="relative flex justify-between items-center py-4 mb-8">
        <button onClick={onBackToHome} className="flex items-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            All Subjects
        </button>
        <div className="flex items-center gap-2">
            <button onClick={onGoToProfile} className="bg-white dark:bg-slate-700 p-2 rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </button>
            <div className="relative">
                 <button onClick={() => setShowSettings(!showSettings)} className="bg-white dark:bg-slate-700 p-2 rounded-full shadow-sm hover:bg-slate-100 dark:hover:bg-slate-600 transition">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 </button>
                 {showSettings && (
                     <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-20 border border-slate-200 dark:border-slate-700">
                         <button onClick={() => {onResetProgress(); setShowSettings(false);}} className="block w-full text-left px-4 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700">Reset Progress</button>
                         <button onClick={() => {onDeleteCourse(); setShowSettings(false);}} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700">Delete Subject</button>
                     </div>
                 )}
            </div>
        </div>
      </header>

      <section className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">{course.courseTitle}</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">{course.courseDescription}</p>
        <div className="mt-6">
          <div className="flex justify-between items-center text-sm text-slate-500 dark:text-slate-400">
            <span>Progress</span>
            <span className="font-semibold">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-2">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
          </div>
          <p className="text-right text-xs text-slate-500 dark:text-slate-400 mt-1">{completedTopicsCount} / {totalTopics} topics completed</p>
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Study Plan</h2>
            <div className="flex items-center gap-2 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                <button onClick={() => setPracticeMode('by-topic')} className={`px-3 py-1 text-sm font-semibold rounded-md ${practiceMode === 'by-topic' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>By Topic</button>
                <button onClick={() => setPracticeMode('by-unit')} className={`px-3 py-1 text-sm font-semibold rounded-md ${practiceMode === 'by-unit' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>By Unit</button>
                <button onClick={() => setPracticeMode('all-shuffled')} className={`px-3 py-1 text-sm font-semibold rounded-md ${practiceMode === 'all-shuffled' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>Full Exam</button>
            </div>
        </div>

        {practiceMode === 'by-topic' && (
          <div className="space-y-6">
            {course.units.map(unit => (
              <div key={unit.unitId} className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-bold mb-4">{unit.unitTitle}</h3>
                <div className="space-y-3">
                    {unit.topics.map(topic => renderTopic(topic, unit.unitId))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {practiceMode === 'by-unit' && (
            <div className="space-y-6">
                {course.units.map(unit => (
                    <div key={unit.unitId} className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold">{unit.unitTitle}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{unit.topics.reduce((sum, t) => sum + t.mcqs.length, 0)} questions</p>
                        </div>
                        <button onClick={() => handleStartUnitQuiz(unit)} className="bg-[#20B2AA] text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition">
                            Start Unit Quiz
                        </button>
                    </div>
                ))}
            </div>
        )}

        {practiceMode === 'all-shuffled' && (
            <div className="p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                <h3 className="text-xl font-bold">Full Subject Exam</h3>
                <p className="mt-2 mb-6 text-slate-500 dark:text-slate-400">Test your knowledge across all topics. Questions will be timed.</p>
                <button onClick={handleStartFullQuiz} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition">
                    Begin Full Exam
                </button>
            </div>
        )}
      </section>
    </div>
  );
};

export default CourseView;
