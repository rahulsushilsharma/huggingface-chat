# Login Class  
## Functions

<dl>
<dt><a href="#parseCookies">parseCookies()</a> ⇒ <code>string</code></dt>
<dd><p>Parses cookies into a formatted string.</p>
</dd>
<dt><a href="#get">get(url, _parms)</a> ⇒ <code>Promise.&lt;AxiosResponse&gt;</code></dt>
<dd><p>Sends an HTTP GET request.</p>
</dd>
<dt><a href="#post">post(url, data, _headers)</a> ⇒ <code>Promise.&lt;AxiosResponse&gt;</code></dt>
<dd><p>Sends an HTTP POST request.</p>
</dd>
<dt><a href="#refreshCookies">refreshCookies(response)</a></dt>
<dd><p>Refreshes cookies based on the response headers.</p>
</dd>
<dt><a href="#signinWithEmail">signinWithEmail()</a></dt>
<dd><p>Attempts to sign in with the provided email and password.</p>
</dd>
<dt><a href="#getAuthUrl">getAuthUrl()</a> ⇒ <code>Promise.&lt;string&gt;</code></dt>
<dd><p>Retrieves the authentication URL for a chat.</p>
</dd>
<dt><a href="#getCrpf">getCrpf(input)</a> ⇒ <code>string</code> | <code>null</code></dt>
<dd><p>Extracts CSRF token from a string.</p>
</dd>
<dt><a href="#grantAuth">grantAuth(url)</a> ⇒ <code>Promise.&lt;number&gt;</code></dt>
<dd><p>Grants authorization by following redirects.</p>
</dd>
<dt><a href="#login">login(cache_path)</a> ⇒ <code>Promise.&lt;string&gt;</code></dt>
<dd><p>Initiates the login process.</p>
</dd>
<dt><a href="#cacheLogin">cacheLogin(path)</a></dt>
<dd><p>Caches login data to a file.</p>
</dd>
<dt><a href="#loadLoginCache">loadLoginCache(path)</a> ⇒ <code>Promise.&lt;string&gt;</code></dt>
<dd><p>Loads cached login data from a file.</p>
</dd>
</dl>

<a name="parseCookies"></a>

## parseCookies() ⇒ <code>string</code>
Parses cookies into a formatted string.

**Kind**: global function  
**Returns**: <code>string</code> - A formatted string containing parsed cookies.  
<a name="get"></a>

## get(url, _parms) ⇒ <code>Promise.&lt;AxiosResponse&gt;</code>
Sends an HTTP GET request.

**Kind**: global function  
**Returns**: <code>Promise.&lt;AxiosResponse&gt;</code> - A Promise that resolves to the HTTP response.  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | The URL to send the GET request to. |
| _parms | <code>Record.&lt;string, any&gt;</code> | Optional query parameters for the request. |

<a name="post"></a>

## post(url, data, _headers) ⇒ <code>Promise.&lt;AxiosResponse&gt;</code>
Sends an HTTP POST request.

**Kind**: global function  
**Returns**: <code>Promise.&lt;AxiosResponse&gt;</code> - A Promise that resolves to the HTTP response.  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | The URL to send the POST request to. |
| data | <code>Record.&lt;string, any&gt;</code> | Data to include in the request body. |
| _headers | <code>Record.&lt;string, any&gt;</code> | Optional additional headers for the request. |

<a name="refreshCookies"></a>

## refreshCookies(response)
Refreshes cookies based on the response headers.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| response | <code>AxiosResponse</code> | The HTTP response to extract cookies from. |

<a name="signinWithEmail"></a>

## signinWithEmail()
Attempts to sign in with the provided email and password.

**Kind**: global function  
**Throws**:

- <code>Error</code> If the sign-in fails.

<a name="getAuthUrl"></a>

## getAuthUrl() ⇒ <code>Promise.&lt;string&gt;</code>
Retrieves the authentication URL for a chat.

