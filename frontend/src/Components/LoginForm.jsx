import React from 'react';
import Captcha from './Captcha';
import "./Styles/LoginForm.css";

export function LoginForm({ onSubmit, handleHasAccount, handleValsChange, handleCaptcha }) {
    return (
        <div>
            <form onSubmit={onSubmit} id='login-form'>
                <label htmlFor="username">Username</label>
                <input type="text" id="username" name="username" onChange={handleValsChange} />
                <br /><br />

                <label htmlFor="password">Password</label>
                <input type="password" id="password" name="password" onChange={handleValsChange} />
                <br /><br />

                {/* CAPTCHA Component */}
                <Captcha onChange={handleCaptcha} />

                <button type="submit">Log In</button>

                <div id='registration-link'>
                    <p>Don't have an account? Register here:</p>
                    <button type="button" onClick={() => handleHasAccount(false)}>
                        Register Here
                    </button>
                </div>
            </form>
        </div>
    );
}
