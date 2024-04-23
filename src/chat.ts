import { open } from "fs/promises";

interface Conversation {
  id: string;
  model: string;
  systemPrompt: string;
  title: string;
  history: History[];
}
interface History {
  id: string;
  role: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}
interface Model {
  id: string | null;
  name: string | null;
  displayName: string | null;
  preprompt: string | null;
  promptExamples: { title: string; prompt: string }[];
  websiteUrl: string | null;
  description: string | null;
  datasetName: string | null;
  datasetUrl: string | null;
  modelUrl: string | null;
  parameters: { [key: string]: any };
}
interface Sesson {
  id: string;
  title: string;
  model: string;
}
interface ChatResponse {
  id: string | undefined;
  stream: ReadableStream | undefined;
  completeResponsePromise: () => Promise<string>;
}
/**
 * ChatBot class for managing conversations and interactions with models on Hugging Face.
 */
export default class ChatBot {
  // Private instance variables and properties...
  private cookie!: string;
  private path: string | undefined;
  private headers = {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    "sec-ch-ua":
      '"Chromium";v="116", "Not)A;Brand";v="24", "Google Chrome";v="116"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
  private chatLength = 0;
  private models: Model[] = [];
  private sessons: Sesson[] = [];

  private currentModel: Model | null = null;
  private currentModelId: string | null = null;
  private currentConversation: Conversation | null = null;
  private currnetSesson: Sesson | null = null;
  private currentConversionID: string | undefined = undefined;

  /**
   * Constructs a new instance of the ChatBot class.
   * @param {string} cookie - The user's authentication cookie.
   * @param {string} path - The path to a file containing the authentication cookie.
   * @throws {Error} If both `cookie` and `path` are provided or if neither is provided.
   */

  constructor(cookie?: string, path?: string) {
    if (!cookie && !path) throw new Error("cookie or path of cookie required");
    else if (cookie && path) throw new Error("both cookie and path given");
    else if (cookie && !path) this.cookie = cookie;
    else this.path = path;
  }
  /**
   * Initializes the ChatBot instance.
   * @async
   * @returns {Promise<void>}
   */
  async intialize(): Promise<void> {
    if (this.path) await this.readCookiesFromPath(this.path);
    await this.getRemoteLlms();
    this.currentModel = this.models[0];
    this.currentModelId = this.currentModel.id;
    await this.getRemoteConversations();
  }
  /**
   * Switches the current model for the chat.
   * @param {string} value - The ID of the model to switch to.
   * @throws {Error} If the provided model ID is not a string or if the model is not found.
   */
  switchModel(value: string) {
    this.currentConversation = null;
    this.currentModel = null;
    this.currentModelId = null;

    if (typeof value === "string") {
      for (const model of this.models) {
        if (model.id === value) {
          this.currentModel = model;
          this.currentModelId = model.id;
        }
      }
      if (this.currentModelId === null) {
        throw Error(
          "Model not found, you can list the models by calling listAvilableModels()"
        );
      }
    } else {
      throw Error("Model Id should be a string");
    }
  }

  /**
   * Lists available models that can be used with the chat.
   * @returns {Model[]} An array of available model names.
   */
  listAvilableModels(): Model[] {
    return this.models;
  }

  /**
   * Lists available sessions for the chat.
   * @returns {Sesson[]} An array of available sessions.
   */
  listAvilableSesson(): Sesson[] {
    return this.sessons;
  }

  /**
   * Returns the currently selected model for the chat.
   * @returns {Model | null} The current model.
   */
  showCurrentModel(): Model | null {
    return this.currentModel;
  }

  /**
   * Reads cookies from a specified file path.
   * @param {string} path - The path to the file containing the cookies.
   * @throws {Error} If the path is undefined.
   * @private
   */
  private async readCookiesFromPath(path: string | undefined) {
    if (!path) throw new Error("cookie path undefined");
    const file = await open(path);

    for await (const line of file.readLines()) {
      this.cookie += line;
    }
  }

  /**
   * Fetches remote conversations from a server.
   * @returns {Promise<Sesson[]>} A promise that resolves to an array of fetched conversations.
   * @throws {Error} If the server response is not successful.
   */
  async getRemoteConversations(): Promise<Sesson[]> {
    try {
      const response = await fetch("https://huggingface.co/chat/__data.json", {
        headers: {
          ...this.headers,
          cookie: this.cookie,
        },
        body: null,
        method: "GET",
      });

      if (response.status !== 200) {
        throw new Error(
          `Failed to get remote conversations with status code: ${response.status}`
        );
      }
      const json = await response.json();
      const data = json.nodes[0].data;
      const conversationIndices = data[data[0].conversations];
      const conversations: Sesson[] = [];

      for (const index of conversationIndices) {
        const conversationData = data[index];
        const c: Sesson = {
          id: data[conversationData.id],
          title: data[conversationData.title],
          model: data[conversationData.model],
        };
        conversations.push(c);
      }
      this.sessons = conversations;
      return conversations;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetches remote LLMs from a server.
   * @returns {Promise<Model[]>} A promise that resolves to an array of fetched conversations.
   * @throws {Error} If the server response is not successful.
   */
  async getRemoteLlms(): Promise<Model[]> {
    try {
      const response = await fetch("https://huggingface.co/chat/__data.json", {
        headers: {
          ...this.headers,
          cookie: this.cookie,
        },
        body: null,
        method: "GET",
      });

      if (response.status !== 200) {
        throw new Error(
          `Failed to get remote LLMs with status code: ${response.status}`
        );
      }
      const json = await response.json();
      const data = json.nodes[0].data;
      const modelsIndices = data[data[0].models];
      const modelList: Model[] = [];

      const returnDataFromIndex = (index: number): any =>
        index === -1 ? null : data[index];

      for (const modelIndex of modelsIndices) {
        const modelData = data[modelIndex];

        // Model is unlisted, skip it
        if (data[modelData.unlisted]) {
          continue;
        }

        const m: Model = {
          id: returnDataFromIndex(modelData.id),
          name: returnDataFromIndex(modelData.name),
          displayName: returnDataFromIndex(modelData.displayName),
          preprompt: returnDataFromIndex(modelData.preprompt),
          promptExamples: [],
          websiteUrl: returnDataFromIndex(modelData.websiteUrl),
          description: returnDataFromIndex(modelData.description),
          datasetName: returnDataFromIndex(modelData.datasetName),
          datasetUrl: returnDataFromIndex(modelData.datasetUrl),
          modelUrl: returnDataFromIndex(modelData.modelUrl),
          parameters: {},
        };

        const promptList = returnDataFromIndex(modelData.promptExamples);
        if (promptList !== null) {
          const _promptExamples = promptList.map((index: number) =>
            returnDataFromIndex(index)
          );
          m.promptExamples = _promptExamples.map((prompt: any) => ({
            title: data[prompt.title],
            prompt: data[prompt.prompt],
          }));
        }

        const indicesParametersDict: { [key: string]: number } =
          returnDataFromIndex(modelData.parameters);
        const outParametersDict: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(indicesParametersDict)) {
          if (value === -1) {
            outParametersDict[key] = null;
            continue;
          }

          if (Array.isArray(data[value])) {
            outParametersDict[key] = data[value].map(
              (index: number) => data[index]
            );
            continue;
          }

          outParametersDict[key] = data[value];
        }

        m.parameters = outParametersDict;

        modelList.push(m);
      }
      this.models = modelList;
      return modelList;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Initializes a new chat conversation.
   * @returns {Promise<Conversation>} The conversation ID of the new chat.
   * @throws {Error} If the creation of a new conversation fails.
   */
  async getNewChat(systemPrompt?: string): Promise<Conversation> {
    const model = {
      model: this.currentModelId,
      preprompt: systemPrompt,
    };
    let retry = 0;
    while (retry < 5) {
      let response = await fetch("https://huggingface.co/chat/conversation", {
        headers: {
          ...this.headers,
          "content-type": "application/json",
          cookie: this.cookie,
          Referer: "https://huggingface.co/chat/",
        },
        body: JSON.stringify(model),
        method: "POST",
      });

      const { conversationId } = await response.json();

      if (conversationId) {
        this.currentConversionID = conversationId;
        break;
      } else {
        console.error(
          `Failed to create new conversation error ${response.statusText}, retrying...`
        );
        retry++;
      }
    }

    if (!this.currentConversionID)
      throw new Error("Failed to create new conversion");

    const currentChat = await this.getConversationHistory(
      this.currentConversionID
    );
    return currentChat;
  }

  /**
   * Initiates a chat with the provided text.
   * @param {string} text - The user's input text or prompt.
   * @param {string} currentConversionID - The conversation ID for the current chat.
   * @returns {Promise<ChatResponse>} An object containing conversation details.
   * @throws {Error} If there is an issue with the chat request.
   */
  async chat(
    text: string,
    currentConversionID?: string
  ): Promise<ChatResponse> {
    if (text == "") throw new Error("the prompt can not be empty.");

    if (!currentConversionID && !this.currentConversionID) {
      await this.getNewChat(); // if no chat is avilable
    } else if (currentConversionID) {
      this.currentConversionID = currentConversionID;
      await this.getConversationHistory(currentConversionID);
    } else if (this.currentConversionID) {
      await this.getConversationHistory(this.currentConversionID);
    }

    if (!this.currentConversation)
      throw new Error("Failed to create new conversion");

    const data = {
      inputs: text,
      id: this.currentConversation.history[
        this.currentConversation.history.length - 1
      ].id,
      is_retry: false,
      is_continue: false,
      web_search: false,
      files: [],
    };
    const response = await fetch(
      "https://huggingface.co/chat/conversation/" +
        this.currentConversionID +
        "",
      {
        headers: {
          ...this.headers,
          "content-type": "application/json",
          cookie: this.cookie,
          Referer:
            "https://huggingface.co/chat/conversation/" +
            this.currentConversionID +
            "",
        },
        body: JSON.stringify(data),
        method: "POST",
      }
    );

    function parseResponse(chunck: string) {
      try {
        // check if chunk contains multiple jsons
        const _jsonArr = chunck.split("}");
        const newJsonArray: any[] = [];

        for (const val of _jsonArr) {
          if (val.trim()) newJsonArray.push(JSON.parse(val + "}"));
        }
        return newJsonArray;
      } catch (error) {
        if (chunck) console.error("Error parsing JSON:", chunck);
        return [{}];
      }
    }
    const decoder = new TextDecoder();
    let completeResponse = "";

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const decodedChunk = decoder.decode(chunk);

        try {
          const modifiedDataArr = parseResponse(decodedChunk);

          for (const modifiedData of modifiedDataArr) {
            if (modifiedData.type === "finalAnswer") {
              completeResponse = modifiedData?.text || "";
              controller.terminate();
            } else if (modifiedData.type === "stream") {
              controller.enqueue(modifiedData?.token || "");
            }
          }
        } catch {
          throw new Error("Error during parsing response");
        }
      },
    });
    const modifiedStream = response.body?.pipeThrough(transformStream);

    async function completeResponsePromise() {
      return new Promise<string>(async (resolve) => {
        if (!modifiedStream) {
          console.error("modifiedStream undefined");
        } else {
          let reader = modifiedStream.getReader();

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              resolve(completeResponse);
              break; // The streaming has ended.
            }
          }
        }
      });
    }

