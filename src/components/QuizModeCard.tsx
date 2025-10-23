'use client';
import { Course, QuizResult } from '@/lib/types';

interface QuizModeCardProps {
  title: string;
  description: string;
  icon: string;
  progress: QuizResult | null;
  course: Course;
  onSelect: () => void;
  onReset: () => void;
}

export function QuizModeCard({ title, description, icon, progress, course, onSelect, onReset }: QuizModeCardProps) {
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
