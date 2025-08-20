import express from 'express';
const router = express.Router();

// V2 routes (maintained for compatibility)
router.get('/', (req, res) => res.status(501).json({message: "Not implemented"}));
router.post('/', (req, res) => res.status(501).json({message: "Not implemented"}));
router.put('/:meetingId', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/attendance-report', (req, res) => res.status(501).json({message: "Not implemented"}));

export default router;