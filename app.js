// Global state management
let currentView = 'home';
let currentCourse = null;
let currentTopic = null;
let currentPracticeMode = 'by-topic'; // New practice mode state
let currentQuiz = {
  questions: [],
  currentIndex: 0,
  answers: [],
  startTime: null,
  timer: null,
  mode: 'topic' // 'topic', 'unit', 'all'
};
let pendingQuestions = null; // Store uploaded questions before transformation

// In-memory storage
let coursesData = [];
let progressData = {};

// Timer configuration
const TIMER_CONFIG = {
  duration: 45,
  thresholds: {
    green: 50,
    yellow: 20,
    red: 0
  }
};

// XP configuration
const XP_CONFIG = {
  perCorrect: 10,
  perfectBonus: 50
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  setupEventListeners();
  loadCourses();
  showView('home');
});

// Event listeners setup
function setupEventListeners() {
  const fileInput = document.getElementById('file-input');
  const uploadArea = document.getElementById('upload-area');
  
  // File input change
  fileInput.addEventListener('change', handleFileSelect);
  
  // Drag and drop events
  uploadArea.addEventListener('dragover', handleDragOver);
  uploadArea.addEventListener('dragleave', handleDragLeave);
  uploadArea.addEventListener('drop', handleDrop);
  uploadArea.addEventListener('click', () => fileInput.click());
}

// View management
function showView(viewName) {
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  
  // Show target view
  const targetView = document.getElementById(`${viewName}-view`);
  if (targetView) {
    targetView.classList.add('active');
    currentView = viewName;
    
    // Scroll to top when changing views
    window.scrollTo(0, 0);
    
    // Update page title based on view
    updatePageTitle(viewName);
  }
}

function updatePageTitle(viewName) {
  const titles = {
    'home': 'MCQ Course Platform',
    'course': currentCourse ? `${currentCourse.courseTitle} - Dashboard` : 'Course Dashboard',
    'quiz': currentTopic ? `Quiz: ${currentTopic.topicTitle}` : 'Quiz',
    'results': 'Quiz Results'
  };
  
  document.title = titles[viewName] || 'MCQ Course Platform';
}

// File handling
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('upload-area').classList.add('dragover');
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('upload-area').classList.remove('dragover');
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('upload-area').classList.remove('dragover');
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    handleFile(file);
  }
}

function handleFile(file) {
  if (!file.name.endsWith('.json')) {
    showError('Please select a valid JSON file.');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const jsonData = JSON.parse(e.target.result);
      
      // Check if it's the new flat questions format
      if (jsonData.questions && Array.isArray(jsonData.questions)) {
        if (validateFlatQuestions(jsonData)) {
          pendingQuestions = jsonData.questions;
          showCoursePreview(jsonData.questions);
          hideError();
        }
      } else {
        // Legacy format - validate and save directly
        if (validateCourse(jsonData)) {
          saveCourse(jsonData);
          loadCourses();
          hideError();
          // Clear file input
          document.getElementById('file-input').value = '';
        }
      }
    } catch (error) {
      showError(`Invalid JSON format: ${error.message}`);
    }
  };
  reader.readAsText(file);
}

// Flat questions validation
function validateFlatQuestions(data) {
  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    showError('Missing or empty questions array');
    return false;
  }
  
  for (let i = 0; i < data.questions.length; i++) {
    const question = data.questions[i];
    
    if (!question.question_id) {
      showError(`Question ${i + 1}: Missing question_id`);
      return false;
    }
    
    if (!question.question_text) {
      showError(`Question ${i + 1}: Missing question_text`);
      return false;
    }
    
    if (!question.topic) {
      showError(`Question ${i + 1}: Missing topic`);
      return false;
    }
    
    if (!Array.isArray(question.options) || question.options.length !== 4) {
      showError(`Question ${i + 1}: Must have exactly 4 options`);
      return false;
    }
    
    // Validate options format
    for (let j = 0; j < question.options.length; j++) {
      const option = question.options[j];
      if (!option.id || !option.text || typeof option.is_correct !== 'boolean') {
        showError(`Question ${i + 1}, Option ${j + 1}: Invalid option format`);
        return false;
      }
    }
    
    if (!question.correct_answer || !['A', 'B', 'C', 'D'].includes(question.correct_answer)) {
      showError(`Question ${i + 1}: correct_answer must be A, B, C, or D`);
      return false;
    }
    
    if (!question.study_unit || !question.study_unit.number || !question.study_unit.name) {
      showError(`Question ${i + 1}: Missing or invalid study_unit`);
      return false;
    }
  }
  
  return true;
}

// Transform flat questions to course structure
function transformQuestionsToCourse(questions) {
  // Step 1: Group by study unit number
  const unitGroups = {};
  
  questions.forEach(question => {
    const unitNumber = question.study_unit.number;
    if (!unitGroups[unitNumber]) {
      unitGroups[unitNumber] = {
        number: unitNumber,
        name: question.study_unit.name,
        questions: []
      };
    }
    unitGroups[unitNumber].questions.push(question);
  });
  
  // Step 2: Group by topic within each unit
  const units = Object.values(unitGroups).sort((a, b) => a.number - b.number).map((unit, unitIndex) => {
    const topicGroups = {};
    
    unit.questions.forEach(question => {
      const topicName = question.topic;
      if (!topicGroups[topicName]) {
        topicGroups[topicName] = [];
      }
      topicGroups[topicName].push(question);
    });
    
    const topics = Object.keys(topicGroups).map((topicName, topicIndex) => {
      const mcqs = topicGroups[topicName].map(question => {
        // Map difficulty number to string and calculate points
        let difficulty = 'medium';
        let points = 10;
        
        if (question.difficulty === 1) {
          difficulty = 'easy';
          points = 5;
        } else if (question.difficulty >= 4) {
          difficulty = 'hard';
          points = 15;
        }
        
        return {
          questionId: question.question_id,
          question: question.question_text,
          options: question.options.map(opt => `${opt.id}) ${opt.text}`),
          correct: question.correct_answer,
          explanation: question.explanation || 'No explanation available',
          difficulty: difficulty,
          points: points,
          firstAttemptRate: question.first_attempt_rate || null,
          originalDifficulty: question.difficulty
        };
      });
      
      return {
        topicId: `topic-${unit.number}-${topicIndex + 1}`,
        topicTitle: topicName,
        topicDescription: `Questions on ${topicName}`,
        mcqs: mcqs
      };
    });
    
    return {
      unitId: `unit-${unit.number}`,
      unitTitle: unit.name,
      unitDescription: `Unit ${unit.number}: ${unit.name}`,
      topics: topics
    };
  });
  
  // Step 3: Create course structure
  const courseId = `tax-course-${Date.now()}`;
  
  return {
    courseTitle: 'Tax Preparation MCQ Course',
    courseDescription: `Auto-generated course with ${questions.length} questions across ${units.length} units`,
    courseId: courseId,
    units: units,
    createdAt: new Date().toISOString()
  };
}

