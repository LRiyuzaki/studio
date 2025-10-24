
import React, { useState, useEffect, useCallback } from 'react';
import type { 
  Course, RawQuestion, ProgressData, CourseProgress, 
  QuizState, QuizResults, MCQ, Unit, Topic 
} from './types';
import { transformQuestionsToCourse } from './lib/parser';
import HomeView from './components/HomeView';
import CourseView from './components/CourseView';
import QuizView from './components/QuizView';
import ResultsView from './components/ResultsView';
import ProfileView from './components/ProfileView';

const XP_CONFIG = { perCorrect: 10, perfectBonus: 50 };

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'course' | 'quiz' | 'results' | 'profile'>('home');
  const [courses, setCourses] = useState<Course[]>([]);
  const [progressData, setProgressData] = useState<ProgressData>({});
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<QuizState | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [courseToReset, setCourseToReset] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedCourses = localStorage.getItem('mcq_courses');
      const savedProgress = localStorage.getItem('mcq_progress');
      if (savedCourses) setCourses(JSON.parse(savedCourses));
      if (savedProgress) setProgressData(JSON.parse(savedProgress));
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    // This effect runs after initial data is loaded from localStorage
    if (courses.length === 0) return; // Don't run if courses aren't loaded yet

    const activeQuizData = localStorage.getItem('mcq_active_quiz');
    if (activeQuizData) {
      const activeQuiz: QuizState = JSON.parse(activeQuizData);
      if (!activeQuiz.isComplete) {
        if (window.confirm('You have an unfinished quiz. Would you like to resume?')) {
          const course = courses.find(c => c.units.some(u => u.topics.some(t => t.topicId === activeQuiz.topicId || u.unitId === activeQuiz.topicId) || activeQuiz.topicId === 'all-shuffled'));
          if(course) {
            setCurrentCourse(course);
            setCurrentQuiz(activeQuiz);
            setView('quiz');
          } else {
             // The course for this quiz no longer exists
             localStorage.removeItem('mcq_active_quiz');
          }
        } else {
          localStorage.removeItem('mcq_active_quiz');
        }
      }
    }
  }, [courses]); // Depend on courses to ensure it runs after they are loaded

  const saveData = useCallback((newCourses: Course[], newProgress: ProgressData) => {
    try {
      localStorage.setItem('mcq_courses', JSON.stringify(newCourses));
      localStorage.setItem('mcq_progress', JSON.stringify(newProgress));
    } catch (error)
    {
      console.error("Failed to save data to localStorage", error);
    }
  }, []);
  
  const handleSetCourses = (newCourses: Course[]) => {
    setCourses(newCourses);
    saveData(newCourses, progressData);
  }

  const handleSetProgressData = (newProgressData: ProgressData) => {
    setProgressData(newProgressData);
    saveData(courses, newProgressData);
  }

  const handleCreateCourse = (questions: RawQuestion[], title: string) => {
    const newCourse = transformQuestionsToCourse(questions, title);
    const newCourses = [...courses, newCourse];
    handleSetCourses(newCourses);
  };
  
  const handleSelectCourse = (courseId: string) => {
    const course = courses.find(c => c.courseId === courseId);
    if (course) {
      if (!progressData[courseId]) {
        const newProgress: CourseProgress = {
          completedTopics: [], totalXP: 0, currentStreak: 0, lastStudyDate: null, quizHistory: []
        };
        const newProgressData = { ...progressData, [courseId]: newProgress };
        handleSetProgressData(newProgressData);
      }
      setCurrentCourse(course);
      setView('course');
    }
  };

  const handleStartQuiz = (questions: MCQ[], mode: 'topic' | 'unit' | 'all', topicId: string, topicTitle: string) => {
    const activeQuizData = localStorage.getItem('mcq_active_quiz');
    if (activeQuizData) {
        const activeQuiz: QuizState = JSON.parse(activeQuizData);
        if (activeQuiz.topicId === topicId && !activeQuiz.isComplete) {
            if (window.confirm('It looks like you have an unfinished quiz for this topic. Would you like to resume?')) {
                setCurrentQuiz(activeQuiz);
                setView('quiz');
                return;
            }
        }
    }

    // If not resuming, start a new quiz
    localStorage.removeItem('mcq_active_quiz');
    setCurrentQuiz({
      questions,
      currentIndex: 0,
      answers: new Array(questions.length).fill(null),
      startTime: Date.now(),
      mode,
      topicId,
      topicTitle,
      isComplete: false,
      correctCount: 0,
      wrongCount: 0,
    });
    setQuizResults(null);
    setView('quiz');
  };

  const updateCurrentQuizState = (updater: (prevState: QuizState) => QuizState) => {
    setCurrentQuiz(prevState => {
      if (!prevState) return null;
      const newState = updater(prevState);
      // Persist to localStorage on every update
      localStorage.setItem('mcq_active_quiz', JSON.stringify(newState));
      return newState;
    });
  };

  const handleUpdateCurrentIndex = (index: number) => {
    updateCurrentQuizState(prevState => {
        if (!prevState || index < 0 || index >= prevState.questions.length) return prevState;
        return {
            ...prevState,
            currentIndex: index,
        };
    });
  };

  const handleRecordAnswer = (questionIndex: number, userAnswer: string, isCorrect: boolean) => {
      updateCurrentQuizState(prevState => {
          // Only update score and final answer if it's the first attempt for this question in this session
          if (prevState.answers[questionIndex] === null) {
              const newAnswers = [...prevState.answers];
              newAnswers[questionIndex] = userAnswer;
              return {
                  ...prevState,
                  answers: newAnswers,
                  correctCount: prevState.correctCount + (isCorrect ? 1 : 0),
                  wrongCount: prevState.wrongCount + (isCorrect ? 0 : 1),
              };
          }
          return prevState; // No change if already answered
      });
  };

  const handleCompleteQuiz = () => {
    if (!currentQuiz || !currentCourse) return;

    // Mark as complete and save before processing results
    const completedQuizState = { ...currentQuiz, isComplete: true };
    localStorage.setItem('mcq_active_quiz', JSON.stringify(completedQuizState));

    let correctAnswers = 0;
    const review = currentQuiz.questions.map((q, i) => {
      const isCorrect = currentQuiz.answers[i] === q.correct;
      if (isCorrect) correctAnswers++;
      return {
        question: q.question,
        userAnswer: currentQuiz.answers[i],
        correctAnswer: q.correct,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const percentage = Math.round((correctAnswers / currentQuiz.questions.length) * 100);
    let xpEarned = correctAnswers * XP_CONFIG.perCorrect;
    if (percentage === 100) xpEarned += XP_CONFIG.perfectBonus;

    const newResults: QuizResults = { correctAnswers, totalQuestions: currentQuiz.questions.length, percentage, xpEarned, review };
    setQuizResults(newResults);
    
    // Update progress
    const courseId = currentCourse.courseId;
    const progress = { ...(progressData[courseId] || { completedTopics: [], totalXP: 0, currentStreak: 0, lastStudyDate: null, quizHistory: [] }) };
    
    if (currentQuiz.mode === 'topic' && !progress.completedTopics.includes(currentQuiz.topicId) && percentage > 70) {
      progress.completedTopics.push(currentQuiz.topicId);
    }
    progress.totalXP += xpEarned;
    
    // Streak logic
    const today = new Date().toDateString();
    const lastDate = progress.lastStudyDate ? new Date(progress.lastStudyDate).toDateString() : null;
    if (lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastDate === yesterday.toDateString()) {
            progress.currentStreak++;
        } else {
            progress.currentStreak = 1;
        }
        progress.lastStudyDate = new Date().toISOString();
    }
    
    progress.quizHistory.unshift({
      topicId: currentQuiz.topicId,
      topicTitle: currentQuiz.topicTitle,
      score: correctAnswers,
      total: currentQuiz.questions.length,
      percentage,
      completedAt: new Date().toISOString(),
      xpEarned,
      mode: currentQuiz.mode,
    });
    if (progress.quizHistory.length > 20) progress.quizHistory.pop(); // Store more history for better analytics
    
    handleSetProgressData({ ...progressData, [courseId]: progress });
    localStorage.removeItem('mcq_active_quiz');
    setView('results');
  };

  const handleExitQuiz = () => {
    if (window.confirm('Are you sure you want to exit? Your progress will be saved.')) {
        setCurrentQuiz(null);
        setQuizResults(null);
        setView('course');
    }
  };

  const handleBackToCourse = () => {
    setCurrentQuiz(null);
    setQuizResults(null);
    setView('course');
  };

  const handleRetryQuiz = () => {
    if (currentQuiz && currentCourse) {
      localStorage.removeItem('mcq_active_quiz');
      handleStartQuiz(currentQuiz.questions, currentQuiz.mode, currentQuiz.topicId, currentQuiz.topicTitle);
    } else {
      handleBackToHome();
    }
  };

  const handleBackToHome = () => {
    setCurrentCourse(null);
    setCurrentQuiz(null);
    setQuizResults(null);
    localStorage.removeItem('mcq_active_quiz');
    setView('home');
  };
  
  const handleGoToProfile = () => {
    setView('profile');
  };

  const handleDeleteCourse = (courseId: string) => {
    setCourseToDelete(courseId);
  };
  
  const handleResetProgress = (courseId: string) => {
    setCourseToReset(courseId);
  };

  const confirmDeleteCourse = () => {
    if (!courseToDelete) return;

    const newCourses = courses.filter(c => c.courseId !== courseToDelete);
    const newProgressData = { ...progressData };
    delete newProgressData[courseToDelete];
    handleSetCourses(newCourses);
    handleSetProgressData(newProgressData);
    
    setCourseToDelete(null);
    handleBackToHome();
  };
  
  const confirmResetProgress = () => {
      if (!courseToReset) return;
      
      const newProgress: CourseProgress = {
          completedTopics: [], totalXP: 0, currentStreak: 0, lastStudyDate: null, quizHistory: []
      };
      const newProgressData = { ...progressData, [courseToReset]: newProgress };
      handleSetProgressData(newProgressData);
      
      setCourseToReset(null);
  };

  const cancelDeleteCourse = () => {
    setCourseToDelete(null);
  };
  
  const cancelResetProgress = () => {
      setCourseToReset(null);
  }

  const renderView = () => {
    switch (view) {
      case 'course':
        return currentCourse && (
          <CourseView
            course={currentCourse}
            progress={progressData[currentCourse.courseId]}
            onStartQuiz={handleStartQuiz}
            onBackToHome={handleBackToHome}
            onDeleteCourse={() => handleDeleteCourse(currentCourse.courseId)}
            onResetProgress={() => handleResetProgress(currentCourse.courseId)}
            onGoToProfile={handleGoToProfile}
          />
        );
      case 'quiz':
        return currentQuiz && (
          <QuizView
            quiz={currentQuiz}
            onRecordAnswer={handleRecordAnswer}
            onCompleteQuiz={handleCompleteQuiz}
            onExitQuiz={handleExitQuiz}
            onUpdateCurrentIndex={handleUpdateCurrentIndex}
          />
        );
      case 'results':
        return quizResults && (
          <ResultsView
            results={quizResults}
            onRetryQuiz={handleRetryQuiz}
            onBackToCourse={handleBackToCourse}
          />
        );
      case 'profile':
        return (
            <ProfileView 
                courses={courses}
                progressData={progressData}
                onBack={currentCourse ? handleBackToCourse : handleBackToHome}
            />
        );
      case 'home':
      default:
        return (
          <HomeView
            courses={courses}
            progressData={progressData}
            onSelectCourse={handleSelectCourse}
            onCreateCourse={handleCreateCourse}
            onGoToProfile={handleGoToProfile}
          />
        );
    }
  };

  const renderModals = () => (
    <>
      {courseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm m-4 transform transition-all duration-300 scale-100">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Confirm Deletion</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Are you sure you want to delete the course "{courses.find(c => c.courseId === courseToDelete)?.courseTitle}"? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end space-x-4">
              <button onClick={cancelDeleteCourse} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">
                Cancel
              </button>
              <button onClick={confirmDeleteCourse} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
       {courseToReset && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm m-4 transform transition-all duration-300 scale-100">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Confirm Reset</h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Are you sure you want to reset all progress for "{courses.find(c => c.courseId === courseToReset)?.courseTitle}"? Your quiz history and scores will be permanently erased.
            </p>
            <div className="mt-6 flex justify-end space-x-4">
              <button onClick={cancelResetProgress} className="bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">
                Cancel
              </button>
              <button onClick={confirmResetProgress} className="bg-amber-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-amber-600 transition">
                Reset Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <main className="min-h-screen bg-[#F0FAF9] dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      {renderView()}
      {renderModals()}
    </main>
  );
};

export default App;
