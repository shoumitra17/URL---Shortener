import Redis from 'ioredis';

const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('Redis Connected');
});

redis.on('ready', () => {
  console.log('Redis Ready');
});

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

// Test the connection immediately
redis.set('test:connection', 'ok').then(() => {
  console.log('Redis write test passed');
}).catch((err) => {
  console.error('Redis write test failed:', err.message);
});

export default redis;