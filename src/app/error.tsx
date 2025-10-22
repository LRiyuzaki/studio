// app/error.tsx
'use client'; 

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Something went wrong!</h2>
        <p className="text-gray-700 mb-6">{error.message}</p>
        <button
          onClick={() => reset()}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
