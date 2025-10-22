// components/ResultExport.tsx
'use client';
import { jsPDF } from 'jspdf';
import type { MCQ } from '@/lib/types';

export default function ResultExport({ 
  mcqs, 
  score 
}: { 
  mcqs: MCQ[]; 
  score: number; 
}) {
  const percentage = mcqs.length > 0 ? Math.round((score / mcqs.length) * 100) : 0;
  
  const exportTXT = () => {
    const content = `
MCQ Quiz Results
================
Score: ${score}/${mcqs.length} (${percentage}%)

Questions:
${mcqs.map((q, i) => `${i + 1}. ${q.question}\n   Correct: ${q.options.find(opt => opt.startsWith(q.correct))}`).join('\n\n')}
    `.trim();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz-results.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('Quiz Results', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text(`Final Score: ${score} / ${mcqs.length} (${percentage}%)`, 105, 30, { align: 'center' });

    doc.setFontSize(12);
    let y = 45;
    mcqs.forEach((q, i) => {
        if (y > 280) {
            doc.addPage();
            y = 15;
        }
        const questionText = `${i + 1}. ${q.question}`;
        const splitQuestion = doc.splitTextToSize(questionText, 180);
        doc.text(splitQuestion, 15, y);
        y += (splitQuestion.length * 5) + 2;

        const correctOption = `   Correct Answer: ${q.options.find(opt => opt.startsWith(q.correct))}`;
        const splitAnswer = doc.splitTextToSize(correctOption, 170);
        doc.text(splitAnswer, 20, y);
        y += (splitAnswer.length * 5) + 8;
    });

    doc.save('quiz-results.pdf');
  };
  
  return (
    <main className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto text-center bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">Quiz Complete!</h1>
        <p className="text-6xl font-bold mb-8" style={{color: percentage >= 80 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444' }}>{percentage}%</p>
        <p className="text-xl mb-8 text-gray-600">
          You scored {score} out of {mcqs.length}
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={exportTXT}
            className="w-full sm:w-auto bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-semibold transition"
          >
            Export TXT
          </button>
          <button 
            onClick={exportPDF}
            className="w-full sm:w-auto bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 font-semibold transition"
          >
            Export PDF
          </button>
          <a 
            href="/"
            className="w-full sm:w-auto inline-block bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 font-semibold transition text-center"
          >
            New Quiz
          </a>
        </div>
      </div>
    </main>
  );
}