// Show course preview
function showCoursePreview(questions) {
  const preview = document.getElementById('course-preview');
  const course = transformQuestionsToCourse(questions);
  
  // Update stats
  document.getElementById('preview-units').textContent = course.units.length;
  
  let totalTopics = 0;
  course.units.forEach(unit => {
    totalTopics += unit.topics.length;
  });
  
  document.getElementById('preview-topics').textContent = totalTopics;
  document.getElementById('preview-questions').textContent = questions.length;
  
  // Show units structure
  const unitsList = document.getElementById('preview-units-list');
  unitsList.innerHTML = course.units.map(unit => {
    const topicsList = unit.topics.map(topic => 
      `<div class="preview-topic">• ${topic.topicTitle} (${topic.mcqs.length} questions)</div>`
    ).join('');
    
    return `
      <div class="preview-unit">
        <div class="preview-unit-title">Unit ${unit.unitId.split('-')[1]}: ${unit.unitTitle}</div>
        <div class="preview-topics">${topicsList}</div>
      </div>
    `;
  }).join('');
  
  preview.style.display = 'block';
}

// Create course from preview
function createCourse() {
  if (!pendingQuestions) {
    showError('No questions data available');
    return;
  }
  
  const course = transformQuestionsToCourse(pendingQuestions);
  saveCourse(course);
  loadCourses();
  
  // Reset state
  pendingQuestions = null;
  document.getElementById('course-preview').style.display = 'none';
  document.getElementById('file-input').value = '';
}

// Course validation
function validateCourse(course) {
  if (!course.courseTitle) {
    showError('Missing required field: courseTitle');
    return false;
  }
  
  if (!course.courseId) {
    showError('Missing required field: courseId');
    return false;
  }
  
  if (!Array.isArray(course.units) || course.units.length === 0) {
    showError('Missing or empty units array');
    return false;
  }
  
  for (let i = 0; i < course.units.length; i++) {
    const unit = course.units[i];
    
    if (!unit.unitId) {
      showError(`Unit ${i + 1}: Missing unitId`);
      return false;
    }
    
    if (!unit.unitTitle) {
      showError(`Unit ${i + 1}: Missing unitTitle`);
      return false;
    }
    
    if (!Array.isArray(unit.topics) || unit.topics.length === 0) {
      showError(`Unit ${i + 1}: Missing or empty topics array`);
      return false;
    }
    
    for (let j = 0; j < unit.topics.length; j++) {
      const topic = unit.topics[j];
      
      if (!topic.topicId) {
        showError(`Unit ${i + 1}, Topic ${j + 1}: Missing topicId`);
        return false;
      }
      
      if (!topic.topicTitle) {
        showError(`Unit ${i + 1}, Topic ${j + 1}: Missing topicTitle`);
        return false;
      }
      
      if (!Array.isArray(topic.mcqs) || topic.mcqs.length === 0) {
        showError(`Unit ${i + 1}, Topic ${j + 1}: Missing or empty mcqs array`);
        return false;
      }
      
      for (let k = 0; k < topic.mcqs.length; k++) {
        const mcq = topic.mcqs[k];
        
        if (!mcq.question) {
          showError(`Unit ${i + 1}, Topic ${j + 1}, Question ${k + 1}: Missing question`);
          return false;
        }
        
        if (!Array.isArray(mcq.options) || mcq.options.length !== 4) {
          showError(`Unit ${i + 1}, Topic ${j + 1}, Question ${k + 1}: Must have exactly 4 options`);
          return false;
        }
        
        if (!mcq.correct || !['A', 'B', 'C', 'D'].includes(mcq.correct)) {
          showError(`Unit ${i + 1}, Topic ${j + 1}, Question ${k + 1}: Correct answer must be A, B, C, or D`);
          return false;
        }
      }
    }
  }
  
  return true;
}

// Storage operations using in-memory storage
function saveCourse(course) {
  try {
    // Check for duplicate courseId
    const existingIndex = coursesData.findIndex(c => c.courseId === course.courseId);
    
    if (existingIndex !== -1) {
      if (confirm(`Course with ID "${course.courseId}" already exists. Do you want to overwrite it?`)) {
        coursesData[existingIndex] = { ...course, createdAt: new Date().toISOString() };
      } else {
        return;
      }
    } else {
      coursesData.push({ ...course, createdAt: new Date().toISOString() });
    }
  } catch (error) {
    showError('Failed to save course.');
  }
}

function getCourses() {
  return coursesData;
}

function getCourseProgress(courseId) {
  if (!progressData[courseId]) {
    progressData[courseId] = {
      completedTopics: [],
      unitProgress: {},
      totalXP: 0,
      currentStreak: 0,
      lastStudyDate: null,
      quizHistory: []
    };
  }
  return progressData[courseId];
}

