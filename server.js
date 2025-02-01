
import {WebSocketServer} from 'ws';

const PORT = 8000;

const serverSock = new WebSocketServer({port:PORT});

serverSock.on('connection', function connect(curr_client){
    console.log("client just connect")
    curr_client.on('error',console.error);

    curr_client.on('message', function server_message(){
        console.log("reiceved message");
    });


    curr_client.on('message',function broadcast(data){
        const client_list = serverSock.clients;
        function check(client)
        {
            if(client !== curr_client && client.readyState === WebSocket.OPEN)
            {
                return true
            }

            return false;
        }

        client_list.forEach( (client) => {
            if(check(client))
            {
                client.send(data);
            }
        }
        
        );
    
    
    });


});

console.log( (new Date()) + " Server is listening on port " + PORT);
