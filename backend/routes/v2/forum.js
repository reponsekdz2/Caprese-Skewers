import express from 'express';
const router = express.Router();

router.get('/posts', (req,res) => res.status(501).json({message: "Not implemented"}));
router.post('/posts', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/posts/:postId', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/posts/:postId/replies', (req,res) => res.status(501).json({message: "Not implemented"}));
router.post('/posts/:postId/replies', (req,res) => res.status(501).json({message: "Not implemented"}));

export default router;