import express from 'express';
const router = express.Router();

// V2 routes (maintained for compatibility)
router.get('/child/:childUserId/incidents', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/child/:childUserId/activities', (req, res) => res.status(501).json({message: "Not implemented"}));

export default router;