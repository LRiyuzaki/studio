'use client';

import { useMemo } from 'react';
import { initializeFirebase } from '@/firebase';
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
  const { app, auth, firestore } = useMemo(() => initializeFirebase(), []);

  if (!app) {
    return <>{children}</>;
  }

  return (
    <FirebaseProvider app={app} auth={auth} firestore={firestore}>
        <UserProvider>
            {children}
        </UserProvider>
    </FirebaseProvider>
  );
}
