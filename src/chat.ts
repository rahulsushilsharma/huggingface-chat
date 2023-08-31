// import { Session } from 'express-session';
// import axios from 'axios';
// import fs from 'fs'

// class ChatBot {
//   private cookies: Record<string, string>;
//   private session: Session;
//   private hfBaseUrl: string;
//   private jsonHeader: Record<string, string>;
//   private conversationIdList: string[];
//   private notSummarizeCids: string[];
//   private activeModel: string;
//   private acceptedWelcomeModal: boolean;
//   private currentConversation: string;

//   constructor(cookies: Record<string, string> | null = null, cookiePath: string = '') {
//     if (cookies === null && cookiePath === '') {
//       throw new Error('Authentication is required now, but no cookies provided. See tutorial at https://github.com/Soulter/hugging-chat-api');
//     } else if (cookies !== null && cookiePath !== '') {
//       throw new Error('Both cookies and cookiePath provided');
//     }

//     if (cookies === null && cookiePath !== '') {
//       // Read cookies from path
//       if (!fs.existsSync(cookiePath)) {
//         throw new Error(`Cookie file ${cookiePath} not found. Note: The file must be in JSON format and must contain a list of cookies. See more at https://github.com/Soulter/hugging-chat-api`);
//       }
//       const cookiesData = fs.readFileSync(cookiePath, 'utf-8');
//       cookies = JSON.parse(cookiesData);
//     }

//     // Convert cookies to KV format
//     if (Array.isArray(cookies)) {
//       this.cookies = cookies.reduce((acc, cookie) => {
//         acc[cookie.name] = cookie.value;
//         return acc;
//       }, {});
//     } else {
//       this.cookies = cookies|| {'':''}as Record<string,string>;
//     }

//     this.hfBaseUrl = 'https://huggingface.co';
//     this.jsonHeader = { 'Content-Type': 'application/json' };
//     this.session = this.getHcSession();
//     this.conversationIdList = [];
//     this.notSummarizeCids = [];
//     this.activeModel = 'meta-llama/Llama-2-70b-chat-hf';
//     this.acceptedWelcomeModal = false; // Only when accepted, it can create a new conversation.
//     this.currentConversation = this.newConversation();
//   }

//   private getHcSession(): Session {
//     const session = new Session();
//     // Set cookies
//     session.cookies.update(this.cookies);
//     session.get(this.hfBaseUrl + '/chat');
//     return session;
//   }

//   private getHeaders(ref = true, refCid?: string): Record<string, string> {
//     const headers: Record<string, string> = {
//       Accept: '*/*',
//       Connection: 'keep-alive',
//       Host: 'huggingface.co',
//       Origin: 'https://huggingface.co',
//       'Sec-Fetch-Site': 'same-origin',
//       'Content-Type': 'application/json',
//       'Sec-Ch-Ua-Platform': 'Windows',
//       'Sec-Ch-Ua': 'Chromium";v="116", "Not)A;Brand";v="24", "Microsoft Edge";v="116',
//       'Sec-Ch-Ua-Mobile': '?0',
//       'Sec-Fetch-Mode': 'cors',
//       'Sec-Fetch-Dest': 'empty',
//       'Accept-Encoding': 'gzip, deflate, br',
//       'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
//     };

//     if (ref) {
//       const refCidToUse = refCid || this.currentConversation;
//       headers.Referer = `https://huggingface.co/chat/conversation/${refCidToUse}`;
//     }

//     return headers;
//   }

//   private getCookies(): Record<string, string> {
//     return this.session.cookies.getDict();
//   }

//   getConversationList(): string[] {
//     return [...this.conversationIdList];
//   }

//   // [Deprecated Method]
//   acceptEthicsModal(): boolean {
//     const data = {
//       ethicsModalAccepted: 'true',
//       shareConversationsWithModelAuthors: 'true',
//       ethicsModalAcceptedAt: '',
//       activeModel: this.activeModel.toString(),
//     };

