import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import fs from 'fs';
import path from 'path';

class Login {
    private email: string;
    private passwd: string;
    private headers: { [key: string]: string };
    private cookies: any; // You might want to use a specific type for cookies

    constructor(email: string, passwd: string) {
        this.email = email;
        this.passwd = passwd;
        this.headers = {
            Referer: 'https://huggingface.co/',
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.64',
        };
        this.cookies = {}; // Initialize cookies as needed
    }

    private async requestsGet(url: string, params: any | null = null, allow_redirects: boolean = true): Promise<AxiosResponse> {
        const config: AxiosRequestConfig = {
            url,
            method: 'get',
            params,
            headers: this.headers,
            maxRedirects: allow_redirects ? 5 : 0,
        };

        const response = await axios(config);
        this.refreshCookies(response.headers['set-cookie']);
        return response;
    }

    private async requestsPost(
        url: string,
        headers: { [key: string]: string } | null = null,
        params: any | null = null,
        data: any | null = null,
        stream: boolean = false,
        allow_redirects: boolean = true
    ): Promise<AxiosResponse> {
        const config: AxiosRequestConfig = {
            url,
            method: 'post',
            params,
            data,
            headers: headers || this.headers,
            maxRedirects: allow_redirects ? 5 : 0,
        };

        const response = await axios(config);
        this.refreshCookies(response.headers['set-cookie']);
        return response;
    }

    private refreshCookies(setCookie: string[] | undefined) {
        if (setCookie) {
            // Parse and update cookies as needed
        }
    }

    public async SigninWithEmail(): Promise<void> {
        const url = 'https://huggingface.co/login';
        const data = {
            username: this.email,
            password: this.passwd,
        };

        try {
            const res = await this.requestsPost(url, null, null, data, false, false);
            if (res.status === 400) {
                throw new Error('Wrong username or password');
            }
        } catch (error) {
            throw error;
        }
    }

    public async getAuthURL(): Promise<string> {
        const url = 'https://huggingface.co/chat/login';
        const headers = {
            Referer: 'https://huggingface.co/chat/login',
            'User-Agent': this.headers['User-Agent'],
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        try {
            const res = await this.requestsPost(url, headers, false);
            if (res.status === 200) {
                const location = res.data.location;
                if (location) {
                    return location;
                } else {
                    throw new Error('No authorize URL found, please check your email or password.');
                }
            } else if (res.status === 303) {
                const location = res.headers['location'];
                if (location) {
                    return location;
                } else {
                    throw new Error('No authorize URL found, please check your email or password.');
                }
            } else {
                throw new Error('Something went wrong!');
            }
        } catch (error) {
            throw error;
        }
    }

    public async grantAuth(url: string): Promise<number> {
        try {
            const res = await this.requestsGet(url, false);
            if (res.headers['location']) {
                const location = res.headers['location'];
                const res2 = await this.requestsGet(location, false);

                if (res2.headers['set-cookie'] && res2.headers['set-cookie'].includes('hf-chat')) {
                    return 1;
                }
            }

            if (res.status !== 200) {
                throw new Error('Grant auth fatal!');
            }

            const csrfMatch = res.data.match(/\/oauth\/authorize.*?name="csrf" value="(.*?)"/);
            if (!csrfMatch || csrfMatch.length === 0) {
                throw new Error('No CSRF found!');
            }

            const data = {
                csrf: csrfMatch[1],
            };

            const res3 = await this.requestsPost(url, data, false);
            if (res3.status !== 303) {
                throw new Error(`Get hf-chat cookies fatal! - ${res3.status}`);
            } else {
                const location = res3.headers['location'];
                const res4 = await this.requestsGet(location, false);

                if (res4.status !== 302) {
                    throw new Error(`Get hf-chat cookie fatal! - ${res4.status}`);
                } else {
                    return 1;
                }
            }
        } catch (error) {
            throw error;
        }
    }

    public async login(): Promise<any> {
        await this.SigninWithEmail();
        const location = await this.getAuthURL();
        if (await this.grantAuth(location)) {
            return this.cookies;
        } else {
            throw new Error(`Grant auth fatal, please check your email or password\nCookies gained:\n${JSON.stringify(this.cookies)}`);
        }
    }

    public async saveCookiesToDir(cookieDirPath: string | null = null): Promise<string> {
        const cookieDir = cookieDirPath || path.join(__dirname, 'usercookies');
        const cookiePath = path.join(cookieDir, `${this.email}.json`);

        if (!fs.existsSync(cookieDir)) {
            console.log('Cookie directory not found, creating...');
            fs.mkdirSync(cookieDir, { recursive: true });
        }

        console.log(`Cookie store path: ${cookiePath}`);

        fs.writeFileSync(cookiePath, JSON.stringify(this.cookies), { encoding: 'utf-8' });

        return cookiePath;
    }

    private _getCookiePath(cookieDirPath: string): string {
        if (!fs.existsSync(cookieDirPath)) {
            return '';
        }

        const files = fs.readdirSync(cookieDirPath);

        for (const file of files) {
            if (file === `${this.email}.json`) {
                return path.join(cookieDirPath, file);
            }
        }

        return '';
    }

    public async loadCookiesFromDir(cookieDirPath: string | null = null): Promise<any> {
        const cookieDir = cookieDirPath || path.join(__dirname, 'usercookies');
        const cookiePath = this._getCookiePath(cookieDir);

        if (!cookiePath) {
            throw new Error(
                `Cookie not found. Please check the path given: ${cookieDir}.\nCookie file must be named like this: '${this.email}.json': '${this.email}.json'`
            );
        }

        try {
            const cookieData = fs.readFileSync(cookiePath, { encoding: 'utf-8' });
            const cookies = JSON.parse(cookieData);

            for (const key of Object.keys(cookies)) {
                // Update the cookies as needed
            }

            return this.cookies;
        } catch (error) {
            throw new Error('Load cookies from files fatal. Please check the format');
        }
    }
}

const EMAIL: string | undefined = process.env.EMAIL;
const PASSWD: string | undefined = process.env.PASSWD;

if ("EMAIL" && "PASSWD") {
    const login = new Login('omega8299@gmail.com', 'ft;GasE/CTNw9ip');
    // Use the login object as needed
    const coockies = await login.login()
    const cookie_path_dir = "./cookies_snapshot"
    login.saveCookiesToDir(cookie_path_dir)
} else {
    console.error('EMAIL and PASSWD environment variables are required.');
}
