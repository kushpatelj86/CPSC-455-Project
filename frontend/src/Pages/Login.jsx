import React, { useState, useEffect, useRef } from 'react';
import { LoginForm } from '../Components/LoginForm.jsx';
import { Navigate } from 'react-router-dom';

export function Login() {
  const [hasAccount, setHasAccount] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaReal, setCaptchaReal] = useState('');
  const [wsConnected, setWsConnected] = useState(false);

  const ws = useRef(null);

  const [values, setValues] = useState({
    username: '',
    password: ''
  });

  // Capture the username at the time of sending
  const lastLoginAttempt = useRef('');

  // WebSocket setup
  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8000');

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Handle login/registration responses
      if (data.type === 'login' || data.type === 'registration') {
        if (data.status === 'success') {
          // Prefer server-sent username if available, otherwise use last sent username
          const username = data.username || lastLoginAttempt.current;
          localStorage.setItem('currentUser', JSON.stringify({ username }));
          setIsLoggedIn(true);
        } 
        else {
          alert(data.message || 'Authentication failed.');
        }
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket closed');
      setWsConnected(false);
    };

    ws.current.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    return () => ws.current.close();
  }, []);

  const handleValsChange = (e) => {
    const id = e.target.id;
    setValues({ ...values, [id]: e.target.value });
  };

  const handleCaptcha = (input, real) => {
    setCaptchaInput(input);
    setCaptchaReal(real);
  };

  const handleHasAccount = (val) => setHasAccount(val);

  const handleLoginSubmit = (e) => {
    e.preventDefault();

    if (captchaInput !== captchaReal) {
      alert('Incorrect CAPTCHA.');
      return;
    }

    if (!wsConnected) {
      alert('WebSocket not connected.');
      return;
    }

    // Capture the username at the time of sending
    lastLoginAttempt.current = values.username;

    ws.current.send(JSON.stringify({
      type: 'login',
      username: values.username,
      password: values.password,
      captchaCode: captchaInput
    }));
  };

  // Redirects
  if (hasAccount === false) return <Navigate to="/sign-up" replace />;
  if (isLoggedIn) return <Navigate to="/home" replace />;

  return (
    <div>
      <LoginForm
        handleHasAccount={handleHasAccount}
        onSubmit={handleLoginSubmit}
        handleValsChange={handleValsChange}
        handleCaptcha={handleCaptcha}
      />
    </div>
  );
}
