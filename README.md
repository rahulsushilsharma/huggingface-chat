# huggingface chat api 
A simple api for hugging face chat with login caching
 
## example usage 

```js

import { Login ,ChatBot} from "huggingface-chat";
import readline from 'readline';

const EMAIL = "email"
const PASSWD = "password"
const cachePath = "./login_cache/"

const signin = new Login(EMAIL, PASSWD)

const res = await signin.login(cachePath) // default path is ./login_cache/

const chat = new ChatBot(res) // res is cookies which is required for subsequent aip calls

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
```
