export const rateLimitMap = new Map();


//Enforces rate limiting
export function rateLimit(client, actionType, wss) {
  const now = Date.now();
  const key = client.username || client._socket.remoteAddress;

  const timeWindow = 60 * 1000; // 60 seconds
  const maxMessages = 5;

  let userData = rateLimitMap.get(key);

  if (!userData) {
    userData = { 
      count: 1, 
      windowStart: now 
    };
    rateLimitMap.set(key, userData);
    return true;
  }

  if (now - userData.windowStart > timeWindow) {
    userData.count = 1;
    userData.windowStart = now;
    rateLimitMap.set(key, userData);
    return true;
  }

  userData.count++;

  if (userData.count > maxMessages) {
    client.send(JSON.stringify({
      type: actionType,
      status: "fail",
      message: "You are sending messages too quickly. Please wait a minute."
    }));
    return false;
  }

  rateLimitMap.set(key, userData);
  return true;
}

//Resets rate limiting
export function resetRateLimit(client) {
  const key = client.username || client._socket.remoteAddress;
  rateLimitMap.delete(key);
}
