import express from 'express';
const router = express.Router();

router.get('/vehicles', (req,res) => res.status(501).json({message: "Not implemented"}));
router.post('/vehicles', (req,res) => res.status(501).json({message: "Not implemented"}));
router.put('/vehicles/:id', (req,res) => res.status(501).json({message: "Not implemented"}));
router.delete('/vehicles/:id', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/routes', (req,res) => res.status(501).json({message: "Not implemented"}));
router.post('/routes', (req,res) => res.status(501).json({message: "Not implemented"}));
router.put('/routes/:id', (req,res) => res.status(501).json({message: "Not implemented"}));
router.delete('/routes/:id', (req,res) => res.status(501).json({message: "Not implemented"}));

export default router;
