'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import type { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';


export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error("Caught a Firestore Permission Error:", error);
      
      // In a real dev environment, we'd use the Next.js error overlay.
      // For this environment, we'll use a detailed toast.
      toast({
          variant: "destructive",
          title: "Firestore Permission Denied",
          description: (
              <div className="text-xs font-mono">
                  <p><b>Operation:</b> {error.context.operation}</p>
                  <p><b>Path:</b> {error.context.path}</p>
                  <p className="mt-2">Check your Firestore Security Rules to grant access.</p>
                  {error.context.requestResourceData && (
                      <details className="mt-2">
                          <summary>Request Data</summary>
                          <pre className="text-xs bg-black/20 p-2 rounded mt-1 overflow-auto max-h-40">
                              {JSON.stringify(error.context.requestResourceData, null, 2)}
                          </pre>
                      </details>
                  )}
              </div>
          ),
          duration: 20000, 
      });
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.removeListener('permission-error', handleError);
    };
  }, [toast]);

  return null; // This component does not render anything
}
