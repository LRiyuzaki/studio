# CourseMaster: The Ultimate JSON to MCQ Course Platform

CourseMaster is a powerful, client-side application that transforms structured JSON files into beautiful, interactive, and gamified learning experiences. Simply upload your course content, and CourseMaster instantly generates a full-featured course platform with units, topics, multiple-choice questions (MCQs), and sophisticated progress tracking.

The entire application runs in the browser, leveraging IndexedDB for robust course storage and `localStorage` for tracking user progress. This means no backend, no database setup, and a fast, offline-capable experience.

## ✨ Core Features

-   **Dynamic Course Creation**: Upload a structured JSON file and get a fully interactive course in seconds.
-   **Hierarchical Content**: Organizes content into a clear `Units` → `Topics` → `MCQs` structure.
-   **Multiple Quiz Modes**: Engage with content in different ways:
    -   **🧠 Practice Mode**: Learn interactively with instant feedback. Select an answer to see if it's correct or not, with the ability to retry until you find the right one. A "Show Answer" button is available if you're stuck.
    -   **📘 Study Mode**: A guided review where all correct answers and explanations are shown upfront. Perfect for revision.
    -   **📝 Exam Mode**: Simulate a real test. Answers are locked in on the first click, and results are only shown at the end.
-   **Comprehensive Quiz Menu**: Launch a single quiz that pulls questions from every topic in the course, with the ability to choose your preferred quiz mode.
-   **Rich Progress Tracking**:
    -   **Unit Progress Bars**: See your completion percentage for each unit directly on the course dashboard.
    -   **Quiz Performance**: Track correct vs. incorrect answers in real-time during quizzes.
    -   **Topic Status**: Completed topics are marked with a checkmark for clear visual feedback.
-   **Client-Side Storage**: Uses the browser's IndexedDB to handle large course files and `localStorage` for progress, ensuring a fast and private experience.
-   **Progress Management**:
    -   **Reset Progress**: Start a course over from scratch without deleting it.
    -   **Export Progress**: Download a JSON file of your quiz history and achievements.

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/en/) (v18.x or later)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd course-master-app
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

## ⚙️ How the Application Works

### 1. Uploading a Course

The journey begins on the homepage. You can either drag and drop a JSON file into the upload area or click to select one from your computer. The application will instantly parse the file, validate its structure, save it to the browser's IndexedDB, and redirect you to the newly created course dashboard.

### 2. The Course Dashboard

This is your central hub for the course. From here, you can:
-   View the course title and description.
-   See a summary of total units, topics, and questions.
-   Navigate through the units and their topics.
-   Track your completion percentage for each unit via the integrated progress bars.
-   Launch a **Comprehensive Quiz** covering all topics.
-   **Manage your course**: Reset your progress or delete the course entirely.

### 3. Taking a Quiz

-   **Topic Quizzes**: Click on any topic to start a quiz for that specific set of questions. By default, these start in **Practice Mode** to encourage learning.
-   **Comprehensive Quiz**: Click the "Start Comprehensive Quiz" button to go to a menu where you can choose your desired mode (Study, Practice, or Exam) for a quiz covering all questions in the course.

### 4. Progress and Persistence

Your progress is automatically saved in the browser's `localStorage` as you complete quizzes. This includes which topics you've mastered, your quiz history, and your scores. Because all data is stored locally, you can close your browser and come back later to find your courses and progress exactly as you left them.

## 📋 JSON Schema Specification

The platform expects a specific JSON structure to build a course. The application is smart and supports two different schemas.

### Schema 1: Hierarchical Structure (Preferred)

This is the ideal format, as it gives you full control over the course structure.

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

### Schema 2: Flat Question List (Automatic Conversion)

If you have a simple list of questions, the application can automatically build a course structure for you. The parser will group questions into units and topics based on the `study_unit` and `topic` fields.

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
      "explanation": "...",
      "difficulty": 2
    }
  ]
}
```

### Modifying the Schema

-   **IDs**: `courseId`, `unitId`, `topicId`, and `questionId` should be unique strings. The parser relies on these to track progress.
-   **MCQ Options**: The `options` array should contain the full text of each choice. The `correct` field should correspond to the letter of the correct option (e.g., "A", "B", "C").
-   **Difficulty & Points**: These are optional fields but are used to calculate XP and can add a gamified layer to the experience. `difficulty` can be `"easy"`, `"medium"`, or `"hard"`.

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
│   ├── QuizDisplay.tsx   # Core UI for presenting questions and options
│   └── Timer.tsx         # Timer component for timed quizzes
│
└── lib/                    # Core logic, types, and utilities
    ├── course-parser.ts  # Handles validation and parsing of course JSON
    ├── idb.ts            # IndexedDB setup and helpers
    ├── storage.ts        # Functions for storing/retrieving data
    └── types.ts          # TypeScript type definitions
```
