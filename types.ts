
export enum UserRole {
  ADMIN = 'Admin',
  TEACHER = 'Teacher',
  STUDENT = 'Student',
  PARENT = 'Parent',
  LIBRARIAN = 'Librarian',
  ACCOUNTANT = 'Accountant',
  BURSAR = 'Bursar', 
  HEAD_TEACHER = 'Head Teacher',
  DISCIPLINARIAN = 'Disciplinarian',
  STAFF = 'Staff', 
  DOCTOR = 'Doctor',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; 
  avatar?: string | null;
  phone?: string; 
  studentDetailsId?: string; 
  teacherDetailsId?: string; 
  lastLogin?: string; 
  childUserId?: string; 
  // Enhanced Profile Fields
  address?: string;
  dateOfBirth?: string;
  bio?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  occupation?: string; // e.g. for Parent
  chatRoomIds?: string[];
  studentPoints?: number; // For leaderboard
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<boolean>;
  register?: (userData: Partial<User>) => Promise<boolean>;
  loginWithPhone?: (phone: string, otp: string, role?: UserRole) => Promise<boolean>; 
  registerWithPhone?: (userData: Partial<User>, otp: string) => Promise<boolean>; 
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

export interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  subItems?: NavItem[];
  roles?: UserRole[]; 
}

export interface Student {
  id: string; 
  name:string;
  studentId: string; 
  grade: string; 
  parentContact: string; 
  avatar?: string | null;
  parentId?: string; 
  userId: string; 
  experiencePoints?: number; // Kept for consistency, can be linked to User.studentPoints
  badges?: string[];
  classId?: string; 
  medicalConditions?: string; // Enhanced Profile Field
}

export interface SchoolClass {
  id: string;
  name: string; 
  teacherId: string | null; 
  studentCount?: number; 
  subject?: string; 
}

export interface LogEntry {
  id: string;
  timestamp: string;
  userEmail: string; 
  action: string;
  details: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

export enum LocalStorageKeys {
  AUTH_USER_INFO = 'schoolUserInfo',
}

// --- Academics ---
export interface Exam {
  id: string;
  name: string;
  date: string; 
  maxMarks: number;
  classId?: string | null; 
  subject?: string;
  teacherId?: string; 
}

export interface Mark {
  id: string; 
  examId: string;
  studentId: string; 
  marksObtained: number | null; 
  studentName?: string; 
  examName?: string; 
  comments?: string;
}

export interface AttendanceRecord {
    id: string;
    studentId: string; 
    studentName?: string; 
    date: string; 
    status: 'present' | 'absent' | 'late' | 'excused';
    classId?: string; 
    className?: string;
    remarks?: string;
}

export interface TimetableSlot {
    id: string;
    classId: string;
    className?: string; 
    dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    startTime: string; 
    endTime: string; 
    subject: string;
    teacherId: string | null;
    teacherName?: string; 
}

export interface Syllabus { 
    id: string;
    classId: string;
    subject: string;
    title: string;
    description: string;
    fileUrl?: string; 
}


// --- Teacher Uploaded Resources ---
export interface TeacherResource {
  id: string;
  title: string;
  type: 'exercise' | 'syllabus' | 'book_chapter' | 'exam_paper' | 'other';
  classId?: string | null; 
  className?: string; 
  subject?: string;
  fileName: string;
  mimeType: string;
  fileData?: string; 
  fileUrl?: string; 
  uploadedByTeacherId: string;
  teacherName?: string; 
  uploadDate: string;
  description?: string;
  isLiveExam?: boolean; 
  examDurationMinutes?: number;
  examContent?: string; 
}

export interface TeacherResourceModalState extends Partial<Omit<TeacherResource, 'fileData' | 'fileName' | 'mimeType' | 'uploadedByTeacherId' | 'uploadDate'>> {
  aiPrompt?: string;
  aiGeneratedContent?: string;
}


// --- Resources ---
export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  quantity: number;
  availableQuantity: number;
  category?: string;
  publishedDate?: string;
  coverImageUrl?: string; 
  reservations?: BookReservation[];
}

export interface BookTransaction {
    id: string;
    bookId: string;
    userId: string; 
    issueDate: string; 
    dueDate: string; 
    returnDate?: string | null; 
    status: 'issued' | 'returned' | 'overdue';
    fineAmount?: number;
    finePaid?: boolean;
}

export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    location?: string; 
    supplier?: string;
}


