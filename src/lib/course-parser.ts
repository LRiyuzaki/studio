// lib/course-parser.ts
import { Course, Unit, Topic, MCQ } from './types';

export function validateAndParseCourseJSON(jsonString: string): Course {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate required fields
    if (!data.courseTitle || !data.courseId || !Array.isArray(data.units)) {
      throw new Error('Invalid JSON: Missing courseTitle, courseId, or units array');
    }
    
    // Validate units
    data.units.forEach((unit: any, i: number) => {
      if (!unit.unitId || !unit.unitTitle || !Array.isArray(unit.topics)) {
        throw new Error(`Invalid unit at index ${i}: Missing required fields`);
      }
      
      // Validate topics
      unit.topics.forEach((topic: any, j: number) => {
        if (!topic.topicId || !topic.topicTitle || !Array.isArray(topic.mcqs)) {
          throw new Error(`Invalid topic at unit ${i}, topic ${j}: Missing required fields`);
        }
        
        // Validate MCQs
        topic.mcqs.forEach((mcq: any, k: number) => {
          if (!mcq.question || !Array.isArray(mcq.options) || mcq.options.length !== 4 || !mcq.correct) {
            throw new Error(`Invalid MCQ at unit ${i}, topic ${j}, question ${k}: Must have question, 4 options, and correct answer`);
          }
          
          if (!['A', 'B', 'C', 'D'].includes(mcq.correct)) {
            throw new Error(`Invalid MCQ at unit ${i}, topic ${j}, question ${k}: Correct answer must be A, B, C, or D`);
          }
          
          // Add default questionId if missing
          if (!mcq.questionId) {
            mcq.questionId = `${topic.topicId}-q${k + 1}`;
          }
        });
      });
    });
    
    // Add timestamp
    const course: Course = {
      ...data,
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
