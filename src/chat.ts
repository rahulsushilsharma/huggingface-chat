import { open } from "fs/promises"
import { randomUUID } from 'crypto';

/**
 * ChatBot class for managing conversations and interactions with models on Hugging Face.
 */
export default class ChatBot {
  // Private instance variables and properties...
  private cookie!: string
  private currentConversionID !: string
  private chatLength = 0
  private models = ['meta-llama/Llama-2-70b-chat-hf', 'codellama/CodeLlama-34b-Instruct-hf', 'OpenAssistant/oasst-sft-6-llama-30b-xor']
  private headers = {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "sec-ch-ua": "\"Chromium\";v=\"116\", \"Not)A;Brand\";v=\"24\", \"Google Chrome\";v=\"116\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  }
  private currentModel = this.models[0];

  /**
     * Constructs a new instance of the ChatBot class.
     * @param {string} cookie - The user's authentication cookie.
     * @param {string} path - The path to a file containing the authentication cookie.
     * @throws {Error} If both `cookie` and `path` are provided or if neither is provided.
     */
  constructor(cookie?: string, path?: string) {
    if (!cookie && !path) throw new Error('cookie or path of cookie required')
    else if (cookie && path) throw new Error('both cookie and path given')
    else if (cookie && !path) this.cookie = cookie
    else this.readCookiesFromPath(path)
  }

  /**
    * Switches the active model for the chat.
    * @param {'meta-llama/Llama-2-70b-chat-hf' | 'codellama/CodeLlama-34b-Instruct-hf' | 'OpenAssistant/oasst-sft-6-llama-30b-xor'} value - The model to switch to.
    */
  switchModel(value: 'meta-llama/Llama-2-70b-chat-hf' | 'codellama/CodeLlama-34b-Instruct-hf' | 'OpenAssistant/oasst-sft-6-llama-30b-xor') {
    this.currentConversionID = '';
    this.currentModel = value
  }

  /**
     * Lists available models that can be used with the chat.
     * @returns {string[]} An array of available model names.
     */
  listAvilableModels(): string[] {
    return this.models
  }

  /**
     * Reads cookies from a file path and sets them for authentication.
     * @param {string} path - The path to the file containing cookies.
     * @throws {Error} If `path` is undefined or if there is an error reading the file.
     */
  private async readCookiesFromPath(path: string | undefined) {
    if (!path) throw new Error('cookie path undefined')
    const file = await open(path);

    for await (const line of file.readLines()) {
      this.cookie += line
    }
  }

  /**
     * Initializes a new chat conversation.
     * @returns {Promise<string>} The conversation ID of the new chat.
     * @throws {Error} If the creation of a new conversation fails.
     */
  async getNewChat(): Promise<string> {
    const model = {
      model: this.currentModel
    }
    let response = await fetch("https://huggingface.co/chat/conversation", {
      "headers": {
        ...this.headers,
        "content-type": "application/json",
        "cookie": this.cookie,
        "Referer": "https://huggingface.co/chat/",
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


  /**
    * Checks if there is an active conversation ID, and if not, creates a new chat.
    */
  private async checkConversionId() {
    if (!this.currentConversionID) {
      this.currentConversionID = await this.getNewChat()
    }
  }


  /**
     * Initiates a chat with the provided text.
     * @param {string} text - The user's input text or prompt.
     * @param {string} currentConversionID - The conversation ID for the current chat.
     * @param {number} temperature - Temperature for text generation.
     * @param {number} truncate - Maximum number of tokens in the generated response.
     * @param {number} max_new_tokens - Maximum number of new tokens to generate.
     * @param {number} top_p - Top-p value for text generation.
     * @param {number} repetition_penalty - Repetition penalty for generated text.
     * @param {number} top_k - Top-k value for text generation.
     * @param {boolean} return_full_text - Whether to return the full text of the conversation.
     * @param {boolean} stream - Whether to use streaming for text generation.
     * @param {boolean} use_cache - Whether to use cached results for text generation.
     * @param {boolean} is_retry - Whether the request is a retry.
     * @returns {Promise<{ id: string, stream: ReadableStream|undefined, completeResponsePromise: () => Promise<string> }>} An object containing conversation details.
     * @throws {Error} If there is an issue with the chat request.
     */
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
  ): Promise<{ id: string; stream: ReadableStream|undefined; completeResponsePromise: () => Promise<string>; }> {

    if (text == "")
      throw new Error("the prompt can not be empty.")

    if (!currentConversionID) await this.checkConversionId()
    else this.currentConversionID = currentConversionID

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
        ...this.headers,
        "content-type": "application/json",
        "cookie": this.cookie,
        "Referer": "https://huggingface.co/chat/conversation/" + this.currentConversionID + "",
      },
      "body": JSON.stringify(data),
      "method": "POST"
    });

    function parseResponse(chunck: string) {
      try {
        const jsonObject = JSON.parse(chunck.substring(5).trim());
        return jsonObject
      } catch (error) {
        if (chunck.substring(5).trim()) console.error('Error parsing JSON:', chunck.substring(5).trim());
        return ''
      }
    }
    const decoder = new TextDecoder();
    const self = this;
    let completeResponse = ''
   
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const decodedChunk = decoder.decode(chunk)

        const modifiedData = parseResponse(decodedChunk)

        if (modifiedData.generated_text) {
          completeResponse = modifiedData.generated_text
          controller.terminate();
          if (self.chatLength <= 0) {
            await self.summarizeConversation()
          }
        } else {
          completeResponse = modifiedData.generated_text
          controller.enqueue(modifiedData.token.text);

        }
      },
    });
    const modifiedStream = response.body?.pipeThrough(transformStream);


    async function completeResponsePromise() {
      return new Promise<string>(async (resolve) => {
        if (!modifiedStream) {
          console.error('modifiedStream undefined');

        } else {
          let reader = modifiedStream.getReader();

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              resolve(completeResponse)
              break; // The streaming has ended.
            }
          }
        }
      })
    }

    this.chatLength += 1;
    return { id: this.currentConversionID, stream: modifiedStream, completeResponsePromise }
  }




  /**
     * Summarizes the conversation based on its conversation ID.
     * @param {string} conversation_id - The conversation ID to summarize.
     * @returns {Promise<any>} A Promise that resolves to the summarized conversation.
     * @throws {Error} If there is an issue summarizing the conversation.
     */
  private async summarizeConversation(conversation_id?: string): Promise<any> {

    if (!conversation_id) {
      conversation_id = this.currentConversionID
    }
    const response = await fetch("https://huggingface.co/chat/conversation/" + conversation_id + "/summarize", {
      "headers": {
        ...this.headers,
        "cookie": this.cookie,
        "Referer": "https://huggingface.co/chat/conversation/" + conversation_id + "",
      },
      "body": null,
      "method": "POST"
    }).catch(error => {
      throw new Error("Unable to summarize chat " + error)

    })
    const resJson = await response.json().catch(error => { throw new Error('Unknown response ' + error) })
    return resJson
  }

  /**
     * Preserves the context of the current chat conversation.
     * @param {boolean} newChat - Indicates if a new chat is being preserved.
     * @returns {Promise<Response>} A Promise that resolves to the response from preserving chat context.
     * @throws {Error} If there is an issue preserving chat context.
     */
  private async preserveContext(newChat: boolean): Promise<Response> {
    let response: Response
    if (newChat) {
      response = await fetch("https://huggingface.co/chat/conversation/" + this.currentConversionID + "/__data.json?x-sveltekit-invalidated=1_1", {
        "headers": {
          ...this.headers,
          "cookie": this.cookie,
          "Referer": "https://huggingface.co/chat/",
        },
        "body": null,
        "method": "GET"
      });

    } else {
      response = await fetch("https://huggingface.co/chat/conversation/" + this.currentConversionID + "/__data.json?x-sveltekit-invalidated=1_", {
        "headers": {
          ...this.headers,
          "cookie": this.cookie,
          "Referer": "https://huggingface.co/chat/conversation/" + this.currentConversionID + "",
        },
        "body": null,
        "method": "GET"
      });
    }

    if (response.status != 200) throw new Error("Unable to preserve chat context " + response)

    return response
  }
}


