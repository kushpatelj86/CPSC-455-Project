import User from '../model/User.js';
import bcrypt from 'bcrypt';
import { santize } from '../protections/sanitization.js';
import { limitLogin, resetLoginLimit } from '../protections/loginlimiting.js';



// Send authentication response
function sendAuthResponse(client,type, status, message = "",islimited=false, isSecurePassword=false) {
  client.send(JSON.stringify({
    type: type,
    status,
    message,
    islimited,
    isSecurePassword
  }));
}

function sendError(client, error = "") {
  client.send(JSON.stringify({
    type: "login",
    status: "fail",
    error
  }));
}


export async function handleLogin(client, username, password, type, captchaCode) {
    if (!username || !password) {
        return sendAuthResponse(client, type, 'fail', 'Username and password required');
    }
    if (!limitLogin(client)) {
        const timeRemaining = 60000 - (Date.now() - client.attemptData.lastViolationTime);
        return sendAuthResponse(client, type, 'fail', `Account locked. Try again in ${Math.ceil(timeRemaining / 1000)}s`, true);
    }

    if (!captchaCode) {
        return sendAuthResponse(client, type, 'fail', 'Captcha required');
    }
  try {
    const user = await User.findOne({ username });
    if (!user) {
        return sendAuthResponse(client, type, 'fail', 'User does not exist');
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return sendAuthResponse(client, type, 'fail', 'Incorrect password');
    }
    resetLoginLimit(client);
    sendAuthResponse(client, type, 'success', 'Login successful', false, true);
  } catch (err) {
    console.error(err);
    sendAuthResponse(client, type, 'fail', 'Server error');
  }
}

export async function handleRegistration(client, username, password, type) {
  if (!username || !password) {
    return sendAuthResponse(client, type, 'fail', 'Username and password required');
  }
  if (!checkValidPassword(password)) {
    return sendAuthResponse(client, type, 'fail', 'Password must be at least 8 characters, include uppercase, lowercase, number, and special char');
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return sendAuthResponse(client, type, 'fail', 'Username already exists');
    }
    const hash = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hash });
    await newUser.save();

    sendAuthResponse(client, type, 'success', 'User registered successfully', false, true);
  } catch (err) {
    console.error(err);
    sendAuthResponse(client, type, 'fail', 'Server error');
  }
}


function checkValidPassword(password) {
  // Check length (minimum 8 characters)
  if (password.length < 8) {
    return false;
  }

  let hasUpperCase = false;
  let hasLowerCase = false;
  let hasNumber = false;
  let hasSpecialChar = false;
  const specialChars = "!@#$%^&*()_+-=[]{};':\"\\|,.<>/?";

  // Check each character in the password
  for (let i = 0; i < password.length; i++) {
    const char = password[i];

    if (char >= 'A' && char <= 'Z') {
      hasUpperCase = true;
    } 
    else if (char >= 'a' && char <= 'z') {
      hasLowerCase = true;
    } 
    else if (char >= '0' && char <= '9') {
      hasNumber = true;
    } 
    else if (specialChars.includes(char)) {
      hasSpecialChar = true;
    }
  }

  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    return false;
  }

  return true;
}