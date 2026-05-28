const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'web/src/app/admin/reputations/page.tsx');
const componentsDir = path.join(__dirname, 'web/src/app/admin/reputations/components');

if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

let content = fs.readFileSync(pagePath, 'utf8');

// 1. Extract StudentsTab
const studentsStart = content.indexOf("{/* Tab 1: Students Reputation Score Table */}");
const studentsEnd = content.indexOf("{/* Tab 2: Feedback & Reviews Feed */}");
const studentsContent = content.substring(studentsStart, studentsEnd);
content = content.replace(studentsContent, "{activeTab === 'students' && <StudentsTab {...props} />}\n\n        ");

// 2. Extract FeedbacksTab
const feedbacksStart = content.indexOf("{/* Tab 2: Feedback & Reviews Feed */}");
const feedbacksEnd = content.indexOf("{/* Tab 3: Activities & System Logs */}");
const feedbacksContent = content.substring(feedbacksStart, feedbacksEnd);
content = content.replace(feedbacksContent, "{activeTab === 'feedbacks' && <FeedbacksTab {...props} />}\n\n        ");

// 3. Extract ActivitiesTab
const activitiesStart = content.indexOf("{/* Tab 3: Activities & System Logs */}");
const activitiesEnd = content.indexOf("{/* Adjustment Modal */}");
const activitiesContent = content.substring(activitiesStart, activitiesEnd);
content = content.replace(activitiesContent, "{activeTab === 'activities' && <ActivitiesTab {...props} />}\n\n        ");

// Construct props object in page.tsx
const propsCode = `
  const props = {
    // Students
    studentStatusFilter, setStudentStatusFilter,
    studentScoreFilter, setStudentScoreFilter,
    studentSort, setStudentSort,
    setStudentPage, paginatedStudents, sortedStudents,
    currentStudentPage, studentTotalPages, studentPaginationItems,
    setSelectedStudent,
    // Feedbacks
    feedbackRatingFilter, setFeedbackRatingFilter,
    feedbackSort, setFeedbackSort,
    setFeedbackPage, paginatedFeedbacks, sortedFeedbacks,
    currentFeedbackPage, feedbackTotalPages, feedbackPaginationItems,
    // Activities
    activityTypeFilter, setActivityTypeFilter,
    activitySort, setActivitySort,
    setActivityPage, paginatedActivities, sortedActivities,
    currentActivityPage, activityTotalPages, activityPaginationItems
  };
`;
content = content.replace("return (", propsCode + "\n  return (");

// Add imports
const imports = `
import { StudentsTab } from './components/StudentsTab';
import { FeedbacksTab } from './components/FeedbacksTab';
import { ActivitiesTab } from './components/ActivitiesTab';
`;
content = content.replace("import DashboardLayout", imports + "import DashboardLayout");

fs.writeFileSync(pagePath, content, 'utf8');

const tabImports = `import React from 'react';\nimport { Filter, Sliders, ChevronLeft, ChevronRight, Star, ShieldCheck, AlertTriangle, MessageSquare, TrendingUp, TrendingDown, History } from 'lucide-react';\n\n`;

const generateComponent = (name, content) => {
  let cleaned = content;
  cleaned = cleaned.replace("{activeTab === 'students' && (", "");
  cleaned = cleaned.replace("{activeTab === 'feedbacks' && (", "");
  cleaned = cleaned.replace("{activeTab === 'activities' && (", "");
  if (cleaned.endsWith(')}')) {
    cleaned = cleaned.substring(0, cleaned.length - 2);
  }
  
  return tabImports + "export const " + name + " = (props: any) => {\\n" +
  "  const { \\n" +
  "    studentStatusFilter, setStudentStatusFilter,\\n" +
  "    studentScoreFilter, setStudentScoreFilter,\\n" +
  "    studentSort, setStudentSort,\\n" +
  "    setStudentPage, paginatedStudents, sortedStudents,\\n" +
  "    currentStudentPage, studentTotalPages, studentPaginationItems,\\n" +
  "    setSelectedStudent,\\n" +
  "    feedbackRatingFilter, setFeedbackRatingFilter,\\n" +
  "    feedbackSort, setFeedbackSort,\\n" +
  "    setFeedbackPage, paginatedFeedbacks, sortedFeedbacks,\\n" +
  "    currentFeedbackPage, feedbackTotalPages, feedbackPaginationItems,\\n" +
  "    activityTypeFilter, setActivityTypeFilter,\\n" +
  "    activitySort, setActivitySort,\\n" +
  "    setActivityPage, paginatedActivities, sortedActivities,\\n" +
  "    currentActivityPage, activityTotalPages, activityPaginationItems\\n" +
  "  } = props;\\n\\n" +
  "  return (\\n" +
  "    <>\\n" +
  cleaned + "\\n" +
  "    </>\\n" +
  "  );\\n" +
  "};\\n";
};

fs.writeFileSync(path.join(componentsDir, 'StudentsTab.tsx'), generateComponent('StudentsTab', studentsContent), 'utf8');
fs.writeFileSync(path.join(componentsDir, 'FeedbacksTab.tsx'), generateComponent('FeedbacksTab', feedbacksContent), 'utf8');
fs.writeFileSync(path.join(componentsDir, 'ActivitiesTab.tsx'), generateComponent('ActivitiesTab', activitiesContent), 'utf8');

console.log("Refactoring complete!");