//     const response = this.session.post(
//       `${this.hfBaseUrl}/chat/settings`,
//       {
//         headers: this.getHeaders(false),
//         cookies: this.getCookies(),
//         allowRedirects: true,
//         data: JSON.stringify(data),
//       }
//     );

//     if (response.status !== 200) {
//       throw new Error(`Failed to accept ethics modal with status code ${response.status}. ${response.content}`);
//     }

//     return true;
//   }

//   newConversation(): string {
//     let errCount = 0;

//     // Accept the welcome modal when init.
//     // 17/5/2023: This is not required anymore.
//     // if (!this.acceptedWelcomeModal) {
//     //     this.acceptEthicsModal();
//     // }

//     // Create new conversation and get a conversation id.
//     const headers = this.getHeaders(false);
//     headers.Referer = 'https://huggingface.co/chat';

//     let resp:any;
//     while (true) {
//       try {
//         resp = this.session.post(
//           `${this.hfBaseUrl}/chat/conversation`,
//           { model: this.activeModel },
//           {
//             headers,
//             cookies: this.getCookies(),
//           }
//         );
//         // console.log("new conversation");
//         // console.log(resp.text);
//         // logging.debug(resp.text);
//         const cid = JSON.parse(resp.text).conversationId;
//         this.conversationIdList.push(cid);
//         this.notSummarizeCids.push(cid); // For the 1st chat, the conversation needs to be summarized.
//         this.__preserveContext({ cid, ending: '1_1' });
//         return cid;
//       } catch (e) {
//         errCount += 1;
//         // logging.debug(`Failed to create new conversation. Retrying... (${errCount})`);
//         if (errCount > 5) {
//           throw new Error(`Failed to create new conversation. (${errCount})`);
//         }
//         continue;
//       }
//     }
//   }

//   changeConversation(conversationId: string): boolean {
//     if (!this.conversationIdList.includes(conversationId)) {
//       throw new Error('Invalid conversation id, not in conversation list.');
//     }
//     this.currentConversation = conversationId;
//     return true;
//   }
//   summarizeConversation(conversationId?: string): string {
//     if (!conversationId) {
//       conversationId = this.currentConversation;
//     }

//     const headers = this.getHeaders(true);
//     const response = this.session.post(
//       `${this.hfBaseUrl}/chat/conversation/${conversationId}/summarize`,
//       {
//         headers,
//         cookies: this.getCookies(),
//       }
//     );

//     if (response.status !== 200) {
//       throw new Error(`Failed to send chat message with status code: ${response.status}`);
//     }

//     const responseData = response.json();
//     if ('title' in responseData) {
//       return responseData.title;
//     }

//     throw new Error(`Unknown server response: ${responseData}`);
//   }

//   shareConversation(conversationId?: string): string {
//     if (!conversationId) {
//       conversationId = this.currentConversation;
//     }

//     const headers = this.getHeaders();
//     const response = this.session.post(
//       `${this.hfBaseUrl}/chat/conversation/${conversationId}/share`,
//       {
//         headers,
//         cookies: this.getCookies(),
//       }
//     );

//     if (response.status !== 200) {
//       throw new Error(`Failed to send chat message with status code: ${response.status}`);
//     }

//     const responseData = response.json();
//     if ('url' in responseData) {
//       return responseData.url;
//     }

//     throw new Error(`Unknown server response: ${responseData}`);
//   }

//   deleteConversation(conversationId?: string): boolean {
//     if (!conversationId) {
//       throw new Error('conversation_id is required.');
//     }

//     const headers = this.getHeaders();
//     const response = this.session.delete(
//       `${this.hfBaseUrl}/chat/conversation/${conversationId}`,
//       {
//         headers,
//         cookies: this.getCookies(),
//       }
//     );

//     if (response.status !== 200) {
//       throw new Error(`Failed to delete conversation with status code: ${response.status}`);
//     }

