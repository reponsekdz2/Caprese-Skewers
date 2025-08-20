import express from 'express';
const router = express.Router();

router.post('/wellness-log', (req, res) => res.status(501).json({message: "Not implemented"}));
router.put('/wellness-log/:logId', (req, res) => res.status(501).json({message: "Not implemented"}));
router.delete('/wellness-log/:logId', (req, res) => res.status(501).json({message: "Not implemented"}));

export default router;
