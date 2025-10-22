import { Course, Unit, Topic, MCQ } from './types';

// This is the new interface for the questions in the input JSON
interface InputQuestion {
  question_id: string;
  topic: string;
  question_text: string;
  options: { id: string; text: string; is_correct: boolean }[];
  correct_answer: string;
  study_unit: { number: number; name: string };
  explanation: string;
  difficulty: number;
}

/**
 * Validates and parses a JSON string into a structured Course object.
 * This function can handle two different JSON schemas: a hierarchical one and a flat list of questions.
 * @param {string} jsonString - The JSON string representing the course content.
 * @returns {Course} The parsed and structured course object.
 * @throws {Error} If the JSON is invalid or does not conform to expected schemas.
 */
export function validateAndParseCourseJSON(jsonString: string): Course {
  try {
    const data = JSON.parse(jsonString);

    // Schema 1: Hierarchical structure (courseTitle, units, etc.)
    if (data.courseTitle && data.courseId && Array.isArray(data.units)) {
        // Assume it's the structured format, just add createdAt and return
        return {
            ...data,
            createdAt: new Date().toISOString(),
        };
    }

    // Schema 2: Flat list of questions
    if (!Array.isArray(data.questions)) {
      throw new Error('Invalid JSON: Top-level "questions" array not found.');
    }

    const unitsMap = new Map<number, { unit: Unit, topicsMap: Map<string, Topic> }>();

    for (const q of (data.questions as InputQuestion[])) {
      if (!q.study_unit || !q.topic || !q.question_id) {
        // Skip invalid question structures
        continue;
      }

      const unitNumber = q.study_unit.number;
      const topicName = q.topic;

      // Get or create unit
      if (!unitsMap.has(unitNumber)) {
        unitsMap.set(unitNumber, {
          unit: {
            unitId: `unit-${unitNumber}`,
            unitTitle: q.study_unit.name.split(' covers')[0] || `Unit ${unitNumber}`,
            unitDescription: q.study_unit.name,
            topics: [],
          },
          topicsMap: new Map<string, Topic>(),
        });
      }
      const unitEntry = unitsMap.get(unitNumber)!;

      // Get or create topic
      if (!unitEntry.topicsMap.has(topicName)) {
        unitEntry.topicsMap.set(topicName, {
          topicId: `${unitEntry.unit.unitId}-topic-${unitEntry.topicsMap.size + 1}`,
          topicTitle: topicName,
          topicDescription: `Questions related to ${topicName}`,
          mcqs: [],
        });
      }
      const topicEntry = unitEntry.topicsMap.get(topicName)!;

      // Create and add MCQ
      const newMcq: MCQ = {
        questionId: q.question_id,
        question: q.question_text,
        options: q.options.map(opt => opt.text),
        correct: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty <= 2 ? 'easy' : q.difficulty <= 4 ? 'medium' : 'hard',
        points: q.difficulty * 5,
      };
      topicEntry.mcqs.push(newMcq);
    }
    
    // Assemble the course
    const course: Course = {
      courseId: 'generated-course-from-json',
      courseTitle: 'Dynamic Course from Questions',
      courseDescription: 'This course was dynamically generated from a list of questions.',
      createdAt: new Date().toISOString(),
      units: [],
    };
    
    const sortedUnitKeys = Array.from(unitsMap.keys()).sort((a, b) => a - b);
    
    for (const unitKey of sortedUnitKeys) {
      const unitEntry = unitsMap.get(unitKey)!;
      unitEntry.unit.topics = Array.from(unitEntry.topicsMap.values());
      course.units.push(unitEntry.unit);
    }
    
    if (course.units.length === 0) {
      throw new Error("No valid units or topics could be generated from the JSON file.");
    }

    return course;

  } catch (error) {
    throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculates statistics for a given course.
 * @param {Course} course - The course object.
 * @returns {{totalUnits: number, totalTopics: number, totalMCQs: number, totalPoints: number}} An object containing the statistics.
 */
export function getCourseStats(course: Course) {
  let totalMCQs = 0;
  let totalTopics = 0;
  const totalUnits = course.units.length;
  let totalPoints = 0;
  
  course.units.forEach(unit => {
    totalTopics += unit.topics.length;
    unit.topics.forEach(topic => {
      totalMCQs += topic.mcqs.length;
      topic.mcqs.forEach(mcq => {
        totalPoints += mcq.points || 5;
      });
    });
  });
  
  return { totalUnits, totalTopics, totalMCQs, totalPoints };
}

/**
 * Retrieves a topic by its ID from a course.
 * @param {Course} course - The course to search within.
 * @param {string} topicId - The ID of the topic to find.
 * @returns {Topic | null} The found topic object, or null if not found.
 */
export function getTopicById(course: Course, topicId: string): Topic | null {
  for (const unit of course.units) {
    const topic = unit.topics.find(t => t.topicId === topicId);
    if (topic) return topic;
  }
  return null;
}

/**
 * Retrieves a unit by its ID from a course.
 * @param {Course} course - The course to search within.
 * @param {string} unitId - The ID of the unit to find.
 * @returns {Unit | null} The found unit object, or null if not found.
 */
export function getUnitById(course: Course, unitId: string): Unit | null {
  return course.units.find(u => u.unitId === unitId) || null;
}

/**
 * Finds the unit that a specific topic belongs to.
 * @param {Course} course - The course to search within.
 * @param {string} topicId - The ID of the topic.
 * @returns {Unit | null} The parent unit object, or null if not found.
 */
export function getUnitForTopic(course: Course, topicId: string): Unit | null {
  for (const unit of course.units) {
    if (unit.topics.some(t => t.topicId === topicId)) {
      return unit;
    }
  }
  return null;
}

/**
 * Gathers all MCQs from all topics and units in a course into a single array.
 * @param {Course} course - The course object.
 * @returns {MCQ[]} An array of all MCQs in the course.
 */
export function getAllMCQs(course: Course): MCQ[] {
  const allMCQs: MCQ[] = [];
  course.units.forEach(unit => {
    unit.topics.forEach(topic => {
      allMCQs.push(...topic.mcqs);
    });
  });
  return allMCQs;
}
