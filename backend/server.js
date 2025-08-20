// server.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import * as v2Routers from './routes/v2/index.js';
import * as v3Routers from './routes/v3/index.js';

// ESM equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;
const WS_PING_INTERVAL = 30000; // 30 seconds

// --- In-memory Data Store (IDs are strings for consistency) ---
let users = [];
let students = [];
let classes = [];
let historyLogs = [];
let awards = [];
let exams = [];
let marks = [];
let libraryBooks = [];
let bookTransactions = [];
let attendanceRecords = [];
let timetableSlots = [];
let syllabi = [];
let inventoryItems = [];
let feeCategories = [];
let feeStructures = [];
let feePayments = [];
let expenses = [];
let payrollEntries = [];
let leaveRequests = [];
let trainingSessions = [];
let notices = [];
let schoolEvents = [];
let transportVehicles = [];
let transportRoutes = [];
let schoolSettings = [{id: 'setting-1', key: 'schoolName', value: 'Sunshine Academy', description: 'The official name of the school.'}, {id: 'setting-2', key: 'currentTerm', value: 'Term 1 2024', description: 'The active academic term.'}];
let incidents = [];
let studentWellnessLogs = [];
let teacherResources = [];
let meetings = [];
let chatRooms = [];
let chatMessages = [];
let notifications = [];
let studentPoints = {}; // Store as { userId: { points: number, badges: string[] } }
let callLogs = [];
let bookRequests = [];
let forumPosts = [];
let forumReplies = [];
let academicYearSettings = null;
let courses = []; 
let studentCourseEnrollments = []; 
let disciplineRules = [];
let activities = []; 
let activityEnrollments = []; 
let onlineExamSubmissions = [];

// Helper to generate unique IDs
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
let nextNotificationId = 1;
let nextCallId = 1;
let nextStudentRegNum = 1001;

const ADMIN_EMAIL = 'reponsekdz06@gmail.com';
const ADMIN_CODE = '20072025';

const WebSocketClients = new Map(); // Renamed to avoid conflict with 'clients' elsewhere if any
const roomSubscriptions = new Map(); // roomId -> Set<userId>

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // For serving static files if saved to disk

// --- Multer Setup ---
const storage = multer.memoryStorage();
const fileUploadMiddleware = multer({ storage: storage, limits: { fileSize: 20 * 1024 * 1024 } }); // Generic file upload
const avatarUploadMiddleware = multer({
    storage: storage, limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files for avatars!'), false)
});
const receiptUploadMiddleware = multer({
    storage: storage, limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') ? cb(null, true) : cb(new Error('Only image or PDF for receipts!'), false)
});


