import express from 'express';
const router = express.Router();

router.get('/student/:studentUserId', (req, res) => res.status(501).json({message: "Not implemented"}));
router.post('/', (req, res) => res.status(501).json({message: "Not implemented"}));

export default router;