function saveCourseProgress(courseId, progress) {
  progressData[courseId] = progress;
}

// UI rendering functions
function loadCourses() {
  const courses = getCourses();
  const container = document.getElementById('courses-list');
  
  if (courses.length === 0) {
    container.innerHTML = '<div class="empty-state">No courses uploaded yet. Upload a JSON file to get started!</div>';
    return;
  }
  
  container.innerHTML = courses.map(course => {
    const stats = getCourseStats(course);
    return `
      <div class="course-card" onclick="openCourse('${course.courseId}')">
        <h3>${course.courseTitle}</h3>
        <p>${course.courseDescription || 'No description available'}</p>
        <div class="course-stats">
          <span>${stats.units} units</span>
          <span>${stats.topics} topics</span>
          <span>${stats.questions} questions</span>
        </div>
      </div>
    `;
  }).join('');
}

function getCourseStats(course) {
  let totalTopics = 0;
  let totalQuestions = 0;
  
  course.units.forEach(unit => {
    totalTopics += unit.topics.length;
    unit.topics.forEach(topic => {
      totalQuestions += topic.mcqs.length;
    });
  });
  
  return {
    units: course.units.length,
    topics: totalTopics,
    questions: totalQuestions
  };
}

function openCourse(courseId) {
  const courses = getCourses();
  const course = courses.find(c => c.courseId === courseId);
  
  if (!course) {
    showError('Course not found');
    return;
  }
  
  // Add loading state
  const courseCards = document.querySelectorAll('.course-card');
  courseCards.forEach(card => card.style.opacity = '0.6');
  
  setTimeout(() => {
    currentCourse = course;
    renderCourseDashboard();
    showView('course');
    
    // Show success message
    showSuccessToast(`Loaded ${course.courseTitle}`);
  }, 300);
}

// Add toast notification system
function showSuccessToast(message) {
  const toast = document.createElement('div');
  toast.className = 'success-toast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #43A047;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(67, 160, 71, 0.3);
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Slide in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 100);
  
  // Slide out and remove
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

function renderCourseDashboard() {
  const course = currentCourse;
  const progress = getCourseProgress(course.courseId);
  
  // Update course info
  document.getElementById('course-title').textContent = course.courseTitle;
  document.getElementById('course-description').textContent = course.courseDescription || 'No description available';
  
  // Calculate overall stats
  const overallStats = calculateOverallStats(course, progress);
  
  // Update stats
  document.getElementById('completion-stat').textContent = `${Math.round(overallStats.completionPercentage)}%`;
  document.getElementById('xp-stat').textContent = progress.totalXP;
  document.getElementById('streak-stat').textContent = progress.currentStreak;
  document.getElementById('quizzes-stat').textContent = progress.quizHistory.length;
  
  // Update practice mode UI
  updatePracticeModeUI();
  
  // Render units based on current mode
  renderUnits(course, progress);
  
  // Render quiz history
  renderQuizHistory(progress.quizHistory.slice(-5));
}

function calculateOverallStats(course, progress) {
  let totalTopics = 0;
  let completedTopics = progress.completedTopics.length;
  
  course.units.forEach(unit => {
    totalTopics += unit.topics.length;
  });
  
  const completionPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
  
  return { completionPercentage, totalTopics, completedTopics };
}

