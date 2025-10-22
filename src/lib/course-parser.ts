// lib/course-parser.ts
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

export function validateAndParseCourseJSON(jsonString: string): Course {
  try {
    const data = JSON.parse(jsonString);

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

export function getCourseStats(course: Course) {
  let totalMCQs = 0;
  let totalTopics = 0;
  let totalUnits = course.units.length;
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

export function getTopicById(course: Course, topicId: string): Topic | null {
  for (const unit of course.units) {
    const topic = unit.topics.find(t => t.topicId === topicId);
    if (topic) return topic;
  }
  return null;
}

export function getUnitById(course: Course, unitId: string): Unit | null {
  return course.units.find(u => u.unitId === unitId) || null;
}

export function getUnitForTopic(course: Course, topicId: string): Unit | null {
  for (const unit of course.units) {
    if (unit.topics.some(t => t.topicId === topicId)) {
      return unit;
    }
  }
  return null;
}

export function getAllMCQs(course: Course): MCQ[] {
  const allMCQs: MCQ[] = [];
  course.units.forEach(unit => {
    unit.topics.forEach(topic => {
      allMCQs.push(...topic.mcqs);
    });
  });
  return allMCQs;
}
