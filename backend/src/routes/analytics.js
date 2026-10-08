import express from 'express';
import { getAnalytics } from '../services/analyticsService.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/analytics/:code — get analytics for a short URL
router.get('/:code', protect, async (req, res) => {
  try {
    const analytics = await getAnalytics(req.params.code);
    return res.status(200).json(analytics);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Analytics route error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;