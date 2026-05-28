const fs = require('fs');
const path = require('path');

const files = [
  'src/components/products/ProductDashboardWrapper.tsx',
  'src/app/verification/page.tsx',
  'src/app/messages/page.tsx',
  'src/app/login/page.tsx',
  'src/app/admin/posts/page.tsx',
  'src/app/admin/reputations/page.tsx',
  'src/app/admin/meeting-points/page.tsx',
  'src/app/admin/login/page.tsx',
  'src/app/admin/disputes/page.tsx',
  'src/app/admin/approvals/page.tsx'
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Import alerts
  if (!content.includes('import { showSuccessAlert')) {
    content = content.replace(/(import .*;\n)(?=\n*(?:export|const|type|interface|function))/, `$1import { showSuccessAlert, showErrorAlert, showConfirmAlert } from '@/lib/alerts';\n`);
  }

  // 2. Remove the feedback state
  content = content.replace(/const \[feedback, setFeedback\].*;\n?/g, '');
  content = content.replace(/setFeedback\(null\);\n?/g, ''); // Sometimes used to reset

  // 3. Replace showFeedback implementation
  // Old:
  // const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
  //   setFeedback({ message, type });
  //   setTimeout(() => setFeedback(null), 3000);
  // };
  const showFeedbackRegex = /const showFeedback = [^{]+{[^}]+setFeedback[^}]+}/g;
  content = content.replace(showFeedbackRegex, `const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      showSuccessAlert('Thành công!', message);
    } else {
      showErrorAlert('Lỗi!', message);
    }
  }`);
  
  // also handle some variants
  content = content.replace(/const showFeedback = \([^)]+\) => {\s*setFeedback\([^)]+\);\s*};?/g, `const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      showSuccessAlert('Thành công!', message);
    } else {
      showErrorAlert('Lỗi!', message);
    }
  };`);

  // 4. Remove the JSX block for feedback
  // Pattern: {feedback && ( ... )}
  // This is a bit tricky with regex for nested divs. I'll use a known trick: it's a block starting with `{feedback && (` and ending with a line having just `)}` before other main tags, or I can use a simpler approach.
  // Actually, let's just find the exact block from one file:
  // `{feedback && (\n          <div className={\`fixed... (multiple lines) ...        </div>\n      )}`
  const feedbackBlockRegex = /\{feedback && \([\s\S]*?(?:<\/div>\s*\)\}|<\/div>\s*\]\)\})\s*/g;
  content = content.replace(feedbackBlockRegex, '');
  
  // Also try to catch this one from admin/posts/page.tsx:
  // {feedback && (
  //   <div className={`fixed ...`}>
  //     <span ...>{feedback.message}</span>
  //   </div>
  // )}
  const feedbackBlockRegex2 = /\{feedback && \([\s\S]*?<\/div>\s*\)\}\n?/g;
  content = content.replace(feedbackBlockRegex2, '');
  
  // 5. Replace window.confirm
  content = content.replace(/const (\w+) = window\.confirm\(([\s\S]+?)\);/g, "const $1 = (await showConfirmAlert('Xác nhận', $2)).isConfirmed;");

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated ${file}`);
}