//     return true;
//   }
//   getAvailableLLMModels(): string[] {
//     // Get all available models that exist in huggingface.co/chat.
//     // Returns a hard-coded array. The array is up to date.
//     return ['OpenAssistant/oasst-sft-6-llama-30b-xor', 'meta-llama/Llama-2-70b-chat-hf'];
//   }

//   setShareConversations(val: boolean = true): void {
//     const setting = {
//       ethicsModalAcceptedAt: '',
//       searchEnabled: 'true',
//       activeModel: 'meta-llama/Llama-2-70b-chat-hf',
//       shareConversationsWithModelAuthors: ''
//     };

//     if (val) {
//       setting['shareConversationsWithModelAuthors'] = 'on';
//     }

//     const response = this.session.post(
//       `${this.hfBaseUrl}/chat/settings`,
//       {
//         headers: this.getHeaders(true),
//         cookies: this.getCookies(),
//         allowRedirects: true,
//         data: setting,
//       }
//     );
//   }

//   switchLLM(to: number): boolean {
//     // Attempts to change the current conversation's Large Language Model.
//     // Requires an index to indicate the model you want to switch.
//     // For now, 0 is `OpenAssistant/oasst-sft-6-llama-30b-xor`, 1 is `meta-llama/Llama-2-70b-chat-hf` :)
//     // llm 1 is the latest LLM.
//     // REMEMBER: For flexibility, the effect of switch is just limited to the current conversation.
//     // You can manually switch LLM when you change a conversation.

//     const llms = ['OpenAssistant/oasst-sft-6-llama-30b-xor', 'meta-llama/Llama-2-70b-chat-hf'];
//     let mdl = '';

//     if (to === 0) {
//       mdl = 'OpenAssistant/oasst-sft-6-llama-30b-xor';
//     } else if (to === 1) {
//       mdl = 'meta-llama/Llama-2-70b-chat-hf';
//     } else {
//       throw new Error(`Can't switch LLM, unexpected index. For now, 0 is 'OpenAssistant/oasst-sft-6-llama-30b-xor', 1 is 'meta-llama/Llama-2-70b-chat-hf' :)`);
//     }

//     const response = this.session.post(
//       `${this.hfBaseUrl}/chat/settings`,
//       {
//         headers: this.getHeaders(true),
//         cookies: this.getCookies(),
//         allowRedirects: true,
//         data: {
//           shareConversationsWithModelAuthors: 'on',
//           ethicsModalAcceptedAt: '',
//           searchEnabled: 'true',
//           activeModel: mdl,
//         },
//       }
//     );

//     const check = this.checkOperation();
//     if (check) {
//       return true;
//     } else {
//       console.log(`Switch LLM ${llms[to]} failed. Please submit an issue to https://github.com/Soulter/hugging-chat-api`);
//       return false;
//     }
//   }

//   checkOperation(): boolean {
//     const response = this.session.post(
//       `${this.hfBaseUrl}/chat/conversation/${this.currentConversation}/__data.json?x-sveltekit-invalidated=1_1`,
//       {
//         headers: this.getHeaders(true),
//         cookies: this.getCookies(),
//       }
//     );

//     return response.status === 200;
//   }
 

//   chat(
//     text: string,
//     temperature: number = 0.9,
//     topP: number = 0.95,
//     repetitionPenalty: number = 1.2,
//     topK: number = 50,
//     truncate: number = 1024,
//     watermark: boolean = false,
//     maxNewTokens: number = 1024,
//     stop: string[] = ["</s>"],
//     returnFullText: boolean = false,
//     stream: boolean = true,
//     useCache: boolean = false,
//     isRetry: boolean = false,
//     retryCount: number = 5
//   ): string {
//     if (retryCount <= 0) {
//       throw new Error("The parameter retryCount must be greater than 0.");
//     }
//     if (this.currentConversation === "") {
//       this.currentConversation = this.newConversation();
//     }
//     if (text === "") {
//       throw new Error("The prompt cannot be empty.");
//     }

