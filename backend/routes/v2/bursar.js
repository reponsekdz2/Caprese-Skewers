import express from 'express';
const router = express.Router();

router.get('/all-student-fees', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/student-fees/:studentId', (req, res) => res.status(501).json({message: "Not implemented"}));

export default router;