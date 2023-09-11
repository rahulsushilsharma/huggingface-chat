
# Huggingface chat api 
A simple api for hugging face chat with login caching.

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
const data = await chat.chat("who am i");
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
## Contributions
- If you happen to use a missing feature , feel free to open an issue.
- Pull requests are welcomed too!

## License

[MIT](LICENSE.md)
