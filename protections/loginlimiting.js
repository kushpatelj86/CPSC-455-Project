export const loginAttempts = new Map();


//Checks the number of times a user logs in
export function limitLogin(client) {
  const now = Date.now();
  const key = client._socket.remoteAddress;
  let attemptData = loginAttempts.get(key);
  if (attemptData == null) { 
    attemptData = {
      attempts: 0,
      lastAttempt: now,
      lastViolationTime: null
    };
  }


  const LOCK_DURATION = 60 * 1000; // 1 minute
  const MAX_ATTEMPTS = 5;
  const WINDOW = 60 * 1000; // 1 minute

  /*if (attemptData.lastViolationTime && now - attemptData.lastViolationTime < LOCK_DURATION) {
    client.attemptData = attemptData;
    return false;
  }*/

  if (now - attemptData.lastAttempt > WINDOW) {
    attemptData.attempts = 1;
  } 
  else {
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

//Resets login limits

export function resetLoginLimit(client) {
  const key = client._socket.remoteAddress;
  loginAttempts.delete(key);
}
