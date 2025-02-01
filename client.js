import WebSocket from 'ws';
import promptSync from 'prompt-sync'
import fs from 'fs'

const prompt = promptSync();
const userName = prompt("Enter Username: ");
const password = prompt.hide('Enter a password: ');

function JSONData() {
    const file = 'users.json'
    var data = fs.readFileSync(file);
    const json_data = JSON.parse(data);

    return json_data;
}







function UserExist()
{
    const currentObject = JSONData();

    let exits = false;

    for (const key in currentObject) {

        if(currentObject[key].username === userName)
        {
            exits = true;
            break;
        }
  
    }




    return exits;


}




function checkValidPassword()
{
    const currentObject = JSONData();
    let isValid = false;

    for (const key in currentObject) {
        console.log(currentObject[key].password === password)
        console.log(currentObject[key].username === userName)

        if(currentObject[key].password === password && currentObject[key].username === userName)
        {
            isValid = true;
            break;
        }
  
    }
    return isValid;
}



if((UserExist() === false))
{
    var currentObject = JSONData();
    let newData = {
        
        "username" : userName,
        "password" : password
        
    }
    currentObject.push(newData);

    var updatedData = JSON.stringify(currentObject);
    fs.writeFile('users.json', updatedData, err => {
    if(err) 
        {
            throw err;
        }
    });   


    console.log("User created")
}


else
{

    const serverAddress = "ws://localhost:8000";

    const cliSocket = new WebSocket(serverAddress);

    if((checkValidPassword() === false))
    {
        console.log("Invalid password");
    }

    else
    {
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


    }
}

