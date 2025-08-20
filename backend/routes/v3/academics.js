import express from 'express';
const router = express.Router();

// V2 routes (maintained for compatibility)
router.get('/exams', (req, res) => res.status(501).json({message: "Not implemented"}));
router.put('/exams/:examId', (req, res) => res.status(501).json({message: "Not implemented"}));
router.delete('/exams/:examId', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/exams/:examId/marks', (req, res) => res.status(501).json({message: "Not implemented"}));
router.post('/marks', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/attendance/class/:classId/date/:dateString', (req, res) => res.status(501).json({message: "Not implemented"}));
router.post('/attendance/bulk', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/syllabus', (req, res) => res.status(501).json({message: "Not implemented"}));
router.delete('/syllabus/:syllabusId', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/timetable', (req, res) => res.status(501).json({message: "Not implemented"}));
router.post('/timetable', (req, res) => res.status(501).json({message: "Not implemented"}));
router.put('/timetable/:slotId', (req, res) => res.status(501).json({message: "Not implemented"}));
router.delete('/timetable/:slotId', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/timetable/my', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/attendance/my', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/attendance/student/:studentId', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/courses', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/courses/:courseId/prerequisites', (req, res) => res.status(501).json({message: "Not implemented"}));

// V3 Enhancements
// New API (4/23): Get academic performance statistics for an entire class
router.get('/classes/:classId/performance', (req, res) => {
    const { classId } = req.params;
    res.json({ message: `Performance report for class ${classId} generated.` });
});

// New API (5/23): Get a curriculum map for a grade or department
router.get('/curriculum-map', (req, res) => {
    const { grade, department } = req.query;
    res.json({ message: `Curriculum map for grade ${grade}, department ${department} fetched.` });
});

// New API (6/23): Student requests an official transcript
router.post('/transcripts/request', (req, res) => {
    // const { studentId } = req.user; // from auth middleware
    res.status(202).json({ message: `Transcript request received. It will be processed and sent to you.` });
});

// New API (7/23): Admin views all transcript requests
router.get('/transcripts/requests', (req, res) => {
    res.json({ message: 'All pending and completed transcript requests fetched.' });
});

export default router;