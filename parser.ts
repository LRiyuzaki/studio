
import type { Course, RawQuestion, MCQ, Unit, Topic } from './types';

// Robust, state-machine-based CSV parser that correctly handles quoted fields,
// escaped quotes, and newlines within fields.
export const parseCSV = (text: string): { headers: string[], rows: Record<string, string>[] } => {
    const rowsArray: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;
    const normalizedText = text.trim().replace(/\r\n/g, '\n');

    for (let i = 0; i < normalizedText.length; i++) {
        const char = normalizedText[i];
        const nextChar = normalizedText[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // This is an escaped quote (e.g., "" inside a field)
                currentField += '"';
                i++; // Skip the next quote character
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of a field
            currentRow.push(currentField);
            currentField = '';
        } else if (char === '\n' && !inQuotes) {
            // End of a row
            currentRow.push(currentField);
            rowsArray.push(currentRow);
            currentRow = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }

    // Add the final field and row to the results
    currentRow.push(currentField);
    if (currentRow.length > 0 && (currentRow.length > 1 || currentRow[0] !== '')) {
        rowsArray.push(currentRow);
    }
   
    if (rowsArray.length < 2) { // Must have at least a header and one data row
        return { headers: rowsArray.length === 1 ? rowsArray[0] : [], rows: [] };
    }

    const headers = rowsArray[0].map(h => h.trim());
    const rows = rowsArray.slice(1).map(values => {
        // Only process rows that have the same number of columns as the header
        if (values.length === headers.length && values.some(v => v.trim() !== '')) {
            return headers.reduce((obj, header, index) => {
                obj[header] = values[index] || '';
                return obj;
            }, {} as Record<string, string>);
        }
        return null; // Ignore malformed or empty rows
    }).filter(row => row !== null) as Record<string, string>[];

    return { headers, rows };
};


/**
 * Validates raw JSON data and extracts the array of questions.
 * Handles both a root array of questions and an object with a "questions" property.
 * @param data The parsed JSON data.
 * @returns An array of RawQuestion objects.
 * @throws An error if the data format is invalid.
 */
export const validateAndExtractQuestions = (data: any): RawQuestion[] => {
    let questions: RawQuestion[];

    if (Array.isArray(data)) {
        questions = data;
    } else if (data && Array.isArray(data.questions)) {
        questions = data.questions;
    } else {
        throw new Error('Invalid JSON format. Expected a root array of questions or an object with a "questions" property.');
    }
    
    if (questions.length === 0) {
        throw new Error('JSON must contain a non-empty array of questions.');
    }

    // Basic validation of the first question to catch major formatting issues.
    const firstQuestion = questions[0];
    if (!firstQuestion.question_id || !firstQuestion.topic || !firstQuestion.question_text || !firstQuestion.options || !firstQuestion.correct_answer || !firstQuestion.study_unit) {
        throw new Error(`The first question in the file is missing required fields (e.g., question_id, topic, question_text, etc.).`);
    }

    return questions;
};


export const transformQuestionsToCourse = (questions: RawQuestion[], title: string): Course => {
    const unitGroups: { [key: number]: { number: number; name: string; questions: RawQuestion[] } } = {};
    questions.forEach(q => {
      const unitNumber = q.study_unit.number;
      if (!unitGroups[unitNumber]) {
        unitGroups[unitNumber] = { number: unitNumber, name: q.study_unit.name, questions: [] };
      }
      unitGroups[unitNumber].questions.push(q);
    });

    const units: Unit[] = Object.values(unitGroups)
      .sort((a, b) => a.number - b.number)
      .map((unit, unitIndex) => {
        const topicGroups: { [key: string]: RawQuestion[] } = {};
        unit.questions.forEach(q => {
          if (!topicGroups[q.topic]) topicGroups[q.topic] = [];
          topicGroups[q.topic].push(q);
        });

        const topics: Topic[] = Object.keys(topicGroups).map((topicName, topicIndex) => {
          const mcqs: MCQ[] = topicGroups[topicName].map(q => {
            let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
            let points = 10;
            if (q.difficulty === 1) { difficulty = 'easy'; points = 5; }
            else if (q.difficulty && q.difficulty >= 4) { difficulty = 'hard'; points = 15; }

            return {
              questionId: q.question_id,
              question: q.question_text,
              options: q.options.map(opt => `${opt.id}) ${opt.text}`),
              correct: q.correct_answer,
              explanation: q.explanation || 'No explanation available',
              difficulty,
              points,
              firstAttemptRate: q.first_attempt_rate || null,
              originalDifficulty: q.difficulty || 2,
            };
          });

          return {
            topicId: `topic-${unit.number}-${topicIndex + 1}`,
            topicTitle: topicName,
            topicDescription: `Questions on ${topicName}`,
            mcqs,
          };
        });

        return {
          unitId: `unit-${unit.number}`,
          unitTitle: unit.name,
          unitDescription: `Unit ${unit.number}: ${unit.name}`,
          topics,
        };
      });

    const courseId = `${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
    return {
      courseId,
      courseTitle: title,
      courseDescription: `Auto-generated course with ${questions.length} questions across ${units.length} units.`,
      units,
      createdAt: new Date().toISOString(),
    };
  };
