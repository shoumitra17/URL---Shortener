import Url from '../models/Url.js';
import { generateShortCode } from './idGenerator.js';
import redis from '../config/redis.js';

const CACHE_TTL = 86400; // 24 hours

function validateUrl(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    throw { statusCode: 400, message: 'Invalid URL' };
  }
}

export async function createShortUrl({ originalUrl, customAlias, expiresAt, userId }) {
  validateUrl(originalUrl);

  let shortCode;

  if (customAlias) {
    if (!/^[a-zA-Z0-9_-]{3,50}$/.test(customAlias)) {
      throw { statusCode: 400, message: 'Invalid custom alias' };
    }
    const existing = await Url.findOne({ shortCode: customAlias });
    if (existing) throw { statusCode: 409, message: 'Alias already taken' };
    shortCode = customAlias;
  } else {
    shortCode = generateShortCode().shortCode;
  }

  const url = await Url.create({
    shortCode,
    originalUrl,
    customAlias: customAlias || null,
    expiresAt: expiresAt || null,
    userId: userId || null,
  });

  // Cache both originalUrl and urlId
  console.log('Attempting to cache:', shortCode);
  const cacheResult = await redis.setex(
    `url:${shortCode}`,
    CACHE_TTL,
    JSON.stringify({
      originalUrl,
      urlId: url._id.toString(),
    })
  );
  console.log('Cache result:', cacheResult);

  return url;
}

export async function resolveShortUrl(shortCode) {
  // Check Redis first
  const cached = await redis.get(`url:${shortCode}`);
  if (cached) {
    console.log('Cache HIT:', shortCode);
    const data = JSON.parse(cached);
    Url.findOneAndUpdate({ shortCode }, { $inc: { clickCount: 1 } }).catch(() => {});
    return { originalUrl: data.originalUrl, urlId: data.urlId };
  }

  // MongoDB fallback
  console.log('Cache MISS:', shortCode);
  const url = await Url.findOne({ shortCode });
  if (!url) return null;

  if (!url.isActive) throw { statusCode: 410, message: 'Link deactivated' };
  if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
    throw { statusCode: 410, message: 'Link expired' };
  }

  // Store both originalUrl and urlId in Redis
  await redis.setex(`url:${shortCode}`, CACHE_TTL, JSON.stringify({
    originalUrl: url.originalUrl,
    urlId: url._id.toString(),
  }));

  Url.findOneAndUpdate({ shortCode }, { $inc: { clickCount: 1 } }).catch(() => {});

  return { originalUrl: url.originalUrl, urlId: url._id };
}

export async function getUserUrls(userId, { limit = 20, skip = 0 } = {}) {
  return Url.find({ userId }).sort({ createdAt: -1 }).limit(limit).skip(skip);
}

export async function deactivateUrl(shortCode, userId) {
  const url = await Url.findOneAndUpdate(
    { shortCode, userId },
    { isActive: false },
    { new: true }
  );
  if (!url) throw { statusCode: 404, message: 'URL not found' };
  await redis.del(`url:${shortCode}`);
  return true;
}