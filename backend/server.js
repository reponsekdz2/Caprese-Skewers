// backend/server.js
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer';
import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import bcryptjs from 'bcryptjs';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

import pool from './db.js';
import newApiRouter from './api/main.js'; // Import the new API router

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;
const WS_PING_INTERVAL = 30000;
const SALT_ROUNDS = 10;

// --- Upload Directories Setup ---
const UPLOAD_BASE_DIR = path.join(__dirname, 'uploads');
const UPLOAD_DIRS = {
    avatars: 'avatars',
    receipts: 'receipts',
    resources: 'resources',
    chat_files: 'chat_files',
    syllabus_files: 'syllabus_files',
    exam_submissions: 'exam_submissions',
    homework_images: 'homework_images',
    notice_images: 'notice_images', // Added for notice images
};

const ensureUploadDirs = async () => {
  try {
    await fs.mkdir(UPLOAD_BASE_DIR, { recursive: true });
    for (const dir of Object.values(UPLOAD_DIRS)) {
      await fs.mkdir(path.join(UPLOAD_BASE_DIR, dir), { recursive: true });
    }
    console.log("Upload directories ensured at:", UPLOAD_BASE_DIR);
  } catch (err) {
    console.error("Error creating upload directories:", err);
  }
};
ensureUploadDirs();

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(UPLOAD_BASE_DIR));


// --- Multer Setup for Disk Storage ---
const createMulterStorage = (subfolder) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const fullPath = path.join(UPLOAD_BASE_DIR, subfolder);
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
  });
};

