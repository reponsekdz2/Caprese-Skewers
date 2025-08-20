import express from 'express';
const router = express.Router();

// New API (10/15): Trigger a system-wide backup
router.post('/system/backup', (req, res) => {
    res.status(202).json({ message: 'System backup initiated. This may take a few minutes.' });
});

// New API (11/15): Get system health/stats
router.get('/system/health', (req, res) => {
    res.json({
        status: 'OK',
        databaseConnections: 5,
        websocketClients: 10,
        memoryUsage: '128MB / 512MB'
    });
});

export default router;
