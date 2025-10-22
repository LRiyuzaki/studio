// lib/course-parser.ts
import { Course, Unit, Topic, MCQ } from './types';

// Raw types from the new JSON structure
interface RawQuestion {
  question_id: string;
  topic: string;
  question_text: string;
  options: { id: string; text: string; is_correct: boolean }[];
  correct_answer: string;
  study_unit: { number: number; name: string };
  explanation: string;
  difficulty: number;
}

interface RawJson {
  questions: RawQuestion[];
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export function validateAndParseCourseJSON(jsonString: string): Course {
  try {
    const data: RawJson = JSON.parse(jsonString);

    if (!data.questions || !Array.isArray(data.questions)) {
      throw new Error("Invalid JSON: Missing 'questions' array.");
    }

    const unitsMap = new Map<string, Unit>();
    
    // Assume a default course structure
    const courseId = "user-generated-course";
    const courseTitle = "Imported Course";
    const courseDescription = "A course generated from an uploaded JSON file.";

    for (const q of data.questions) {
      const unitId = `unit-${q.study_unit.number}`;
      const unitTitle = q.study_unit.name.replace(/covers the information for this\nquestion/g, '').trim();
      
      if (!unitsMap.has(unitId)) {
        unitsMap.set(unitId, {
          unitId: unitId,
          unitTitle: unitTitle,
          unitDescription: `Content for ${unitTitle}`,
          topics: [],
        });
      }
      
      const unit = unitsMap.get(unitId)!;
      
      const topicId = `${unitId}-${slugify(q.topic)}`;
      let topic = unit.topics.find(t => t.topicId === topicId);
      
      if (!topic) {
        topic = {
          topicId: topicId,
          topicTitle: q.topic,
          topicDescription: `Questions about ${q.topic}`,
          mcqs: [],
        };
        unit.topics.push(topic);
      }

      // Transform options to fit the existing structure, even though `correct` is also top-level
      const mcq: MCQ = {
        questionId: q.question_id,
        question: q.question_text,
        options: q.options,
        correct: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        points: (q.difficulty || 1) * 10,
      };

      topic.mcqs.push(mcq);
    }
    
    const course: Course = {
      courseId: courseId,
      courseTitle: courseTitle,
      courseDescription: courseDescription,
      units: Array.from(unitsMap.values()).sort((a, b) => {
        const numA = parseInt(a.unitId.split('-')[1]);
        const numB = parseInt(b.unitId.split('-')[1]);
        return numA - numB;
      }),
      createdAt: new Date().toISOString(),
    };

    return course;

  } catch (error) {
    throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Count total MCQs in course
export function getCourseStats(course: Course) {
  let totalMCQs = 0;
  let totalTopics = 0;
  let totalUnits = course.units.length;
  
  course.units.forEach(unit => {
    totalTopics += unit.topics.length;
    unit.topics.forEach(topic => {
      totalMCQs += topic.mcqs.length;
    });
  });
  
  return { totalUnits, totalTopics, totalMCQs };
}

// Get topic by ID
export function getTopicById(course: Course, topicId: string): Topic | null {
  for (const unit of course.units) {
    const topic = unit.topics.find(t => t.topicId === topicId);
    if (topic) return topic;
  }
  return null;
}

// Get unit by ID
export function getUnitById(course: Course, unitId: string): Unit | null {
  return course.units.find(u => u.unitId === unitId) || null;
}
