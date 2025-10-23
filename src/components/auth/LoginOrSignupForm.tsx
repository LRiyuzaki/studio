'use client';
import { useState } from 'react';
import { useFirebase } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  updateProfile,
} from 'firebase/auth';

/**
 * A form component for user login and signup.
 * It supports email/password and Google sign-in.
 * @returns {JSX.Element} The rendered login/signup form.
 */
export default function LoginOrSignupForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { auth } = useFirebase();

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!auth) {
      setError('Firebase is not initialized.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          await updateProfile(userCredential.user, { displayName });
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    if (!auth) {
      setError('Firebase is not initialized.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      if ((err as any).code !== 'auth/popup-closed-by-user') {
        setError(err.message);
      }
    } finally {
      // Don't set loading to false, as a redirect is in progress.
    }
  };

  return (
    <div className="w-full max-w-md p-4 sm:p-0">
        <div className="flex border-b border-gray-200 mb-6">
            <button
                onClick={() => setIsLogin(true)}
                className={`w-1/2 py-3 font-semibold text-center ${isLogin ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
                Sign In
            </button>
            <button
                onClick={() => setIsLogin(false)}
                className={`w-1/2 py-3 font-semibold text-center ${!isLogin ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            >
                Sign Up
            </button>
        </div>

        <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">{isLogin ? 'Welcome Back' : 'Create an Account'}</h1>
            <p className="text-gray-600">
            {isLogin ? 'Sign in to access your courses' : 'Join to start your learning journey'}
            </p>
        </div>
        
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 sm:py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.519-3.354-11.088-7.962l-6.571 4.819C9.656 39.663 16.318 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.021 35.846 44 30.138 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
          </svg>
          {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
        </button>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="px-4 text-gray-500 text-sm">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <form onSubmit={handleAuthAction} className="space-y-4">
          {!isLogin && (
            <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display Name"
                required
                className="w-full px-4 py-2 sm:py-2.5 border rounded-lg"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-4 py-2 sm:py-2.5 border rounded-lg"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-4 py-2 sm:py-2.5 border rounded-lg"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>
    </div>
  );
}
