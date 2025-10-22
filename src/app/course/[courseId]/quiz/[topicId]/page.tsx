// app/course/[courseId]/quiz/[topicId]/page.tsx
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getCourse, updateProgressAfterQuiz } from '@/lib/storage';
import { getTopicById } from '@/lib/course-parser';
import { Topic } from '@/lib/types';
import Timer from '@/components/Timer';

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const topicId = params.topicId as string;
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());
  
  useEffect(() => {
    if (!courseId || !topicId) return;
    const course = getCourse(courseId);
    if (!course) {
      router.push('/');
      return;
    }
    
    const foundTopic = getTopicById(course, topicId);
    if (!foundTopic) {
      router.push(`/course/${courseId}`);
      return;
    }
    
    setTopic(foundTopic);
  }, [courseId, topicId, router]);
  
  if (!topic) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  
  const handleAnswer = (selected: string) => {
    const currentMCQ = topic.mcqs[currentIndex];
    const isCorrect = selected === currentMCQ.correct;
    let newScore = score;
    if (isCorrect) {
      newScore = score + 1;
      setScore(newScore);
    }
    
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    
    if (currentIndex === topic.mcqs.length - 1) {
      setFinished(true);
      
      const course = getCourse(courseId)!;
      const unitId = course.units.find(u => u.topics.some(t => t.topicId === topicId))?.unitId || '';
      
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      updateProgressAfterQuiz(
        courseId,
        topicId,
        topic.topicTitle,
        unitId,
        newScore,
        topic.mcqs.length,
        newAnswers,
        'test',
        timeSpent
      );
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  if (finished) {
    const percentage = Math.round((score / topic.mcqs.length) * 100);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-2xl">
          <h1 className="text-5xl font-bold mb-4">Quiz Complete! 🎉</h1>
          <div className="text-8xl font-bold text-indigo-600 my-8">{percentage}%</div>
          <p className="text-2xl mb-8">
            You scored {score} out of {topic.mcqs.length}
          </p>
          
          <div className="flex gap-4 justify-center">
            <a
              href={`/course/${courseId}`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-lg"
            >
              Back to Course
            </a>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-8 py-3 rounded-lg"
            >
              Retry Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const current = topic.mcqs[currentIndex];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-sm text-gray-500 mb-1">{topic.topicTitle}</h2>
              <p className="font-semibold">
                Question {currentIndex + 1} of {topic.mcqs.length}
              </p>
            </div>
            <Timer duration={45} onExpire={() => handleAnswer('')} />
          </div>
          
          <h3 className="text-2xl font-bold mb-8">{current.question}</h3>
          
          <div className="space-y-4">
            {current.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(letter)}
                  className="w-full text-left p-6 rounded-xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                >
                  <span className="font-bold">{letter})</span> {opt.replace(/^[A-D]\)\s*/, '')}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
