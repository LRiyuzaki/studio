'use client';

import { FirebaseProvider } from '@/firebase/provider';
import { UserProvider } from '@/firebase/auth/use-user';

// This provider is intended to be used in a client component.
// It initializes Firebase on the client and provides it to its children.
// It should be used as a wrapper around the app's root layout.
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseProvider>
        <UserProvider>
            {children}
        </UserProvider>
    </FirebaseProvider>
  );
}