const fileTypeFilters = {
    images: (req, file, cb) => file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files allowed!')),
    imagesOrPdf: (req, file, cb) => (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') ? cb(null, true) : cb(new Error('Only image or PDF files allowed!')),
    general: (req, file, cb) => cb(null, true),
};

const avatarUpload = multer({ storage: createMulterStorage(UPLOAD_DIRS.avatars), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: fileTypeFilters.images });
const receiptUpload = multer({ storage: createMulterStorage(UPLOAD_DIRS.receipts), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: fileTypeFilters.imagesOrPdf });
const resourceUpload = multer({ storage: createMulterStorage(UPLOAD_DIRS.resources), limits: { fileSize: 20 * 1024 * 1024 }, fileFilter: fileTypeFilters.general });
const syllabusUpload = multer({ storage: createMulterStorage(UPLOAD_DIRS.syllabus_files), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: fileTypeFilters.general });
const chatFileUpload = multer({ storage: createMulterStorage(UPLOAD_DIRS.chat_files), limits: { fileSize: 15 * 1024 * 1024 }, fileFilter: fileTypeFilters.general });
const examSubmissionUpload = multer({ storage: createMulterStorage(UPLOAD_DIRS.exam_submissions), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: fileTypeFilters.general });
const homeworkImageUpload = multer({ storage: createMulterStorage(UPLOAD_DIRS.homework_images), limits: {fileSize: 4 * 1024 * 1024}, fileFilter: fileTypeFilters.images});
const noticeImageUpload = multer({ storage: createMulterStorage(UPLOAD_DIRS.notice_images), limits: {fileSize: 5 * 1024 * 1024}, fileFilter: fileTypeFilters.images});


// --- Helper Functions ---
const generateId = (prefix = 'id') => `${prefix}-${uuidv4()}`;

const deleteFileFromUploads = async (filePath) => {
    if (!filePath || !filePath.startsWith('/uploads/')) return;
    const absolutePath = path.join(__dirname, filePath.substring(1));
    try {
        await fs.unlink(absolutePath);
        console.log(`Deleted file: ${absolutePath}`);
    } catch (err) {
        if (err.code !== 'ENOENT') { 
            console.warn(`Failed to delete file: ${absolutePath}`, err.message);
        }
    }
};

// --- Initialize Data (Admin User) ---
const initializeData = async () => {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@school.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
    try {
        const [existingAdmins] = await pool.query('SELECT id FROM Users WHERE email = ? AND role = ?', [ADMIN_EMAIL, 'Admin']);
        if (existingAdmins.length === 0) {
            const adminId = generateId('user-admin');
            const hashedPassword = await bcryptjs.hash(ADMIN_PASSWORD, SALT_ROUNDS);
            await pool.query('INSERT INTO Users SET ?', {
                id: adminId, name: 'School Administrator', email: ADMIN_EMAIL, password: hashedPassword, role: 'Admin', phone: '0000000000', createdAt: new Date(), updatedAt: new Date()
            });
            console.log(`Admin user ${ADMIN_EMAIL} created.`);
        } else {
            console.log(`Admin user ${ADMIN_EMAIL} already exists.`);
        }
    } catch (error) {
        console.error("Error initializing admin data:", error);
    }
};
initializeData();


// --- Logging Middleware ---
app.use((req, res, next) => {
  const userEmail = req.user ? req.user.email : 'Guest';
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - User: ${userEmail}`);
  next();
});

// --- History Log Function ---
const addHistoryLog = async (userEmailOrId, action, details = '', ipAddress = null, entityType = null, entityId = null) => {
  const isEmail = userEmailOrId && userEmailOrId.includes('@');
  let userId = null;
  let userEmail = 'System';

  if (isEmail) {
    userEmail = userEmailOrId;
    try {
        const [users] = await pool.query('SELECT id FROM Users WHERE email = ?', [userEmail]);
        if (users.length > 0) userId = users[0].id;
    } catch (e) { console.error("Error fetching userId for history log:", e); }
  } else if (userEmailOrId) { 
    userId = userEmailOrId;
     try {
        const [users] = await pool.query('SELECT email FROM Users WHERE id = ?', [userId]);
        if (users.length > 0) userEmail = users[0].email; else userEmail = 'Unknown User';
    } catch (e) { console.error("Error fetching userEmail for history log:", e); }
  }

  const newLog = { 
    id: generateId('log'), userEmail, userId, action, entityType, entityId, details, ipAddress: ipAddress || 'N/A' 
  };
  try {
    await pool.query('INSERT INTO HistoryLogs SET ?', newLog);
    console.log(`History: ${userEmail} (${userId || 'N/A'}) - ${action} - ${entityType || ''}:${entityId || ''} - ${details}`);
  } catch (error) {
    console.error("Error adding to HistoryLogs table:", error);
  }
};

// --- Authentication Middleware ---
const authMiddleware = async (req, res, next) => {
  const userEmailHeader = req.headers['x-user-email'];
  if (userEmailHeader) {
    try {
      const [users] = await pool.query('SELECT * FROM Users WHERE email = ?', [userEmailHeader]);
      if (users.length > 0) {
        req.user = users[0];
      } else {
        console.warn(`AuthMiddleware: User with email ${userEmailHeader} not found.`);
      }
    } catch (error) {
      console.error("AuthMiddleware DB error:", error);
    }
  }
  next();
};
app.use(authMiddleware);

// --- Role-based Authorization Middleware ---
const roleAuth = (allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized: Authentication required." });
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: `Forbidden: Role ${req.user.role} does not have access to this resource.` });
  }
  next();
};

// =========================================================================================
// --- API ROUTES ---
// =========================================================================================

// Mount the new API router for version 2
app.use('/api/v2', newApiRouter);

// --- Auth Routes ---
const authRouter = express.Router();
authRouter.post('/login', async (req, res) => {
    const { email, password, role: requestedRole } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required." });
    try {
        const [users] = await pool.query('SELECT * FROM Users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ success: false, message: "Invalid credentials." });
        
        const user = users[0];
        const passwordMatch = await bcryptjs.compare(password, user.password);
        if (!passwordMatch) return res.status(401).json({ success: false, message: "Invalid credentials." });

        if (requestedRole && user.role !== requestedRole) {
            if (user.role === 'Accountant' && requestedRole === 'Bursar') {
                // Allow accountant to login as Bursar
            } else {
                return res.status(403).json({ success: false, message: `Access denied. You are trying to log in as ${requestedRole} but your account is ${user.role}.` });
            }
        }
        
        await pool.query('UPDATE Users SET lastLogin = NOW() WHERE id = ?', [user.id]);
        addHistoryLog(user.email, 'User Login', `User ${user.email} logged in as ${user.role}.`, req.ip, 'User', user.id);
        const { password: _, ...userToReturn } = user; 
        res.json({ success: true, user: userToReturn, message: "Login successful." });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error during login." });
    }
});
authRouter.post('/login-admin', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required." });
    try {
        const [users] = await pool.query('SELECT * FROM Users WHERE email = ? AND role = ?', [email, 'Admin']);
        if (users.length === 0) return res.status(401).json({ success: false, message: "Invalid admin credentials or not an admin." });
        
        const adminUser = users[0];
        const passwordMatch = await bcryptjs.compare(password, adminUser.password);
        if (!passwordMatch) return res.status(401).json({ success: false, message: "Invalid admin credentials." });
        
        await pool.query('UPDATE Users SET lastLogin = NOW() WHERE id = ?', [adminUser.id]);
        addHistoryLog(adminUser.email, 'Admin Login', `Admin ${adminUser.email} logged in.`, req.ip, 'User', adminUser.id);
        const { password: _, ...userToReturn } = adminUser;
        res.json({ success: true, user: userToReturn, message: "Admin login successful." });
    } catch (error) {
        console.error("Admin login error:", error);
        res.status(500).json({ success: false, message: "Server error during admin login." });
    }
});
authRouter.post('/register', async (req, res) => {
    const { name, email, password, role, phone, ...otherDetails } = req.body; 
    if (!name || !email || !password || !role) {
        return res.status(400).json({ success: false, message: "Name, email, password, and role are required." });
    }
    if (role === 'Admin') return res.status(403).json({success: false, message: "Admin registration is not allowed."});
    
    try {
        const [existingUsers] = await pool.query('SELECT id FROM Users WHERE email = ? OR (phone IS NOT NULL AND phone = ? AND phone != "")', [email, phone || null]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ success: false, message: "User with this email or phone already exists." });
        }

        const hashedPassword = await bcryptjs.hash(password, SALT_ROUNDS);
        const userId = generateId('user');
        const studentDetailsId = role === 'Student' ? generateId('student') : null;
        
        const newUser = {
            id: userId, name, email, password: hashedPassword, role, phone: phone || null,
            studentDetailsId,
            address: otherDetails.address || null,
            dateOfBirth: otherDetails.dateOfBirth || null,
            bio: otherDetails.bio || null,
            emergencyContactName: otherDetails.emergencyContactName || null,
            emergencyContactPhone: otherDetails.emergencyContactPhone || null,
            occupation: otherDetails.occupation || null,
            childUserId: otherDetails.childUserId || null, 
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await pool.query('INSERT INTO Users SET ?', newUser);
        
        if (role === 'Student') {
            const studentIdSuffix = Math.floor(1000 + Math.random() * 9000);
            const schoolStudentId = `S${new Date().getFullYear().toString().slice(-2)}${studentIdSuffix}`;
            const newStudent = {
                id: studentDetailsId, userId, studentId: schoolStudentId, name, 
                grade: otherDetails.grade || 'Not Assigned',
                parentId: otherDetails.parentId || null, // This should be the Parent's User.id
                parentContact: otherDetails.parentContact || null,
                classId: otherDetails.classId || null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            await pool.query('INSERT INTO Students SET ?', newStudent);
        }
        
        addHistoryLog(email, 'User Registration', `New user ${email} registered as ${role}.`, req.ip, 'User', userId);
        const { password: _, ...userToReturn } = newUser;
        res.status(201).json({ success: true, user: userToReturn, message: "Registration successful." });

    } catch (error) {
        console.error("Registration error:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: "A user with that email or phone already exists." });
        }
        res.status(500).json({ success: false, message: "Server error during registration." });
    }
});
authRouter.post('/login-phone', (req, res) => res.status(501).json({success: false, message: "Phone login not implemented yet"}));
authRouter.post('/register-phone', (req, res) => res.status(501).json({success: false, message: "Phone registration not implemented yet"}));
app.use('/api/auth', authRouter);


// --- User Management Routes ---
const userRouter = express.Router();
userRouter.get('/', roleAuth(['Admin', 'Head Teacher']), async (req, res) => {
    const { role, name, email } = req.query;
    let query = 'SELECT id, name, email, role, avatar, phone, lastLogin FROM Users WHERE 1=1';
    const params = [];
    if (role) { query += ' AND role = ?'; params.push(role); }
    if (name) { query += ' AND name LIKE ?'; params.push(`%${name}%`); }
    if (email) { query += ' AND email LIKE ?'; params.push(`%${email}%`); }
    query += ' ORDER BY name ASC';
    try {
        const [users] = await pool.query(query, params);
        res.json(users);
    } catch (error) { res.status(500).json({ message: "Error fetching users", error: error.message }); }
});
userRouter.get('/:id', authMiddleware, async (req, res) => { 
    if (!req.user) return res.status(401).json({message: "Auth required"});
    try {
        const [users] = await pool.query('SELECT id, name, email, role, avatar, phone, lastLogin, address, dateOfBirth, bio, emergencyContactName, emergencyContactPhone, occupation, studentPoints, preferences FROM Users WHERE id = ?', [req.params.id]);
        if (users.length === 0) return res.status(404).json({ message: "User not found" });
        const userResult = users[0];
        try { userResult.preferences = userResult.preferences ? JSON.parse(userResult.preferences) : {}; } catch (e) { userResult.preferences = {}; }
        res.json(userResult);
    } catch (error) { res.status(500).json({ message: "Error fetching user details", error: error.message }); }
});
userRouter.post('/', roleAuth(['Admin']), avatarUpload.single('avatarFile'), async (req, res) => {
    const { name, email, password, role, phone, ...otherDetails } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ message: "Name, email, password, and role are required." });
    if (role === 'Admin' && req.user.role !== 'Admin') return res.status(403).json({message: "Only Admins can create other Admins."});

    try {
        const [existing] = await pool.query('SELECT id FROM Users WHERE email = ? OR (phone IS NOT NULL AND phone = ? AND phone != "")', [email, phone || null]);
        if (existing.length > 0) return res.status(409).json({message: "Email or phone already exists."});

        const hashedPassword = await bcryptjs.hash(password, SALT_ROUNDS);
        const userId = generateId('user');
        const avatarPath = req.file ? `/uploads/${UPLOAD_DIRS.avatars}/${req.file.filename}` : null;
        
        const newUser = {
            id: userId, name, email, password: hashedPassword, role, phone: phone || null, avatar: avatarPath,
            address: otherDetails.address || null, dateOfBirth: otherDetails.dateOfBirth || null, bio: otherDetails.bio || null,
            emergencyContactName: otherDetails.emergencyContactName || null, emergencyContactPhone: otherDetails.emergencyContactPhone || null,
            occupation: otherDetails.occupation || null, createdAt: new Date(), updatedAt: new Date()
        };
        await pool.query('INSERT INTO Users SET ?', newUser);
        addHistoryLog(req.user.email, 'Create User', `Created user ${email} (${role}).`, req.ip, 'User', userId);
        const { password: _, ...userToReturn } = newUser;
        res.status(201).json(userToReturn);
    } catch (error) { 
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({message: "Email or phone already exists."});
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Error creating user", error: error.message }); 
    }
});
userRouter.put('/:id', authMiddleware, avatarUpload.single('avatarFile'), async (req, res) => {
    const { id } = req.params;
    if (req.user.id !== id && req.user.role !== 'Admin' && req.user.role !== 'Head Teacher') {
        return res.status(403).json({ message: "Forbidden: You can only update your own profile or an Admin/Head Teacher can update others." });
    }
    const { name, email, phone, role, currentPassword, newPassword, avatar: avatarAction, ...otherDetails } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM Users WHERE id = ?', [id]);
        if (users.length === 0) return res.status(404).json({ message: "User not found" });
        const userToUpdate = users[0];

        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (email !== undefined && email !== userToUpdate.email) {
            const [existingEmail] = await pool.query('SELECT id FROM Users WHERE email = ? AND id != ?', [email, id]);
            if(existingEmail.length > 0)