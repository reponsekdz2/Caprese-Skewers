import express from 'express';
const router = express.Router();

router.get('/', (req, res) => res.status(501).json({message: "Not implemented"}));
router.get('/unread-count', (req, res) => res.status(501).json({message: "Not implemented"}));
router.put('/:notificationId/read', (req, res) => res.status(501).json({message: "Not implemented"}));
router.put('/mark-all-read', (req, res) => res.status(501).json({message: "Not implemented"}));
router.post('/send', (req, res) => res.status(501).json({message: "Not implemented"}));

export default router;
