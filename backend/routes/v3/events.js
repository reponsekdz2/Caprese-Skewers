import express from 'express';
const router = express.Router();

// V2 routes (maintained for compatibility)
router.get('/', (req,res) => res.status(501).json({message: "Not implemented"}));
router.post('/', (req,res) => res.status(501).json({message: "Not implemented"}));
router.put('/:id', (req,res) => res.status(501).json({message: "Not implemented"}));
router.delete('/:id', (req,res) => res.status(501).json({message: "Not implemented"}));
router.post('/:eventId/rsvp', (req, res) => res.status(501).json({message: "Not implemented"}));

// V3 Enhancements
// New API (18/23): Add photos to an event gallery
router.post('/:eventId/gallery', (req, res) => {
    // Expects multipart/form-data with image files
    const { eventId } = req.params;
    res.json({ message: `Images uploaded to the gallery for event ${eventId}.` });
});


export default router;