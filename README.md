# Kush In Tech Chat

Kush In Tech Chat is a chatting system built with Node.js and WebSockets. It supports user authentication with strong password requirements, message encryption, rate limiting, and limited logging attempts. It uses a secure WebSocket connection (wss://) over HTTPS. This chat applications gives users option to send it to everyone or individuals

Link to chat https://kush-in-tech-chat.onrender.com/

## Features

- **Real-Time Messaging:**  
  Send and receive messages instantly using WebSockets,
  
- **User Authentication:**  
  It uses mongo db to store the users, it uses the my atlas mongodb account to store all the users

- **Password Security**
  * Minimum 8 characters
  * At least one uppercase letter
  * At least one lowercase letter
  * At least one number
  * At least one special character


- **Message Encryption:**  
  All messages are encrypted using the AES-GCM algorithm, which provides a authentication tag, to generate the key you must run the command "openssl rand -hex 32 > aes-key.pem"

- **Rate Limiting:**  
  If a client sends more than 5 requests during the first minute he will be restricted from sending more messages until their rate limit gets reset
- **Login Limiting:**  
  If a client attempts to log in with the wrong password more than 5 times they are locked out for 1 minute

- **Secure Certificates:**  
  I ran the web sockets on a https server and to generate the certificates required for running it on a https server you must 

- **Live on the world wide web:**  
Hosted on render platform
Uses UptimeRobot to ping to this website every 5 minutes to keep it running forever


## Installation

Clone this repository and install dependencies:

```bash
git clone https://github.com/kushpatelj86/CPSC-455-Project.git
cd CPSC-455-Project
npm install
```




## Running the Server

By default, the server listens on port 8000 using a secured WebSocket connection (wss://). 

Start the server (connects both server and client side) with :
```bash
node server.js
```


## Protection functions
There is a protection folder in which encryption, rate limiting, and login limiting is put in place and they are used using external libraries like bcrypt or crypto
## Instructions

- **Login:**  
  Enter your username and password and captcha code. If the user doesn't exist create a new user by clicking the register button

- **Join:**  
  There'll be a join message sent to you when you log in.

- **Chat:**  
  The chat will be in the same window and at the same time but you'll have an option to send a message to everyone or a select user if you choose a select user only the select user will be able to see the message no one else

- **Logout:**  
   Use the logout button to disconnect from the chat.


## Sources 

https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-gcm

https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt#aes-gcm

https://stackoverflow.com/questions/14603205/how-to-convert-hex-string-into-a-bytes-array-and-a-bytes-array-in-the-hex-strin

https://www.geeksforgeeks.org/node-js-crypto-createcipheriv-method/


https://www.w3schools.com/Jsref/canvas_clearrect.asp

https://www.w3schools.com/tags/canvas_filltext.asp