**Kind**: global function  
**Returns**: <code>Promise.&lt;string&gt;</code> - A Promise that resolves to the authentication URL.  
**Throws**:

- <code>Error</code> If the URL retrieval fails.

<a name="getCrpf"></a>

## getCrpf(input) ⇒ <code>string</code> \| <code>null</code>
Extracts CSRF token from a string.

**Kind**: global function  
**Returns**: <code>string</code> \| <code>null</code> - The extracted CSRF token or null if not found.  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>string</code> | The input string containing CSRF information. |

<a name="grantAuth"></a>

## grantAuth(url) ⇒ <code>Promise.&lt;number&gt;</code>
Grants authorization by following redirects.

**Kind**: global function  
**Returns**: <code>Promise.&lt;number&gt;</code> - A Promise that resolves to a status code.  
**Throws**:

- <code>Error</code> If the authorization process fails.


| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | The URL to grant authorization for. |

<a name="login"></a>

## login(cache_path) ⇒ <code>Promise.&lt;string&gt;</code>
Initiates the login process.

**Kind**: global function  
**Returns**: <code>Promise.&lt;string&gt;</code> - A Promise that resolves to the parsed cookies.  
**Throws**:

- <code>Error</code> If the login process fails.


| Param | Type | Description |
| --- | --- | --- |
| cache_path | <code>string</code> | Optional path for caching login data. |

<a name="cacheLogin"></a>

## cacheLogin(path)
Caches login data to a file.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | The path where login data will be cached. |

<a name="loadLoginCache"></a>

## loadLoginCache(path) ⇒ <code>Promise.&lt;string&gt;</code>
Loads cached login data from a file.

**Kind**: global function  
**Returns**: <code>Promise.&lt;string&gt;</code> - A Promise that resolves to the cached login data.  

| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | The path to the cached login data file. |

# Chat Class  
## Functions

<dl>
<dt><a href="#switchModel">switchModel(value)</a></dt>
<dd><p>Switches the active model for the chat.</p>
</dd>
<dt><a href="#listAvilableModels">listAvilableModels()</a> ⇒ <code>Array.&lt;string&gt;</code></dt>
<dd><p>Lists available models that can be used with the chat.</p>
</dd>
<dt><a href="#readCookiesFromPath">readCookiesFromPath(path)</a></dt>
<dd><p>Reads cookies from a file path and sets them for authentication.</p>
</dd>
<dt><a href="#getNewChat">getNewChat()</a> ⇒ <code>Promise.&lt;string&gt;</code></dt>
<dd><p>Initializes a new chat conversation.</p>
</dd>
<dt><a href="#checkConversionId">checkConversionId()</a></dt>
<dd><p>Checks if there is an active conversation ID, and if not, creates a new chat.</p>
</dd>
<dt><a href="#chat">chat(text, currentConversionID, temperature, truncate, max_new_tokens, top_p, repetition_penalty, top_k, return_full_text, stream, use_cache, is_retry)</a> ⇒ <code><a href="#ChatResponse">Promise.&lt;ChatResponse&gt;</a></code></dt>
<dd><p>Initiates a chat with the provided text.</p>
</dd>
<dt><a href="#summarizeConversation">summarizeConversation(conversation_id)</a> ⇒ <code>Promise.&lt;any&gt;</code></dt>
<dd><p>Summarizes the conversation based on its conversation ID.</p>
</dd>
<dt><a href="#preserveContext">preserveContext(newChat)</a> ⇒ <code>Promise.&lt;Response&gt;</code></dt>
<dd><p>Preserves the context of the current chat conversation.</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#ChatResponse">ChatResponse</a></dt>
<dd></dd>
</dl>

<a name="switchModel"></a>

## switchModel(value)
Switches the active model for the chat.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| value | <code>&#x27;meta-llama/Llama-2-70b-chat-hf&#x27;</code> \| <code>&#x27;codellama/CodeLlama-34b-Instruct-hf&#x27;</code> \| <code>&#x27;OpenAssistant/oasst-sft-6-llama-30b-xor&#x27;</code> | The model to switch to. |

