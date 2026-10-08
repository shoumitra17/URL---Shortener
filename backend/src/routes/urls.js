import express from 'express';
import {
  createShortUrl,
  resolveShortUrl,
  getUserUrls,
  deactivateUrl,
} from '../services/urlService.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/urls — shorten a URL (public)
router.post('/',protect, async (req, res) => {
  try {
    const { url, customAlias, expiresAt } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    const newUrl = await createShortUrl({
      originalUrl: url,
      customAlias,
      expiresAt,
      userId: req.user?.id ?? null,
    });
    return res.status(201).json({
      shortCode: newUrl.shortCode,
      shortUrl: `${process.env.BASE_URL}/${newUrl.shortCode}`,
      originalUrl: newUrl.originalUrl,
      expiresAt: newUrl.expiresAt,
      createdAt: newUrl.createdAt,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('ROUTE ERROR:', err);
    return res.status(500).json({ error: err.message ?? 'Internal server error' });
  }
});

// GET /api/urls — get all URLs for logged in user (protected)
router.get('/', protect, async (req, res) => {
  try {
    const limit = Number(req.query.limit ?? 20);
    const skip  = Number(req.query.skip  ?? 0);
    const urls = await getUserUrls(req.user.id, { limit, skip });
    return res.status(200).json({ urls });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/urls/:code — deactivate a URL (protected)
router.delete('/:code', protect, async (req, res) => {
  try {
    await deactivateUrl(req.params.code, req.user.id);
    return res.status(200).json({ success: true });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;