# SecureChat

SecureChat is a real-time chat system built with Node.js and WebSockets. It supports user authentication authentication with strong password requirements, message encryption, rate limiting, and limited logging attempts. It uses a secure WebSocket connection (wss://) over HTTPS. This chat applications gives users option to send it to everyone or individuals 

## Features

- **Real-Time Messaging:**  
  Send and receive messages instantly using WebSockets,
  
- **User Authentication:**  
  It uses mongo db to store the users 

- **Password Security**
  * Minimum 8 characters
  * At least one uppercase letter
  * At least one lowercase letter
  * At least one number
  * At least one special character
  * Real-time password strength feedback during account creation


- **Message Encryption:**  
  All messages are encrypted using the AES-GCM algorithm, which provides authentication, to generate the key you must run the command "openssl rand -hex 32 > aes-key.pem"

- **Rate Limiting:**  
  If a client sends more than 5 requests within 10 seconds, further requests during that same 10-second window will be rejected. After the 10 seconds have passed, their count is reset, and they can





## Installation

Clone this repository and install dependencies:

```bash
git clone https://github.com/kushpatelj86/CPSC-455-Project.git
cd CPSC-455-Project
npm install
```




## Running the Server

By default, the server listens on port 8001 using a secured WebSocket connection (wss://). 

Start the server (connects both server and client side) with :
```bash
node server.js
```


## helper functions

server.js helper functions are located in the src folder
## Instructions

- **Login:**  
  Enter your username and password. If the user does not exist, a new account is automatically created with that username and password.

- **Join:**  
  There'll be a join message sent to you when you log in .

- **Chat:**  
  The chat will be in the same window and at the same time but youll have an option to send a message to everyone or a select user if you choose a select user only the select user will be able to see the message no one else

- **Logout:**  
   Use `logout` to disconnect from the chat.
