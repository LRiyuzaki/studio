import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import LoginOrSignupForm from './LoginOrSignupForm';
import { useFirebase } from '@/firebase';
import * as firebaseAuth from 'firebase/auth';

// Mock the useFirebase hook
jest.mock('@/firebase', () => ({
  useFirebase: jest.fn(),
}));

// Mock the firebase/auth module
jest.mock('firebase/auth');
const mockedFirebaseAuth = firebaseAuth as jest.Mocked<typeof firebaseAuth>;


describe('LoginOrSignupForm', () => {
  const mockAuth = {}; // Dummy auth object

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Setup the mock for useFirebase to return the dummy auth object and a dummy firestore object
    (useFirebase as jest.Mock).mockReturnValue({ auth: mockAuth, firestore: {} });

    // Provide default mock implementations
    mockedFirebaseAuth.getRedirectResult.mockResolvedValue(null); // Simulate no redirect result on load
    mockedFirebaseAuth.signInWithEmailAndPassword.mockResolvedValue({} as any);
    mockedFirebaseAuth.createUserWithEmailAndPassword.mockResolvedValue({ user: {} } as any);
    mockedFirebaseAuth.signInWithRedirect.mockResolvedValue({} as any);
    mockedFirebaseAuth.updateProfile.mockResolvedValue(undefined);
  });

  it('renders the login form by default', () => {
    render(<LoginOrSignupForm />);
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  });

  it('switches to the signup form when the signup button is clicked', async () => {
    render(<LoginOrSignupForm />);
    const signUpButton = await screen.findByRole('button', { name: /^sign up$/i });
    await act(async () => {
      fireEvent.click(signUpButton);
    });
    expect(await screen.findByRole('heading', { name: /create an account/i })).toBeInTheDocument();
  });

  it('calls signInWithEmailAndPassword when the login form is submitted', async () => {
    render(<LoginOrSignupForm />);
    fireEvent.change(await screen.findByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(await screen.findByPlaceholderText('Password'), { target: { value: 'password' } });

    const submitButton = await screen.findByTestId('submit-button');
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockedFirebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'test@example.com', 'password');
    });
  });

  it('calls createUserWithEmailAndPassword when the signup form is submitted', async () => {
    render(<LoginOrSignupForm />);
    await act(async () => {
      fireEvent.click(await screen.findByRole('button', { name: /^sign up$/i }));
    });

    fireEvent.change(await screen.findByPlaceholderText('Display Name'), { target: { value: 'Test User' } });
    fireEvent.change(await screen.findByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(await screen.findByPlaceholderText('Password'), { target: { value: 'password' } });

    const createAccountButton = await screen.findByRole('button', { name: 'Create Account' });
    await act(async () => {
      fireEvent.click(createAccountButton);
    });

    await waitFor(() => {
      expect(mockedFirebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'test@example.com', 'password');
    });
  });

  it('calls signInWithRedirect when the google sign-in button is clicked', async () => {
    render(<LoginOrSignupForm />);
    const googleButton = await screen.findByRole('button', { name: /sign in with google/i });
    await act(async () => {
      fireEvent.click(googleButton);
    });
    await waitFor(() => {
      expect(mockedFirebaseAuth.signInWithRedirect).toHaveBeenCalled();
    });
  });
});
