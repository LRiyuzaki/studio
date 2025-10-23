# EAIZY Learn: MCQ & Mock Exam Platform

EAIZY Learn is a web application built with Next.js and Firebase that transforms structured JSON files into interactive and gamified learning experiences. Upload your course content, and EAIZY Learn instantly generates a full-featured course platform with units, topics, multiple-choice questions (MCQs), and sophisticated progress tracking powered by a secure Firebase backend.

## ✨ Core Features

-   **Dynamic Course Creation**: Upload a structured JSON file to instantly create a new, fully interactive course.
-   **Secure Cloud Backend**: Uses **Firebase Authentication** for user management and **Firestore** for secure, scalable data storage.
-   **Hierarchical Content**: Organizes content into a clear `Units` → `Topics` → `MCQs` structure.
-   **Multiple Quiz Modes**:
    -   **🧠 Practice Mode**: Learn with instant feedback. Retry questions until you find the right answer.
    -   **📝 Exam Mode**: Simulate a real test. Answers are locked on first click, and results are shown only at the end.
-   **Comprehensive Quiz Menu**: Launch a single quiz that pulls questions from every topic in the course.
-   **Rich Progress Tracking**:
    -   **Unit Progress Bars**: See your completion percentage for each unit on the course dashboard.
    -   **Topic Mastery**: Completed topics are marked with a checkmark for clear visual feedback.
    -   **XP & Levels**: Earn experience points for completing quizzes and level up.
-   **Centralized Dashboard**: View all your courses, track overall stats (total XP, quizzes taken), and upload new content from a single page.

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/en/) (v18.x or later)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
-   A **Firebase Project**

### Firebase Setup

1.  **Create a Firebase Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Enable Authentication**: In your Firebase project, go to **Build > Authentication** and enable the **Email/Password** and **Google** sign-in methods.
3.  **Enable Firestore**: Go to **Build > Firestore Database** and create a database.
4.  **Get Config**: In your project settings, find your web app's Firebase configuration object.
5.  **Update `src/firebase/config.ts`**: Copy your Firebase config object into the `src/firebase/config.ts` file in this project.
6.  **Authorize Domain**: In **Authentication > Settings > Authorized domains**, add `localhost` to the list to enable local development.

### Installation & Local Launch

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd eaizy-learn-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Open the application:**
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## ⚙️ How It Works

### 1. Authentication

The app uses Firebase Authentication. Users can sign up or log in using their email and password or with their Google account. User sessions are securely managed by Firebase.

### 2. Uploading a Course

From the main dashboard, you can upload a course by dragging and dropping a JSON file. The application parses the file, validates its structure, saves it to Firestore under the current user's `ownerId`, and creates an associated progress document for that user.

### 3. Data Model

-   **`/courses/{courseId}`**: Stores the main course structure, including units, topics, and MCQs. Each document has an `ownerId` field linking it to a user.
-   **`/users/{userId}/progress/{courseId}`**: Stores a user's progress for a specific course, including completed topics, quiz history, and total XP.

This separation ensures that course content is stored centrally while user progress is stored privately for each user.

## 📋 JSON Schema Specification

The platform supports two JSON schemas for course creation.

### Schema 1: Hierarchical Structure (Preferred)

This format gives you full control over the course structure.

```json
{
  "courseTitle": "Introduction to Machine Learning",
  "courseDescription": "A complete ML fundamentals course.",
  "courseId": "ml-101",
  "units": [
    {
      "unitId": "unit-1",
      "unitTitle": "Supervised Learning",
      "topics": [
        {
          "topicId": "topic-1-1",
          "topicTitle": "Linear Regression",
          "mcqs": [
            {
              "questionId": "q1",
              "question": "What is linear regression used for?",
              "options": ["A) Classification", "B) Regression"],
              "correct": "B",
              "explanation": "Linear regression predicts continuous values."
            }
          ]
        }
      ]
    }
  ]
}
```

### Schema 2: Flat Question List (Automatic Conversion)

A simple list of questions can be automatically converted into a structured course. The parser will group questions into units and topics based on the `study_unit` and `topic` fields.

## 📁 Project Structure

```
/src
├── app/                  # Next.js App Router pages
│   ├── page.tsx          # Homepage: Login, dashboard, and course upload
│   └── course/
│       ├── [courseId]/
│       │   ├── page.tsx              # Course dashboard and unit/topic overview
│       │   └── quiz/
│       │       ├── [topicId]/page.tsx  # Quiz page for a specific topic
│       │       └── page.tsx          # Comprehensive quiz menu
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout
│
├── components/           # Reusable React components
│   ├── QuizDisplay.tsx   # Core UI for presenting quiz questions
│   └── auth/             # Authentication-related components
│
└── lib/                  # Core logic, types, and utilities
    ├── course-parser.ts  # Handles validation and parsing of course JSON
    ├── hooks.ts          # SWR hooks for efficient data fetching (useCourses, etc.)
    ├── storage.ts        # Firestore data access functions (getCourse, saveProgress, etc.)
    └── types.ts          # TypeScript type definitions for the application
│
└── firebase/             # Firebase configuration and setup
    ├── client-provider.tsx # Client-side provider for Firebase services
    ├── config.ts         # Firebase project configuration (NEEDS to be updated)
    ├── index.ts          # Firebase initialization
    └── provider.tsx      # Core provider for Auth state and Firebase context
```
