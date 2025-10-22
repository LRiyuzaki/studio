// lib/course-parser.ts
import { Course, Unit, Topic, MCQ } from './types';

export function validateAndParseCourseJSON(jsonString: string): Course {
  try {
    const data = JSON.parse(jsonString);
    
    if (!data.courseTitle || !data.courseId || !Array.isArray(data.units)) {
      throw new Error('Invalid JSON: Missing courseTitle, courseId, or units array');
    }
    
    data.units.forEach((unit: any, i: number) => {
      if (!unit.unitId || !unit.unitTitle || !Array.isArray(unit.topics)) {
        throw new Error(`Invalid unit at index ${i}: Missing required fields`);
      }
      
      unit.topics.forEach((topic: any, j: number) => {
        if (!topic.topicId || !topic.topicTitle || !Array.isArray(topic.mcqs)) {
          throw new Error(`Invalid topic at unit ${i}, topic ${j}: Missing required fields`);
        }
        
        topic.mcqs.forEach((mcq: any, k: number) => {
          if (!mcq.question || !Array.isArray(mcq.options) || mcq.options.length !== 4 || !mcq.correct) {
            throw new Error(`Invalid MCQ at unit ${i}, topic ${j}, question ${k}: Must have question, 4 options, and correct answer`);
          }
          
          if (!['A', 'B', 'C', 'D'].includes(mcq.correct)) {
            throw new Error(`Invalid MCQ at unit ${i}, topic ${j}, question ${k}: Correct answer must be A, B, C, or D`);
          }
          
          if (!mcq.questionId) {
            mcq.questionId = `${topic.topicId}-q${k + 1}`;
          }
          
          if (!mcq.points) {
            mcq.points = mcq.difficulty === 'hard' ? 15 : mcq.difficulty === 'medium' ? 10 : 5;
          }
        });
      });
    });
    
    const course: Course = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    
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
