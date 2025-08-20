import express from 'express';
const router = express.Router();

// Notices
router.get('/notices', (req,res) => res.status(501).json({message: "Not implemented"}));
router.post('/notices', (req,res) => res.status(501).json({message: "Not implemented"}));
router.put('/notices/:id', (req,res) => res.status(501).json({message: "Not implemented"}));
router.delete('/notices/:id', (req,res) => res.status(501).json({message: "Not implemented"}));
// Messages (School-wide messages by Head Teacher)
router.get('/messages', (req,res) => res.status(501).json({message: "Not implemented"}));
router.post('/messages', (req,res) => res.status(501).json({message: "Not implemented"}));

export default router;