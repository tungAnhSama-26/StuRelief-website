const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'web/src/app/messages/page.tsx');
const componentsDir = path.join(__dirname, 'web/src/app/messages/components');

if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

let content = fs.readFileSync(pagePath, 'utf8');

const modalStart = content.indexOf("{/* Meeting Point Modal */}");
const modalEnd = content.indexOf("</DashboardLayout>");

if (modalStart !== -1 && modalEnd !== -1) {
  const modalContent = content.substring(modalStart, modalEnd);
  content = content.replace(modalContent, "<MeetingPointModal {...props} />\n      ");
  
  const componentImports = `import React from 'react';\nimport { MapPin } from 'lucide-react';\n\n`;
  const componentCode = `${componentImports}export const MeetingPointModal = (props: any) => {\n  const { \n    showMeetingPointModal, setShowMeetingPointModal, \n    meetingPointName, setMeetingPointName, \n    meetingPointCampus, setMeetingPointCampus, \n    meetingPointUniversity, setMeetingPointUniversity, \n    meetingPointAddress, setMeetingPointAddress,\n    handleSendMeetingPoint\n  } = props;\n\n  return (\n    <>\n      ${modalContent}\n    </>\n  );\n};\n`;
  
  fs.writeFileSync(path.join(componentsDir, 'MeetingPointModal.tsx'), componentCode, 'utf8');
}

// Add imports
const imports = `
import { MeetingPointModal } from './components/MeetingPointModal';
`;
content = content.replace("import DashboardLayout", imports + "import DashboardLayout");

// Add props object
const propsCode = `
  const props = {
    showMeetingPointModal, setShowMeetingPointModal,
    meetingPointName, setMeetingPointName,
    meetingPointCampus, setMeetingPointCampus,
    meetingPointUniversity, setMeetingPointUniversity,
    meetingPointAddress, setMeetingPointAddress,
    handleSendMeetingPoint
  };
`;
content = content.replace("return (", propsCode + "\n  return (");

fs.writeFileSync(pagePath, content, 'utf8');
console.log("Refactoring messages complete!");
