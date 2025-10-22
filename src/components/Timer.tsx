'use client';
import { useEffect, useState } from 'react';

interface TimerProps {
  duration: number;
  onExpire: () => void;
  paused?: boolean;
  mode?: 'quiz' | 'question';
}

export default function Timer({ duration, onExpire, paused = false, mode = 'quiz' }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }
    
    if (paused) return;
    
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, paused, onExpire]);
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const percentage = (timeLeft / duration) * 100;
  
  return (
    <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow-sm border">
      <div className={`text-lg font-mono font-bold ${
        timeLeft <= 10 ? 'text-red-600' : 'text-gray-700'
      }`}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>
      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${
            percentage > 50 ? 'bg-green-500' :
            percentage > 20 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-gray-500 capitalize">{mode}</span>
    </div>
  );
}