<a name="listAvilableModels"></a>

## listAvilableModels() ⇒ <code>Array.&lt;string&gt;</code>
Lists available models that can be used with the chat.

**Kind**: global function  
**Returns**: <code>Array.&lt;string&gt;</code> - An array of available model names.  
<a name="readCookiesFromPath"></a>

## readCookiesFromPath(path)
Reads cookies from a file path and sets them for authentication.

**Kind**: global function  
**Throws**:

- <code>Error</code> If `path` is undefined or if there is an error reading the file.


| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | The path to the file containing cookies. |

<a name="getNewChat"></a>

## getNewChat() ⇒ <code>Promise.&lt;string&gt;</code>
Initializes a new chat conversation.

**Kind**: global function  
**Returns**: <code>Promise.&lt;string&gt;</code> - The conversation ID of the new chat.  
**Throws**:

- <code>Error</code> If the creation of a new conversation fails.

<a name="checkConversionId"></a>

## checkConversionId()
Checks if there is an active conversation ID, and if not, creates a new chat.

**Kind**: global function  
<a name="chat"></a>

## chat(text, currentConversionID, temperature, truncate, max_new_tokens, top_p, repetition_penalty, top_k, return_full_text, stream, use_cache, is_retry) ⇒ [<code>Promise.&lt;ChatResponse&gt;</code>](#ChatResponse)
Initiates a chat with the provided text.

**Kind**: global function  
**Returns**: [<code>Promise.&lt;ChatResponse&gt;</code>](#ChatResponse) - An object containing conversation details.  
**Throws**:

- <code>Error</code> If there is an issue with the chat request.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| text | <code>string</code> |  | The user's input text or prompt. |
| currentConversionID | <code>string</code> |  | The conversation ID for the current chat. |
| temperature | <code>number</code> | <code>0.1</code> | Temperature for text generation. |
| truncate | <code>number</code> | <code>1000</code> | Maximum number of tokens in the generated response. |
| max_new_tokens | <code>number</code> | <code>2048</code> | Maximum number of new tokens to generate. |
| top_p | <code>number</code> | <code>0.95</code> | Top-p value for text generation. |
| repetition_penalty | <code>number</code> | <code>1.2</code> | Repetition penalty for generated text. |
| top_k | <code>number</code> | <code>50</code> | Top-k value for text generation. |
| return_full_text | <code>boolean</code> | <code>false</code> | Whether to return the full text of the conversation. |
| stream | <code>boolean</code> | <code>true</code> | Whether to use streaming for text generation. |
| use_cache | <code>boolean</code> | <code>false</code> | Whether to use cached results for text generation. |
| is_retry | <code>boolean</code> | <code>false</code> | Whether the request is a retry. |

<a name="summarizeConversation"></a>

## summarizeConversation(conversation_id) ⇒ <code>Promise.&lt;any&gt;</code>
Summarizes the conversation based on its conversation ID.

**Kind**: global function  
**Returns**: <code>Promise.&lt;any&gt;</code> - A Promise that resolves to the summarized conversation.  
**Throws**:

- <code>Error</code> If there is an issue summarizing the conversation.


| Param | Type | Description |
| --- | --- | --- |
| conversation_id | <code>string</code> | The conversation ID to summarize. |

<a name="preserveContext"></a>

## preserveContext(newChat) ⇒ <code>Promise.&lt;Response&gt;</code>
Preserves the context of the current chat conversation.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Response&gt;</code> - A Promise that resolves to the response from preserving chat context.  
**Throws**:

- <code>Error</code> If there is an issue preserving chat context.


| Param | Type | Description |
| --- | --- | --- |
| newChat | <code>boolean</code> | Indicates if a new chat is being preserved. |

<a name="ChatResponse"></a>

## ChatResponse
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | conversation ID |
| stream | <code>ReadableStream</code> \| <code>undefined</code> | Get stream response |
| completeResponsePromise | <code>completeResponsePromise</code> | Get complete response |

