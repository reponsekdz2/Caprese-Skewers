import express from 'express';
const router = express.Router();

// V2 routes (maintained for compatibility)
router.get('/staff-overview', (req,res) => res.status(501).json({message: "Not implemented"}));

export default router;