import express from 'express';
const router = express.Router();

// V2 routes (maintained for compatibility)
router.post('/initiate', (req, res) => res.status(501).json({message: "Not implemented"}));
router.put('/:callId/answer', (req, res) => res.status(501).json({message: "Not implemented"}));
router.put('/:callId/decline', (req, res) => res.status(501).json({message: "Not implemented"}));
router.put('/:callId/busy', (req, res) => res.status(501).json({message: "Not implemented"}));
router.put('/:callId/end', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/my-history', (req, res) => res.status(501).json({message: "Not implemented"}));

export default router;