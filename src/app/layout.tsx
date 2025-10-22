import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MCQ Generator',
  description: 'Generate multiple-choice quizzes from your documents.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
