import express from 'express';
const router = express.Router();

router.get('/book-requests', (req, res) => res.status(501).json({message: "Not implemented"}));
router.put('/book-requests/:requestId', (req, res) => res.status(501).json({message: "Not implemented"}));
router.put('/transactions/:transactionId/pay-fine', (req,res) => res.status(501).json({message: "Not implemented"}));

export default router;
