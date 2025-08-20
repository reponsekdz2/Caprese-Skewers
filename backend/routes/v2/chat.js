import express from 'express';
const router = express.Router();

// Existing routes
router.get('/rooms', (req,res) => res.status(501).json({message: "Not implemented"}));
router.post('/rooms', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/rooms/:roomId/messages', (req,res) => res.status(501).json({message: "Not implemented"}));
// The actual implementation for POST with file uploads is defined in server.js
// router.post('/messages', (req,res) => res.status(501).json({message: "Not implemented"}));
// router.post('/upload-file', (req, res) => res.status(501).json({message: "Not implemented"}));

// New API (12/15): Mute a chat room for the current user
router.put('/rooms/:roomId/mute', (req, res) => {
    const { roomId } = req.params;
    const { mute } = req.body; // true or false
    res.json({ message: `Chat room ${roomId} has been ${mute ? 'muted' : 'unmuted'}.` });
});

export default router;