// --- Helper Functions (Finders, Sorters, etc.) ---
const findUserByEmail = (email) => users.find(u => u.email === email);
const findUserByPhone = (phone) => users.find(u => u.phone === phone);
const findUserById = (id) => users.find(u => u.id === id);
const findStudentById = (id) => students.find(s => s.id === id);
const findStudentByUserId = (userId) => students.find(s => s.userId === userId);
const findCallLogById = (id) => callLogs.find(cl => cl.id === id);
const findClassById = (id) => classes.find(c => c.id === id);
const findExamById = (id) => exams.find(e => e.id === id);
const findMarkByStudentAndExam = (studentId, examId) => marks.find(m => m.studentId === studentId && m.examId === examId);
const findBookById = (id) => libraryBooks.find(b => b.id === id);
const findInventoryItemById = (id) => inventoryItems.find(i => i.id === id);
const findFeeCategoryById = (id) => feeCategories.find(fc => fc.id === id);
const findFeeStructureById = (id) => feeStructures.find(fs => fs.id === id);
const findExpenseById = (id) => expenses.find(e => e.id === id);
const findPayrollEntryById = (id) => payrollEntries.find(p => p.id === id);
const findLeaveRequestById = (id) => leaveRequests.find(lr => lr.id === id);
const findTrainingSessionById = (id) => trainingSessions.find(ts => ts.id === id);
const findNoticeById = (id) => notices.find(n => n.id === id);
const findEventById = (id) => schoolEvents.find(e => e.id === id);
const findVehicleById = (id) => transportVehicles.find(v => v.id === id);
const findRouteById = (id) => transportRoutes.find(r => r.id === id);
const findDisciplineRuleById = (id) => disciplineRules.find(rule => rule.id === id);
const findIncidentById = (id) => incidents.find(i => i.id === id);
const findTeacherResourceById = (id) => teacherResources.find(tr => tr.id === id);
const findMeetingById = (id) => meetings.find(m => m.id === id);
const findChatRoomById = (id) => chatRooms.find(cr => cr.id === id);
const findBookRequestById = (id) => bookRequests.find(br => br.id === id);
const findForumPostById = (id) => forumPosts.find(fp => fp.id === id);
const findForumReplyById = (id) => forumReplies.find(fr => fr.id === id);
const findCourseById = (id) => courses.find(c => c.id === id);
const findWellnessLogById = (id) => studentWellnessLogs.find(log => log.id === id);
const findOnlineExamSubmissionById = (id) => onlineExamSubmissions.find(sub => sub.id === id);
const findActivityById = (id) => activities.find(act => act.id === id);
const findActivityEnrollmentById = (id) => activityEnrollments.find(enr => enr.id === id);
const findBookTransactionById = (id) => bookTransactions.find(bt => bt.id === id);
const findStudentCourseEnrollment = (studentId, courseId) => studentCourseEnrollments.find(e => e.studentId === studentId && e.courseId === courseId);


const isUserCurrentlyInActiveCall = (userId) => {
    return callLogs.some(call =>
        call.participants.some(p => p.userId === userId && p.status === 'connected') &&
        !['ended', 'declined', 'failed', 'missed', 'left'].includes(call.status)
    );
};


