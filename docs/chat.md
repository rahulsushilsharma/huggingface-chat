## Functions

<dl>
<dt><a href="#intialize">intialize()</a> ⇒ <code>Promise.&lt;void&gt;</code></dt>
<dd><p>Initializes the ChatBot instance.</p>
</dd>
<dt><a href="#switchModel">switchModel(value)</a></dt>
<dd><p>Switches the current model for the chat.</p>
</dd>
<dt><a href="#listAvilableModels">listAvilableModels()</a> ⇒ <code>Array.&lt;Model&gt;</code></dt>
<dd><p>Lists available models that can be used with the chat.</p>
</dd>
<dt><a href="#listAvilableSesson">listAvilableSesson()</a> ⇒ <code>Array.&lt;Sesson&gt;</code></dt>
<dd><p>Lists available sessions for the chat.</p>
</dd>
<dt><a href="#showCurrentModel">showCurrentModel()</a> ⇒ <code>Model</code> | <code>null</code></dt>
<dd><p>Returns the currently selected model for the chat.</p>
</dd>
<dt><a href="#getRemoteConversations">getRemoteConversations()</a> ⇒ <code>Promise.&lt;Array.&lt;Sesson&gt;&gt;</code></dt>
<dd><p>Fetches remote conversations from a server.</p>
</dd>
<dt><a href="#getRemoteLlms">getRemoteLlms()</a> ⇒ <code>Promise.&lt;Array.&lt;Model&gt;&gt;</code></dt>
<dd><p>Fetches remote LLMs from a server.</p>
</dd>
<dt><a href="#getNewChat">getNewChat()</a> ⇒ <code>Promise.&lt;Conversation&gt;</code></dt>
<dd><p>Initializes a new chat conversation.</p>
</dd>
<dt><a href="#chat">chat(text, currentConversionID)</a> ⇒ <code>Promise.&lt;ChatResponse&gt;</code></dt>
<dd><p>Initiates a chat with the provided text.</p>
</dd>
<dt><a href="#getConversationHistory">getConversationHistory()</a> ⇒ <code>Promise.&lt;Conversation&gt;</code></dt>
<dd><p>get the details of current conversation</p>
</dd>
</dl>

<a name="intialize"></a>

## intialize() ⇒ <code>Promise.&lt;void&gt;</code>
Initializes the ChatBot instance.

**Kind**: global function  
<a name="switchModel"></a>

## switchModel(value)
Switches the current model for the chat.

**Kind**: global function  
**Throws**:

- <code>Error</code> If the provided model ID is not a string or if the model is not found.


| Param | Type | Description |
| --- | --- | --- |
| value | <code>string</code> | The ID of the model to switch to. |

<a name="listAvilableModels"></a>

## listAvilableModels() ⇒ <code>Array.&lt;Model&gt;</code>
Lists available models that can be used with the chat.

**Kind**: global function  
**Returns**: <code>Array.&lt;Model&gt;</code> - An array of available model names.  
<a name="listAvilableSesson"></a>

## listAvilableSesson() ⇒ <code>Array.&lt;Sesson&gt;</code>
Lists available sessions for the chat.

**Kind**: global function  
**Returns**: <code>Array.&lt;Sesson&gt;</code> - An array of available sessions.  
<a name="showCurrentModel"></a>

## showCurrentModel() ⇒ <code>Model</code> \| <code>null</code>
Returns the currently selected model for the chat.

**Kind**: global function  
**Returns**: <code>Model</code> \| <code>null</code> - The current model.  
<a name="getRemoteConversations"></a>

## getRemoteConversations() ⇒ <code>Promise.&lt;Array.&lt;Sesson&gt;&gt;</code>
Fetches remote conversations from a server.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Array.&lt;Sesson&gt;&gt;</code> - A promise that resolves to an array of fetched conversations.  
**Throws**:

- <code>Error</code> If the server response is not successful.

<a name="getRemoteLlms"></a>

## getRemoteLlms() ⇒ <code>Promise.&lt;Array.&lt;Model&gt;&gt;</code>
Fetches remote LLMs from a server.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Array.&lt;Model&gt;&gt;</code> - A promise that resolves to an array of fetched conversations.  
**Throws**:

- <code>Error</code> If the server response is not successful.

<a name="getNewChat"></a>

## getNewChat() ⇒ <code>Promise.&lt;Conversation&gt;</code>
Initializes a new chat conversation.

**Kind**: global function  
**Returns**: <code>Promise.&lt;Conversation&gt;</code> - The conversation ID of the new chat.  
**Throws**:

- <code>Error</code> If the creation of a new conversation fails.

<a name="chat"></a>

## chat(text, currentConversionID) ⇒ <code>Promise.&lt;ChatResponse&gt;</code>
Initiates a chat with the provided text.

**Kind**: global function  
**Returns**: <code>Promise.&lt;ChatResponse&gt;</code> - An object containing conversation details.  
**Throws**:

- <code>Error</code> If there is an issue with the chat request.


| Param | Type | Description |
| --- | --- | --- |
| text | <code>string</code> | The user's input text or prompt. |
| currentConversionID | <code>string</code> | The conversation ID for the current chat. |

<a name="getConversationHistory"></a>

## getConversationHistory() ⇒ <code>Promise.&lt;Conversation&gt;</code>
get the details of current conversation

**Kind**: global function  
**Returns**: <code>Promise.&lt;Conversation&gt;</code> - A Promise that return conversation details  
**Throws**:

- <code>Error</code> If there is an api error