//     const optionsId = uuidv4();
//     const optionsRid = uuidv4();

//     const reqJson = {
//       inputs: text,
//       parameters: {
//         temperature: temperature,
//         top_p: topP,
//         repetition_penalty: repetitionPenalty,
//         top_k: topK,
//         truncate: truncate,
//         watermark: watermark,
//         max_new_tokens: maxNewTokens,
//         stop: stop,
//         return_full_text: returnFullText,
//         stream: stream,
//       },
//       options: {
//         use_cache: useCache,
//         is_retry: isRetry,
//         id: uuidv4(),
//       },
//       stream: true,
//     };

//     const headers = {
//       Origin: "https://huggingface.co",
//       Referer: `https://huggingface.co/chat/conversation/${this.currentConversation}`,
//       "Content-Type": "application/json",
//       "Sec-ch-ua": '"Chromium";v="94", "Microsoft Edge";v="94", ";Not A Brand";v="99"',
//       "Sec-ch-ua-mobile": "?0",
//       "Sec-ch-ua-platform": '"Windows"',
//       Accept: "*/*",
//       "Accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
//     };

//     while (retryCount > 0) {
//       const resp = this.session.post(
//         `${this.hfBaseUrl}/chat/conversation/${this.currentConversation}`,
//         reqJson,
//         {
//           stream: true,
//           headers: headers,
//           cookies: this.session.cookies.get_dict(),
//         }
//       );

//       let resText = "";

//       if (resp.status !== 200) {
//         retryCount -= 1;
//         if (retryCount <= 0) {
//           throw new Error(`Failed to chat. (${resp.status})`);
//         }
//       }

//       for await (const line of resp.iter_lines()) {
//         if (line) {
//           const res = line.toString("utf-8");
//           try {
//             const obj = JSON.parse(res.slice(5));
//             if ("generated_text" in obj) {
//               if (obj.token.text.endsWith("</s>")) {
//                 resText += obj.token.text.slice(0, -5);
//               } else {
//                 resText += obj.token.text;
//               }
//             } else if ("error" in obj) {
//               throw new Error(obj.error);
//             }
//           } catch (e) {
//             if (
//               e instanceof SyntaxError &&
//               res.includes("{\"error\":\"Model is overloaded\"}")
//             ) {
//               throw new Error("Model is overloaded, please try again later.");
//             }
//             throw new Error(`Failed to parse response: ${res}`);
//           }
//         }
//       }

//       try {
//         if (this.currentConversation in this.__not_summarize_cids) {
//           this.summarizeConversation();
//           this.__not_summarize_cids.splice(
//             this.__not_summarize_cids.indexOf(this.currentConversation),
//             1
//           );
//         }
//         this.preserveContext({ ref_cid: this.currentConversation });
//       } catch {
//         // Handle exceptions here if needed.
//       }

//       return resText.trim();
//     }
//   }
//   private async preserveContext(cid: string | null = null, ending: string = '1_', refCid: string = ''): Promise<{ message: string; status: number }> {
//     const headers: Record<string, string> = {
//       'User-Agent':
//         'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.1901.203',
//       Accept: '*/*',
//     };

//     if (refCid === '') {
//       headers.Referer = 'https://huggingface.co/chat';
//     } else {
//       headers.Referer = `https://huggingface.co/chat/conversation/${refCid}`;
//     }

//     const cookie = {
//       'hf-chat': this.getCookies()['hf-chat'],
//     };

//     if (cid === null) {
//       cid = this.currentConversation;
//     }

//     const url = `https://huggingface.co/chat/conversation/${cid}/__data.json?x-sveltekit-invalidated=${ending}`;

//     const response = await this.session.get(url, { cookies: cookie, headers: headers, data: {} });

//     if (response.status_code === 200) {
//       return { message: 'Context Successfully Preserved', status: 200 };
//     } else {
//       return { message: 'Internal Error', status: 500 };
//     }
//   }
// }


