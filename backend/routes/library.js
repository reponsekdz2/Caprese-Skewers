import express from 'express';
const router = express.Router();

// Existing routes
router.get('/books', (req, res) => res.status(501).json({message: "Not implemented"}));
router.post('/books', (req, res) => res.status(501).json({message: "Not implemented"}));
router.put('/books/:id', (req, res) => res.status(501).json({message: "Not implemented"}));
router.delete('/books/:id', (req, res) => res.status(501).json({message: "Not implemented"}));

// New API (9/15): Get a user's full borrowing history
router.get('/user/:userId/history', (req, res) => {
    const { userId } = req.params;
    res.json({ message: `Borrowing history for user ${userId} fetched.` });
});

export default router;
