
# Huggingface chat api 
A simple api for hugging face chat with login caching.

>Note: currently only supported in node 18.x and higher, working on the fix.

## Installation

Current stable release (`2.x`) 

```sh
npm i huggingface-chat
``` 

## Example usage 

###  With non streaming api 

```js

import { Login ,ChatBot} from "huggingface-chat";

const EMAIL = "email"
const PASSWD = "password"
const cachePath = "./login_cache/"

const signin = new Login(EMAIL, PASSWD)
const res = await signin.login(cachePath) // default path is ./login_cache/
const chat = new ChatBot(res) // res is cookies which is required for subsequent aip calls
const data = await chat.chat("who am i"); // Default model is "meta-llama/Llama-2-70b-chat-hf"
const  response  =  await  data.completeResponsePromise()
console.log(response)
```


###  With streaming api 

```js

import { Login ,ChatBot} from "huggingface-chat";

const EMAIL = "email"
const PASSWD = "password"
const cachePath = "./login_cache/"

const signin = new Login(EMAIL, PASSWD)
const res = await signin.login(cachePath) // default path is ./login_cache/
const chat = new ChatBot(res) // res is cookies which is required for subsequent aip calls
const data = await chat.chat("who am i"); 
let  reader  =  data.stream.getReader();
while (true) {
	const  {  done,  value  }  =  await  reader.read();
	if (done) break;  // The streaming has ended.
	console.log(value)
}
```

### Switching Models

```js
/*
Avilable models are:

'meta-llama/Llama-2-70b-chat-hf'
'codellama/CodeLlama-34b-Instruct-hf'
'OpenAssistant/oasst-sft-6-llama-30b-xor'
*/
chat.switchModel('OpenAssistant/oasst-sft-6-llama-30b-xor') 

```

## Documentations

Full API documentations can be found here [docs](./docs/doc.md)

## Contributions

- If you happen to see missing feature or a bug, feel free to open an issue.
- Pull requests are welcomed too!

## License

[MIT](LICENSE.md)
