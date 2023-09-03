# hugging-chat-api-js
An api for hugging face chat
 
## example usage 

```js
import Login from '../src/login.js'
import ChatBot from '../src/chat.js'
import readline from 'readline';

const EMAIL = "email"
const PASSWD = "password"

const signin = new Login(EMAIL, PASSWD)

const res = await signin.loadCache("./cache/")
// const res = await signin.login()
console.log(res);

const chat = new ChatBot(res)

const { id, data }= await chat.chat("who am i")

const rl = readline.createInterface({
    input: data, // Use the response data stream
});

rl.on('line', (line) => {
    try {
        const jsonObject = JSON.parse(line.substring(5).trim());
        console.log(jsonObject.token.text);
        console.log(jsonObject.generated_text?jsonObject.generated_text:'');
    } catch (error) {
        if(line.substring(5).trim())console.error('Error parsing JSON:', line.substring(5).trim());
    }
});

rl.on('close', () => {
    console.log('Stream closed',id);
});
console.log(id);
```