// --- Finance ---
export interface FeeCategory {
    id: string;
    name: string; 
    description?: string;
}
export interface FeeStructure {
    id: string;
    name?: string; 
    classId: string | null; 
    className?: string; 
    feeCategoryId: string;
    feeCategoryName?: string; 
    amount: number;
    dueDate?: string; 
    frequency: 'monthly' | 'quarterly' | 'annually' | 'one-time' | 'termly';
}

export interface FeePayment {
    id: string;
    studentId: string; 
    feeStructureId?: string; 
    feeCategoryId?: string; 
    amountPaid: number;
    paymentDate: string; 
    paymentMethod: 'cash' | 'card' | 'online' | 'cheque';
    transactionId?: string; 
    receiptNumber?: string;
    feeCategoryName?: string; 
    notes?: string;
}

export interface StudentFeeSummary {
    studentId: string; 
    studentName: string;
    studentIdentifier: string; 
    grade: string;
    totalDue: number;
    totalPaid: number;
    balance: number;
    payments?: FeePayment[]; 
    appliedFeeStructures?: FeeStructure[]; 
}


export interface Expense {
    id: string;
    category: string; 
    description: string;
    amount: number;
    date: string; 
    vendor?: string;
    receiptUrl?: string;
}

export interface PayrollEntry {
    id: string;
    userId: string; 
    month: string; 
    grossSalary: number;
    deductions: number;
    netSalary: number;
    paymentDate?: string; 
    status: 'pending' | 'paid';
}

// --- HR & Training ---
export interface LeaveRequest {
    id: string;
    userId: string; 
    userName?: string; 
    startDate: string; 
    endDate: string; 
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string; 
}

export interface TrainingSession {
    id: string;
    title: string;
    description: string;
    date: string; 
    trainer?: string;
    participants: string[]; 
}

// --- Communication & Events ---
export interface Notice {
    id: string;
    title: string;
    content: string;
    publishDate: string; 
    expiryDate?: string; 
    audience: 'all' | UserRole[]; 
    authorName?: string; 
    imageUrl?: string | null; // Stores the URL of the uploaded or AI-generated image
}

export interface Event {
    id: string;
    title: string;
    description: string;
    startDate: string; 
    endDate: string; 
    location?: string;
    organizer?: string;
}

// --- Parent-Teacher Meetings ---
export interface Meeting {
  id: string;
  parentId: string; 
  parentName?: string; 
  teacherId: string; 
  teacherName?: string; 
  studentId?: string; 
  studentName?: string; 
  proposedDate: string;
  proposedTime: string;
  status: 'requested' | 'confirmed' | 'rejected' | 'completed' | 'cancelled';
  meetingLink?: string; 
  notes?: string; 
  createdAt: string;
  updatedAt?: string;
  reasonForRequest?: string; 
  meetingType?: 'standard' | 'visiting_day_slot' | 'event';
  // New fields for attendance tracking
  attendedByParent?: boolean;
  notesByTeacher?: string;
  childVisitDetails?: string;
  parentAttendedTime?: string; // ISO Timestamp
}


// --- Transport ---
export interface TransportVehicle {
    id: string;
    vehicleNumber: string;
    model: string;
    capacity: number;
    driverId?: string; 
}

export interface TransportRoute {
    id: string;
    routeName: string;
    vehicleId?: string; 
    stops: Array<{ name: string; time: string }>; 
}

// --- Settings ---
export interface SchoolSetting {
    id: string; 
    key: string;
    value: any; 
    description?: string;
}

// --- Dashboard Specific ---
export interface DashboardStatCardData {
  id: string;
  title: string;
  value: string | number;
  icon: React.ElementType;
  bgColorClass?: string;
  iconColorClass?: string;
  linkTo?: string;
  trend?: { value: string; direction: 'up' | 'down' | 'neutral' }; 
}

export interface WidgetCardData {
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full'; 
  className?: string;
}

export interface ActivityLogItem {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    details?: string;
}

export interface CourseProgress { 
    id: string;
    name: string;
    progress: number; 
    colorClass: string; 
}

// New Course type for management
export interface Course {
    id: string;
    title: string;
    description: string;
    instructor?: string; // Teacher User ID or Name
    credits?: number;
    department?: string;
    code?: string; // e.g. MATH101
    // Add other relevant fields like prerequisites, etc.
}

export interface UpcomingEventOrAssignment { 
    id: string;
    title: string;
    dueDate: string; 
    type: 'assignment' | 'exam' | 'event' | 'lesson';
}

// Student Specific Dashboard Data
export interface StudentDashboardData {
    awards: Award[];
    courses: CourseProgress[]; 
    upcoming: UpcomingEventOrAssignment[]; 
    points: number;
    badges?: string[];
    recentGrades: Pick<Mark, 'examName' | 'marksObtained' | 'id'>[]; 
    notificationsCount: number; 
    tipOfTheDay?: string; 
    liveExamsCount?: number; 
    forumPostsCount?: number; 
    chatMessagesCount?: number;
}

