'use client';

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public readonly context: SecurityRuleContext;
  public readonly serverError?: Error;

  constructor(context: SecurityRuleContext, serverError?: Error) {
    const message = `Firestore Permission Error: Your client does not have permission to ${context.operation} the document at '${context.path}'.`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
    this.serverError = serverError;

    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}
