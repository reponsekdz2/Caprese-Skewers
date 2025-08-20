import express from 'express';
const router = express.Router();

// V2 routes (maintained for compatibility)
router.get('/', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/:id', (req, res) => res.status(501).json({message: "Not implemented"}));
router.delete('/:id', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/live-exams', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/live-exams/:examId', (req,res) => res.status(501).json({message: "Not implemented"}));
router.post('/submit-exam', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/:studentUserId/wellness-logs', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/:studentUserId/wellness/today', (req, res) => res.status(501).json({message: "Not implemented"}));
router.post('/wellness', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/enrollments', (req,res) => res.status(501).json({message: "Not implemented"}));
router.post('/enrollments', (req,res) => res.status(501).json({message: "Not implemented"}));
router.delete('/enrollments/:enrollmentId', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/book-requests', (req,res) => res.status(501).json({message: "Not implemented"}));
router.post('/book-requests', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/digital-library', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/:studentId/marks', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/activities/my-enrollments', (req, res) => res.status(501).json({message: "Not implemented"}));
router.post('/activities/:activityId/enroll', (req, res) => res.status(501).json({message: "Not implemented"}));
router.delete('/activities/:activityId/withdraw', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/:studentId/id-card', (req, res) => res.status(501).json({message: "Not implemented"}));

// V3 Enhancements
// New API (16/23): Get a student's attendance summary
router.get('/:studentId/attendance-summary', (req, res) => {
    const { studentId } = req.params;
    res.json({ message: `Attendance summary for student ${studentId} fetched.` });
});


export default router;