// Admin Specific Dashboard Data
export interface AdminDashboardStats {
    totalUsers: number;
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    userRoleDistribution: Record<UserRole, number>;
    recentActivity: LogEntry[];
    activeUsersToday?: number;
}

// Teacher Specific Dashboard Data
export interface TeacherDashboardData {
    myClassesSummary: { id: string; name: string; studentCount: number; subject?: string }[];
    upcomingLessons: UpcomingEventOrAssignment[]; 
    pendingSubmissionsCount: number; 
    totalStudentsTaught: number; 
    meetingRequestsCount?: number; 
    chatMessagesCount?: number;
}

// Parent Specific Dashboard Data
export interface ParentDashboardData {
    childId: string; 
    childName: string;
    childGrade: string;
    childAttendance: { present: number; absent: number; total: number; percentage: number }; 
    childRecentGrades: Pick<Mark, 'examName' | 'marksObtained' | 'id'>[]; 
    schoolAnnouncements: Pick<Notice, 'id' | 'title' | 'publishDate'>[];
    upcomingSchoolEvents: Pick<Event, 'id' | 'title' | 'startDate'>[];
    feeStatus?: { amountDue: number; dueDate: string; }; 
    upcomingMeetings?: Meeting[];
    childDisciplineCount?: number; 
    chatMessagesCount?: number;
}

// Doctor Dashboard Data
export interface DoctorDashboardData {
    upcomingAppointmentsCount: number;
    recentWellnessAlerts: Array<{ studentName: string; mood: string; date: string; logId: string }>;
    totalStudentsMonitored: number;
}


export interface RoleCardData {
  role: UserRole;
  title: string;
  description: string;
  icon: React.ElementType;
  loginPath: string;
  registerPath?: string; 
  avatarBgColor?: string; 
}

export interface Award {
  id: string;
  name: string;
  description: string;
  dateAwarded: string; 
  awardedToStudentId: string; 
  awardedBy?: string; 
  icon?: string; 
}

export interface WellnessLogEntry { // Renamed from StudentWellnessEntry
    id: string;
    studentUserId: string;
    studentName?: string; // Added for convenience
    mood: 'happy' | 'okay' | 'sad' | 'anxious' | 'calm'; 
    entryDate: string; 
    notes?: string; 
    loggedByDoctorId?: string; // Optional, if logged by a doctor
    loggedByDoctorName?: string; // Optional
}

// --- Online Exams ---
export interface OnlineExamAttempt {
    id: string;
    studentUserId: string; 
    examResourceId: string; 
    submissionText?: string; 
    submittedFileUrl?: string; 
    submissionDate: string;
    grade?: number | null;
    feedback?: string;
}

// --- Student Forum ---
export interface ForumPost {
    id: string;
    title: string;
    content: string;
    studentUserId: string; 
    studentName?: string; 
    createdAt: string;
    updatedAt?: string;
    repliesCount?: number;
    tags?: string[];
}

export interface ForumReply {
    id: string;
    postId: string; 
    content: string;
    studentUserId: string; 
    studentName?: string; 
    createdAt: string;
    updatedAt?: string;
}

// --- Discipline Management ---
export interface DisciplineRule {
    id: string;
    ruleName: string;
    description: string;
    severityLevel: 'low' | 'medium' | 'high' | 'warning';
    applicableToClassId?: string | null; 
    consequence?: string; 
}

export interface Incident {
    id: string;
    studentId: string; 
    studentName?: string; 
    date: string;
    description: string;
    type: string; 
    reportedBy: string; 
    actionTaken?: string | null;
    status: 'Open' | 'Under Review' | 'Closed' | 'Resolved';
    ruleId?: string | null; 
}


// --- Head Teacher Communication ---
export interface SchoolMessage {
    id: string;
    senderId: string; 
    senderName?: string; 
    title: string;
    content: string;
    targetAudience: 'all' | UserRole[] | 'specific_users';
    targetUserIds?: string[]; 
    targetClassIds?: string[]; 
    sentAt: string;
    readBy?: string[]; 
}

// --- Chat System ---
export interface ChatMessagePart {
  type: 'text' | 'file';
  content: string; // Text content or file name/URL
  mimeType?: string; // For files
  fileSize?: number; // For files
}
export interface ChatMessage {
    id: string;
    roomId: string;
    senderId: string;
    senderName?: string; 
    senderAvatar?: string | null;
    text?: string; // Main text content
    fileUrl?: string; // URL to the uploaded file
    fileName?: string; // Original name of the file
    fileType?: string; // MIME type of the file
    fileSize?: number; // Size in bytes
    timestamp: string;
    status?: 'sent' | 'delivered' | 'read'; 
}

