const rateLimitMap = new Map();

export function rateLimit(client, actionType, wss) {
  const now = Date.now();
  const key = client.username || client._socket.remoteAddress;
  const limit = rateLimitMap.get(key) || { count: 0, lastTime: now };

  const timeWindow = 10 * 6000; // 60 seconds
  const maxRequests = 5;

  if (now - limit.lastTime > timeWindow) {
    limit.count = 1;
    limit.lastTime = now;
  } 
  else {
    limit.count++;
  }

  rateLimitMap.set(key, limit);

  if (limit.count > maxRequests) {
    client.send(JSON.stringify({
      type: actionType,
      status: "fail",
      message: "You are sending messages too quickly. Please slow down."
    }));
    return false;
  }

  return true;
}

export function resetRateLimit(client) {
  const key = client.username || client._socket.remoteAddress;
  rateLimitMap.delete(key);
}
