import React from 'react';
import Captcha from './Captcha';
import "./Styles/SignUpForm.css";

export function SignUpForm({ handleSignUpSubmit, handleValsChange, handleCaptcha }) {
    return (
        <div>
            <form id='signup-form' onSubmit={handleSignUpSubmit}>
                
                <label htmlFor="username">Username</label>
                <input type="text" id="username" name="username" onChange={handleValsChange} />
                <br /><br />

                <label htmlFor="password">Password</label>
                <input type="password" id="password" name="password" onChange={handleValsChange} />
                <br /><br />

                {/* CAPTCHA Component */}
                <Captcha onChange={handleCaptcha} />

                <button type="submit">Create User</button>
            </form>
        </div>
    );
}
