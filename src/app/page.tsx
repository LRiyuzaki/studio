'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/firebase/auth/google-auth';
import { signInWithEmail, signUpWithEmail } from '@/firebase/auth/email-password-auth';
import { Loader2, BrainCircuit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

<<<<<<< HEAD
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
=======
  // Zustand state selectors
  const {
    quizzes,
    allProgress,
    activeQuizId,
    isTimerEnabled,
    addQuiz,
    deleteQuiz,
    setActiveQuizId,
    startSession,
    finishSession,
    toggleTimer,
    resetProgress,
  } = useQuizStore();
  
  const activeQuiz = useMemo(() => quizzes.find(q => q.id === activeQuizId), [quizzes, activeQuizId]);
>>>>>>> 7849063b14f3c5f108cbc395d1eb30f53a47e740

  const handleEmailSignUp = async () => {
    setIsSubmitting(true);
    try {
      await signUpWithEmail(email, password);
      // The useEffect will handle redirection on user state change
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
<<<<<<< HEAD

  const handleEmailSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithEmail(email, password);
      // The useEffect will handle redirection on user state change
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
=======
  
  const calculatePerformance = (answers: UserAnswer[]) => {
    if (!activeQuiz) return { totalQuestions: 0, attemptedQuestions: 0, correctAnswers: 0, accuracy: 0, performanceByUnit: [] };
    
    const relevantAnswers = answers.filter(answer => 
        questionsForSession.some(q => q.question_id === answer.questionId)
    );

    const attemptedQuestions = relevantAnswers.length;
    const correctAnswers = relevantAnswers.filter(a => a.isCorrect).length;
    const accuracy = attemptedQuestions > 0 ? (correctAnswers / attemptedQuestions) * 100 : 0;

    const performanceByUnit = activeQuiz.units.map(unit => {
      const unitQuestionIds = new Set(unit.questions.map(q => q.question_id));
      const unitAnswers = answers.filter(a => unitQuestionIds.has(a.questionId));
      
      const unitAttempted = unitAnswers.length;
      const unitCorrect = unitAnswers.filter(a => a.isCorrect).length;
      const unitAccuracy = unitAttempted > 0 ? (unitCorrect / unitAttempted) * 100 : 0;
      const totalResponseTime = unitAnswers.reduce((sum, a) => sum + a.responseTime, 0);
      const averageResponseTime = unitAttempted > 0 ? (totalResponseTime / unitAttempted) / 1000 : 0;

      return {
        studyUnit: { number: unit.unitNumber, name: unit.unitName },
        questionsAttempted: unitAttempted,
        questionsCorrect: unitCorrect,
        accuracy: parseFloat(unitAccuracy.toFixed(1)),
        averageResponseTime: parseFloat(averageResponseTime.toFixed(2)),
      };
    }).filter(p => questionsForSession.some(q => q.study_unit.number === p.studyUnit.number)); // Only include units in the current session

    return {
      totalQuestions: questionsForSession.length,
      attemptedQuestions,
      correctAnswers,
      accuracy: parseFloat(accuracy.toFixed(1)),
      performanceByUnit,
    };
  }

  const handleQuizFinish = () => {
    finishSession(); // This will now correctly merge progress in the store
    const quizProgress = useQuizStore.getState().allProgress[activeQuizId!] || {};
    const allAnswersForQuiz = Object.values(quizProgress).flatMap((p: any) => p.answers);
    const result = calculatePerformance(allAnswersForQuiz);
    setSessionResult(result);
    setView('results');
  };
  
  const handleGoToDashboard = () => {
    setView('dashboard');
    setSessionResult(null);
  };
  
  const handleBackToLibrary = () => {
    setActiveQuizId(null);
    setView('dashboard');
  };
  
  const renderDashboard = () => {
    if (activeQuiz) {
      return (
        <Dashboard 
          quiz={activeQuiz} 
          onStartQuiz={handleStartQuiz} 
          onBack={handleBackToLibrary}
          timerEnabled={isTimerEnabled}
          onTimerToggle={toggleTimer}
          progress={allProgress[activeQuiz.id] || {}}
          onResetProgress={handleResetUnitProgress}
        />
      );
>>>>>>> 7849063b14f3c5f108cbc395d1eb30f53a47e740
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      // The useEffect will handle redirection on user state change
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.message,
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-muted/30 font-body antialiased flex items-center justify-center p-4">
      {loading || user ? (
        <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <BrainCircuit className="mx-auto h-16 w-16 text-primary mb-4" />
                <h1 className="text-3xl font-bold text-primary font-headline mb-2">QuizCraft Architect</h1>
                <p className="text-muted-foreground">
                    An intelligent MCQ renderer with gamification and analytics.
                </p>
            </div>

            <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sign In</CardTitle>
                            <CardDescription>Enter your credentials to access your account.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="signin-email">Email</Label>
                                <Input id="signin-email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={isSubmitting}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signin-password">Password</Label>
                                <Input id="signin-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} disabled={isSubmitting}/>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                            <Button className="w-full" onClick={handleEmailSignIn} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Sign In
                            </Button>
                            <div className="relative w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                    Or continue with
                                    </span>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting}>
                                Sign in with Google
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                <TabsContent value="signup">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sign Up</CardTitle>
                            <CardDescription>Create a new account to get started.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="signup-email">Email</Label>
                                <Input id="signup-email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={isSubmitting}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-password">Password</Label>
                                <Input id="signup-password" type="password" required value={password} onChange={e => setPassword(e.target.value)} disabled={isSubmitting}/>
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                            <Button className="w-full" onClick={handleEmailSignUp} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Create Account
                            </Button>
                            <div className="relative w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                    Or sign up with
                                    </span>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting}>
                                Sign up with Google
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
            <p className="px-8 text-center text-sm text-muted-foreground mt-6">
                By clicking continue, you agree to our imaginary{" "}
                <a href="/terms" className="underline underline-offset-4 hover:text-primary">
                    Terms of Service
                </a>
                .
            </p>
        </div>
      )}
    </main>
  );
}
