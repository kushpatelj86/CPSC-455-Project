import React, { useState, useEffect, useRef } from 'react';
import { SignUpForm } from '../Components/SignUpForm.jsx';
import { Navigate } from 'react-router-dom';

export function SignUp() {
  const [hasAccount, setHasAccount] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [values, setValues] = useState({ username: '', password: '' });
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaReal, setCaptchaReal] = useState('');
  const ws = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);

  // --- Initialize WebSocket only once ---
  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8000');

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'registration') {
        if (data.status === 'success') {
          localStorage.setItem('currentUser', JSON.stringify({ username: values.username }));
          setIsRegistered(true); // triggers redirect to home
        } 
        else {
          if(data.message)
          {
            alert(data.message)
          }
          else
          {
            alert("Registration failed")

          }
        }
      }
    };

    ws.current.onerror = (err) => console.error('WebSocket error:', err);

    return () => ws.current?.close();
  }, []); // <- empty dependency array ensures this runs only once

  // --- Form handlers ---
  const handleValsChange = (e) => {
    const { id, value } = e.target;
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  const handleCaptcha = (input, real) => {
    setCaptchaInput(input);
    setCaptchaReal(real);
  };

  const handleHasAccount = (val) => setHasAccount(val);

  const handleSignUpSubmit = (e) => {
    e.preventDefault();

    if (captchaInput !== captchaReal) {
      alert('Incorrect CAPTCHA. Please try again.');
      return;
    }

    if (!wsConnected) {
      alert('WebSocket not connected.');
      return;
    }

    ws.current.send(
      JSON.stringify({
        type: 'registration',
        username: values.username,
        password: values.password,
        captchaCode: captchaInput
      })
    );
  };

  // --- Redirect logic ---
  if (hasAccount) {
    return <Navigate to="/login" replace />;
  }
  if (isRegistered) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div>
      <SignUpForm
        handleSignUpSubmit={handleSignUpSubmit}
        handleValsChange={handleValsChange}
        handleCaptcha={handleCaptcha}
        handleHasAccount={handleHasAccount} // pass to allow "Already have an account?" link
      />
    </div>
  );
}
