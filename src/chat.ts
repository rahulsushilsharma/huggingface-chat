import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { open } from "fs/promises"
import { v4 as uuidv4 } from 'uuid';
import { Readable, Transform } from 'stream';
import readline from 'readline';
// const Readable = require('stream').Readable;

export default class ChatBot {
    private cookie!: string
    private model !: string
    private currentConversionID !: string
    private headers = {
        'authority': 'huggingface.co',
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'content-type': 'application/json',
        'origin': 'https://huggingface.co',
        'sec-ch-ua': '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'
    }

    constructor(cookie?: string, path?: string) {
        if (!cookie && !path) throw new Error('cookie or path of cookie required')
        else if (cookie && path) throw new Error('both cookie and path given')
        else if (cookie && !path) this.cookie = cookie
        else this.readCookiesFromPath(path)

    }

    async readCookiesFromPath(path: string | undefined) {
        if (!path) throw new Error('cookie path undefined')
        const file = await open(path);

        for await (const line of file.readLines()) {
            this.cookie += line
        }
    }

    async getNewSession() {
        let response: AxiosResponse<any, any>
        try {
            response = await axios.post(
                'https://huggingface.co/chat/conversation',
                {
                    'model': this.model || 'meta-llama/Llama-2-70b-chat-hf'
                },
                {
                    headers: {
                        ...this.headers,
                        'referer': 'https://huggingface.co/chat',
                        'cookie': this.cookie
                    }

                }
            )
        } catch (e) {
            throw new Error('Failed to faitch' + e)
        }
        if (!response) return

        if (response.status != 200) throw new Error('Failed to create new conversion' + response)

        return response.data['conversationId']
    }

    async checkConversionId() {
        console.log('conversionID', this.currentConversionID)

        if (!this.currentConversionID) {

            this.currentConversionID = await this.getNewSession()
            console.log('creating new conversion', this.currentConversionID)

        }
    }

    async chat(
        text: string,
        currentConversionID?: string,
        temperature: number = 0.9,
        top_p: number = 0.95,
        repetition_penalty: number = 1.2,
        top_k: number = 50,
        truncate: number = 100,
        watermark: boolean = false,
        max_new_tokens: number = 100,
        stop = ["</s>"],
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
                "watermark": watermark,
                'max_new_tokens': max_new_tokens,
                "stop": stop,
                'top_p': top_p,
                'repetition_penalty': repetition_penalty,
                'top_k': top_k,
                'return_full_text': return_full_text
            },
            'stream': stream,
            'options': {
                'id': uuidv4(),
                'is_retry': is_retry,
                'use_cache': use_cache,
                'web_search_id': ''
            }
        }
        let response: AxiosResponse<any, any>
        try {
            response = await axios.post(
                `https://huggingface.co/chat/conversation/${this.currentConversionID}`,
                data,
                {
                    headers: {
                        ...this.headers,
                        'referer': `https://huggingface.co/chat/conversation/${this.currentConversionID}`,
                        'cookie': this.cookie
                    },
                    responseType: stream ? 'stream' : undefined
                }
            );

            const transformStream = new Transform({
                transform(chunk, encoding, callback) {
                    const transformedData = chunk.toString().substring(5).trim();
                    this.push(transformedData); // Push the transformed data to the new stream
                    callback();
                }
            });
            const op = response.data.pipe(transformStream)
            if (response.status != 200) throw new Error('Failed to chat' + response)
            return { id: this.currentConversionID, data: op }


        } catch (error) {
            throw new Error('Failed to faitch ' + error)

        }



    }


    // Return a summary of the conversation.

    async summarizeConversation(conversation_id?: string) {

        if (conversation_id)
            this.currentConversionID = conversation_id
        let response: AxiosResponse<any, any>

        try {
            response = await axios.post(
                `https://huggingface.co/chat/conversation/${this.currentConversionID}/summarize`,
                '',
                {
                    headers: {
                        ...this.headers,
                        'Referer': `https://huggingface.co/chat/conversation/${this.currentConversionID}`,
                        'cookie': this.cookie
                    }
                }
            );

        } catch (error) {
            throw new Error("Unable to summarize chat " + error)
        }
        if (response.data) {
            try {
                const res = JSON.parse(response.data)
                if (!res.hasOwnProperty('title')) throw new Error("Unknown response from chat summarization " + response.data)
            } catch (error) {
                throw new Error("Unknown response from chat summarization " + response.data)
            }
        }
        return response.data
    }


    preserveContext() {

    }

}

