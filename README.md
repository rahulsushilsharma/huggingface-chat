
**Deprecation Notice**

> The versions 2.x and lower are deprecated please use latest.
 
# Huggingface chat api 
A simple api for hugging face chat with login caching.

## Installation

Current stable release (`4.x`) 
> Added tools support 🎉

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

// more info : https://huggingface.co/chat/models
let currentModel = chat.showCurrentModel()
console.log(currentModel)


chat.switchModel("microsoft/Phi-3.5-mini-instruct")

currentModel = chat.showCurrentModel()
console.log(currentModel)

const currentChat = await chat.getNewChat("you are a drunk person") // optional if you want to set a system prompt
console.log(currentChat)

const tools = await chat.getToolList("1") // for the sake of not overloading the api the tools need to be called when needed also pass the page number more info : https://huggingface.co/chat/tools
console.log(tools)

let data  = await chat.chat("take screenshoot of this website : google.com", undefined, {
	tools:["000000000000000000000001","66e99753cb638fb7e2342da5"], // pass the tools id tools[0].id
	rawResponse:true
}); 

let  reader  =  data.stream.getReader();
while (true) {
	const  {  done,  value  }  =  await  reader.read();
	if (done) break;  // The streaming has ended.
	process.stdout.write(value)
}


data = await chat.chat("what is my name"); 
let response = await data.completeResponsePromise() //non streaming response 
console.log(response)

data = await chat.chat("what is my name", sessons[0].id); // using existing sessons
response = await data.completeResponsePromise()
console.log(response)



```


>Note: Supported in node 18.x and higher.

>Note: In case the package stops working there is most likely a change in hugging face api, if possible please report it and update the package to latest if available.

## Documentations

Full API documentations of both classes can be found here [Chat](./docs/chat.md) [Login](./docs/login.md)


## Contributions

- If you happen to see missing feature or a bug, feel free to open an [issue](https://github.com/rahulsushilsharma/huggingface-chat/issues).
- Pull requests are welcomed too!

## License

[MIT](LICENSE.md)
