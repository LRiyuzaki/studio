# **App Name**: QuizCraft Architect

## Core Features:

- JSON Upload and Parsing: Allows users to upload a JSON file containing quiz questions, which is then parsed and normalized to a standardized schema.
- Unit-Based Question Clustering: Groups questions by study unit number, displaying each unit as a card with unit number, name, question count, completion percentage and accuracy, enabling focused study sessions.
- Accurate Answer Validation: Compares the user's selected option ID against the correct answer field to ensure accurate validation, providing immediate feedback with green/red indicators and subtle animations upon selection.
- Adaptive Practice Modes: Offers two practice modes: 'Practice Unit,' focusing on questions within a selected unit in their original JSON order, and 'Practice All Units,' iterating through all questions sequentially from all units.
- Gamified Learning Experience: Rewards XP for correct answers with bonus XP for streaks, tracks streak counters, and unlocks badges for milestones, enhancing user engagement through animated rewards and visual progress indicators.
- Performance Analytics and Insights: Presents a comprehensive performance overview after each session, including total attempted, correct, accuracy percentages, average response time, and per-unit performance breakdowns using client-side visualizations (Recharts). The AI analyzes a student's past responses to suggest areas they may need to focus on with specific study units that function as tools.
- Accessibility and Responsive Design: Ensures the application is fully accessible through keyboard navigation and ARIA roles, with a responsive UI that adapts seamlessly to different screen sizes and devices.

## Style Guidelines:

- Primary color: Light sea green (#20B2AA), evokes feelings of calmness, confidence, and focus, reminiscent of academic settings.
- Background color: Very light green (#F0FAF9), offering a gentle backdrop that minimizes eye strain and maximizes readability during extended study sessions.
- Accent color: Soft coral (#F08080), providing a contrasting color that guides the user's eye towards crucial interactive elements and important information without being overwhelming.
- Body and headline font: 'Inter', a grotesque-style sans-serif font that gives a modern and neutral aesthetic suitable for a wide range of educational content. Use for all text to impart an objective feel.
- Simple, geometric icons for study units and achievements to enhance visual appeal without distracting from the content.
- Card-based layout for study units and questions to provide a structured and easily navigable learning experience.
- Subtle transitions and animations (using Framer Motion) for correct/incorrect answers and achievement unlocks to provide positive reinforcement and engagement.