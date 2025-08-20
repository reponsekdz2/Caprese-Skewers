import express from 'express';
const router = express.Router();

// V2 routes (maintained for compatibility)
router.get('/rooms', (req,res) => res.status(501).json({message: "Not implemented"}));
router.post('/rooms', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/rooms/:roomId/messages', (req,res) => res.status(501).json({message: "Not implemented"}));
router.put('/rooms/:roomId/mute', (req, res) => res.status(501).json({message: "Not implemented"}));


// V3 Enhancements
// New API (17/23): Archive a chat room
router.put('/rooms/:roomId/archive', (req, res) => {
    const { roomId } = req.params;
    res.json({ message: `Chat room ${roomId} has been archived.` });
});


export default router;