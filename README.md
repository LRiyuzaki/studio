# QuizCraft Architect

QuizCraft Architect is a modern, intelligent web application for creating, managing, and taking multiple-choice quizzes. It features a clean user interface, persistent progress tracking, gamification elements, and AI-powered study suggestions to provide a powerful and engaging learning experience.

Built with a modern tech stack, this application serves as a robust foundation for any educational platform.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [How It Works](#how-it-works)
  - [State Management with Zustand](#state-management-with-zustand)
  - [Adding a New Quiz](#adding-a-new-quiz)
  - [AI-Powered Suggestions](#ai-powered-suggestions)
- [Key Components](#key-components)

---

## Features

-   **Persistent Quiz Library**: Add and manage multiple quizzes from local JSON files. All quizzes and progress are persisted in the browser's `localStorage`.
-   **Modular Unit System**: Quizzes are automatically organized into distinct study units based on the provided data.
-   **Comprehensive Dashboard**: View overall progress for a quiz and drill down into individual unit statistics.
-   **Live Progress Tracking**: Progress bars for completion and accuracy update in real-time as you answer questions.
-   **Resume Anywhere**: The application saves your progress after every answer, allowing you to close the browser and pick up exactly where you left off.
-   **AI Study Assistant**: After a quiz session, receive personalized study suggestions from a Genkit-powered AI that analyzes your performance to identify weak spots.
-   **Gamified Timer Mode**: An optional timer adds a layer of challenge, calculating a dynamic time-per-question based on the quiz's total length.

---

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
-   **AI Integration**: [Genkit](https://firebase.google.com/docs/genkit)
-   **Icons**: [Lucide React](https://lucide.dev/)

---

## Project Structure

The project follows a standard Next.js App Router structure with some key directories:

```
src
├── ai/
│   ├── flows/                  # Contains Genkit AI flows (e.g., study suggestions)
│   └── genkit.ts               # Genkit configuration
├── app/
│   ├── globals.css             # Global styles and Tailwind directives
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main entry point and component for the application
├── components/
│   ├── ui/                     # Reusable UI components from ShadCN
│   └── *.tsx                   # Application-specific components (e.g., Dashboard, QuizRunner)
├── hooks/
│   └── use-toast.ts            # Custom hook for toast notifications
├── lib/
│   ├── actions.ts              # Server Actions for calling AI flows
│   ├── quiz-parser.ts          # Logic for parsing quiz JSON into units
│   ├── store.ts                # Zustand store for global state management
│   ├── types.ts                # TypeScript type definitions
│   └── utils.ts                # Utility functions (e.g., `cn` for classnames)
└── ...
```

---

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run the Development Server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

---

## How It Works

### State Management with Zustand

The application's state is managed centrally by a **Zustand store** defined in `src/lib/store.ts`. This approach avoids prop-drilling and ensures a single source of truth for all quiz data and user progress.

The store is configured with `persist` middleware, which automatically saves the entire state (`quizzes`, `allProgress`, `isTimerEnabled`, etc.) to `localStorage` on every change. When the app loads, this data is rehydrated, providing a seamless experience across browser sessions.

**Key Actions in the Store:**

-   `addQuiz`: Adds a new quiz to the state.
-   `deleteQuiz`: Removes a quiz and its associated progress.
-   `addSessionAnswer`: The core action for progress tracking. It's called for every answer, updating the relevant unit's progress and recalculating completion and accuracy.
-   `resetProgress`: Clears progress for a specific unit or an entire quiz.

### Adding a New Quiz

To add a new quiz, you must provide a JSON file.

1.  Click the **"Add New Quiz"** button on the main library screen.
2.  Provide a name for the quiz and upload a JSON file that contains an array of question objects.

**Required JSON Format for Questions:**

Each question object in the array must have the following structure:

```json
{
  "question_id": "string",
  "topic": "string",
  "question_text": "string",
  "options": [
    { "id": "string", "text": "string", "is_correct": boolean },
    { "id": "string", "text": "string", "is_correct": boolean }
  ],
  "correct_answer": "string (must match the id of the correct option)",
  "study_unit": {
    "number": number,
    "name": "string"
  },
  "explanation": "string"
}
```

### AI-Powered Suggestions

The AI functionality is powered by **Genkit**.

-   The flow is defined in `src/ai/flows/personalized-study-suggestions.ts`.
-   It accepts a student's performance data (accuracy, response time per unit) as input.
-   It uses a Genkit prompt to instruct an LLM to act as an AI study assistant and identify the top 3 units that need review, providing a reason for each suggestion.
-   This flow is called via a Next.js Server Action in `src/lib/actions.ts` and displayed on the results page.

---

## Key Components

-   **`QuizLibrary`**: Displays all available quizzes and allows users to add, open, or delete them.
-   **`Dashboard`**: The main hub for a selected quiz. It shows overall progress and lists all study units in `UnitCard` components.
-   **`UnitCard`**: A card representing a single study unit, displaying its completion and accuracy progress bars.
-   **`QuizRunner`**: The main quiz interface. It manages the flow of questions, handles user answers, and displays the `QuestionCard`.
-   **`QuestionCard`**: Renders a single question, its options, and provides immediate feedback and an explanation after an answer is submitted.
-   **`ResultsPage`**: Displays a summary of the quiz session's performance and the AI-powered study suggestions.
