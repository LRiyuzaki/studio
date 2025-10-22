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

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

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
