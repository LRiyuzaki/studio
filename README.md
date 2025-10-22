# CourseMaster - JSON MCQ Platform

CourseMaster is a Next.js application that transforms structured JSON files into interactive, gamified learning experiences. Users can upload course content containing units, topics, and multiple-choice questions (MCQs) to dynamically generate a full-featured course platform.

The application is designed to run entirely on the client-side, using the browser's IndexedDB for course storage and `localStorage` for progress tracking, requiring no backend or database setup.

## ✨ Core Features

-   **Dynamic Course Creation**: Upload a structured JSON file and instantly get a fully interactive course.
-   **Hierarchical Content**: Supports a `Units` → `Topics` → `MCQs` structure.
-   **Multiple Quiz Modes**: Engage with content in different ways:
    -   **Study Mode**: Learn with instant explanations after each question.
    -   **Practice Mode**: Test your knowledge with immediate feedback.
    -   **Timed Mode**: Challenge yourself with a 30-second timer per question.
    -   **Test Mode**: Simulate an exam with results only at the end.
-   **Comprehensive Quiz Menu**: Take a quiz covering all topics in a course from a central menu.
-   **Gamification**: Earn XP, level up, unlock badges for achievements, and build a study streak.
-   **Rich Progress Tracking**: Monitor completion percentages, quiz history, and performance analytics.
-   **Client-Side Storage**: Uses IndexedDB to handle large course files and `localStorage` for progress, making it fast and offline-friendly.
-   **Progress Export**: Users can export their course progress as a JSON file.

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/en/) (v18.x or later recommended)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd json-course-mcq-platform
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```

4.  **Open the application:**
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
/src
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Homepage: JSON upload and course library
│   └── course/
│       ├── [courseId]/
│       │   ├── page.tsx              # Course dashboard and unit overview
│       │   └── quiz/
│       │       ├── [topicId]/page.tsx  # Quiz page for a specific topic
│       │       └── page.tsx          # Centralized comprehensive quiz menu
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout
│
├── components/           # Reusable React components
│   ├── ProgressDashboard.tsx # Displays user stats (XP, level, badges)
│   ├── QuizDisplay.tsx   # Core UI for presenting questions and options
│   └── Timer.tsx         # Timer component for timed quizzes
│
└── lib/                    # Core logic, types, and utilities
    ├── course-parser.ts  # Handles validation and parsing of course JSON
    ├── idb.ts            # IndexedDB setup and helpers
    ├── storage.ts        # Functions for storing/retrieving data (courses, progress)
    └── types.ts          # TypeScript type definitions for the application
```

##  D-Z-059

The platform expects a specific JSON structure to build a course. The application supports two main schemas:

### 1. Hierarchical Schema (Preferred)

This structure is organized and easy to author.

```json
{
  "courseTitle": "Introduction to Machine Learning",
  "courseDescription": "A complete ML fundamentals course.",
  "courseId": "ml-101",
  "units": [
    {
      "unitId": "unit-1",
      "unitTitle": "Supervised Learning",
      "unitDescription": "Learn about supervised ML algorithms.",
      "topics": [
        {
          "topicId": "topic-1-1",
          "topicTitle": "Linear Regression",
          "topicDescription": "Understanding linear models.",
          "mcqs": [
            {
              "questionId": "q1",
              "question": "What is linear regression used for?",
              "options": [
                "A) Classification",
                "B) Regression",
                "C) Clustering",
                "D) Dimensionality reduction"
              ],
              "correct": "B",
              "explanation": "Linear regression predicts continuous values.",
              "difficulty": "easy",
              "points": 10
            }
          ]
        }
      ]
    }
  ]
}
```

### 2. Flat List Schema

The application can also dynamically build a course from a flat list of questions. The parser will group questions into units and topics automatically based on the `study_unit` and `topic` fields.

```json
{
  "questions": [
    {
      "question_id": "94850116",
      "topic": "Use of Prior Returns",
      "question_text": "Layla is self-employed and expects to owe $2,500 of taxes...",
      "options": [
        { "id": "A", "text": "...", "is_correct": false },
        { "id": "B", "text": "...", "is_correct": false },
        { "id": "C", "text": "...", "is_correct": true },
        { "id": "D", "text": "...", "is_correct": false }
      ],
      "correct_answer": "C",
      "study_unit": { "number": 1, "name": "Preliminary Work" },
      "explanation": "Since Layla had zero tax liability...",
      "difficulty": 2
    }
  ]
}
```

## 🛠️ How It Works

1.  **JSON Upload**: On the homepage, the user uploads a JSON file.
2.  **Parsing & Validation**: `lib/course-parser.ts` validates the JSON structure. If it's a flat list, it normalizes it into the hierarchical course structure.
3.  **Storage**: The parsed `Course` object is saved to IndexedDB via `lib/idb.ts` and `lib/storage.ts`.
4.  **Course Dashboard**: The user is redirected to the course page, which displays units, topics, and a progress dashboard.
5.  **Quiz Taking**: Clicking a topic starts a quiz. The `QuizDisplay` component handles rendering questions, validating answers, and showing explanations based on the selected `QuizMode`.
6.  **Progress Update**: After a quiz, `lib/storage.ts` updates the user's progress in `localStorage`, calculating XP, updating streaks, and checking for new badges.
