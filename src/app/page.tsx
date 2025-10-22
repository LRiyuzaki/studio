// app/page.tsx
import { redirect } from 'next/navigation';
import { generateMCQs } from '@/lib/gemini';
import { parseFile } from '@/lib/parser';
import MCQDisplay from '@/components/MCQDisplay';

export default function Home({ 
  searchParams 
}: { 
  searchParams: { step?: string; data?: string; message?: string } 
}) {
  const step = searchParams.step || 'upload';
  
  async function handleUpload(formData: FormData) {
    'use server';
    
    const file = formData.get('file') as File;
    if (!file || file.size === 0) {
      redirect(`/?step=error&message=${encodeURIComponent('Please select a file to upload.')}`);
      return;
    }
    const numQuestions = Number(formData.get('numQuestions'));
    
    try {
      const content = await parseFile(file);
      const mcqs = await generateMCQs(content, numQuestions);
      
      const data = encodeURIComponent(JSON.stringify(mcqs));
      redirect(`/?step=quiz&data=${data}`);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      redirect(`/?step=error&message=${encodeURIComponent(errorMessage)}`);
    }
  }
  
  if (step === 'upload') {
    return (
      <main className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">MCQ Generator</h1>
          <form action={handleUpload} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
              <input 
                type="file" 
                name="file" 
                accept=".pdf,.docx,.txt" 
                required 
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
              <input 
                type="number" 
                name="numQuestions" 
                min={1} 
                max={50} 
                defaultValue={5}
                required
                className="block w-full border border-gray-300 p-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Generate MCQs
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (step === 'error') {
     return (
      <main className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Generation Failed</h1>
          <p className="text-gray-700 mb-6">{searchParams.message || 'An unknown error occurred.'}</p>
          <a href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Try Again
          </a>
        </div>
      </main>
    );
  }
  
  try {
    const mcqs = JSON.parse(decodeURIComponent(searchParams.data || '[]'));
    if (!Array.isArray(mcqs) || mcqs.length === 0) {
      throw new Error('Invalid or empty quiz data.');
    }
    return <MCQDisplay mcqs={mcqs} />;
  } catch (error) {
     const errorMessage = error instanceof Error ? error.message : 'Could not load quiz data.';
     redirect(`/?step=error&message=${encodeURIComponent(errorMessage)}`);
  }
}