function renderUnits(course, progress) {
  const container = document.getElementById('units-container');
  
  if (currentPracticeMode === 'all-shuffled') {
    container.innerHTML = `
      <div class="all-topics-container">
        <div class="all-topics-card">
          <div class="all-topics-info">
            <h3>🔀 Practice All Topics</h3>
            <p>Random questions from all ${getTotalQuestions(course)} questions across all units and topics</p>
            <div class="all-topics-stats">
              <span>${course.units.length} units</span> • 
              <span>${getTotalTopics(course)} topics</span> • 
              <span>${getTotalQuestions(course)} questions</span>
            </div>
          </div>
          <button class="btn btn--primary" onclick="startAllShuffledQuiz()">
            Start Random Quiz
          </button>
        </div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = course.units.map((unit, unitIndex) => {
    const unitProgress = calculateUnitProgress(unit, progress);
    const totalUnitQuestions = unit.topics.reduce((sum, topic) => sum + topic.mcqs.length, 0);
    
    return `
      <div class="unit-card">
        <div class="unit-header" onclick="toggleUnit(${unitIndex})">
          <div class="unit-info">
            <h3>Unit ${unitIndex + 1}: ${unit.unitTitle}</h3>
            <p>${unit.unitDescription || 'No description available'}</p>
            ${currentPracticeMode === 'by-unit' ? `
              <button class="unit-practice-btn" onclick="event.stopPropagation(); startUnitQuiz('${unit.unitId}')">
                📚 Practice Unit (${totalUnitQuestions} questions)
              </button>
            ` : ''}
          </div>
          <div class="unit-progress">
            <div class="progress-percentage">${Math.round(unitProgress.completionPercentage)}%</div>
            <div style="font-size: 12px; color: #6B7280;">
              ${unitProgress.completedTopics} / ${unitProgress.totalTopics} topics
            </div>
          </div>
        </div>
        <div class="unit-topics" id="unit-${unitIndex}-topics">
          ${currentPracticeMode === 'by-topic' ? `
            <div class="topics-grid">
              ${unit.topics.map(topic => {
                const isCompleted = progress.completedTopics.includes(topic.topicId);
                return `
                  <div class="topic-card ${isCompleted ? 'completed' : ''}" 
                       onclick="startQuiz('${topic.topicId}')">
                    <h4>${topic.topicTitle}</h4>
                    <p>${topic.topicDescription || 'No description available'}</p>
                    <p class="question-count">${topic.mcqs.length} questions</p>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function calculateUnitProgress(unit, progress) {
  const totalTopics = unit.topics.length;
  const completedTopics = unit.topics.filter(topic => 
    progress.completedTopics.includes(topic.topicId)
  ).length;
  
  const completionPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;
  
  return { totalTopics, completedTopics, completionPercentage };
}

// Helper function to make createCourse globally accessible
window.createCourse = createCourse;

// Practice mode functions
function switchPracticeMode(mode) {
  currentPracticeMode = mode;
  
  // Update active button and aria attributes
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-pressed', 'false');
  });
  
  const activeBtn = document.querySelector(`[data-mode="${mode}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.setAttribute('aria-pressed', 'true');
  }
  
  // Add visual feedback
  activeBtn.style.transform = 'scale(0.98)';
  setTimeout(() => {
    if (activeBtn) activeBtn.style.transform = '';
  }, 150);
  
  // Update UI
  updatePracticeModeUI();
  
  // Re-render units with smooth transition
  if (currentCourse) {
    const unitsContainer = document.getElementById('units-container');
    unitsContainer.style.opacity = '0.7';
    
    setTimeout(() => {
      const progress = getCourseProgress(currentCourse.courseId);
      renderUnits(currentCourse, progress);
      unitsContainer.style.opacity = '1';
    }, 200);
  }
}

function updatePracticeModeUI() {
  const titleElement = document.getElementById('units-section-title');
  const practiceAllBtn = document.getElementById('practice-all-btn');
  
  switch (currentPracticeMode) {
    case 'by-topic':
      titleElement.textContent = 'Course Topics';
      practiceAllBtn.style.display = 'none';
      break;
    case 'by-unit':
      titleElement.textContent = 'Course Units';
      practiceAllBtn.style.display = 'none';
      break;
    case 'all-shuffled':
      titleElement.textContent = 'All Topics Practice';
      practiceAllBtn.style.display = 'inline-block';
      break;
  }
}

function getTotalQuestions(course) {
  let total = 0;
  course.units.forEach(unit => {
    unit.topics.forEach(topic => {
      total += topic.mcqs.length;
    });
  });
  return total;
}

function getTotalTopics(course) {
  let total = 0;
  course.units.forEach(unit => {
    total += unit.topics.length;
  });
  return total;
}

function startAllShuffledQuiz() {
  if (!currentCourse) {
    alert('No course available. Please select a course first.');
    return;
  }
  
  // Collect all questions from all topics
  const allQuestions = [];
  currentCourse.units.forEach(unit => {
    unit.topics.forEach(topic => {
      topic.mcqs.forEach(mcq => {
        allQuestions.push({
          ...mcq,
          topicTitle: topic.topicTitle,
          unitTitle: unit.unitTitle
        });
      });
    });
  });
  
  if (allQuestions.length === 0) {
    alert('No questions available in this course.');
    return;
  }
  
  // Shuffle questions using Fisher-Yates algorithm
  for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }
  
  // Limit to maximum 20 questions for better experience
  const quizQuestions = allQuestions.slice(0, Math.min(20, allQuestions.length));
  
  currentTopic = {
    topicId: 'all-shuffled',
    topicTitle: `All Topics Mixed (${quizQuestions.length} questions)`,
    mcqs: quizQuestions
  };
  
  currentQuiz = {
    questions: quizQuestions,
    currentIndex: 0,
    answers: [],
    startTime: Date.now(),
    timer: null,
    timeRemaining: TIMER_CONFIG.duration,
    mode: 'all'
  };
  
  currentQuiz.answers = new Array(currentQuiz.questions.length).fill(null);
  
  renderQuizInterface();
  showView('quiz');
  startTimer();
}

function startUnitQuiz(unitId) {
  if (!currentCourse) {
    alert('No course available. Please select a course first.');
    return;
  }
  
  const unit = currentCourse.units.find(u => u.unitId === unitId);
  if (!unit) {
    alert('Unit not found.');
    return;
  }
  
  // Collect all questions from this unit
  const unitQuestions = [];
  unit.topics.forEach(topic => {
    topic.mcqs.forEach(mcq => {
      unitQuestions.push({
        ...mcq,
        topicTitle: topic.topicTitle,
        unitTitle: unit.unitTitle
      });
    });
  });
  
  if (unitQuestions.length === 0) {
    alert('This unit has no questions available.');
    return;
  }
  
  // Shuffle questions within the unit using Fisher-Yates algorithm
  for (let i = unitQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unitQuestions[i], unitQuestions[j]] = [unitQuestions[j], unitQuestions[i]];
  }
  
  currentTopic = {
    topicId: unitId,
    topicTitle: `${unit.unitTitle} (${unitQuestions.length} questions)`,
    mcqs: unitQuestions
  };
  
  currentQuiz = {
    questions: unitQuestions,
    currentIndex: 0,
    answers: [],
    startTime: Date.now(),
    timer: null,
    timeRemaining: TIMER_CONFIG.duration,
    mode: 'unit'
  };
  
  currentQuiz.answers = new Array(currentQuiz.questions.length).fill(null);
  
  renderQuizInterface();
  showView('quiz');
  startTimer();
}

function toggleUnit(unitIndex) {
  const topicsDiv = document.getElementById(`unit-${unitIndex}-topics`);
  const header = document.querySelector(`#unit-${unitIndex}-topics`).previousElementSibling;
  
  const isExpanding = !topicsDiv.classList.contains('expanded');
  
  topicsDiv.classList.toggle('expanded');
  header.classList.toggle('expanded');
  
  // Add aria-expanded for accessibility
  header.setAttribute('aria-expanded', isExpanding.toString());
  
  // Smooth toggle animation with better UX
  if (isExpanding) {
    topicsDiv.style.maxHeight = topicsDiv.scrollHeight + 'px';
    // Scroll into view if needed
    setTimeout(() => {
      if (topicsDiv.getBoundingClientRect().bottom > window.innerHeight) {
        header.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 300);
  } else {
    topicsDiv.style.maxHeight = '0';
  }
  
  // Add visual feedback
  header.style.transform = 'scale(0.99)';
  setTimeout(() => {
    header.style.transform = '';
  }, 150);
}

function renderQuizHistory(history) {
  const container = document.getElementById('quiz-history-list');
  
  if (history.length === 0) {
    container.innerHTML = '<div class="empty-state">No quiz history yet. Complete some quizzes to see your progress!</div>';
    return;
  }
  
  container.innerHTML = history.map(quiz => `
    <div class="history-item">
      <div class="history-info">
        <strong>${quiz.topicTitle}</strong>
        <div style="font-size: 12px; color: var(--color-text-secondary);">
          ${new Date(quiz.completedAt).toLocaleDateString()}
        </div>
      </div>
      <div class="history-score">
        ${Math.round(quiz.percentage)}% (${quiz.score}/${quiz.total})
      </div>
    </div>
  `).join('');
}

// Quiz functionality
function startQuiz(topicId) {
  const topic = findTopic(topicId);
  if (!topic) {
    showErrorToast('Topic not found. Please try again.');
    return;
  }
  
  if (topic.mcqs.length === 0) {
    showErrorToast('This topic has no questions available.');
    return;
  }
  
  // Add loading state
  showSuccessToast(`Starting ${topic.topicTitle} quiz...`);
  
  currentTopic = {
    ...topic,
    topicTitle: `${topic.topicTitle} (${topic.mcqs.length} questions)`
  };
  
  currentQuiz = {
    questions: [...topic.mcqs], // Copy questions
    currentIndex: 0,
    answers: [],
    startTime: Date.now(),
    timer: null,
    timeRemaining: TIMER_CONFIG.duration,
    mode: 'topic'
  };
  
  // Initialize answers array
  currentQuiz.answers = new Array(currentQuiz.questions.length).fill(null);
  
  setTimeout(() => {
    renderQuizInterface();
    showView('quiz');
    startTimer();
  }, 500);
}

function showErrorToast(message) {
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #EF4444;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 100);
  
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

function findTopic(topicId) {
  for (const unit of currentCourse.units) {
    for (const topic of unit.topics) {
      if (topic.topicId === topicId) {
        return topic;
      }
    }
  }
  return null;
}

function renderQuizInterface() {
  const topic = currentTopic;
  const quiz = currentQuiz;
  const question = quiz.questions[quiz.currentIndex];
  
  // Update back button text and ensure click handler is properly set
  const backBtn = document.getElementById('quiz-back-btn');
  if (backBtn) {
    backBtn.innerHTML = '← Back to Course';
    // Ensure the onclick handler is properly set
    backBtn.onclick = exitQuiz;
  }
  
  // Update question counter and topic name
  document.getElementById('question-counter').textContent = 
    `Question ${quiz.currentIndex + 1} of ${quiz.questions.length}`;
    
  // Update topic name in breadcrumb
  const topicNameEl = document.getElementById('quiz-topic-name');
  if (topicNameEl && topic) {
    topicNameEl.textContent = topic.topicTitle || 'Quiz';
  }
  
  // Update question metadata
  const questionId = document.getElementById('question-id');
  const difficultyStars = document.getElementById('difficulty-stars');
  const successRate = document.getElementById('success-rate');
  
  questionId.textContent = question.questionId ? `Q${question.questionId}` : `Q${quiz.currentIndex + 1}`;
  
  // Generate difficulty stars
  const difficulty = question.originalDifficulty || 2;
  const stars = '★'.repeat(difficulty);
  difficultyStars.textContent = stars;
  difficultyStars.className = `difficulty-stars difficulty-${question.difficulty || 'medium'}`;
  
  // Show success rate
  if (question.firstAttemptRate) {
    successRate.textContent = `${question.firstAttemptRate}% get this right`;
    successRate.style.display = 'inline-block';
  } else {
    successRate.style.display = 'none';
  }
  
  // Update question text
  document.getElementById('question-text').textContent = question.question;
  
  // Render options
  const optionsContainer = document.getElementById('options-container');
  optionsContainer.innerHTML = question.options.map((option, index) => {
    const letter = ['A', 'B', 'C', 'D'][index];
    const isSelected = quiz.answers[quiz.currentIndex] === letter;
    return `
      <button class="option-button ${isSelected ? 'selected' : ''}" 
              onclick="selectAnswer('${letter}')">
        <span class="option-letter">${letter}</span>
        <span>${option.replace(/^[A-D]\)\s*/, '')}</span>
      </button>
    `;
  }).join('');
}

function selectAnswer(answer) {
  // Prevent multiple selections
  if (currentQuiz.answers[currentQuiz.currentIndex] !== null) {
    return; // Already answered
  }
  
  // Store the answer
  currentQuiz.answers[currentQuiz.currentIndex] = answer;
  
  // Update UI to show selection
  document.querySelectorAll('.option-button').forEach(btn => {
    btn.classList.remove('selected');
  });
  
  // Find the button with this answer and mark it as selected
  const optionButtons = document.querySelectorAll('.option-button');
  optionButtons.forEach(btn => {
    const letter = btn.querySelector('.option-letter').textContent;
    if (letter === answer) {
      btn.classList.add('selected');
    }
  });
  
  // Disable all option buttons to prevent multiple selections
  document.querySelectorAll('.option-button').forEach(btn => {
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.8';
  });
  
  // Show explanation after selection
  const isCorrect = answer === currentQuiz.questions[currentQuiz.currentIndex].correct;
  showQuestionExplanation(isCorrect);
  
  // Auto-advance after a delay
  setTimeout(() => {
    // Re-enable buttons for next question
    document.querySelectorAll('.option-button').forEach(btn => {
      btn.style.pointerEvents = 'auto';
      btn.style.opacity = '1';
    });
    nextQuestion();
  }, 2800);
}

function showQuestionExplanation(isCorrect) {
  const explanationDiv = document.getElementById('question-explanation');
  const question = currentQuiz.questions[currentQuiz.currentIndex];
  
  explanationDiv.innerHTML = `
    <div style="padding: 20px; border-radius: 12px; background: ${isCorrect ? '#E8F5E8' : '#FFEBEE'}; border: 2px solid ${isCorrect ? '#43A047' : '#F44336'}; margin-top: 20px;">
      <h4 style="margin: 0 0 12px 0; color: ${isCorrect ? '#2E7D32' : '#C62828'}; font-size: 18px;">
        ${isCorrect ? '✅ Excellent!' : '❌ Not quite right'}
      </h4>
      <p style="margin: 8px 0; font-weight: 500; color: #22213B;"><strong>Correct Answer:</strong> ${question.correct}</p>
      <p style="margin: 8px 0 0 0; color: #555; line-height: 1.5;">${question.explanation || 'No explanation available.'}</p>
    </div>
  `;
  
  explanationDiv.style.display = 'block';
  
  // Hide after a delay
  setTimeout(() => {
    explanationDiv.style.display = 'none';
  }, 2200);
}

function nextQuestion() {
  clearTimer();
  
  if (currentQuiz.currentIndex < currentQuiz.questions.length - 1) {
    currentQuiz.currentIndex++;
    currentQuiz.timeRemaining = TIMER_CONFIG.duration;
    renderQuizInterface();
    startTimer();
  } else {
    completeQuiz();
  }
}

function startTimer() {
  const timerBar = document.getElementById('timer-fill');
  const timerText = document.getElementById('timer-text');
  
  currentQuiz.timer = setInterval(() => {
    currentQuiz.timeRemaining--;
    
    const percentage = (currentQuiz.timeRemaining / TIMER_CONFIG.duration) * 100;
    timerBar.style.width = percentage + '%';
    timerText.textContent = currentQuiz.timeRemaining + 's';
    
    // Update timer bar color
    timerBar.className = 'timer-fill';
    if (percentage <= TIMER_CONFIG.thresholds.red) {
      timerBar.classList.add('danger');
    } else if (percentage <= TIMER_CONFIG.thresholds.yellow) {
      timerBar.classList.add('warning');
    }
    
    // Auto-submit when time expires
    if (currentQuiz.timeRemaining <= 0) {
      nextQuestion();
    }
  }, 1000);
}

function clearTimer() {
  if (currentQuiz.timer) {
    clearInterval(currentQuiz.timer);
    currentQuiz.timer = null;
  }
}

function exitQuiz() {
  clearTimer();
  if (confirm('Are you sure you want to exit the quiz? Your progress will be lost.')) {
    // Reset quiz state
    currentQuiz = {
      questions: [],
      currentIndex: 0,
      answers: [],
      startTime: null,
      timer: null,
      mode: 'topic'
    };
    currentTopic = null;
    
    // Ensure we return to the correct view
    if (currentCourse) {
      renderCourseDashboard();
      showView('course');
    } else {
      showView('home');
      loadCourses();
    }
  } else {
    // Resume timer if they don't want to exit
    if (currentQuiz.timeRemaining > 0) {
      startTimer();
    }
  }
}

function completeQuiz() {
  clearTimer();
  
  const quiz = currentQuiz;
  const topic = currentTopic;
  const course = currentCourse;
  
  // Calculate score
  let correctAnswers = 0;
  const results = quiz.questions.map((question, index) => {
    const userAnswer = quiz.answers[index];
    const isCorrect = userAnswer === question.correct;
    if (isCorrect) correctAnswers++;
    
    return {
      question: question.question,
      userAnswer: userAnswer,
      correctAnswer: question.correct,
      isCorrect: isCorrect,
      explanation: question.explanation || 'No explanation available'
    };
  });
  
  const totalQuestions = quiz.questions.length;
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);
  const timeSpent = Math.round((Date.now() - quiz.startTime) / 1000);
  
  // Calculate XP
  let xpEarned = correctAnswers * XP_CONFIG.perCorrect;
  if (percentage === 100) {
    xpEarned += XP_CONFIG.perfectBonus;
  }
  
  // Update progress
  const progress = getCourseProgress(course.courseId);
  
  // Add topic to completed topics if not already there
  if (!progress.completedTopics.includes(topic.topicId)) {
    progress.completedTopics.push(topic.topicId);
  }
  
  // Update total XP
  progress.totalXP += xpEarned;
  
  // Update streak
  updateStreak(progress);
  
  // Add to quiz history
  progress.quizHistory.push({
    topicId: topic.topicId,
    topicTitle: topic.topicTitle,
    score: correctAnswers,
    total: totalQuestions,
    percentage: percentage,
    answers: quiz.answers,
    completedAt: new Date().toISOString(),
    timeSpent: timeSpent,
    xpEarned: xpEarned
  });
  
  // Save progress
  saveCourseProgress(course.courseId, progress);
  
  // Store results for display
  currentQuiz.results = {
    correctAnswers,
    totalQuestions,
    percentage,
    xpEarned,
    results,
    timeSpent
  };
  
  renderQuizResults();
  showView('results');
}

function updateStreak(progress) {
  const today = new Date().toDateString();
  const lastStudyDate = progress.lastStudyDate ? new Date(progress.lastStudyDate).toDateString() : null;
  
  if (!lastStudyDate) {
    // First quiz ever
    progress.currentStreak = 1;
  } else if (lastStudyDate === today) {
    // Same day, don't change streak
    return;
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    
    if (lastStudyDate === yesterdayString) {
      // Consecutive day
      progress.currentStreak += 1;
    } else {
      // Streak broken
      progress.currentStreak = 1;
    }
  }
  
  progress.lastStudyDate = new Date().toISOString();
}

function renderQuizResults() {
  const results = currentQuiz.results;
  const topic = currentTopic;
  
  // Update score display
  const scoreEl = document.getElementById('score-percentage');
  scoreEl.textContent = results.percentage + '%';
  
  // Color code based on score
  scoreEl.className = 'score-percentage';
  if (results.percentage === 100) {
    scoreEl.classList.add('perfect');
  } else if (results.percentage >= 80) {
    scoreEl.classList.add('good');
  } else if (results.percentage < 60) {
    scoreEl.classList.add('poor');
  }
  
  // Update score text
  document.getElementById('score-text').textContent = 
    `You scored ${results.correctAnswers} out of ${results.totalQuestions}`;
  
  // Performance message
  let message = '';
  if (results.percentage === 100) {
    message = '🏆 Perfect score! Amazing!';
  } else if (results.percentage >= 80) {
    message = '🌟 Great job!';
  } else if (results.percentage >= 60) {
    message = '👍 Good effort!';
  } else {
    message = '📚 Keep practicing!';
  }
  document.getElementById('performance-message').textContent = message;
  
  // Add comparison message based on first attempt rates
  addComparisonMessage(results, topic);
  
  // XP earned
  document.getElementById('xp-earned').textContent = `+${results.xpEarned} XP`;
  
  // Detailed results
  renderDetailedResults(results.results);
}

function addComparisonMessage(results, topic) {
  // Calculate average first attempt rate for comparison
  const questionsWithRates = currentQuiz.questions.filter(q => q.firstAttemptRate);
  if (questionsWithRates.length === 0) return;
  
  const avgFirstAttemptRate = questionsWithRates.reduce((sum, q) => sum + q.firstAttemptRate, 0) / questionsWithRates.length;
  
  if (results.percentage > avgFirstAttemptRate) {
    const comparisonDiv = document.createElement('div');
    comparisonDiv.className = 'comparison-message';
    comparisonDiv.textContent = `🎉 You scored better than ${Math.round(avgFirstAttemptRate)}% of users!`;
    
    const performanceEl = document.getElementById('performance-message');
    performanceEl.parentNode.insertBefore(comparisonDiv, performanceEl.nextSibling);
  }
}

function renderDetailedResults(results) {
  const container = document.getElementById('question-review');
  
  container.innerHTML = results.map((result, index) => {
    const statusClass = result.isCorrect ? 'correct' : 'incorrect';
    return `
      <div class="question-review-item ${statusClass}">
        <div class="review-question">
          <strong>Question ${index + 1}:</strong> ${result.question}
        </div>
        <div class="review-answers">
          <div class="review-user-answer">
            <strong>Your Answer:</strong> ${result.userAnswer || 'No answer'}
          </div>
          <div class="review-correct-answer">
            <strong>Correct Answer:</strong> ${result.correctAnswer}
          </div>
        </div>
        ${result.explanation ? `<div style="margin-top: 8px; font-style: italic; color: var(--color-text-secondary);">${result.explanation}</div>` : ''}
      </div>
    `;
  }).join('');
}

function backToCourse() {
  // Clear any timers first
  clearTimer();
  
  // Reset any quiz state
  currentQuiz = {
    questions: [],
    currentIndex: 0,
    answers: [],
    startTime: null,
    timer: null,
    mode: 'topic'
  };
  
  currentTopic = null;
  
  // Ensure we have a current course and return to dashboard
  if (currentCourse) {
    renderCourseDashboard();
    showView('course');
  } else {
    showView('home');
    loadCourses();
  }
}

function retryQuiz() {
  if (currentTopic && currentQuiz.mode) {
    switch (currentQuiz.mode) {
      case 'all':
        startAllShuffledQuiz();
        break;
      case 'unit':
        startUnitQuiz(currentTopic.topicId);
        break;
      case 'topic':
      default:
        startQuiz(currentTopic.topicId);
        break;
    }
  } else {
    backToCourse();
  }
}

function deleteCourse() {
  const course = currentCourse;
  if (!course) return;
  
  if (confirm(`Are you sure you want to delete the course "${course.courseTitle}"? This action cannot be undone.`)) {
    try {
      // Remove course
      coursesData = coursesData.filter(c => c.courseId !== course.courseId);
      
      // Remove progress data
      delete progressData[course.courseId];
      
      // Go back to home
      showView('home');
      loadCourses();
    } catch (error) {
      showError('Failed to delete course');
    }
  }
}

// Error handling
function showError(message) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = message;
  errorDiv.classList.add('show');
}

function hideError() {
  const errorDiv = document.getElementById('error-message');
  errorDiv.classList.remove('show');
}

// Add sample tax questions for testing (can be removed in production)
function addSampleTaxQuestions() {
  const sampleData = {
    "questions": [
      {
        "question_id": "94850116",
        "topic": "Use of Prior Returns",
        "question_text": "Layla is self-employed and expects to owe $2,500 of taxes for the year. Her tax liability for the prior tax year was zero because her Schedule C business had a loss in the prior year. Which of the following statements is correct?",
        "options": [
          {"id": "A", "text": "Layla is required to pay the full amount due before December 31 or she will be subject to an estimated tax penalty.", "is_correct": false},
          {"id": "B", "text": "Layla is required to pay estimated taxes.", "is_correct": false},
          {"id": "C", "text": "Layla is not required to pay estimated taxes.", "is_correct": true},
          {"id": "D", "text": "Layla must pay at least $1,500 of estimated tax during the year.", "is_correct": false}
        ],
        "correct_answer": "C",
        "study_unit": {"number": 1, "name": "Preliminary Work with Taxpayer Data"},
        "explanation": "Since Layla had zero tax liability on her prior-year return, she is not required to pay any estimated tax in the current year.",
        "first_attempt_rate": 63,
        "difficulty": 2
      },
      {
        "question_id": "94815853",
        "topic": "Taxpayer Personal Information",
        "question_text": "Penny was the victim of identity theft last year. She received an IP PIN from the IRS this year. How should the IP PIN be used?",
        "options": [
          {"id": "A", "text": "The preparer should enter Penny's IP PIN on the tax return in the PTIN section.", "is_correct": false},
          {"id": "B", "text": "The preparer should enter Penny's IP PIN on the tax return next to her signature block.", "is_correct": true},
          {"id": "C", "text": "The preparer does not need to enter Penny's IP PIN on the tax return.", "is_correct": false},
          {"id": "D", "text": "The preparer should enter Penny's IP PIN in the third-party designee area.", "is_correct": false}
        ],
        "correct_answer": "B",
        "study_unit": {"number": 1, "name": "Preliminary Work with Taxpayer Data"},
        "explanation": "The preparer should enter Penny's IP PIN on the tax return next to her signature block.",
        "first_attempt_rate": 59,
        "difficulty": 3
      }
    ]
  };
  
  if (validateFlatQuestions(sampleData)) {
    const course = transformQuestionsToCourse(sampleData.questions);
    saveCourse(course);
    loadCourses();
  }
}

// Add sample course for testing (can be removed in production)
function addSampleCourse() {
  const sampleCourse = {
    "courseTitle": "Introduction to JavaScript",
    "courseDescription": "Learn JavaScript fundamentals from scratch",
    "courseId": "js-basics-101",
    "units": [
      {
        "unitId": "unit-1",
        "unitTitle": "Variables and Data Types",
        "unitDescription": "Understanding variables, primitives, and type coercion",
        "topics": [
          {
            "topicId": "topic-1-1",
            "topicTitle": "Variable Declaration",
            "topicDescription": "Learn var, let, and const",
            "mcqs": [
              {
                "questionId": "q1",
                "question": "Which keyword should you use to declare a block-scoped variable?",
                "options": ["A) var", "B) let", "C) const", "D) function"],
                "correct": "B",
                "explanation": "let creates block-scoped variables that can be reassigned",
                "difficulty": "easy",
                "points": 10
              },
              {
                "questionId": "q2",
                "question": "What happens when you try to reassign a const variable?",
                "options": ["A) It works fine", "B) It creates a new variable", "C) It throws an error", "D) It becomes undefined"],
                "correct": "C",
                "explanation": "const variables cannot be reassigned after initialization",
                "difficulty": "medium",
                "points": 10
              }
            ]
          },
          {
            "topicId": "topic-1-2",
            "topicTitle": "Data Types",
            "topicDescription": "Primitive and reference types",
            "mcqs": [
              {
                "questionId": "q3",
                "question": "Which of the following is NOT a primitive type in JavaScript?",
                "options": ["A) string", "B) number", "C) array", "D) boolean"],
                "correct": "C",
                "explanation": "Arrays are reference types (objects), not primitives",
                "difficulty": "easy",
                "points": 10
              }
            ]
          }
        ]
      },
      {
        "unitId": "unit-2",
        "unitTitle": "Functions",
        "unitDescription": "Function declarations, expressions, and arrow functions",
        "topics": [
          {
            "topicId": "topic-2-1",
            "topicTitle": "Function Basics",
            "topicDescription": "Creating and calling functions",
            "mcqs": [
              {
                "questionId": "q4",
                "question": "What is the difference between function declaration and function expression?",
                "options": ["A) No difference", "B) Declarations are hoisted", "C) Expressions are faster", "D) Declarations cannot have parameters"],
                "correct": "B",
                "explanation": "Function declarations are hoisted to the top of their scope",
                "difficulty": "medium",
                "points": 10
              }
            ]
          }
        ]
      }
    ]
  };
  
  saveCourse(sampleCourse);
  loadCourses();
}

// Make functions globally accessible
window.switchPracticeMode = switchPracticeMode;
window.startAllShuffledQuiz = startAllShuffledQuiz;
window.startUnitQuiz = startUnitQuiz;
window.exitQuiz = exitQuiz;
window.backToCourse = backToCourse;
window.retryQuiz = retryQuiz;
window.deleteCourse = deleteCourse;
window.toggleUnit = toggleUnit;
window.startQuiz = startQuiz;
window.selectAnswer = selectAnswer;
window.nextQuestion = nextQuestion;
window.openCourse = openCourse;
window.showView = showView;

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
  // Only in quiz view
  if (currentView === 'quiz' && currentQuiz.questions.length > 0) {
    // Allow A, B, C, D key selection
    if (['KeyA', 'KeyB', 'KeyC', 'KeyD'].includes(e.code)) {
      const answer = e.code.replace('Key', '');
      selectAnswer(answer);
    }
    // Escape key to exit quiz
    if (e.code === 'Escape') {
      exitQuiz();
    }
  }
});

// Add enhanced user experience features
document.addEventListener('DOMContentLoaded', function() {
  // Add smooth scrolling for all internal links
  document.documentElement.style.scrollBehavior = 'smooth';
  
  // Add focus management for better accessibility
  let lastFocusedElement = null;
  
  document.addEventListener('focusin', function(e) {
    lastFocusedElement = e.target;
  });
  
  // Return focus when exiting modals/views
  window.addEventListener('viewchange', function() {
    if (lastFocusedElement && document.contains(lastFocusedElement)) {
      lastFocusedElement.focus();
    }
  });
});

// Uncomment the line below to add sample course on page load (for testing)
// setTimeout(() => addSampleTaxQuestions(), 1000);