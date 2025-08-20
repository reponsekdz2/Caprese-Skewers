import express from 'express';
const router = express.Router();

// V2 routes (maintained for compatibility)
router.get('/rules', (req,res) => res.status(501).json({message: "Not implemented"}));
router.post('/rules', (req,res) => res.status(501).json({message: "Not implemented"}));
router.put('/rules/:id', (req,res) => res.status(501).json({message: "Not implemented"}));
router.delete('/rules/:id', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/incidents', (req,res) => res.status(501).json({message: "Not implemented"}));
router.post('/incidents', (req,res) => res.status(501).json({message: "Not implemented"}));
router.put('/incidents/:id', (req,res) => res.status(501).json({message: "Not implemented"}));
router.delete('/incidents/:id', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/incidents/student/:studentId', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/student/:studentId/history', (req, res) => res.status(501).json({message: "Not implemented"}));

export default router;