export interface ChatRoom {
    id: string;
    name: string; 
    members: UserChatInfo[]; 
    isGroupChat: boolean;
    lastMessage?: ChatMessage;
    createdAt: string;
    updatedAt: string;
    avatar?: string | null; 
    adminIds?: string[]; 
    unreadCounts?: Record<string, number>; 
}

export interface UserChatInfo {
    id: string;
    name: string;
    avatar?: string | null;
}


// --- Advanced Library Management ---
export interface BookReservation {
    id: string;
    bookId: string;
    userId: string;
    studentName?: string; 
    reservationDate: string;
    status: 'active' | 'fulfilled' | 'cancelled';
}

export interface BookRequest {
    id: string;
    userId: string;
    userName?: string; 
    bookTitle: string;
    bookAuthor?: string;
    requestDate: string;
    status: 'pending' | 'approved' | 'rejected' | 'acquired';
}

// --- Student Report Builder ---
export interface TeacherComment {
    id: string;
    studentId: string; 
    teacherId: string; 
    teacherName?: string; 
    classId?: string; 
    className?: string; 
    subject?: string;
    comment: string;
    term: string; 
    date: string;
}

export interface StudentReportData {
    student: Student;
    user: User; 
    marks: Mark[];
    attendanceSummary: { present: number; absent: number; late: number; excused: number; totalDays: number; percentage: number };
    incidents: Incident[];
    teacherComments: TeacherComment[];
    awards?: Award[];
}

// --- Profile Management ---
export interface ProfileData extends User {
    studentProfile?: Student; 
}

// Librarian Dashboard Data
export interface LibrarianDashboardData {
    totalBooks: number;
    booksBorrowed: number;
    booksOverdue: number; 
    recentlyAdded: LibraryBook[];
    pendingBookRequests?: number;
}

// Bursar Dashboard Data
export interface BursarDashboardData {
    feesCollectedThisMonth: number;
    expensesThisMonth: number;
    pendingPayrollCount: number;
    financialSummary: { totalRevenueYTD: number; totalExpenditureYTD: number };
}

// Head Teacher Dashboard Data
export interface HeadTeacherDashboardData {
    overallStudentAttendance: number;
    staffOnLeaveToday: number;
    academicPerformanceTrend: { month: string, averageGrade: number }[]; 
    keyMetrics: { teacherStudentRatio: string; graduationRate: string }; 
    recentAnnouncements: { id: string, title: string, date: string }[];
    chatMessagesCount?: number;
}

// Disciplinarian Dashboard Data
export interface DisciplinarianDashboardData {
    openIncidentCases: number;
    incidentsThisWeek: number;
    incidentTypeBreakdown: { type: string, count: number, color: string }[]; 
    recentIncidents: { id: string, description: string, date: string, studentName: string }[];
}

// Staff Dashboard Data
export interface StaffDashboardData {
    pendingTasks: number;
    upcomingEvents: { id: string, title: string, date: string}[];
    leaveBalance: { type: string, balance: number }[];
    internalAnnouncements: { id: string, title: string, date: string}[];
    chatMessagesCount?: number;
}

// --- Notifications ---
export enum NotificationStatus {
    UNREAD = 'unread',
    READ = 'read',
}
export interface Notification {
    id: string;
    userId: string; // The user this notification is for
    message: string;
    type: 'info' | 'warning' | 'success' | 'error' | 'new_message' | 'new_assignment' | 'grade_update' | 'incoming_call';
    linkTo?: string; 
    createdAt: string;
    status: NotificationStatus;
    senderId?: string; 
    senderName?: string; 
    relatedEntityId?: string; 
}

// --- Student Leaderboard ---
export interface LeaderboardEntry {
    studentId: string; // User ID of the student
    studentName: string;
    studentAvatar?: string | null;
    points: number;
    rank: number;
    badges?: string[];
}

// --- Calling System ---
export enum CallStatus {
  INITIATED = 'initiated', // Call object created, initiator is waiting
  RINGING = 'ringing',     // Target participant(s) are being notified
  ANSWERED = 'answered',   // At least one target participant answered
  ACTIVE = 'active',       // Call is ongoing after being answered (synonym for answered in 1-on-1)
  MISSED = 'missed',       // No one answered after a timeout, or initiator cancelled before answer
  ENDED = 'ended',         // Call completed successfully or was terminated by a participant
  DECLINED = 'declined',   // A target participant explicitly declined
  FAILED = 'failed',       // Call could not be established due to technical reasons (e.g., network, no permissions)
  CONNECTING = 'connecting',// For WebRTC setup phase
  LEFT = 'left'            // A participant left an ongoing multi-party call
}

