import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MCQ Course Platform',
  description: 'Create and take interactive courses from a JSON file.',
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
