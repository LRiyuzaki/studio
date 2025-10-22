
# QuizCraft Architect

QuizCraft Architect is a web application that allows users to create, manage, and take quizzes. It's built with Next.js and uses local storage to persist quiz data and user progress.

## Features

- **Quiz Library:** View all your quizzes in one place.
- **Add Quizzes:** Easily add new quizzes by uploading a JSON file.
- **Quiz Runner:** Take quizzes with a clean and intuitive interface.
- **Progress Tracking:** Keep track of your progress for each quiz and unit.
- **Timer Mode:** Challenge yourself by enabling a timer for your quiz sessions.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/quizcraft-architect.git
   ```
2. Navigate to the project directory:
   ```bash
   cd quizcraft-architect
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```

### Running the Application

To run the application in development mode, use the following command:

```bash
npm run dev
```

This will start the development server at `http://localhost:9002`.

## Usage

### Adding a Quiz

1. Click the "Add New Quiz" button on the dashboard.
2. Enter a name for your quiz.
3. Upload a JSON file containing your quiz questions. The JSON file should be an array of questions, or an object with a "questions" array. Each question should have the following format:

```json
{
  "question_id": "1",
  "question_text": "What is the capital of France?",
  "options": [
    { "id": "A", "text": "Paris" },
    { "id": "B", "text": "London" },
    { "id": "C", "text": "Berlin" },
    { "id": "D", "text": "Madrid" }
  ],
  "correct_answer": "A",
  "study_unit": {
    "number": 1,
    "name": "Geography"
  }
}
```

### Taking a Quiz

1. From the quiz library, click the "Open" button on the quiz you want to take.
2. On the dashboard, you can choose to practice all units or a specific unit.
3. You can also enable the timer for an extra challenge.
4. Click the "Practice" or "Continue" button to start the quiz.

## Running Tests

To run the tests, use the following command:

```bash
npm test
```
