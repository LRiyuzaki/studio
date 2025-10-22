'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/firebase/auth/google-auth';
import { Loader2, BrainCircuit } from 'lucide-react';

export default function LoginPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 font-body antialiased flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-background p-8 rounded-xl shadow-lg border text-center">
            <BrainCircuit className="mx-auto h-16 w-16 text-primary mb-4" />
            <h1 className="text-3xl font-bold text-primary font-headline mb-2">QuizCraft Architect</h1>
            <p className="text-muted-foreground mb-8">
                An intelligent MCQ renderer with gamification and analytics.
            </p>
            <Button onClick={signInWithGoogle} size="lg" className="w-full">
                Sign in with Google
            </Button>
            <p className="text-xs text-muted-foreground mt-8">
                By signing in, you agree to our imaginary Terms of Service.
            </p>
        </div>
      </div>
    </main>
  );
}
