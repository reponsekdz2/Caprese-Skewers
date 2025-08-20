import express from 'express';
const router = express.Router();

router.get('/admin', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/student/:userId', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/teacher/:userId', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/parent/:userId', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/librarian/:userId', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/bursar/:userId', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/headteacher/:userId', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/disciplinarian/:userId', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/staff/:userId', (req,res) => res.status(501).json({message: "Not implemented"}));
router.get('/doctor/:userId', (req, res) => res.status(501).json({message: "Not implemented"}));

export default router;
