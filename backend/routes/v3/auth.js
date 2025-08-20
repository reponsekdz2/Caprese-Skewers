import express from 'express';
const router = express.Router();

// V2 routes (maintained for compatibility)
router.post('/login', (req, res) => res.status(501).json({message: "Not implemented"}));
router.post('/login-admin', (req, res) => res.status(501).json({message: "Not implemented"}));
router.post('/register', (req, res) => res.status(501).json({message: "Not implemented"}));
router.post('/login-phone', (req, res) => res.status(501).json({message: "Not implemented"}));
router.post('/register-phone', (req, res) => res.status(501).json({message: "Not implemented"}));
router.post('/password-reset/request', (req, res) => res.status(501).json({message: "Not implemented"}));
router.post('/password-reset/confirm', (req, res) => res.status(501).json({message: "Not implemented"}));

// V3 Enhancements can be added here, e.g., for SSO, 2FA, etc.

export default router;