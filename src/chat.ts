import { open } from "fs/promises"
import { randomUUID } from 'crypto';

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