const initializeData = () => {
  if (!users.find(u => u.email === ADMIN_EMAIL)) {
    const adminId = generateId('user');
    users.push({ id: adminId, name: 'Admin User', email: ADMIN_EMAIL, password: ADMIN_CODE, role: 'Admin', avatar: null, phone: '1234567890', lastLogin: new Date().toISOString() });
    studentPoints[adminId] = { points: 0, badges: ['School Admin'] };
  }
  let doctorUser = users.find(u => u.role === 'Doctor');
  if (!doctorUser) {
    const doctorUserId = generateId('user');
    doctorUser = { id: doctorUserId, name: 'Dr. Emily Carter', email: 'doctor.carter@school.com', password: 'password123', role: 'Doctor', avatar: null, phone: '9998887777', lastLogin: new Date().toISOString() };
    users.push(doctorUser); studentPoints[doctorUserId] = { points: 0, badges: ['Healthcare Professional'] };
  }
  if (students.length < 2) {
    const studentUser1Id = generateId('user'); const student1RecordId = generateId('student');
    users.push({id: studentUser1Id, name: 'Alice Wonderland', email: 'alice@school.com', password: 'password123', role: 'Student', studentDetailsId: student1RecordId });
    students.push({id: student1RecordId, userId: studentUser1Id, studentId: `S${nextStudentRegNum++}`, name: 'Alice Wonderland', grade: '10', parentContact: 'parent@example.com'});
    studentWellnessLogs.push({id: generateId('well'), studentUserId: studentUser1Id, studentName: 'Alice Wonderland', mood: 'happy', entryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), notes: 'Feeling good about recent test.'});
    const studentUser2Id = generateId('user'); const student2RecordId = generateId('student');
    users.push({id: studentUser2Id, name: 'Bob The Builder', email: 'bob@school.com', password: 'password123', role: 'Student', studentDetailsId: student2RecordId});
    students.push({id: student2RecordId, userId: studentUser2Id, studentId: `S${nextStudentRegNum++}`, name: 'Bob The Builder', grade: '9', parentContact: 'parent2@example.com'});
    studentWellnessLogs.push({id: generateId('well'), studentUserId: studentUser2Id, studentName: 'Bob The Builder', mood: 'anxious', entryDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), notes: 'Worried about upcoming presentation.'});
    if(doctorUser) { studentWellnessLogs.push({id: generateId('well'), studentUserId: studentUser2Id, studentName: 'Bob The Builder', mood: 'okay', entryDate: new Date().toISOString(), notes: 'Feeling better after talking to a friend.', loggedByDoctorId: doctorUser.id, loggedByDoctorName: doctorUser.name}); }
  }
  const aliceUser = users.find(u => u.name === 'Alice Wonderland');
  if (aliceUser && !awards.some(aw => aw.awardedToStudentId === aliceUser.id)) {
      awards.push({id: generateId('award'), name: 'Math Olympiad Participation', description: 'Participated in the regional Math Olympiad.', dateAwarded: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), awardedToStudentId: aliceUser.id, awardedBy: 'Math Department'});
      awards.push({id: generateId('award'), name: 'Science Fair - 2nd Place', description: 'Achieved 2nd place in the annual school science fair.', dateAwarded: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), awardedToStudentId: aliceUser.id, awardedBy: 'Science Department'});
  }
  if (!academicYearSettings) {
    academicYearSettings = { id: generateId('acad-year'), schoolYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, terms: [ { id: generateId('term'), name: 'Term 1', startDate: `${new Date().getFullYear()}-01-15`, endDate: `${new Date().getFullYear()}-04-05`, isCurrent: true }, { id: generateId('term'), name: 'Term 2', startDate: `${new Date().getFullYear()}-04-22`, endDate: `${new Date().getFullYear()}-07-12`, isCurrent: false }, { id: generateId('term'), name: 'Term 3', startDate: `${new Date().getFullYear()}-08-05`, endDate: `${new Date().getFullYear()}-11-22`, isCurrent: false }, ] };
  }
  if(courses.length === 0) {
    courses.push({id: generateId('course'), title: 'Introduction to Algebra', description: 'Fundamental concepts of algebra.', instructor: 'Dr. Math', credits: 3, department: 'Mathematics', code: 'MATH101'});
    courses.push({id: generateId('course'), title: 'World History I', description: 'Ancient civilizations to the medieval period.', instructor: 'Prof. History', credits: 3, department: 'Social Studies', code: 'HIST101'});
  }
  if(activities.length === 0) {
    const teacherForActivity = users.find(u => u.role === 'Teacher');
    activities.push({ id: generateId('activity'), name: 'School Soccer Club', description: 'Join the school soccer club to learn new skills, make friends, and compete!', category: 'Sports', teacherInChargeId: teacherForActivity?.id || null, teacherInChargeName: teacherForActivity?.name || 'TBD', schedule: 'Tuesdays & Thursdays, 4 PM - 5:30 PM', location: 'Main Sports Field', maxParticipants: 30, currentParticipantsCount: 0, isEnrollmentOpen: true });
    activities.push({ id: generateId('activity'), name: 'Debate Team', description: 'Sharpen your critical thinking and public speaking skills with the debate team.', category: 'Academic Clubs', teacherInChargeId: null, teacherInChargeName: 'Ms. Eloquent', schedule: 'Wednesdays, 3:30 PM - 5 PM', location: 'Room 201', maxParticipants: 20, currentParticipantsCount: 0, isEnrollmentOpen: true });
  }
  console.log(`${users.length} users, ${students.length} students, ${courses.length} courses, ${activities.length} activities initialized.`);
};
initializeData();

// --- Logging Middleware ---
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// --- History Log Function ---
const addHistoryLog = (userEmail, action, details = '') => {
  const newLog = { id: generateId('log'), timestamp: new Date().toISOString(), userEmail, action, details };
  historyLogs.push(newLog);
  console.log(`History: ${userEmail} - ${action} - ${details}`);
};

