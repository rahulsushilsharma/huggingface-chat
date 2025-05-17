import { access, mkdir, open, writeFile } from "fs/promises";

/**
 * Login class for managing authentication and user sessions.
 */
export default class Login {
  private email: string = "";
  private password: string = "";
  private headers: any;
  private cookies: Record<string, any> = {};

  /**
   * Constructs a new instance of the Login class.
   * @param {string} email - huggingface email address.
   * @param {string} password - huggingface password.
   */
  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
    this.headers = {
      Referer: "https://huggingface.co/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.64",
    };
  }

  /**
   * Parses cookies into a formatted string.
   * @returns {string} A formatted string containing parsed cookies.
   */
  private parseCookies(): string {
    let res = "";
    if (!this.cookies) return res;
    if ("token" in this.cookies) res += `token=${this.cookies["token"]};`;
    if ("hf-chat" in this.cookies)
      res += `hf-chat=${this.cookies["hf-chat"]}; `;
    return res;
  }

  /**
   * Sends an HTTP GET request.
   * @param {string} url - The URL to send the GET request to.
   * @param {Record<string, any>} _params - Optional query parameters for the request.
   * @returns {Promise<{ status: number, headers: Headers, data: string }>} A Promise that resolves to the HTTP response.
   */
  async get(
    url: string,
    _params?: Record<string, any>
  ): Promise<{ status: number; headers: Headers; data: string }> {
    const headers = {
      ...this.headers,
      Cookie: this.parseCookies(),
    };
    const params = _params ? new URLSearchParams(_params).toString() : "";
    const fullUrl = params ? `${url}?${params}` : url;
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: headers,
      credentials: "include",
      redirect: "manual",
    });
    const data = await response.text();
    this.refreshCookies(response);
    return {
      status: response.status,
      headers: response.headers,
      data: data,
    };
  }

  /**
   * Sends an HTTP POST request.
   * @param {string} url - The URL to send the POST request to.
   * @param {Record<string, any>} data - Data to include in the request body.
   * @param {Record<string, any>} _headers - Optional additional headers for the request.
   * @returns {Promise<{ status: number, headers: Headers, data: string }>} A Promise that resolves to the HTTP response.
   */
  async post(
    url: string,
    data: Record<string, any> = {},
    _headers: Record<string, any> = {}
  ): Promise<{ status: number; headers: Headers; data: string }> {
    const headers = {
      ..._headers,
      Cookie: this.parseCookies(),
    };
    const body = new URLSearchParams(data);
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body,
      credentials: "include",
      redirect: "manual",
    });
    const responseData = await response.text();
    this.refreshCookies(response);
    return {
      status: response.status,
      headers: response.headers,
      data: responseData,
    };
  }

  /**
   * Refreshes cookies based on the response headers.
   * @param {Headers} headers - The HTTP response headers.
   */
  private refreshCookies(response: { headers: Headers }) {
    const setCookieHeaders = (response.headers as any).getSetCookie
      ? (response.headers as any).getSetCookie()
      : [];
    let jsonCookie: Record<string, any> = {};
    for (const cookie of setCookieHeaders) {
      for (const value of cookie.trim().split(";")) {
        const temp = value.trim().split("=");
        const key = temp[0];
        if (!jsonCookie[key]) {
          jsonCookie[key] = temp[1] || "";
        }
      }
    }
    for (const cookie in jsonCookie) {
      if (cookie === "token") this.cookies["token"] = jsonCookie["token"];
      if (cookie === "hf-chat") this.cookies["hf-chat"] = jsonCookie["hf-chat"];
    }
  }

  /**
   * Attempts to sign in with the provided email and password.
   * @throws {Error} If the sign-in fails.
   */
  private async signinWithEmail() {
    const url = "https://huggingface.co/login";
    const data = {
      username: this.email,
      password: this.password,
    };
    const res = await this.post(url, data, this.headers);
    if (res.status == 400) {
      throw new Error("wrong username or password");
    }
  }

  /**
   * Retrieves the authentication URL for a chat.
   * @returns {Promise<string>} A Promise that resolves to the authentication URL.
   * @throws {Error} If the URL retrieval fails.
   */
  private async getAuthUrl(): Promise<string> {
    const url = "https://huggingface.co/chat/login";
    const headers = {
      Referer: "https://huggingface.co/chat/login",
      "User-Agent": this.headers["User-Agent"],
      origin: "https://huggingface.co",
      "Content-Type": "application/x-www-form-urlencoded",
    };
    const res = await this.post(url, {}, headers);
    if (res.status == 200) {
      try {
        const data = JSON.parse(res.data);
        if (data.location) {
          return data.location;
        } else {
          throw new Error(
            "No authorize url found, please check your email or password."
          );
        }
      } catch {
        throw new Error("Invalid response");
      }
    } else if (res.status == 303) {
      const location = res.headers.get("location");
      if (location) {
        return location;
      } else {
        throw new Error(
          "No authorize url found, please check your email or password."
        );
      }
    } else {
      throw new Error("Something went wrong!");
    }
  }

  /**
   * Extracts CSRF token from a string.
   * @param {string} input - The input string containing CSRF information.
   * @returns {string | null} The extracted CSRF token or null if not found.
   */
  private getCrpf(input: string): string | null {
    const startIndex = input.indexOf("csrf");
    if (startIndex === -1) {
      return null; // Start string not found in input
    }
    const endIndex = input.indexOf("}", startIndex + "csrf".length);
    if (endIndex === -1) {
      return null; // End string not found after the start string
    }
    const str = input
      .substring(startIndex + "csrf".length, endIndex)
      .replace('/"/g', "");
    return str.substring(1);
  }

  /**
   * Grants authorization by following redirects.
   * @param {string} url - The URL to grant authorization for.
   * @returns {Promise<number>} A Promise that resolves to a status code.
   * @throws {Error} If the authorization process fails.
   */
  private async grantAuth(url: string): Promise<number> {
    let res = await this.get(url);
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (location) {
        res = await this.get(location);
        const setCookies = (res.headers as any).getSetCookie
          ? (res.headers as any).getSetCookie()
          : [];
        if (setCookies.some((cookie: string) => cookie.includes("hf-chat"))) {
          return 1;
        }
      }
    }
    if (res.status != 200) {
      throw new Error("grant auth fatal!");
    }
    const csrf = this.getCrpf(res.data);
    if (!csrf) {
      throw new Error("No csrf found!");
    }
    const data = {
      csrf: csrf,
    };
    res = await this.get(url, data);
    if (res.status != 303) {
      throw new Error(`get hf-chat cookies fatal! - ${res.status}`);
    } else {
      const location = res.headers.get("location");
      if (location) {
        res = await this.get(location);
        if (res.status != 302) {
          throw new Error(`get hf-chat cookie fatal! - ${res.status}`);
        } else {
          return 1;
        }
      } else {
        throw new Error("No location found");
      }
    }
  }

  /**
   * Initiates the login process.
   * @param {string} cache_path - Optional path for caching login data.
   * @returns {Promise<string>} A Promise that resolves to the parsed cookies.
   * @throws {Error} If the login process fails.
   */
  async login(cache_path?: string, force: boolean = false): Promise<string> {
    let cookies = "";
    const defaultCookiePath = cache_path || "./login_cache/";
    if (!force) {
      cookies = await this.loadLoginCache(defaultCookiePath);
    }
    if (cookies != "") {
      console.error(
        `Using cache from path: '${defaultCookiePath}${this.email}.txt'`
      );
      return cookies;
    } else {
      await this.signinWithEmail();
      const location = await this.getAuthUrl();
      if (await this.grantAuth(location)) {
        this.cacheLogin(defaultCookiePath);
        return this.parseCookies();
      } else {
        throw new Error(
          `Grant auth fatal, please check your email or password\ncookies gained: \n${this.cookies}`
        );
      }
    }
  }

  /**
   * Caches login data to a file.
   * @param {string} path - The path where login data will be cached.
   */
  private async cacheLogin(path: string) {
    try {
      await access(path);
      await writeFile(`${path}${this.email}.txt`, this.parseCookies());
      console.error(
        `Cache already exists at path '${path}${
          this.email
        }.txt', updating cache with ${this.parseCookies()}`
      );
    } catch (error) {
      try {
        await mkdir(path);
        await writeFile(`${path}${this.email}.txt`, this.parseCookies());
      } catch (error) {
        console.error(`Error creating cache:`, error);
      }
    }
  }

  /**
   * Loads cached login data from a file.
   * @param {string} path - The path to the cached login data file.
   * @returns {Promise<string>} A Promise that resolves to the cached login data.
   */
  async loadLoginCache(path: string): Promise<string> {
    try {
      const file = await open(`${path}${this.email}.txt`, "r");
      const lines: string[] = [];
      for await (const line of file.readLines()) {
        lines.push(line.toString());
      }
      return lines.join("");
    } catch (error) {
      console.error(`Error loading cache:`, error);
      console.error("\nCreating new session.");
      return "";
    }
  }
}
