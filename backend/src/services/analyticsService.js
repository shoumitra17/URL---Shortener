import { UAParser } from 'ua-parser-js';
import Click from '../models/Click.js';
import Url from '../models/Url.js';

// Parse device info from User-Agent header
function parseUserAgent(userAgent) {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const browser = result.browser.name ?? 'unknown';
  const os = result.os.name ?? 'unknown';

  let device = 'unknown';
  if (result.device.type === 'mobile') device = 'mobile';
  else if (result.device.type === 'tablet') device = 'tablet';
  else if (result.browser.name) device = 'desktop';

  return { browser, os, device };
}

// Record a click — called async from redirect route
export async function recordClick({ shortCode, urlId, userAgent, referer }) {
  try {
    const { browser, os, device } = parseUserAgent(userAgent);

    await Click.create({
      shortCode,
      urlId,
      browser,
      os,
      device,
      referer: referer || 'direct',
    });
  } catch (err) {
    // Never let analytics failure affect the redirect
    console.error('Analytics error:', err.message);
  }
}

// Get analytics for a short URL
export async function getAnalytics(shortCode) {
  const url = await Url.findOne({ shortCode });
  if (!url) throw { statusCode: 404, message: 'URL not found' };

  const clicks = await Click.find({ shortCode }).sort({ createdAt: -1 });

  // Total clicks
  const totalClicks = clicks.length;

  // Clicks by device
  const byDevice = clicks.reduce((acc, click) => {
    acc[click.device] = (acc[click.device] || 0) + 1;
    return acc;
  }, {});

  // Clicks by browser
  const byBrowser = clicks.reduce((acc, click) => {
    acc[click.browser] = (acc[click.browser] || 0) + 1;
    return acc;
  }, {});

  // Clicks by OS
  const byOs = clicks.reduce((acc, click) => {
    acc[click.os] = (acc[click.os] || 0) + 1;
    return acc;
  }, {});

  // Clicks over time (last 7 days)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const count = clicks.filter((click) => {
      return click.createdAt.toISOString().split('T')[0] === dateStr;
    }).length;

    last7Days.push({ date: dateStr, clicks: count });
  }

  return {
    shortCode,
    originalUrl: url.originalUrl,
    totalClicks,
    byDevice,
    byBrowser,
    byOs,
    last7Days,
    recentClicks: clicks.slice(0, 10), // last 10 clicks
  };
}