// --- Authentication Middleware ---
const authMiddleware = (req, res, next) => {
  const userEmail = req.headers['x-user-email'];
  if (userEmail) {
    const user = findUserByEmail(userEmail);
    if (user) {
      req.user = user;
    } else {
      console.warn(`AuthMiddleware: User with email ${userEmail} not found.`);
    }
  }
  next();
};
app.use(authMiddleware);

// =========================================================================================
// --- API ROUTE MOUNTING ---
// =========================================================================================

// --- V2 API ---
const v2ApiRouter = express.Router();
Object.values(v2Routers).forEach(router => v2ApiRouter.use(router));
app.use('/api/v2', v2ApiRouter);

// --- V3 API ---
const v3ApiRouter = express.Router();
Object.values(v3Routers).forEach(router => v3ApiRouter.use(router));
app.use('/api/v3', v3ApiRouter);

// Redirect /api to the latest version for convenience
app.use('/api', v3ApiRouter);


// Pass middleware to routers that need it (example for file uploads)
// This is a simplified approach. A more robust solution would involve defining these in the router files themselves.
v2Routers.usersRouter.post('/', avatarUploadMiddleware.single('avatarFile'), (req, res) => res.status(501).json({message: "Not implemented"}));
v2Routers.usersRouter.put('/:id', avatarUploadMiddleware.single('avatarFile'), (req, res) => res.status(501).json({message: "Not implemented"}));
v2Routers.studentsRouter.post('/', avatarUploadMiddleware.single('avatarFile'), (req, res) => res.status(501).json({message: "Not implemented"}));
v2Routers.studentsRouter.put('/:id', avatarUploadMiddleware.single('avatarFile'), (req, res) => res.status(501).json({message: "Not implemented"}));
v2Routers.financeRouter.post('/expenses', receiptUploadMiddleware.single('receiptFile'), (req, res) => res.status(501).json({message: "Not implemented"}));
v2Routers.financeRouter.put('/expenses/:id', receiptUploadMiddleware.single('receiptFile'), (req, res) => res.status(501).json({message: "Not implemented"}));
v2Routers.academicsRouter.post('/syllabus', fileUploadMiddleware.single('syllabusFile'), (req, res) => res.status(501).json({message: "Not implemented"}));
v2Routers.academicsRouter.put('/syllabus/:syllabusId', fileUploadMiddleware.single('syllabusFile'), (req, res) => res.status(501).json({message: "Not implemented"}));
v2Routers.teacherRouter.post('/resources', fileUploadMiddleware.single('resourceFile'), (req, res) => res.status(501).json({message: "Not implemented"}));
v2Routers.teacherRouter.put('/resources/:id', fileUploadMiddleware.single('resourceFile'), (req, res) => res.status(501).json({message: "Not implemented"}));
v2Routers.chatRouter.post('/upload-file', fileUploadMiddleware.single('chatFile'), (req, res) => res.status(501).json({message: "Not implemented"}));


// =========================================================================================
// --- WebSocket Server Logic ---
// =========================================================================================
wss.on('connection', (ws, req) => { /* ... existing code ... */ });


// =========================================================================================
// --- Generic Error Handler & Server Start ---
// =========================================================================================
// Default route for unmatched API calls
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: `API endpoint ${req.originalUrl} not found.` });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err.stack || err.message || err);
  // If the error is from multer (e.g. file too large), it might have specific properties
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: `File too large. ${err.message}` });
  }
  if (err.message && (err.message.includes('Only image files') || err.message.includes('Only image or PDF'))) {
    return res.status(400).json({ message: err.message });
  }
  res.status(err.status || 500).json({
    message: err.message || "An unexpected server error occurred.",
    // ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) // Optional: include stack in dev
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app; // For potential testing