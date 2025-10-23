import { render, screen, fireEvent, act } from '@testing-library/react';
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
    // Setup the mock for useFirebase to return the dummy auth object
    (useFirebase as jest.Mock).mockReturnValue({ auth: mockAuth });

    // Provide default mock implementations
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
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^sign up$/i }));
    });
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
  });

  it('calls signInWithEmailAndPassword when the login form is submitted', async () => {
    render(<LoginOrSignupForm />);

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password' } });

    await act(async () => {
      const submitButton = screen.getAllByRole('button', { name: 'Sign In' }).find(btn => btn.getAttribute('type') === 'submit');
      fireEvent.click(submitButton!);
    });

    expect(mockedFirebaseAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'test@example.com', 'password');
  });

  it('calls createUserWithEmailAndPassword when the signup form is submitted', async () => {
    render(<LoginOrSignupForm />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^sign up$/i }));
    });

    fireEvent.change(screen.getByPlaceholderText('Display Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    });

    expect(mockedFirebaseAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(mockAuth, 'test@example.com', 'password');
  });

  it('calls signInWithRedirect when the google sign-in button is clicked', async () => {
    render(<LoginOrSignupForm />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
    });
    expect(mockedFirebaseAuth.signInWithRedirect).toHaveBeenCalled();
  });
});
