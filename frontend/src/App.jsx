import React from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import { Home } from './Pages/Home';
import { Login } from './Pages/Login';
import { SignUp } from './Pages/SignUp';
import { Chat } from './Pages/Chat';
import { Layout } from './Components/Layout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />

        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          
        </Route>
      </Routes>
    </Router>
  );
}

export default App;