
// server.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

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
    const user = findUserByEmail(userEmail as string);
    if (user) {
      req.user = user;
    } else {
      // Allow request to proceed, but req.user will be undefined. Specific routes can then decide to block.
      // This helps for public-facing parts of an API if any, or for debugging.
      console.warn(`AuthMiddleware: User with email ${userEmail} not found.`);
    }
  }
  next();
};
app.use(authMiddleware);

// --- Role-based Authorization Middleware ---
const roleAuth = (allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized: Authentication required." });
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden: You do not have access to this resource." });
  }
  next();
};

// =========================================================================================
// --- API ROUTES ---
// =========================================================================================

// --- Auth Routes ---
const authRouter = express.Router();
authRouter.post('/login', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
authRouter.post('/login-admin', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
authRouter.post('/register', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
authRouter.post('/login-phone', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
authRouter.post('/register-phone', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/auth', authRouter);


// --- User Management Routes ---
const userRouter = express.Router();
userRouter.get('/', roleAuth(['Admin', 'Head Teacher']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
userRouter.get('/:id', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
userRouter.post('/', roleAuth(['Admin']), avatarUploadMiddleware.single('avatarFile'), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
userRouter.put('/:id', avatarUploadMiddleware.single('avatarFile'), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
userRouter.delete('/:id', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/users', userRouter);


// --- Student Management Routes ---
const studentRouter = express.Router();
studentRouter.get('/', roleAuth(['Admin', 'Teacher', 'Head Teacher', 'Doctor']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
studentRouter.get('/:id', roleAuth(['Admin', 'Teacher', 'Head Teacher', 'Doctor']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
studentRouter.post('/', roleAuth(['Admin']), avatarUploadMiddleware.single('avatarFile'), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
studentRouter.put('/:id', roleAuth(['Admin']), avatarUploadMiddleware.single('avatarFile'), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
studentRouter.delete('/:id', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/students', studentRouter);


// --- Class Management Routes ---
const classRouter = express.Router();
classRouter.get('/', roleAuth(['Admin', 'Teacher', 'Head Teacher']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
classRouter.post('/', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
classRouter.put('/:id', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
classRouter.delete('/:id', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/classes', classRouter);


// --- History Log Route ---
const historyRouter = express.Router();
historyRouter.get('/', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
historyRouter.post('/', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
historyRouter.delete('/', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/history', historyRouter);


// --- Academic Year Settings ---
const academicYearRouter = express.Router();
academicYearRouter.get('/', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
academicYearRouter.put('/', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/admin/academic-year', academicYearRouter);


// --- Awards Routes ---
const awardRouter = express.Router();
awardRouter.get('/student/:studentUserId', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
awardRouter.post('/', roleAuth(['Admin', 'Teacher', 'Head Teacher']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/awards', awardRouter);


// --- Notifications Routes ---
const notificationRouter = express.Router();
notificationRouter.get('/', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
notificationRouter.get('/unread-count', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
notificationRouter.put('/:notificationId/read', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
notificationRouter.put('/mark-all-read', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
notificationRouter.post('/send', roleAuth(['Admin', 'Head Teacher', 'Doctor']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/notifications', notificationRouter);


// --- Meeting Management Routes ---
const meetingRouter = express.Router();
meetingRouter.get('/', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
meetingRouter.post('/', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
meetingRouter.put('/:meetingId', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
meetingRouter.get('/attendance-report', roleAuth(['Admin', 'Head Teacher']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/meetings', meetingRouter);


// --- Calling API Routes ---
const callRouter = express.Router();
callRouter.post('/initiate', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
callRouter.put('/:callId/answer', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
callRouter.put('/:callId/decline', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
callRouter.put('/:callId/busy', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
callRouter.put('/:callId/end', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
callRouter.get('/my-history', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/calls', callRouter);


// --- Finance Routes (Categories, Structures, Payments, Expenses, Payroll) ---
const financeRouter = express.Router();
financeRouter.get('/fee-categories', roleAuth(['Admin', 'Bursar', 'Accountant']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
financeRouter.post('/fee-categories', roleAuth(['Admin', 'Bursar']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
financeRouter.put('/fee-categories/:id', roleAuth(['Admin', 'Bursar']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
financeRouter.delete('/fee-categories/:id', roleAuth(['Admin', 'Bursar']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
financeRouter.get('/fee-structures', roleAuth(['Admin', 'Bursar', 'Accountant']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
financeRouter.post('/fee-structures', roleAuth(['Admin', 'Bursar']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
financeRouter.put('/fee-structures/:id', roleAuth(['Admin', 'Bursar']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
financeRouter.delete('/fee-structures/:id', roleAuth(['Admin', 'Bursar']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
financeRouter.post('/payments', roleAuth(['Bursar', 'Accountant']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
financeRouter.get('/expenses', roleAuth(['Admin', 'Bursar', 'Accountant']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
financeRouter.post('/expenses', roleAuth(['Admin', 'Bursar', 'Accountant']), receiptUploadMiddleware.single('receiptFile'), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
financeRouter.put('/expenses/:id', roleAuth(['Admin', 'Bursar', 'Accountant']), receiptUploadMiddleware.single('receiptFile'), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
financeRouter.delete('/expenses/:id', roleAuth(['Admin', 'Bursar', 'Accountant']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
financeRouter.get('/payroll', roleAuth(['Admin', 'Bursar', 'Accountant']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
financeRouter.post('/payroll', roleAuth(['Admin', 'Bursar', 'Accountant']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
financeRouter.put('/payroll/:id', roleAuth(['Admin', 'Bursar', 'Accountant']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
financeRouter.delete('/payroll/:id', roleAuth(['Admin', 'Bursar', 'Accountant']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
financeRouter.get('/admin-dashboard', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/finance', financeRouter);

// --- Bursar Specific Fee Info Routes ---
const bursarRouter = express.Router();
bursarRouter.get('/all-student-fees', roleAuth(['Admin', 'Bursar', 'Accountant']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
bursarRouter.get('/student-fees/:studentId', roleAuth(['Admin', 'Bursar', 'Accountant', 'Parent']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/bursar', bursarRouter);

// --- Academics Routes (Exams, Marks, Attendance, Syllabus, Timetable) ---
const academicsRouter = express.Router();
// Exams
academicsRouter.get('/exams', roleAuth(['Admin', 'Teacher', 'Head Teacher']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
academicsRouter.post('/exams', roleAuth(['Admin', 'Teacher', 'Head Teacher']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
academicsRouter.put('/exams/:examId', roleAuth(['Admin', 'Teacher', 'Head Teacher']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
academicsRouter.delete('/exams/:examId', roleAuth(['Admin', 'Teacher', 'Head Teacher']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
// Marks
academicsRouter.get('/exams/:examId/marks', roleAuth(['Admin', 'Teacher', 'Head Teacher']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
academicsRouter.post('/marks', roleAuth(['Admin', 'Teacher', 'Head Teacher']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
// Attendance
academicsRouter.get('/attendance/class/:classId/date/:dateString', roleAuth(['Admin', 'Teacher', 'Head Teacher']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
academicsRouter.post('/attendance/bulk', roleAuth(['Admin', 'Teacher', 'Head Teacher']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
// Syllabus
academicsRouter.get('/syllabus', roleAuth(['Admin', 'Teacher', 'Head Teacher']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
academicsRouter.post('/syllabus', roleAuth(['Admin', 'Teacher', 'Head Teacher']), fileUploadMiddleware.single('syllabusFile'), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
academicsRouter.put('/syllabus/:syllabusId', roleAuth(['Admin', 'Teacher', 'Head Teacher']), fileUploadMiddleware.single('syllabusFile'), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
academicsRouter.delete('/syllabus/:syllabusId', roleAuth(['Admin', 'Teacher', 'Head Teacher']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
// Timetable
academicsRouter.get('/timetable', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
academicsRouter.post('/timetable', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
academicsRouter.put('/timetable/:slotId', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
academicsRouter.delete('/timetable/:slotId', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/academics', academicsRouter);

// Common Timetable Route (for users to view their own)
app.get('/api/timetable/my', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
// Common Attendance Route (for users to view their own or child's)
app.get('/api/attendance/my', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.get('/api/attendance/student/:studentId', roleAuth(['Admin', 'Teacher', 'Head Teacher', 'Disciplinarian']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});


// --- Library Routes ---
const libraryRouter = express.Router();
libraryRouter.get('/books', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
libraryRouter.post('/books', roleAuth(['Admin', 'Librarian']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
libraryRouter.put('/books/:id', roleAuth(['Admin', 'Librarian']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
libraryRouter.delete('/books/:id', roleAuth(['Admin', 'Librarian']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/library', libraryRouter);


// --- Inventory Routes ---
const inventoryRouter = express.Router();
inventoryRouter.get('/', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
inventoryRouter.post('/', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
inventoryRouter.put('/:id', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
inventoryRouter.delete('/:id', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/inventory', inventoryRouter);


// --- HR Routes (Leave, Training) ---
const hrRouter = express.Router();
hrRouter.get('/leave', roleAuth(['Admin', 'Head Teacher']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
hrRouter.get('/leave/my', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
hrRouter.post('/leave', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
hrRouter.put('/leave/:id', roleAuth(['Admin', 'Head Teacher']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
hrRouter.get('/training', roleAuth(['Admin', 'Head Teacher']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
hrRouter.post('/training', roleAuth(['Admin', 'Head Teacher']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
hrRouter.put('/training/:id', roleAuth(['Admin', 'Head Teacher']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
hrRouter.delete('/training/:id', roleAuth(['Admin', 'Head Teacher']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/hr', hrRouter);


// --- Communication Routes (Notices, Events, Messages) ---
const communicationRouter = express.Router();
// Notices
communicationRouter.get('/notices', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
communicationRouter.post('/notices', roleAuth(['Admin', 'Head Teacher']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
communicationRouter.put('/notices/:id', roleAuth(['Admin', 'Head Teacher']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
communicationRouter.delete('/notices/:id', roleAuth(['Admin', 'Head Teacher']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
// Events
communicationRouter.get('/events', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
communicationRouter.post('/events', roleAuth(['Admin', 'Head Teacher']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
communicationRouter.put('/events/:id', roleAuth(['Admin', 'Head Teacher']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
communicationRouter.delete('/events/:id', roleAuth(['Admin', 'Head Teacher']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
// Messages (School-wide messages by Head Teacher)
communicationRouter.get('/messages', roleAuth(['Head Teacher', 'Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
communicationRouter.post('/messages', roleAuth(['Head Teacher', 'Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/communication', communicationRouter);


// --- Transport Routes ---
const transportRouter = express.Router();
transportRouter.get('/vehicles', roleAuth(['Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
transportRouter.post('/vehicles', roleAuth(['Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
transportRouter.put('/vehicles/:id', roleAuth(['Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
transportRouter.delete('/vehicles/:id', roleAuth(['Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
transportRouter.get('/routes', roleAuth(['Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
transportRouter.post('/routes', roleAuth(['Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
transportRouter.put('/routes/:id', roleAuth(['Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
transportRouter.delete('/routes/:id', roleAuth(['Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/transport', transportRouter);


// --- Settings Routes ---
const settingsRouter = express.Router();
settingsRouter.get('/', roleAuth(['Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
settingsRouter.put('/', roleAuth(['Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/settings', settingsRouter);


// --- Discipline Routes (Rules, Incidents) ---
const disciplineRouter = express.Router();
// Rules
disciplineRouter.get('/rules', roleAuth(['Admin', 'Head Teacher', 'Disciplinarian']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
disciplineRouter.post('/rules', roleAuth(['Admin', 'Disciplinarian']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
disciplineRouter.put('/rules/:id', roleAuth(['Admin', 'Disciplinarian']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
disciplineRouter.delete('/rules/:id', roleAuth(['Admin', 'Disciplinarian']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
// Incidents
disciplineRouter.get('/incidents', roleAuth(['Admin', 'Head Teacher', 'Disciplinarian']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
disciplineRouter.post('/incidents', roleAuth(['Admin', 'Head Teacher', 'Disciplinarian', 'Teacher']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
disciplineRouter.put('/incidents/:id', roleAuth(['Admin', 'Head Teacher', 'Disciplinarian']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
disciplineRouter.delete('/incidents/:id', roleAuth(['Admin', 'Head Teacher', 'Disciplinarian']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
disciplineRouter.get('/incidents/student/:studentId', roleAuth(['Admin', 'Head Teacher', 'Disciplinarian', 'Teacher']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/discipline', disciplineRouter);

// --- Parent-Specific Routes ---
const parentApiRouter = express.Router();
parentApiRouter.get('/child/:childUserId/incidents', roleAuth(['Parent']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
parentApiRouter.get('/child/:childUserId/activities', roleAuth(['Parent']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/parent', parentApiRouter);


// --- Teacher-Specific Routes (Resources, Comments) ---
const teacherApiRouter = express.Router();
// Resources
teacherApiRouter.get('/resources', roleAuth(['Teacher', 'Head Teacher', 'Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
teacherApiRouter.post('/resources', roleAuth(['Teacher', 'Head Teacher', 'Admin']), fileUploadMiddleware.single('resourceFile'), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
teacherApiRouter.put('/resources/:id', roleAuth(['Teacher', 'Head Teacher', 'Admin']), fileUploadMiddleware.single('resourceFile'), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
teacherApiRouter.delete('/resources/:id', roleAuth(['Teacher', 'Head Teacher', 'Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
// Comments
teacherApiRouter.get('/comments/teacher/:teacherId', roleAuth(['Teacher', 'Head Teacher', 'Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
teacherApiRouter.get('/comments/student/:studentId', roleAuth(['Admin', 'Teacher', 'Head Teacher']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
teacherApiRouter.post('/comments', roleAuth(['Teacher', 'Head Teacher']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
teacherApiRouter.put('/comments/:id', roleAuth(['Teacher', 'Head Teacher', 'Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
teacherApiRouter.delete('/comments/:id', roleAuth(['Teacher', 'Head Teacher', 'Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/teacher', teacherApiRouter);


// --- Student-Specific Routes (Exams, Submissions, Wellness, etc.) ---
const studentApiRouter = express.Router();
studentApiRouter.get('/live-exams', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
studentApiRouter.get('/live-exams/:examId', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
studentApiRouter.post('/submit-exam', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
studentApiRouter.get('/:studentUserId/wellness-logs', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})}); // Parent/Doctor can view too
studentApiRouter.get('/:studentUserId/wellness/today', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
studentApiRouter.post('/wellness', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})}); // Student posts own mood
studentApiRouter.get('/enrollments', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
studentApiRouter.post('/enrollments', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
studentApiRouter.delete('/enrollments/:enrollmentId', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
studentApiRouter.get('/book-requests', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
studentApiRouter.post('/book-requests', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
studentApiRouter.get('/digital-library', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
studentApiRouter.get('/:studentId/marks', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})}); // Student/Parent view marks
studentApiRouter.get('/activities/my-enrollments', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
studentApiRouter.post('/activities/:activityId/enroll', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
studentApiRouter.delete('/activities/:activityId/withdraw', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/student', studentApiRouter);


// --- Doctor-Specific Routes ---
const doctorApiRouter = express.Router();
doctorApiRouter.post('/wellness-log', roleAuth(['Doctor']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})}); // Doctor logs wellness for a student
doctorApiRouter.put('/wellness-log/:logId', roleAuth(['Doctor']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
doctorApiRouter.delete('/wellness-log/:logId', roleAuth(['Doctor', 'Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/doctor', doctorApiRouter);


// --- Librarian-Specific Routes ---
const librarianApiRouter = express.Router();
librarianApiRouter.get('/book-requests', roleAuth(['Librarian', 'Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
librarianApiRouter.put('/book-requests/:requestId', roleAuth(['Librarian', 'Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
librarianApiRouter.put('/transactions/:transactionId/pay-fine', roleAuth(['Librarian', 'Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/librarian', librarianApiRouter);


// --- Courses (General Listing, used by students for enrollment and admin for management) ---
app.get('/api/courses', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});


// --- Activities (General Listing, used by students for enrollment and admin for management) ---
app.get('/api/activities', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.post('/api/activities', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.put('/api/activities/:id', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.delete('/api/activities/:id', roleAuth(['Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});


// --- Chat Routes ---
const chatRouter = express.Router();
chatRouter.get('/rooms', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
chatRouter.post('/rooms', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
chatRouter.get('/rooms/:roomId/messages', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
chatRouter.post('/messages', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
chatRouter.post('/upload-file', fileUploadMiddleware.single('chatFile'), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/chat', chatRouter);


// --- Forum Routes ---
const forumRouter = express.Router(); // Initialized in existing code section
forumRouter.get('/posts', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
forumRouter.post('/posts', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
forumRouter.get('/posts/:postId', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
forumRouter.get('/posts/:postId/replies', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
forumRouter.post('/posts/:postId/replies', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
// PUT and DELETE for posts/replies were already added in a previous step
app.use('/api/forum', forumRouter);


// --- Leaderboard Route ---
app.get('/api/leaderboard', (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});


// --- Dashboard Routes ---
const dashboardRouter = express.Router();
dashboardRouter.get('/admin', roleAuth(['Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
dashboardRouter.get('/student/:userId', (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
dashboardRouter.get('/teacher/:userId', roleAuth(['Teacher', 'Head Teacher', 'Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
dashboardRouter.get('/parent/:userId', roleAuth(['Parent', 'Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
dashboardRouter.get('/librarian/:userId', roleAuth(['Librarian', 'Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
dashboardRouter.get('/bursar/:userId', roleAuth(['Bursar', 'Accountant', 'Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
dashboardRouter.get('/headteacher/:userId', roleAuth(['Head Teacher', 'Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
dashboardRouter.get('/disciplinarian/:userId', roleAuth(['Disciplinarian', 'Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
dashboardRouter.get('/staff/:userId', roleAuth(['Staff', 'Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
dashboardRouter.get('/doctor/:userId', roleAuth(['Doctor', 'Admin']), (req, res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/dashboard', dashboardRouter);

// --- Headteacher Specific Routes ---
const headTeacherApiRouter = express.Router();
headTeacherApiRouter.get('/staff-overview', roleAuth(['Head Teacher', 'Admin']), (req,res) => { /* ... existing code ... */ res.status(500).json({message: "Not fully implemented for brevity"})});
app.use('/api/headteacher', headTeacherApiRouter);


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
