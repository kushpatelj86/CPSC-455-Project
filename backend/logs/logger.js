import fs from 'fs'
import path from 'path';

export function logMessage( sender, message, receiver = 'All'){
    const LOG_FILE = path.join(process.cwd(), 'log.txt'); 

    try {
      const timestamp = new Date().toISOString();
      let content = `${sender} sent this message (${message}) to ${receiver} at ${timestamp}`
      fs.appendFileSync(LOG_FILE, content); 
    } catch (err) {
      console.error('Logging error:', err);
    }

}

export function logAuthentication( username, action){
    const LOG_FILE = path.join(process.cwd(), 'log.txt'); 

    try {
      const timestamp = new Date().toISOString();
      let content = `${username}  ${action}  at ${timestamp}`
      fs.appendFileSync(LOG_FILE, content);
    } catch (err) {
      console.error(err);
    }

}

export function logNotification( username, notification){
    const LOG_FILE = path.join(process.cwd(), 'log.txt'); 

    try {
      const timestamp = new Date().toISOString();
      let content = `${username} recieved this notification (${notification})  at ${timestamp}`
      fs.appendFileSync(LOG_FILE, content);
    } catch (err) {
      console.error(err);
    }

}

export function logRateLimit(username, action) {
  const LOG_FILE = path.join(process.cwd(), 'log.txt');
  try {
    const timestamp = new Date().toISOString();
    const content = `${username} was rate-limited for ${action} at ${timestamp}\n`;
    fs.appendFileSync(LOG_FILE, content);
  } catch (err) {
    console.error('Logging error:', err);
  }
}

export function logLoginLimit(username, action) {
  const LOG_FILE = path.join(process.cwd(), 'log.txt');
  try {
    const timestamp = new Date().toISOString();
    const content = `${username} was login-limited for ${action} at ${timestamp}\n`;
    fs.appendFileSync(LOG_FILE, content);
  } catch (err) {
    console.error('Logging error:', err);
  }
}


export function logUserJoin(username) {
  const LOG_FILE = path.join(process.cwd(), 'log.txt');
  try {
    const timestamp = new Date().toISOString();
    const content = `${username} joined the chat at ${timestamp}\n`;
    fs.appendFileSync(LOG_FILE, content);
  } catch (err) {
    console.error('Logging error:', err);
  }
}

export function logUserLeave(username) {
  const LOG_FILE = path.join(process.cwd(), 'log.txt');
  try {
    const timestamp = new Date().toISOString();
    const content = `${username} left the chat at ${timestamp}\n`;
    fs.appendFileSync(LOG_FILE, content);
  } catch (err) {
    console.error('Logging error:', err);
  }
}




