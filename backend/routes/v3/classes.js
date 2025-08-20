import express from 'express';
const router = express.Router();

// V2 routes (maintained for compatibility)
router.get('/', (req, res) => res.status(501).json({message: "Not implemented"}));
router.post('/', (req, res) => res.status(501).json({message: "Not implemented"}));
router.put('/:id', (req, res) => res.status(501).json({message: "Not implemented"}));
router.delete('/:id', (req, res) => res.status(501).json({message: "Not implemented"}));

export default router;