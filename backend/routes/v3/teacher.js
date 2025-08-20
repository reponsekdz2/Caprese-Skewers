import express from 'express';
const router = express.Router();

// V2 routes (maintained for compatibility)
router.get('/resources', (req, res) => res.status(501).json({message: "Not implemented"}));
router.delete('/resources/:id', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/comments/teacher/:teacherId', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/comments/student/:studentId', (req,res) => res.status(501).json({message: "Not implemented"}));
router.post('/comments', (req,res) => res.status(501).json({message: "Not implemented"}));
router.put('/comments/:id', (req,res) => res.status(501).json({message: "Not implemented"}));
router.delete('/comments/:id', (req,res) => res.status(501).json({message: "Not implemented"}));

export default router;