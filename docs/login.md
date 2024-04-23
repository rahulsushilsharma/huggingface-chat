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

