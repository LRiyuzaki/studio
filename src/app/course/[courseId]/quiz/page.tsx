'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { getCourse, updateProgressAfterQuiz, getProgress, resetComprehensiveQuizModeProgress } from '@/lib/storage';
import { Course, QuizMode, QuizResult } from '@/lib/types';
import { getAllMCQs } from '@/lib/course-parser';
import QuizDisplay from '@/components/QuizDisplay';
import { useFirebase, useUser } from '@/firebase';
import PrivateRoute from '@/components/auth/private-route';

function ComprehensiveQuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { firestore } = useFirebase();
  const { user } = useUser();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [mode, setMode] = useState<QuizMode>('practice');
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [modeProgress, setModeProgress] = useState<Record<QuizMode, QuizResult | null>>({
    practice: null,
    exam: null,
  });

  const loadProgress = useCallback(async () => {
    if (!courseId || !user) return;
    const progress = await getProgress(firestore, user.uid, courseId);
    const newModeProgress: Record<QuizMode, QuizResult | null> = { practice: null, exam: null };
    (['practice', 'exam'] as QuizMode[]).forEach(m => {
      const lastResult = progress.quizHistory
        .filter(q => q.topicId === 'all' && q.mode === m)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
      if (lastResult) newModeProgress[m] = lastResult;
    });
    setModeProgress(newModeProgress);
  }, [courseId, user, firestore]);

  useEffect(() => {
    setIsClient(true);
    if (!courseId || !firestore) return;
    async function loadCourse() {
      const loadedCourse = await getCourse(firestore, courseId);
      if (!loadedCourse) {
        router.push('/');
        return;
      }
      setCourse(loadedCourse);
    }
    loadCourse();
    loadProgress();
  }, [courseId, router, firestore, loadProgress]);
  
  const handleQuizComplete = async (score: number, answers: (string | null)[], timeSpent: number) => {
    if (!course || !user) return;
    await updateProgressAfterQuiz(firestore, user.uid, courseId, 'all', 'Comprehensive Quiz', 'all-units', score, getAllMCQs(course).length, answers, mode, timeSpent);
    setShowModeSelector(true);
    loadProgress();
  };

  const handleExit = () => {
    if (isClient) {
      if (showModeSelector || confirm('Are you sure you want to exit?')) {
        router.push(`/course/${courseId}`);
      }
    }
  };

  const handleResetModeProgress = (modeToReset: QuizMode) => {
    if (confirm(`Are you sure you want to reset your progress for ${modeToReset} mode?`) && user) {
        resetComprehensiveQuizModeProgress(firestore, user.uid, courseId, modeToReset);
        loadProgress();
    }
  };
  
  if (!isClient || !course) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }

  const allMCQsTopic = {
    topicId: 'all',
    topicTitle: 'Comprehensive Quiz',
    topicDescription: `A mix of all questions from "${course.courseTitle}"`,
    mcqs: getAllMCQs(course),
  };

  if (showModeSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <button onClick={() => router.push(`/course/${courseId}`)} className="text-blue-600 hover:text-blue-800 mb-4 inline-block">← Back to Course</button>
          <h1 className="text-3xl font-bold mb-2 text-center">{allMCQsTopic.topicTitle}</h1>
          <p className="text-gray-600 text-center mb-8">{allMCQsTopic.topicDescription}</p>
          <div className="space-y-4 mb-8">
            <QuizModeCard title="Practice Mode" description="Instant feedback" icon="💪" progress={modeProgress.practice} course={course} onSelect={() => { setMode('practice'); setShowModeSelector(false); }} onReset={() => handleResetModeProgress('practice')} />
            <QuizModeCard title="Exam Mode" description="Results at the end" icon="📝" progress={modeProgress.exam} course={course} onSelect={() => { setMode('exam'); setShowModeSelector(false); }} onReset={() => handleResetModeProgress('exam')} />
          </div>
          <div className="text-center text-sm text-gray-500">{allMCQsTopic.mcqs.length} questions</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <QuizDisplay topic={allMCQsTopic} mode={mode} unitId="all-units" courseId={courseId} onComplete={handleQuizComplete} onExit={handleExit} />
    </div>
  );
}

function QuizModeCard({ title, description, icon, progress, course, onSelect, onReset }: { title: string; description: string; icon: string; progress: QuizResult | null; course: Course; onSelect: () => void; onReset: () => void; }) {
  const hasProgress = progress && progress.total > 0;
  return (
    <div className="p-4 border-2 border-gray-200 rounded-xl transition-all hover:border-blue-500 hover:bg-blue-50">
      <div className="flex items-start md:items-center gap-4 flex-col md:flex-row">
        <div className="flex items-center gap-4 flex-grow w-full">
          <div className="text-3xl">{icon}</div>
          <div className="flex-grow">
            <h3 className="font-bold text-lg mb-1">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        <button onClick={onSelect} className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 w-full md:w-auto">{hasProgress ? 'Retry' : 'Start'}</button>
      </div>
      {hasProgress && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="font-semibold">Last Score: {progress.score}/{progress.total} ({progress.percentage}%)</span>
            <button onClick={(e) => { e.stopPropagation(); onReset(); }} className="text-xs text-gray-500 hover:text-red-600 font-semibold">Reset</button>
          </div>
          {progress.unitScores && Object.keys(progress.unitScores).length > 0 && (
              <div className="space-y-2 mt-3">
                  <h4 className="text-sm font-semibold text-gray-700">Performance by Unit:</h4>
                  {Object.entries(progress.unitScores).map(([unitId, unitScore]) => {
                      const unit = course.units.find(u => u.unitId === unitId);
                      if (!unit) return null;
                      const percentage = unitScore.total > 0 ? Math.round((unitScore.score / unitScore.total) * 100) : 0;
                      return (
                          <div key={unitId}>
                              <div className="flex justify-between text-xs mb-1">
                                  <span className="font-medium text-gray-600">{unit.unitTitle}</span>
                                  <span className="font-semibold">{percentage}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                      className={`h-2 rounded-full ${percentage >= 70 ? 'bg-green-500' : percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                      style={{ width: `${percentage}%` }} 
                                      title={`Score: ${unitScore.score}/${unitScore.total}`}>
                                  </div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          )}
        </div>
      )}
    </div>
  );
}


export default function ComprehensiveQuizPageContainer() {
    return <PrivateRoute><ComprehensiveQuizPage /></PrivateRoute>;
}
