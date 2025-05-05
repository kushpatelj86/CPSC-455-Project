const loginAttempts = new Map();

export function limitLogin(client) {
  const now = Date.now();
  const key = client._socket.remoteAddress;
  const attemptData = loginAttempts.get(key) || {
    attempts: 0,
    lastAttempt: now,
    lastViolationTime: null
  };

  const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes
  const MAX_ATTEMPTS = 5;
  const WINDOW = 60 * 1000; // 1 minute

  if (attemptData.lastViolationTime && now - attemptData.lastViolationTime < LOCK_DURATION) {
    client.attemptData = attemptData;
    return false;
  }

  if (now - attemptData.lastAttempt > WINDOW) {
    attemptData.attempts = 1;
  } else {
    attemptData.attempts++;
  }

  attemptData.lastAttempt = now;

  if (attemptData.attempts > MAX_ATTEMPTS) {
    attemptData.lastViolationTime = now;
    client.attemptData = attemptData;
    return false;
  }

  loginAttempts.set(key, attemptData);
  return true;
}

export function resetLoginLimit(client) {
  const key = client._socket.remoteAddress;
  loginAttempts.delete(key);
}
