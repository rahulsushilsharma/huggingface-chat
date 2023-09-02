import axios, { AxiosInstance } from 'axios';
import { open } from "fs/promises"
import { v4 as uuidv4 } from 'uuid';

export default class ChatBot {
    private cookies!: string
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
        if (!cookie && !path) throw new Error('cookie or path of cookies required')
        else if (cookie && path) throw new Error('both cookie and path given')
        else if (cookie && !path) this.cookies = cookie
        else this.readCookiesFromPath(path)

    }

    async readCookiesFromPath(path: string | undefined) {
        if (!path) throw new Error('cookie path undefined')
        const file = await open(path);

        for await (const line of file.readLines()) {
            this.cookies += line
        }
    }

    async getNewSession() {
        const response = await axios.post(
            'https://huggingface.co/chat/conversation',
            {
                'model': this.model || 'meta-llama/Llama-2-70b-chat-hf'
            },
            {
                headers: {
                    ...this.headers,
                    'referer': 'https://huggingface.co/chat',
                    'cookie': this.cookies
                }
            }
        )
        return response.data['conversationId']
    }

    async checkConversionId() {
        if (!this.currentConversionID)
            this.currentConversionID = await this.getNewSession()
    }

    async chat(
        text: string,
        temperature: number = 0.9,
        top_p: number = 0.95,
        repetition_penalty: number = 1.2,
        top_k: number = 50,
        truncate: number = 1024,
        watermark: boolean = false,
        max_new_tokens: number = 1024,
        stop = ["</s>"],
        return_full_text: boolean = false,
        stream: boolean = true,
        use_cache: boolean = false,
        is_retry: boolean = false,
        retry_count: number = 5,
    ) {
        if (retry_count <= 0)
            throw new Error("the parameter retry_count must be greater than 0.")
        if (text == "")
            throw new Error("the prompt can not be empty.")


        await this.checkConversionId()


        const response = await axios.post(
            `https://huggingface.co/chat/conversation/${this.currentConversionID}`,
            {
                'inputs': text,
                'parameters': {
                    'temperature': temperature,
                    'truncate': truncate,
                    'max_new_tokens': max_new_tokens,
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
            },
            {
                headers: {
                    ...this.headers,
                    'referer': `https://huggingface.co/chat/conversation/${this.currentConversionID}`,
                    'cookie': this.cookies
                }
            }
        );
    }



}

