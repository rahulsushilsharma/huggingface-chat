import axios, { AxiosInstance, CreateAxiosDefaults } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { open, access, mkdir, writeFile } from "fs/promises"

export default class Login {
    private email: string = ''
    private password: string = ''
    private headers: any;
    private jar !: CookieJar
    private client !: AxiosInstance
    private cookie: string = ''

    constructor(email: string, password: string) {
        this.email = email;
        this.password = password
        this.headers = {
            "Referer": "https://huggingface.co/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.64",
        }
        this.jar = new CookieJar();
        this.client = wrapper(axios.create(
            { jar: this.jar, withCredentials: true } as  CreateAxiosDefaults<any>
            ));

    }

    async get(url: string, _parms?: any) {
        const headers = {
            ...this.headers,
            Cookie: this.cookie
        }
        const response = await axios.get(url, {
            params: _parms,
            headers: headers,
            validateStatus: function (status) {
                return status >= 200 && status < 400
            },
            maxRedirects: 0


        });
        return response
    }


    async post(url: string, data = {}, _headers = {}) {


        let response = await this.client.post(url, new URLSearchParams(data), {
            headers: _headers,
            validateStatus: function (status) {
                return status >= 200 && status < 400
            },
            maxRedirects: 0
        })
        this.refreshCookies()
        return response
    }

    refreshCookies() {
        const { cookies } = this.jar.toJSON()
        this.cookie = '';
        for (const cookie of cookies) {
            this.cookie += `${cookie.key}=${cookie.value};`
        }
    }

    async signinWithEmail() {
        const url = "https://huggingface.co/login"
        const data = {
            "username": this.email,
            "password": this.password,
        }
        const res = await this.post(url, data, this.headers)
        if (res.status == 400) {
            throw new Error("wrong username or password");
        }
    }


    async getAuthUrl() {
        const url = "https://huggingface.co/chat/login"
        const headers = {
            "Referer": "https://huggingface.co/chat/login",
            "User-Agent": this.headers["User-Agent"],
            "Content-Type": "application/x-www-form-urlencoded"
        }
        const res = await this.post(url, {}, headers)

        if (res.status == 200) {
            let location = res.data.location;
            if (location)
                return location
            else
                throw new Error("No authorize url found, please check your email or password.")
        }
        else if (res.status == 303) {
            const location = res.headers["location"]
            if (location)
                return location
            else
                throw new Error("No authorize url found, please check your email or password.")
        }
        else {
            throw new Error("Something went wrong!")
        }

    }

    getCrpf(input: string): string | null {
        const startIndex = input.indexOf('csrf');
        if (startIndex === -1) {
            return null; // Start string not found in input
        }

        const endIndex = input.indexOf('}', startIndex + 'csrf'.length);
        if (endIndex === -1) {
            return null; // End string not found after the start string
        }

        const str = input.substring(startIndex + 'csrf'.length, endIndex).replace('/&quot;/g', '');
        return str.substring(1)
    }


    async grantAuth(url: string) {
        let res = await this.get(url)
        let location: any
        if (res.headers.hasOwnProperty("location")) {
            location = res.headers["location"]
            // console.log(location)
            res = await this.get(location)
            // console.log("grant auth", this.cookie, this.cookie.includes("hf-chat"));

            if (this.cookie.includes("hf-chat"))
                return 1
        }
        // # raise Exception("grantAuth fatal")
        if (res.status != 200)
            throw new Error("grant auth fatal!")

        const csrf = this.getCrpf(res.data)
        // console.log(csrf, res.data);

        if (!csrf)
            throw new Error("No csrf found!")
        let data = {
            "csrf": csrf
        }
        res = await this.get(url, data)
        if (res.status != 303)
            throw new Error(`get hf-chat cookies fatal! - ${res.status}`)
        else
            location = res.headers["Location"]
        res = await this.get(location)
        if (res.status != 302)
            throw new Error(`get hf-chat cookie fatal! - ${res.status}`)
        else
            return 1

    }

    async login(cache_path?:string) {
        await this.signinWithEmail()
        const location = await this.getAuthUrl()
        if (await this.grantAuth(location)){
            this.cacheLogin(cache_path || './login_cache/')
            return this.cookie
}
        else
            throw new Error(`Grant auth fatal, please check your email or password\ncookies gained: \n${this.cookie}`)

    }

    async cacheLogin(path: string) {
        try {
          // Check if the directory already exists
          await access(path);
          await writeFile(`${path}${this.email}.txt`, this.cookie);
          console.log(`Cache already exists at path '${path}${this.email}.txt, updating cache with ${this.cookie}`);
        } catch (error) {
          // Create the directory if it doesn't exist
          try {
            await mkdir(path);
            await writeFile(`${path}${this.email}.txt`, this.cookie);
            console.log(`Cache created successfully.`);
          } catch (error) {
            console.error(`Error creating cache:`, error);
          }
        }
      }
    
      async loadLoginCache(path: string) {
        try {
          const file = await open(`${path}${this.email}.txt`, 'r');
          const lines: string[] = [];
    
          for await (const line of file.readLines()) {
            lines.push(line.toString());
          }
    
          this.cookie = lines.join(''); // Combine lines into a single string
          return this.cookie
        } catch (error) {
          console.error(`Error loading cache:`, error);
          return ''
        }
      }
}