    this.chatLength += 1;
    return {
      id: this.currentConversionID,
      stream: modifiedStream,
      completeResponsePromise,
    };
  }

  /**
   * get the details of current conversation
   * @returns {Promise<Conversation>} A Promise that return conversation details
   * @throws {Error} If there is an api error
   */
  private async getConversationHistory(conversationId: string) {
    if (!conversationId)
      throw new Error("conversationId is required for getConversationHistory");
    let response = await fetch(
      "https://huggingface.co/chat/conversation/" +
        conversationId +
        "/__data.json",
      {
        headers: {
          ...this.headers,
          cookie: this.cookie,
          Referer: "https://huggingface.co/chat/",
        },
        body: null,
        method: "GET",
      }
    );

    if (response.status != 200)
      throw new Error("Unable get conversation details " + response);
    else {
      const json = await response.json();
      const conversation = this.metadataParser(json, conversationId);
      return conversation;
    }
  }

  private metadataParser(meta: Record<string, any>, conversationId: string) {
    let conversation: Conversation = {
      id: "",
      model: "",
      systemPrompt: "",
      title: "",
      history: [],
    };
    const data: any = meta.nodes[1].data;
    const model = data[data[0].model];
    const systemPrompt = data[data[0].preprompt];
    const title = data[data[0].title];

    const messages: any[] = data[data[0].messages];
    const history: any[] = [];

    for (const index of messages) {
      const nodeMeta = data[index];
      const createdAt = new Date(data[nodeMeta.createdAt][1]).getTime() / 1000;
      const updatedAt = new Date(data[nodeMeta.updatedAt][1]).getTime() / 1000;

      history.push({
        id: data[nodeMeta.id],
        role: data[nodeMeta.from],
        content: data[nodeMeta.content],
        createdAt,
        updatedAt,
      });
    }

    conversation.id = conversationId;
    conversation.model = model;
    conversation.systemPrompt = systemPrompt;
    conversation.title = title;
    conversation.history = history;
    this.currentConversation = conversation;
    return conversation;
  }
}
