'use client';
import { CourseProgress, Badge } from '@/lib/types';
import { getCourse } from '@/lib/storage';
import { useEffect, useState } from 'react';


interface ProgressDashboardProps {
  progress: CourseProgress;
  courseId: string;
}

export default function ProgressDashboard({ progress, courseId }: ProgressDashboardProps) {
  const earnedBadges = progress.badges.filter(b => b.earned);
  const recentQuizzes = progress.quizHistory.slice(-3).reverse();
  const [courseUnits, setCourseUnits] = useState<any[]>([]);

  useEffect(() => {
    const course = getCourse(courseId);
    if(course) {
      setCourseUnits(course.units);
    }
  },[courseId])
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Stats Cards */}
      <div className="col-span-1 lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Level" value={progress.level.toString()} icon="⭐" />
        <StatCard title="Total XP" value={progress.totalXP.toString()} icon="🏅" />
        <StatCard title="Streak" value={`${progress.currentStreak} days`} icon="🔥" />
        <StatCard title="Quizzes" value={progress.quizHistory.length.toString()} icon="✅" />
      </div>
      
      {/* Recent Quizzes */}
      {recentQuizzes.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold mb-4">Recent Quizzes</h3>
          <div className="space-y-3">
            {recentQuizzes.map((quiz, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-sm truncate">{quiz.topicTitle}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(quiz.completedAt).toLocaleDateString()} • {quiz.mode}
                  </div>
                </div>
                <div className={`text-lg font-bold ${
                  quiz.percentage >= 80 ? 'text-green-600' :
                  quiz.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {quiz.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Badges */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4">Badges Earned</h3>
        <div className="space-y-3">
          {earnedBadges.length > 0 ? (
            earnedBadges.map(badge => (
              <div key={badge.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border">
                <span className="text-2xl">{badge.icon}</span>
                <div>
                  <div className="font-semibold">{badge.name}</div>
                  <div className="text-xs text-gray-600">{badge.description}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              <div className="text-4xl mb-2">🏆</div>
              <p className="text-sm">Complete quizzes to earn badges!</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Unit Progress */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold mb-4">Unit Progress</h3>
        <div className="space-y-4">
          {courseUnits.map(unit => {
            const unitProgress = progress.unitProgress[unit.unitId];
            const completionPercentage = unitProgress?.completionPercentage || 0;
            return (
              <div key={unit.unitId}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{unit.unitTitle}</span>
                  <span>{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: string }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-lg text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  );
}
