import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'EAIZY Learn - MCQ & Mock Exam Platform',
  description: 'Your personal Plug and play app for creating and mastering MCQ and mock Exams.',
};

/**
 * The root layout for the application.
 * It wraps the application in a Firebase client provider and sets the viewport.
 * @param {{ children: React.ReactNode }} props - The props for the RootLayout component.
 * @returns {JSX.Element} The rendered RootLayout component.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <FirebaseClientProvider>{children}</FirebaseClientProvider>
      </body>
    </html>
  );
}
