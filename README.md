
**Deprecation Notice**

> The versions 2.x and lower are deprecated please use latest.

# Huggingface chat api 
A simple api for hugging face chat with login caching.

## Installation

Current stable release (`3.x`) 

```sh
npm i huggingface-chat
``` 

## Example usage 
```js

import { Login ,ChatBot} from "huggingface-chat";

const EMAIL = "email"
const PASSWD = "password"
const cachePath = "./login_cache/"
const signin = new Login(EMAIL, PASSWD)
const res = await signin.login(cachePath) // default path is ./login_cache/
const chat = new ChatBot(res) // res is cookies which is required for subsequent aip calls

await chat.intialize()

const models = chat.listAvilableModels()
console.log(models)


const sessons = chat.listAvilableSesson()
console.log(sessons)

let currentModel = chat.showCurrentModel()
console.log(currentModel)


chat.switchModel("google/gemma-1.1-7b-it")

currentModel = chat.showCurrentModel()
console.log(currentModel)

const currentChat = await chat.getNewChat("you are a drunk person") // optional if you want to set a system prompt
console.log(currentChat)

let data = await chat.chat("hi my name is jhon"); 
let  reader  =  data.stream.getReader();
while (true) {
	const  {  done,  value  }  =  await  reader.read();
	if (done) break;  // The streaming has ended.
	console.log(value)
}


data = await chat.chat("what is my name"); 
const response = await data.completeResponsePromise() //non streaming response
console.log(response)

```


>Note: Supported in node 18.x and higher.

## Documentations

Full API documentations can be found here [docs](./docs/doc.md)

## Contributions

- If you happen to see missing feature or a bug, feel free to open an issue.
- Pull requests are welcomed too!

## License

[MIT](LICENSE.md)
