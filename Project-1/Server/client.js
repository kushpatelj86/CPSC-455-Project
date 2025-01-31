import WebSocket from 'ws';
import sanitizeHtml from 'sanitize-html'
import promptSync from 'prompt-sync'
import fs from 'fs'









const serverAddress = "ws://localhost:8000";

const cliSocket = new WebSocket(serverAddress);



cliSocket.on('error', console.error);


cliSocket.on('open', function(){
console.log("send something")
const message = prompt("Please enter your message: ");
cliSocket.send(message);
});

cliSocket.on('message', 
    function recieve_message(data){
        console.log('received: %s', data);
    });