export enum CallType {
  AUDIO = 'audio',
  VIDEO = 'video'
}

export interface CallParticipant {
  userId: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
  status: 'invited' | 'ringing' | 'connected' | 'declined' | 'left' | 'failed_to_connect' | 'busy'; // Added 'busy'
  isMuted?: boolean; // For media state
  isVideoOff?: boolean; // For media state
  stream?: MediaStream; // Placeholder for WebRTC stream
}

export interface CallLog {
  id: string;
  name?: string; // Optional name for the call, e.g., for group calls
  initiatorId: string; 
  initiatorName: string; 
  initiatorRole: UserRole; 
  initiatorAvatar?: string | null; 
  
  participants: CallParticipant[]; 

  callTime: string; // ISO Timestamp of initiation
  answeredTime?: string; 
  endTime?: string; 
  durationSeconds?: number; 
  status: CallStatus; 
  type: CallType; 
  isGroupCall: boolean; 
  message?: string; // For error messages from server, e.g. on initiation failure
}

// WebRTC Signaling Payloads (Examples)
export interface WebRTCOfferPayload {
  type: 'offer';
  sdp: RTCSessionDescriptionInit;
}
export interface WebRTCAnswerPayload {
  type: 'answer';
  sdp: RTCSessionDescriptionInit;
}
export interface WebRTCIceCandidatePayload {
  type: 'candidate';
  candidate: RTCIceCandidateInit | null;
}
export type WebRTCSignalPayload = WebRTCOfferPayload | WebRTCAnswerPayload | WebRTCIceCandidatePayload;


// --- Context for Calling ---
export interface CallContextType {
  activeCall: CallLog | null;
  pendingIncomingCall: CallLog | null;
  isCallModalOpen: boolean;
  callModalState: 'idle' | 'outgoing' | 'incoming' | 'active' | 'requestingPermissions';
  localStream: MediaStream | null;
  remoteStreams: Record<string, MediaStream>; 
  
  initiateCall: (receivers: User[], type: CallType) => Promise<void>;
  answerCall: (call: CallLog) => Promise<void>;
  declineCall: (call: CallLog) => Promise<void>;
  endCall: (callOrNull?: CallLog | null) => Promise<void>; // Made argument optional
  closeCallModal: () => void; 

  setIncomingCall: (call: CallLog) => void; 
  
  toggleMute: () => void;
  toggleVideo: () => void;
  isMuted: boolean;
  isVideoOff: boolean;

  sendSignalingMessage: (targetUserId: string | null, payload: WebRTCSignalPayload) => void;
}

// --- Extracurricular Activities ---
export type ActivityCategory = 'Sports' | 'Arts' | 'Academic Clubs' | 'Community Service' | 'Other';

export interface Activity {
  id: string;
  name: string;
  description: string;
  category: ActivityCategory;
  teacherInChargeId: string | null; // User ID of the teacher
  teacherInChargeName?: string;
  schedule: string; // e.g., "Mondays & Wednesdays, 3 PM - 4 PM"
  location?: string;
  maxParticipants: number | null;
  currentParticipantsCount?: number;
  imageUrl?: string | null; // Optional image for the activity
  isEnrollmentOpen?: boolean;
}

export interface ActivityEnrollment {
  id: string;
  activityId: string;
  studentUserId: string;
  studentName?: string; // Added for convenience
  enrollmentDate: string;
  status: 'enrolled' | 'waitlisted' | 'withdrawn';
}

// --- AI Homework Helper ---
export interface HomeworkHelperInteraction {
  id: string;
  studentUserId: string;
  timestamp: string;
  promptText?: string;
  promptImageUrl?: string;
  aiResponse: string;
  // Potentially add feedback fields, e.g., wasThisHelpful: boolean
}

// --- AI Lesson Planner ---
export interface LessonPlanSection {
  title: string; // e.g., "Learning Objectives", "Activities", "Assessment"
  content: string; // Markdown or HTML content for the section
}
export interface LessonPlan {
  id: string; // If stored
  teacherUserId: string; // Added field
  title: string; // Usually derived from topic
  subject: string;
  gradeLevel: string;
  durationMinutes: number;
  learningObjectives: string; // Could be a list or a single text block
  sections: LessonPlanSection[]; // Structured content
  createdAt: string;
  updatedAt?: string;
}
