import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import redis from './config/redis.js';
import urlRoutes from './routes/urls.js';
import authRoutes from './routes/auth.js';
import protect from './middleware/authMiddleware.js';
import analyticsRoutes from './routes/analytics.js';

// Load environment variables
config();

const app = express();

// ── Connect to MongoDB ────────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────────

app.use(cors({
  origin: process.env.CORS_ORIGIN ?? '*',
  methods: ['GET', 'POST', 'DELETE'],
}));

app.use(express.json());

// Log every request
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
});
app.use(limiter);

// ── Routes ────────────────────────────────────────────────────

// Auth routes (public)
app.use('/api/auth', authRoutes);

// URL routes (mix of public and protected)
app.use('/api/urls', urlRoutes);

// Analytics routes (protected)
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Redirect route — must be LAST
app.get('/:code', async (req, res) => {
  try {
    const { resolveShortUrl } = await import('./services/urlService.js');
    const { recordClick } = await import('./services/analyticsService.js');

    const result = await resolveShortUrl(req.params.code);

    if (!result) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    // Record click in background — never block the redirect
    recordClick({
      shortCode: req.params.code,
      urlId: result.urlId,
      userAgent: req.headers['user-agent'] ?? '',
      referer: req.headers['referer'] ?? 'direct',
    });

    return res.redirect(302, result.originalUrl);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error(err);
    return res.status(500).json({ error: err.message ?? 'Internal server error' });
  }
});

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT ?? 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});