import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CourseMaster - JSON Course Platform',
  description: 'Transform JSON course content into interactive learning experiences',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
