import { open } from "fs/promises"
import { randomUUID } from 'crypto';
// const Readable = require('stream').Readable;

export default class ChatBot {
  private cookie!: string
  private currentConversionID !: string
  private chatLength = 0
  private models = ['codellama/CodeLlama-34b-Instruct-hf']

  constructor(cookie?: string, path?: string) {
    if (!cookie && !path) throw new Error('cookie or path of cookie required')
    else if (cookie && path) throw new Error('both cookie and path given')
    else if (cookie && !path) this.cookie = cookie
    else this.readCookiesFromPath(path)
  }

  async getHcSession() {

  }
  async readCookiesFromPath(path: string | undefined) {
    if (!path) throw new Error('cookie path undefined')
    const file = await open(path);

    for await (const line of file.readLines()) {
      this.cookie += line
    }
  }

  async getNewChat() {
    const model = {
      model: this.models[0]
    }
    let response = await fetch("https://huggingface.co/chat/conversation", {
      "headers": {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "cookie": this.cookie,
        "Referer": "https://huggingface.co/chat/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": JSON.stringify(model),
      "method": "POST"
    }).catch(error => { throw new Error('Failed to create new conversion' + error) });

    const { conversationId } = await response.json().catch(error => { throw new Error('Unknown response ' + error) });
    this.currentConversionID = conversationId;
    if (response.status != 200) throw new Error('Failed to create new conversion' + response)

    await this.preserveContext(true)
    return conversationId
  }

  async checkConversionId() {
    console.log('conversionID', this.currentConversionID)

    if (!this.currentConversionID) {

      this.currentConversionID = await this.getNewChat()
      console.log('creating new conversion', this.currentConversionID)

    }
  }


  async chat(
    text: string,
    currentConversionID?: string,
    temperature: number = 0.1,
    truncate: number = 1000,
    max_new_tokens: number = 2048,

    top_p: number = 0.95,
    repetition_penalty: number = 1.2,
    top_k: number = 50,
    return_full_text: boolean = false,
    stream: boolean = true,
    use_cache: boolean = false,
    is_retry: boolean = false
  ) {

    if (text == "")
      throw new Error("the prompt can not be empty.")

    if (!currentConversionID) await this.checkConversionId()
    else this.currentConversionID = currentConversionID

    const data_ = {
      "inputs": "hi",
      "parameters":
      {
        "temperature": 0.1,
        "truncate": 1000,
        "max_new_tokens": 2048,
        "top_p": 0.95,
        "repetition_penalty": 1.2,
        "top_k": 50,
        "return_full_text": false
      },
      "stream": true,
      "options": {
        "id": "50ee68ab-bc23-496e-bae3-fc3489f16ddb",
        "response_id": "02b46cdc-b0d4-4f67-a54c-3f5c3a30d598",
        "is_retry": false,
        "use_cache": false,
        "web_search_id": ""
      }


    }

    const data = {
      'inputs': text,
      'parameters': {
        'temperature': temperature,
        'truncate': truncate,
        'max_new_tokens': max_new_tokens,
        'top_p': top_p,
        'repetition_penalty': repetition_penalty,
        'top_k': top_k,
        'return_full_text': return_full_text,

      },
      'stream': stream,
      'options': {
        'id': randomUUID(),
        "response_id": randomUUID(),
        'is_retry': is_retry,
        'use_cache': use_cache,
        "web_search_id": ""
      }
    }
    const response = await fetch("https://huggingface.co/chat/conversation/" + this.currentConversionID + "", {
      "headers": {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "cookie": this.cookie,
        "Referer": "https://huggingface.co/chat/conversation/" + this.currentConversionID + "",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": JSON.stringify(data),
      "method": "POST"
    });
    const resText = await response.text()
    console.log(resText)

    if (this.chatLength <= 0) {
      await this.summarizeConversation()
    }


    this.chatLength += 1;
    return { id: this.currentConversionID, data: resText }
  }


  // Return a summary of the conversation.

  async summarizeConversation(conversation_id?: string) {

    if (!conversation_id) {
      conversation_id = this.currentConversionID
    }
    const response = await fetch("https://huggingface.co/chat/conversation/" + conversation_id + "/summarize", {
      "headers": {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "cookie": this.cookie,
        "Referer": "https://huggingface.co/chat/conversation/" + conversation_id + "",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": null,
      "method": "POST"
    }).catch(error => {
      throw new Error("Unable to summarize chat " + error)

    })
    const resJson = await response.json().catch(error => { throw new Error('Unknown response ' + error) })
    console.log('chat summary ', resJson)
    return resJson
  }


  async preserveContext(newChat: boolean) {
    let response: Response
    if (newChat) {
      response = await fetch("https://huggingface.co/chat/conversation/" + this.currentConversionID + "/__data.json?x-sveltekit-invalidated=1_1", {
        "headers": {
          "accept": "*/*",
          "accept-language": "en-US,en;q=0.9",
          "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "cookie": this.cookie,
          "Referer": "https://huggingface.co/chat/",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
      });

    } else {
      response = await fetch("https://huggingface.co/chat/conversation/" + this.currentConversionID + "/__data.json?x-sveltekit-invalidated=1_", {
        "headers": {
          "accept": "*/*",
          "accept-language": "en-US,en;q=0.9",
          "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "cookie": this.cookie,
          "Referer": "https://huggingface.co/chat/conversation/" + this.currentConversionID + "",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
      });
    }

    if (response.status != 200) throw new Error("Unable to preserve chat context " + response)

    return response
  }


}


// import axios, { AxiosResponse } from 'axios';
// import { Session } from 'some-session-library'; // Replace with the actual library you're using

// interface Cookies {
//   [key: string]: string;
// }

// interface ChatBotOptions {
//   cookies?: Cookies | null;
//   cookiePath?: string;
// }

// class ChatBot_ {
//   private cookies: Cookies = {};
//   private session: any;
//   private hfBaseUrl: string = 'https://huggingface.co';
//   private currentConversation: string = '';
//   private conversationIdList: string[] = [];
//   private notSummarizeCids: string[] = [];
//   private activeModel: string = 'meta-llama/Llama-2-70b-chat-hf';
//   private acceptedWelcomeModal: boolean = false;

//   constructor(options: ChatBotOptions = {}) {
//     const { cookies, cookiePath } = options;

//     if (!cookies && !cookiePath) {
//       throw new Error('Authentication is required now, but no cookies provided. See tutorial at https://github.com/Soulter/hugging-chat-api');
//     } else if (cookies && cookiePath) {
//       throw new Error('Both cookies and cookiePath provided');
//     }

//     if (!cookies && cookiePath) {
//       // Read cookies from path
//       // Implement cookie reading logic here
//       // ...

//       this.cookies = {}; // Replace with the actual cookies read from the file
//     } else {
//       this.cookies = cookies!;
//     }

//     this.session = this.getHcSession();
//     this.currentConversation = this.newConversation();
//   }

//   private getHcSession(): any {
//     let session: any

//     // Set cookies
//     session.cookies.update(this.cookies);

//     const response = session.get(`${this.hfBaseUrl}/chat`);

//     // Implement logging logic here
//     // ...

//     return session;
//   }

//   private newConversation(): string {
//     let errCount = 0;

//     // Accept the welcome modal when init.
//     // 17/5/2023: This is not required anymore.
//     // if (!this.acceptedWelcomeModal) {
//     //   this.acceptEthicsModal();
//     // }

//     let _header = this.getHeaders(false);
//     _header.Referer = 'https://huggingface.co/chat';

//     let resp;
//     while (true) {
//       try {
//         resp = this.session.post(`${this.hfBaseUrl}/chat/conversation`, { model: this.activeModel }, { headers: _header });
//         // Implement logging and error handling
//         // ...

//         const cid = resp.data.conversationId;
//         this.conversationIdList.push(cid);
//         this.notSummarizeCids.push(cid); // For the 1st chat, the conversation needs to be summarized.
//         this.preserveContext({ cid, ending: '1_1', refCid: '' });
//         return cid;
//       } catch (e) {
//         errCount++;
//         // Implement error handling and retry logic
//         // ...

//         if (errCount > 5) {
//           throw new Error(`Failed to create new conversation. (${errCount})`);
//         }
//         continue;
//       }
//     }
//   }

//   private getHeaders(ref: boolean): Record<string, string> {
//     const _h: Record<string, string> = {
//       Accept: '*/*',
//       Connection: 'keep-alive',
//       Host: 'huggingface.co',
//       Origin: 'https://huggingface.co',
//       // Add other headers here
//     };

//     if (ref) {
//       // Add Referer header
//       // ...
//     }

//     return _h;
//   }

//   private preserveContext({ cid, ending, refCid }: { cid: string; ending: string; refCid: string }): any {
//     // Implement context preservation logic here
//     // ...
//   }

//   private acceptEthicsModal(): void {
//     // Implement logic for accepting ethics modal
//     // ...
//   }

//   private summarizeConversation(conversationId: string | null = null): string {
//     // Implement conversation summarization logic here
//     // ...

//     return ''; // Replace with the actual summary
//   }

//   private shareConversation(conversationId: string | null = null): string {
//     // Implement conversation sharing logic here
//     // ...

//     return ''; // Replace with the actual share link
//   }

//   private deleteConversation(conversationId: string | null = null): boolean {
//     // Implement conversation deletion logic here
//     // ...

//     return true; // Replace with the actual result
//   }

//   private getAvailableLlmModels(): string[] {
//     // Implement logic to get available LLM models
//     // ...

//     return []; // Replace with the actual list of models
//   }

//   private setShareConversations(val: boolean = true): void {
//     // Implement logic to set sharing conversations
//     // ...
//   }

//   private switchLlm(to: number): boolean {
//     // Implement logic to switch LLM
//     // ...

//     return true; // Replace with the actual result
//   }

//   private checkOperation(): boolean {
//     // Implement operation checking logic here
//     // ...

//     return true; // Replace with the actual result
//   }

//   public chat(
//     text: string,
//     temperature: number = 0.9,
//     topP: number = 0.95,
//     repetitionPenalty: number = 1.2,
//     topK: number = 50,
//     truncate: number = 1024,
//     watermark: boolean = false,
//     maxNewTokens: number = 1024,
//     stop: string[] = ['</s>'],
//     returnFullText: boolean = false,
//     stream: boolean = true,
//     useCache: boolean = false,
//     isRetry: boolean = false,
//     retryCount: number = 5
//   ): string {
//     if (retryCount <= 0) {
//       throw new Error('The parameter retryCount must be greater than 0.');
//     }
//     if (this.currentConversation === '') {
//       this.currentConversation = this.newConversation();
//     }
//     if (text === '') {
//       throw new Error('The prompt cannot be empty.');
//     }

//     // Implement chat logic here
//     // ...

//     return ''; // Replace with the actual chat response
//   }
// }

// export { ChatBot_ };




// // import axios, { AxiosResponse } from 'axios';
// // import { CreateAxiosDefaults } from 'axios';

// // class ChatService {
// //     private currentConversation: string = '';
// //     private hfBaseUrl: string = 'https://huggingface.co'; // Replace with the actual base URL
// //     private session: any; // Replace with the actual session object
// //     __not_summarize_cids: any;

// //     async chat(
// //         text: string,
// //         temperature: number = 0.9,
// //         topP: number = 0.95,
// //         repetitionPenalty: number = 1.2,
// //         topK: number = 50,
// //         truncate: number = 1024,
// //         watermark: boolean = false,
// //         maxNewTokens: number = 1024,
// //         stop: string[] = ["</s>"],
// //         returnFullText: boolean = false,
// //         stream: boolean = true,
// //         useCache: boolean = false,
// //         isRetry: boolean = false,
// //         retryCount: number = 5
// //     ): Promise<string> {
// //         if (retryCount <= 0) {
// //             throw new Error("The parameter retryCount must be greater than 0.");
// //         }
// //         if (this.currentConversation === "") {
// //             this.currentConversation = this.newConversation();
// //         }
// //         if (text === "") {
// //             throw new Error("The prompt cannot be empty.");
// //         }

// //         const optionsId = uuidv4();
// //         const optionsRid = uuidv4();

// //         const reqData = {
// //             inputs: text,
// //             parameters: {
// //                 temperature,
// //                 topP,
// //                 repetitionPenalty,
// //                 topK,
// //                 truncate,
// //                 watermark,
// //                 maxNewTokens,
// //                 stop,
// //                 returnFullText,
// //                 stream,
// //             },
// //             options: {
// //                 useCache,
// //                 isRetry,
// //                 id: uuidv4(),
// //             },
// //             stream: true,
// //         };

// //         const headers = {
// //             Origin: 'https://huggingface.co',
// //             Referer: `https://huggingface.co/chat/conversation/${this.currentConversation}`,
// //             'Content-Type': 'application/json',
// //             'Sec-ch-ua': '"Chromium";v="94", "Microsoft Edge";v="94", ";Not A Brand";v="99"',
// //             'Sec-ch-ua-mobile': '?0',
// //             'Sec-ch-ua-platform': '"Windows"',
// //             Accept: '*/*',
// //             'Accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
// //         };

// //         while (retryCount > 0) {
// //             try {
// //                 const response: AxiosResponse = await axios.post(
// //                     `${this.hfBaseUrl}/chat/conversation/${this.currentConversation}`,
// //                     reqData,
// //                     {
// //                         headers,
// //                         withCredentials: true, // Make sure to include credentials if necessary
// //                     }
// //                 );

// //                 // Handle response data here
// //                 let resText = "";

// //                 if (response.status !== 200) {
// //                     retryCount -= 1;
// //                     if (retryCount <= 0) {
// //                         throw new Error(`Failed to chat. (${response.status})`);
// //                     }
// //                 }

// //                 for (const line of response.data.split('\n')) {
// //                     if (line) {
// //                         const res = line.trim();
// //                         try {
// //                             const obj = JSON.parse(res.substring(5));
// //                             if (obj.generated_text) {
// //                                 if (obj.token.text.endsWith("</s>")) {
// //                                     resText += obj.token.text.slice(0, -5);
// //                                 } else {
// //                                     resText += obj.token.text;
// //                                 }
// //                             } else if (obj.error) {
// //                                 throw new Error(obj.error);
// //                             }
// //                         } catch (error) {
// //                             if (error.message.includes('Model is overloaded')) {
// //                                 throw new Error("Model is overloaded, please try again later.");
// //                             } else {
// //                                 throw new Error(`Failed to parse response: ${res}`);
// //                             }
// //                         }
// //                     }
// //                 }

// //                 // Try to summarize the conversation and preserve the context
// //                 try {
// //                     if (!this.__not_summarize_cids.includes(this.currentConversation)) {
// //                         this.summarizeConversation();
// //                         this.__not_summarize_cids = this.__not_summarize_cids.filter(
// //                             (cid) => cid !== this.currentConversation
// //                         );
// //                     }
// //                     this.__preserveContext({ ref_cid: this.currentConversation });
// //                 } catch (error) {
// //                     // Handle any errors in context preservation or summarization
// //                 }

// //                 return resText.trim();
// //             } catch (error) {
// //                 // Handle axios or other errors
// //                 throw error;
// //             }
// //         }
// //     }
// //     newConversation(): string {
// //         throw new Error('Method not implemented.');
// //     }
// //     summarizeConversation() {
// //         throw new Error('Method not implemented.');
// //     }

// //     private async __preserveContext(cid: string | null = null, ending: string = "1_", refCid: string = ""): Promise<{ message: string; status: number }> {
// //         const headers = {
// //             'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.203",
// //             Accept: "*/*",
// //         };
// //         if (refCid === "") {
// //             headers["Referer"] = "https://huggingface.co/chat";
// //         } else {
// //             headers["Referer"] = `https://huggingface.co/chat/conversation/${refCid}`;
// //         }

// //         const cookie = {
// //             'hf-chat': this.get_cookies()['hf-chat'], // Replace with your actual get_cookies implementation
// //         };

// //         if (cid === null) {
// //             cid = this.currentConversation;
// //         }

// //         const url = `${this.hfBaseUrl}/chat/conversation/${cid}/__data.json?x-sveltekit-invalidated=${ending}`;
// //         headers["cookies"] = cookie
// //         try {
// //             const response: AxiosResponse = await axios.get(url, {
// //                 headers,
// //                 data: {},
// //             });

// //             // Handle response data here
// //             // log('__preserve_context', response, 'get', this.cookies, url, cookie, headers, {});

// //             if (response.status === 200) {
// //                 return { message: "Context Successfully Preserved", status: 200 };
// //             } else {
// //                 return { message: "Internal Error", status: 500 };
// //             }
// //         } catch (error) {
// //             // Handle axios or other errors
// //             throw error;
// //         }
// //     }

// //     private get_cookies(): Record<string, string> {
// //         return this.session.cookies.get_dict();
// //     }
// //     private get_headers(ref: boolean = true, refCid: string | null = null): Record<string, string> {
// //         const _h = {
// //             Accept: "*/*",
// //             Connection: "keep-alive",
// //             Host: "huggingface.co",
// //             Origin: "https://huggingface.co",
// //             'Sec-Fetch-Site': "same-origin",
// //             'Content-Type': "application/json",
// //             'Sec-Ch-Ua-Platform': "Windows",
// //             'Sec-Ch-Ua': "Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Microsoft Edge\";v=\"116",
// //             'Sec-Ch-Ua-Mobile': "?0",
// //             'Sec-Fetch-Mode': "cors",
// //             'Sec-Fetch-Dest': "empty",
// //             'Accept-Encoding': "gzip, deflate, br",
// //             'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
// //         };

// //         if (ref) {
// //             if (refCid === null) {
// //                 refCid = this.currentConversation;
// //             }
// //             _h["Referer"] = `https://huggingface.co/chat/conversation/${refCid}`;
// //         }

// //         return _h;
// //     }

// // }
