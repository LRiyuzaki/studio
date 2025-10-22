// components/Timer.tsx
'use client';
import { useEffect, useState } from 'react';

export default function Timer({ 
  duration, 
  onExpire 
}: { 
  duration: number; 
  onExpire: () => void; 
}) {
  const [timeLeft, setTimeLeft] = useState(duration);
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }
    
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, onExpire]);
  
  return (
    <div className="text-right">
      <span className={`text-2xl font-mono p-2 rounded-lg ${timeLeft <= 10 ? 'text-red-600 bg-red-100' : 'text-gray-700 bg-gray-100'}`}>
        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
      </span>
    </div>
  );
}
