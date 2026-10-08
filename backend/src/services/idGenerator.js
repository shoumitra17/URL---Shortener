/**
 * Snowflake ID Generator
 * 
 * Generates unique IDs without needing to check the database.
 * Each ID is made of 3 parts:
 * [timestamp (41 bits)] + [machine ID (10 bits)] + [sequence (12 bits)]
 * 
 * Then we convert that ID to a short Base62 string like "3mFgT"
 */

const EPOCH = BigInt(1700000000000); // custom start date (Nov 2023)
const MACHINE_ID = BigInt(process.env.MACHINE_ID ?? 1);
const MAX_SEQUENCE = BigInt(4095); // max 4096 IDs per millisecond per machine

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

let sequence = BigInt(0);
let lastTimestamp = BigInt(-1);

function currentTimestamp() {
  return BigInt(Date.now()) - EPOCH;
}

function waitNextMillis(last) {
  let ts = currentTimestamp();
  while (ts <= last) {
    ts = currentTimestamp();
  }
  return ts;
}

export function generateId() {
  let timestamp = currentTimestamp();

  if (timestamp < lastTimestamp) {
    throw new Error('Clock moved backwards — cannot generate ID');
  }

  if (timestamp === lastTimestamp) {
    sequence = (sequence + BigInt(1)) & MAX_SEQUENCE;
    if (sequence === BigInt(0)) {
      // used all 4096 IDs this millisecond — wait for next ms
      timestamp = waitNextMillis(lastTimestamp);
    }
  } else {
    sequence = BigInt(0);
  }

  lastTimestamp = timestamp;

  // Combine all 3 parts into one big number
  const id = (timestamp << BigInt(22)) | (MACHINE_ID << BigInt(12)) | sequence;
  return id;
}

export function toBase62(id) {
  if (id === BigInt(0)) return BASE62[0];
  let result = '';
  let n = id;
  while (n > BigInt(0)) {
    result = BASE62[Number(n % BigInt(62))] + result;
    n = n / BigInt(62);
  }
  return result;
}

export function generateShortCode() {
  const id = generateId();
  const shortCode = toBase62(id);
  return { id: id.toString(), shortCode };
}