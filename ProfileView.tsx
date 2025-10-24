import React, { useMemo } from 'react';
// FIX: Added CourseProgress to the import to be used for type annotations.
import type { Course, ProgressData, Badge, CourseProgress } from '../types';

interface ProfileViewProps {
  courses: Course[];
  progressData: ProgressData;
  onBack: () => void;
}

const MOCK_USER = {
  name: 'Alex Doe',
  email: 'alex.doe@example.com',
  avatar: `https://api.dicebear.com/8.x/initials/svg?seed=Alex`,
};

const BADGE_DEFINITIONS: { id: string; name: string; description: string; icon: string; condition: (courses: Course[], progress: ProgressData) => boolean }[] = [
  // FIX: Added explicit type annotation (prog: CourseProgress) to resolve 'property does not exist on type unknown' error.
  { id: 'perfect-score', name: 'Perfectionist', description: 'Achieved 100% on a quiz.', icon: '🏆', condition: (c, p) => Object.values(p).some((prog: CourseProgress) => prog.quizHistory.some(q => q.percentage === 100)) },
  // FIX: Added explicit type annotation (prog: CourseProgress) to resolve 'property does not exist on type unknown' error.
  { id: 'streak-5', name: 'Dedicated Learner', description: 'Maintained a 5-day study streak.', icon: '🔥', condition: (c, p) => Object.values(p).some((prog: CourseProgress) => prog.currentStreak >= 5) },
  { id: 'course-complete-1', name: 'Course Completer', description: 'Completed your first course.', icon: '🎓', condition: (courses, progress) => courses.some(course => {
      const prog = progress[course.courseId];
      if (!prog) return false;
      const totalTopics = course.units.reduce((sum, unit) => sum + unit.topics.length, 0);
      return totalTopics > 0 && prog.completedTopics.length >= totalTopics;
  })},
  // FIX: Added explicit type annotation (prog: CourseProgress) to resolve 'property does not exist on type unknown' error.
  { id: 'quiz-master-10', name: 'Quiz Master', description: 'Completed 10 quizzes.', icon: '📝', condition: (c, p) => Object.values(p).reduce((sum, prog: CourseProgress) => sum + prog.quizHistory.length, 0) >= 10 },
  // FIX: Added explicit type annotation (prog: CourseProgress) to resolve 'property does not exist on type unknown' error.
  { id: 'xp-500', name: 'XP Enthusiast', description: 'Earned over 500 XP.', icon: '⭐', condition: (c, p) => Object.values(p).reduce((sum, prog: CourseProgress) => sum + prog.totalXP, 0) >= 500 },
];

const ProfileView: React.FC<ProfileViewProps> = ({ courses, progressData, onBack }) => {
  const { totalXp, level, xpForNextLevel, xpInCurrentLevel, earnedBadges } = useMemo(() => {
    // FIX: Added explicit type annotation (p: CourseProgress) to resolve 'property does not exist on type unknown' error.
    const totalXp = Object.values(progressData).reduce((sum, p: CourseProgress) => sum + p.totalXP, 0);
    const xpForNextLevel = 100;
    const level = Math.floor(totalXp / xpForNextLevel) + 1;
    const xpInCurrentLevel = totalXp % xpForNextLevel;

    const earnedBadges = BADGE_DEFINITIONS.filter(badge => badge.condition(courses, progressData));

    return { totalXp, level, xpForNextLevel, xpInCurrentLevel, earnedBadges };
  }, [courses, progressData]);

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <header className="mb-8">
        <button onClick={onBack} className="mb-4 inline-flex items-center text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">User Profile</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          {/* User Info Card */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 text-center">
            <img src={MOCK_USER.avatar} alt="User Avatar" className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-slate-200 dark:border-slate-600" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{MOCK_USER.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{MOCK_USER.email}</p>
          </div>

          {/* Overall Progress Card */}
          <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold mb-4">Overall Progress</h3>
            <div className="text-center">
                <div className="text-sm text-slate-500 dark:text-slate-400">Level {level}</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalXp} XP</div>
            </div>
            <div className="mt-4">
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(xpInCurrentLevel / xpForNextLevel) * 100}%` }}></div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 text-right mt-1">{xpInCurrentLevel} / {xpForNextLevel} XP to next level</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
            {/* Badges Section */}
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold mb-4">Earned Badges</h3>
                {earnedBadges.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {earnedBadges.map(badge => (
                            <div key={badge.id} className="text-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg" title={badge.description}>
                                <div className="text-4xl">{badge.icon}</div>
                                <div className="text-xs font-semibold mt-1">{badge.name}</div>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-sm text-slate-500 dark:text-slate-400">No badges earned yet. Keep learning!</p>}
            </div>

            {/* Course History Section */}
            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold mb-4">Course History</h3>
                <div className="space-y-4">
                    {courses.map(course => {
                        const progress = progressData[course.courseId];
                        const totalTopics = course.units.reduce((sum, unit) => sum + unit.topics.length, 0);
                        const completion = progress && totalTopics > 0 ? Math.round((progress.completedTopics.length / totalTopics) * 100) : 0;
                        return (
                            <div key={course.courseId} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg flex justify-between items-center">
                                <div>
                                    <h4 className="font-semibold">{course.courseTitle}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{progress ? `${progress.totalXP} XP` : 'Not started'}</p>
                                </div>
                                <div className="font-bold text-blue-600 dark:text-blue-400">{completion}%</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;