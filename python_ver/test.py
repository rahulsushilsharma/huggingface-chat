# from .hugchat  import hugchat
import requests
import os
import json
import logging
import re
from requests import Session
import requests
import json
import os
import datetime
import logging
import typing
import traceback
from typing import Union, List, Dict

from requests.sessions import RequestsCookieJar


from dataclasses import dataclass

from typing import Generator, Union

import json
class ModelOverloadedError(Exception):
    """
    HF Model Overloaded Error

    Raised when hf return response `{"error":"Model is overloaded", "error_type":"overloaded"}`
    """
    pass


class ChatBotInitError(Exception):
    """
    ChatBot Init Error

    Raised when chatbot init failed
    """
    pass


class CreateConversationError(Exception):
    """
    Create Conversation Error

    Raised when create conversation failed
    """
    pass


class InvalidConversationIDError(Exception):
    """
    Invalid Conversation ID Error

    Raised when using a invalid conversation id
    """
    pass


class DeleteConversationError(Exception):
    """
    Delete Conversation Error

    Raised when delete conversation failed
    """
    pass


class ChatError(Exception):
    """
    Chat Error

    Raised when chat failed
    """
    pass


class Login:
    
    def __init__(self, email: str, passwd: str = "") -> None:
        self.DEFAULT_PATH_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "usercookies")
        self.DEFAULT_COOKIE_PATH = self.DEFAULT_PATH_DIR + os.path.join(f"{email}.json")

        self.email: str = email
        self.passwd: str = passwd
        self.headers = {
            "Referer": "https://huggingface.co/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.64",
        }
        self.cookies = requests.sessions.RequestsCookieJar()

    def login(self, cookie_dir_path: str = None, save_cookies: bool = False) -> requests.sessions.RequestsCookieJar:
        '''
        Login to huggingface.co with given email and password.
        - If cookie_dir_path is given, load cookies from the path. If path is not exist, raise an exception.
        - If save_cookies is True, save cookies to the givev path (if cookie_dir_path is not given, save to default path `./usercookies`).
        - Return cookies if login success, otherwise raise an exception.
        '''
        
        if not cookie_dir_path:
            cookie_dir_path = self.DEFAULT_PATH_DIR

        # validate cookies content before use
        if os.path.exists(cookie_dir_path) and os.path.exists(self._get_cookie_path(cookie_dir_path)):
            with open(self._get_cookie_path(cookie_dir_path),'r+') as f_cookies:
                cookies = json.load(f_cookies)
                try:
                    list(cookies.keys()).index('token')
                    list(cookies.keys()).index('hf-chat')
                    return self.load_cookies(cookie_dir_path)
                except Exception as e:
                    print('error during validating cookies')

        self._sign_in_with_email()
        location = self._get_auth_url()
        if self._grant_auth(location):
            if save_cookies:
                self.save_cookies(cookie_dir_path)
            return self.cookies
        else:
            raise Exception(f"Grant auth fatal, please check your email or password\ncookies gained: \n{self.cookies}")
        
    def save_cookies(self, cookie_dir_path: str = './usercookies') -> str:
        '''
        cookies will be saved into: cookie_dir_path/<email>.json
        '''
        return self.saveCookiesToDir(cookie_dir_path)
        
    def saveCookiesToDir(self, cookie_dir_path: str = './usercookies') -> str:
        """
        alias of save_cookies
        """
        cookie_dir_path = self.DEFAULT_PATH_DIR if not cookie_dir_path else cookie_dir_path
        if not cookie_dir_path.endswith("/"):
            cookie_dir_path += "/"
        cookie_path = cookie_dir_path + f"{self.email}.json"
        if not os.path.exists(cookie_dir_path):
            logging.info("Cookie directory not exist, creating...")
            os.makedirs(cookie_dir_path)
        logging.info(f"Cookie store path: {cookie_path}")

        with open(cookie_path, "w", encoding="utf-8") as f:
            f.write(json.dumps(self.cookies.get_dict()))
        return cookie_path
    
    def load_cookies(self, cookie_dir_path: str = './usercookies') -> requests.sessions.RequestsCookieJar:
        '''
        cookies will be loaded from: cookie_dir_path/<email>.json
        '''
        return self.loadCookiesFromDir(cookie_dir_path)
    
    def loadCookiesFromDir(self, cookie_dir_path: str = './usercookies') -> requests.sessions.RequestsCookieJar:
        """
        alias of load_cookies
        """
        cookie_dir_path = self.DEFAULT_PATH_DIR if not cookie_dir_path else cookie_dir_path
        cookie_path = self._get_cookie_path(cookie_dir_path)
        if not cookie_path:
            raise Exception(f"Cookie not found. please check the path given: {cookie_dir_path}.\n" +
                            f"Cookie file must be named like this: 'your_email'+'.json': '{self.email}.json'")

        with open(cookie_path, "r", encoding="utf-8") as f:
            try:
                js = json.loads(f.read())
                for i in js.keys():
                    self.cookies.set(i, js[i])
                    logging.info(f"{i} loaded")
                return self.cookies
            except:
                raise Exception("load cookies from files fatal. Please check the format")
    
    def _request_get(self, url: str, params=None, allow_redirects=True) -> requests.Response:
        res = requests.get(
            url,
            params=params,
            headers=self.headers,
            cookies=self.cookies,
            allow_redirects=allow_redirects,
        )
        self._refresh_cookies(res.cookies)
        return res

    def _request_post(self, url: str, headers=None, params=None, data=None, stream=False,
                     allow_redirects=True) -> requests.Response:
        res = requests.post(
            url,
            stream=stream,
            params=params,
            data=data,
            headers=self.headers if headers is None else headers,
            cookies=self.cookies,
            allow_redirects=allow_redirects
        )
        self._refresh_cookies(res.cookies)
        return res

    def _refresh_cookies(self, cookies: requests.sessions.RequestsCookieJar):
        dic = cookies.get_dict()
        for i in dic:
            self.cookies.set(i, dic[i])

    def _sign_in_with_email(self):
        """
        Login through your email and password.
        PS: I found that it doesn't have any type of encryption till now,
        which could expose your password to the internet.
        """
        url = "https://huggingface.co/login"
        data = {
            "username": self.email,
            "password": self.passwd,
        }
        res = self._request_post(url=url, data=data, allow_redirects=False)
        if res.status_code == 400:
            raise Exception("wrong username or password")

    def _get_auth_url(self):
        url = "https://huggingface.co/chat/login"
        headers = {
            "Referer": "https://huggingface.co/chat/login",
            "User-Agent": self.headers["User-Agent"],
            "Content-Type": "application/x-www-form-urlencoded"
        }
        res = self._request_post(url, headers=headers, allow_redirects=False)
        if res.status_code == 200:
            # location = res.headers.get("Location", None)
            location = res.json()["location"]
            if location:
                return location
            else:
                raise Exception("No authorize url found, please check your email or password.")
        elif res.status_code == 303:
            location = res.headers.get("Location")
            if location:
                return location
            else:
                raise Exception("No authorize url found, please check your email or password.")
        else:
            raise Exception("Something went wrong!")

    def _grant_auth(self, url: str) -> int:
        res = self._request_get(url, allow_redirects=False)
        if res.headers.__contains__("location"):
            location = res.headers["location"]
            res = self._request_get(location, allow_redirects=False)
            if res.cookies.__contains__("hf-chat"):
                return 1
        # raise Exception("grantAuth fatal")
        if res.status_code != 200:
            raise Exception("grant auth fatal!")
        csrf = re.findall('/oauth/authorize.*?name="csrf" value="(.*?)"', res.text)
        if len(csrf) == 0:
            raise Exception("No csrf found!")
        data = {
            "csrf": csrf[0]
        }

        res = self._request_post(url, data=data, allow_redirects=False)
        if res.status_code != 303:
            raise Exception(f"get hf-chat cookies fatal! - {res.status_code}")
        else:
            location = res.headers.get("Location")
        res = self._request_get(location, allow_redirects=False)
        if res.status_code != 302:
            raise Exception(f"get hf-chat cookie fatal! - {res.status_code}")
        else:
            return 1

    def _get_cookie_path(self, cookie_dir_path) -> str:
        if not cookie_dir_path.endswith("/"):
            cookie_dir_path += "/"
        if not os.path.exists(cookie_dir_path):
            return ""
        files = os.listdir(cookie_dir_path)
        for i in files:
            if i == f"{self.email}.json":
                return cookie_dir_path + i
        return ""






RESPONSE_TYPE_FINAL = "finalAnswer"
RESPONSE_TYPE_STREAM = "stream"
RESPONSE_TYPE_WEB = "webSearch"
RESPONSE_TYPE_STATUS = "status"
MSGTYPE_ERROR = "error"

MSGSTATUS_PENDING = 0
MSGSTATUS_RESOLVED = 1
MSGSTATUS_REJECTED = 2


class WebSearchSource:
    title: str
    link: str
    hostname: str

    def __str__(self):
        return json.dumps({
            "title": self.title,
            "link": self.link,
            "hostname": self.hostname,
        })


class Message(Generator):
    """
    :Args:
        * g: Generator
        * _stream_yield_all: bool = False
        * web_search: bool = False
        - web_search_sources: list[WebSearchSource] = list()
        - text: str = ""
        - web_search_done: bool = not web_search
        - msg_status: int = MSGSTATUS_PENDING
        - error: Union[Exception, None] = None

    A wrapper of `Generator` that receives and process the response

    :Example:
    .. code-block:: python

        msg = bot.chat(...)

        # stream process
        for res in msg:
            ... # process
        else:
            if msg.done() == MSGSTATUS_REJECTED:
                raise msg.error

        # or simply use:
        final = msg.wait_until_done()
    """

    g: Generator
    _stream_yield_all: bool = False
    web_search: bool = False

    web_search_sources: list = []
    text: str = ""  # For backward compatibility, we have to reserve the `text` field.
    web_search_done: bool = not web_search
    msg_status: int = MSGSTATUS_PENDING
    error: Union[Exception, None] = None

    def __init__(
        self,
        g: Generator,
        _stream_yield_all: bool = False,
        web_search: bool = False,
    ) -> None:
        self.g = g
        self._stream_yield_all = _stream_yield_all
        self.web_search = web_search

    def _filterResponse(self, obj: dict):
        if not obj.__contains__("type"):
            if obj.__contains__("message"):
                raise ChatError(f"Server returns an error: {obj['message']}")
            else:
                raise ChatError(f"No `type` and `message` returned: {obj}")

    def __next__(self) -> dict:
        if self.msg_status == MSGSTATUS_RESOLVED:
            raise StopIteration
        elif self.msg_status == MSGSTATUS_REJECTED:
            if self.error is not None:
                raise self.error
            else:
                raise Exception(
                    "Message stauts is `Rejected` but no error found")

        try:
            a: dict = next(self.g)
            self._filterResponse(a)
            t: str = a["type"]
            message_type: str = ""
            if t == RESPONSE_TYPE_FINAL:
                self.text = a["text"]
                self.msg_status = MSGSTATUS_RESOLVED
            elif t == RESPONSE_TYPE_WEB:
                # gracefully pass unparseable webpages
                if message_type != MSGTYPE_ERROR and a.__contains__("sources"):
                    self.web_search_sources.clear()
                    sources = a["sources"]
                    for source in sources:
                        wss = WebSearchSource()
                        wss.title = source["title"]
                        wss.link = source["link"]
                        wss.hostname = source["hostname"]
                        self.web_search_sources.append(wss)
            elif "messageType" in a:
                message_type: str = a["messageType"]
                if message_type == MSGTYPE_ERROR:
                    self.error = ChatError(a["message"])
                    self.msg_status = MSGSTATUS_REJECTED
                if t == RESPONSE_TYPE_STREAM:
                    self.web_search_done = True
                elif t == RESPONSE_TYPE_STATUS:
                    pass
            else:
                if "Model is overloaded" in str(a):
                    self.error = ModelOverloadedError(
                        "Model is overloaded, please try again later or switch to another model."
                    )
                    self.msg_status = MSGSTATUS_REJECTED
                elif a.__contains__(MSGTYPE_ERROR):
                    self.error = ChatError(a[MSGTYPE_ERROR])
                    self.msg_status = MSGSTATUS_REJECTED
                else:
                    self.error = ChatError(f"Unknown json response: {a}")

            # If _stream_yield_all is True, yield all responses from the server.
            if self._stream_yield_all or t == RESPONSE_TYPE_STREAM:
                return a
            else:
                return self.__next__()
        except StopIteration:
            if self.msg_status == MSGSTATUS_PENDING:
                self.error = ChatError(
                    "Stream of responses has abruptly ended (final answer has not been received)."
                )
                raise self.error
            pass
        except Exception as e:
            # print("meet error: ", str(e))
            self.error = e
            self.msg_status = MSGSTATUS_REJECTED
            raise self.error

    def __iter__(self):
        return self

    def throw(
        self,
        __typ,
        __val=None,
        __tb=None,
    ):
        return self.g.throw(__typ, __val, __tb)

    def send(self, __value):
        return self.g.send(__value)

    def get_final_text(self) -> str:
        """
        :Return:
            - self.text
        """
        return self.text

    def get_search_sources(self) -> list:
        """
        :Return:
            - self.web_search_sources
        """
        return self.web_search_sources

    def search_enabled(self) -> bool:
        """
        :Return:
            - self.web_search
        """
        return self.web_search

    def wait_until_done(self) -> str:
        """
        :Return:
            - self.text if resolved else raise error

        wait until every response is resolved
        """
        while not self.is_done():
            self.__next__()
        if self.is_done() == MSGSTATUS_RESOLVED:
            return self.text
        elif self.error is not None:
            raise self.error
        else:
            raise Exception("Rejected but no error captured!")

    def is_done(self):
        """
        :Return:
            - self.msg_status

        3 status:
        - MSGSTATUS_PENDING = 0    # running
        - MSGSTATUS_RESOLVED = 1   # done with no error(maybe?)
        - MSGSTATUS_REJECTED = 2   # error raised
        """
        return self.msg_status

    def is_done_search(self):
        """
        :Return:
            - self.web_search_done

        web search result will be set to `done` once the token is received
        """
        return self.web_search_done

    def __str__(self):
        return self.wait_until_done()

    def __getitem__(self, key: str) -> str:
        print("_getitem_")
        self.wait_until_done()
        print("done")
        if key == "text":
            return self.text
        elif key == "web_search":
            return self.web_search
        elif key == "web_search_sources":
            return self.web_search_sources

    def __add__(self, other: str) -> str:
        self.wait_until_done()
        return self.text + other

    def __radd__(self, other: str) -> str:
        self.wait_until_done()
        return other + self.text

    def __iadd__(self, other: str) -> str:
        self.wait_until_done()
        self.text += other
        return self.text




@dataclass
class Assistant:
    assistant_id: str
    author: str
    name: str
    model_name: str
    pre_prompt: str
    description: str 

@dataclass
class MessageNode:
    '''
    huggingchat message node, currently only maintain id, role, date and content.
    '''
    id: str
    role: str # "user", "system", or "assistant"
    content: str
    created_at: float # timestamp
    updated_at: float # timestamp
    def __str__(self) -> str:
        print(f"MessageNode(id={self.id}, role={self.role}, content={self.content}, created_at={self.created_at}, updated_at={self.updated_at})")

        return f"MessageNode(id={self.id}, role={self.role}, content={self.content}, created_at={self.created_at}, updated_at={self.updated_at})"

class Conversation:
    def __init__(
        self,
        id: str = None,
        title: str = None,
        model: 'Model' = None,
        system_prompt: str = None,
        history: list = []
    ):
        """
        Returns a conversation object
        """

        self.id: str = id
        self.title: str = title
        self.model = model
        self.system_prompt: str = system_prompt
        self.history: list = history

    def __str__(self) -> str:
        return self.id

class Model:
    def __init__(
        self,
        id: str = None,
        name: str = None,
        displayName: str = None,
        preprompt: str = None,
        promptExamples: list = None,
        websiteUrl: str = None,
        description: str = None,
        datasetName: str = None,
        datasetUrl: str = None,
        modelUrl: str = None,
        parameters: dict = None,
    ):
        """
        Returns a model object
        """

        self.id: str = id
        self.name: str = name
        self.displayName: str = displayName

        self.preprompt: str = preprompt
        self.promptExamples: list = promptExamples
        self.websiteUrl: str = websiteUrl
        self.description: str = description

        self.datasetName: str = datasetName
        self.datasetUrl: str = datasetUrl
        self.modelUrl: str = modelUrl
        self.parameters: dict = parameters

    def __str__(self) -> str:
        return self.id

# we need to keep this for backward compatibility, because some people may use it.
conversation = Conversation
model = Model

class ChatBot:
    cookies: dict
    """Cookies for authentication"""

    session: Session
    """HuggingChat session"""

    def __init__(
        self,
        cookies: Union[dict, None, RequestsCookieJar] = None,
        cookie_path: str = "",
        default_llm: Union[int, str] = 0,
        system_prompt: str = "",
    ) -> None:
        """
        Returns a ChatBot object
        default_llm: name or index
        """
        if cookies is None and cookie_path == "":
            raise exceptions.ChatBotInitError(
                "Authentication is required now, but no cookies provided. See tutorial at https://github.com/Soulter/hugging-chat-api"
            )
        elif cookies is not None and cookie_path != "":
            raise exceptions.ChatBotInitError("Both cookies and cookie_path provided")

        if cookies is None and cookie_path != "":
            # read cookies from path
            if not os.path.exists(cookie_path):
                raise exceptions.ChatBotInitError(
                    f"Cookie file {cookie_path} not found. Note: The file must be in JSON format and must contain a list of cookies. See more at https://github.com/Soulter/hugging-chat-api"
                )
            with open(cookie_path, "r", encoding="utf-8") as f:
                cookies = json.load(f)

        # convert cookies to KV format
        if isinstance(cookies, list):
            cookies = {cookie["name"]: cookie["value"] for cookie in cookies}

        self.cookies = cookies
        print(json.dumps(self.cookies))

        self.hf_base_url = "https://huggingface.co"
        print(json.dumps(self.hf_base_url))

        self.json_header = {"Content-Type": "application/json"}
        print(json.dumps(self.json_header))

        self.session = self.get_hc_session()
        print(json.dumps(self.session))

        self.conversation_list = []
        print(json.dumps(self.conversation_list))

        self.accepted_welcome_modal = (
            False  # It is no longer required to accept the welcome modal
        )

        self.llms = self.get_remote_llms()
        print(json.dumps(self.llms))

        if isinstance(default_llm, str):
            self.active_model = self.get_llm_from_name(default_llm)
            if self.active_model is None:
                raise Exception(
                    f"Given model is not in llms list. LLM list: {[model.id for model in self.llms]}"
                )
        else:
            self.active_model = self.llms[default_llm]
        
        print(json.dumps(self.active_model))

        self.current_conversation = self.new_conversation(system_prompt=system_prompt)
        print(json.dumps(self.current_conversation))

    def get_hc_session(self) -> Session:
        session = Session()
        # set cookies
        session.cookies.update(self.cookies)
        session.get(self.hf_base_url + "/chat")
        print(session)
        return session

    def get_headers(self, ref=True, ref_cid: Conversation = None) -> dict:
        _h = {
            "Accept": "*/*",
            "Connection": "keep-alive",
            "Host": "huggingface.co",
            "Origin": "https://huggingface.co",
            "Sec-Fetch-Site": "same-origin",
            "Content-Type": "application/json",
            "Sec-Ch-Ua-Platform": "Windows",
            "Sec-Ch-Ua": 'Chromium";v="116", "Not)A;Brand";v="24", "Microsoft Edge";v="116',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Dest": "empty",
            "Accept-Encoding": "gzip, deflate, br",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
        }

        if ref:
            if ref_cid is None:
                ref_cid = self.current_conversation
            _h["Referer"] = f"https://huggingface.co/chat/conversation/{ref_cid}"
        return _h

    def get_cookies(self) -> dict:
        return self.session.cookies.get_dict()

    # NOTE: To create a copy when calling this, call it inside of list().
    #       If not, when updating or altering the values in the variable will
    #       also be applied to this class's variable.
    #       This behavior is with any function returning self.<var_name>. It
    #       acts as a pointer to the data in the object.
    #
    # Returns a pointer to this objects list that contains id of conversations.
    def get_conversation_list(self) -> list:
        return list(self.conversation_list)

    def get_active_llm_index(self) -> int:
        return self.llms.index(self.active_model)

    def accept_ethics_modal(self):
        """
        [Deprecated Method]
        """
        response = self.session.post(
            self.hf_base_url + "/chat/settings",
            headers=self.get_headers(ref=False),
            cookies=self.get_cookies(),
            allow_redirects=True,
            data={
                "ethicsModalAccepted": "true",
                "shareConversationsWithModelAuthors": "true",
                "ethicsModalAcceptedAt": "",
                "activeModel": str(self.active_model),
            },
        )

        if response.status_code != 200:
            raise Exception(
                f"Failed to accept ethics modal with status code: {response.status_code}. {response.content.decode()}"
            )

        return True

    def new_conversation(
        self, 
        modelIndex: int = None, 
        system_prompt: str = "", 
        switch_to: bool = False,
        assistant: Union[str, Assistant] = None,
    ) -> Conversation:
        """
        Create a new conversation. Return a conversation object. 
        
        modelIndex: int, get it from get_available_llm_models(). If None, use the default model.
        assistant: str or Assistant, the assistant **id** or assistant object. Use search_assistant() to get the assistant object.
        
        - You should change the conversation by calling change_conversation() after calling this method. Or set param switch_to to True.
        - if you use assistant, the parameter `system_prompt` will be ignored.
        
        """
        err_count = 0

        if modelIndex is None:
            model = self.active_model
        else:
            if modelIndex < 0 or modelIndex >= len(self.llms):
                raise IndexError("Out of range of llm index")

            model = self.llms[modelIndex]

        # Accept the welcome modal when init.
        # 17/5/2023: This is not required anymore.
        # if not self.accepted_welcome_modal:
        #     self.accept_ethics_modal()

        # Create new conversation and get a conversation id.

        _header = self.get_headers(ref=False)
        _header["Referer"] = "https://huggingface.co/chat"
        
        request = {
            "model": model.id,
        }
        
        # get assistant id
        if assistant is not None:
            assistant_id = None
            if isinstance(assistant, str):
                assistant_id = assistant
            elif isinstance(assistant, Assistant):
                assistant_id = assistant.assistant_id
            else:
                raise ValueError("param assistant must be a string or Assistant object.")
            request["assistantId"] = assistant_id
        else:
            request["preprompt"] = system_prompt if system_prompt != "" else model.preprompt

        while True:
            try:
                resp = self.session.post(
                    self.hf_base_url + "/chat/conversation",
                    json=request,
                    headers=_header,
                    cookies=self.get_cookies(),
                )

                logging.debug(resp.text)
                cid = json.loads(resp.text)["conversationId"]

                c = Conversation(id=cid, system_prompt=system_prompt, model=model)

                self.conversation_list.append(c)
                if switch_to:
                    self.change_conversation(c)
                
                # we need know the root message id (a.k.a system prompt message id).
                self.get_conversation_info(c)

                return c

            except BaseException as e:
                err_count += 1
                logging.debug(
                    f" Failed to create new conversation ({e}). Retrying... ({err_count})"
                )
                if err_count > 5:
                    raise exceptions.CreateConversationError(
                        f"Failed to create new conversation with status code: {resp.status_code}. Error: {e}. Retries: {err_count}."
                    )
                continue

    def change_conversation(self, conversation_object: Conversation):
        """
        Change the current conversation to another one.
        """

        local_conversation = self.get_conversation_from_id(conversation_object.id)

        if local_conversation is None:
            raise exceptions.InvalidConversationIDError(
                "Invalid conversation id, not in conversation list."
            )
            
        self.get_conversation_info(local_conversation)

        self.current_conversation = local_conversation

    def share_conversation(self, conversation_object: Conversation = None) -> str:
        """
        Return a share link of the conversation.
        """
        if conversation_object is None:
            conversation_object = self.current_conversation

        headers = self.get_headers()

        r = self.session.post(
            f"{self.hf_base_url}/chat/conversation/{conversation_object}/share",
            headers=headers,
            cookies=self.get_cookies(),
        )

        if r.status_code != 200:
            raise Exception(
                f"Failed to share conversation with status code: {r.status_code}"
            )

        response = r.json()
        if "url" in response:
            return response["url"]

        raise Exception(f"Unknown server response: {response}")

    def delete_all_conversations(self) -> None:
        """
        Deletes ALL conversations on the HuggingFace account
        """

        settings = {"": ("", "")}

        r = self.session.post(
            f"{self.hf_base_url}/chat/conversations?/delete",
            headers={"Referer": "https://huggingface.co/chat"},
            cookies=self.get_cookies(),
            allow_redirects=True,
            files=settings,
        )

        if r.status_code != 200:
            raise exceptions.DeleteConversationError(
                f"Failed to delete ALL conversations with status code: {r.status_code}"
            )

        self.conversation_list = []
        self.current_conversation = None

    def delete_conversation(self, conversation_object: Conversation = None) -> None:
        """
        Delete a HuggingChat conversation by conversation.
        """

        if conversation_object is None:
            conversation_object = self.current_conversation

        headers = self.get_headers()

        r = self.session.delete(
            f"{self.hf_base_url}/chat/conversation/{conversation_object}",
            headers=headers,
            cookies=self.get_cookies(),
        )

        if r.status_code != 200:
            raise exceptions.DeleteConversationError(
                f"Failed to delete conversation with status code: {r.status_code}"
            )
        else:
            self.conversation_list.pop(
                self.get_conversation_from_id(conversation_object.id, return_index=True)
            )

            if conversation_object is self.current_conversation:
                self.current_conversation = None

    def get_available_llm_models(self) -> list:
        """
        Get all available models that are available in huggingface.co/chat.
        """
        return self.llms

    def set_share_conversations(self, val: bool = True):
        """
        Sets the "Share Conversation with Model Authors setting" to the given val variable
        """
        settings = {"shareConversationsWithModelAuthors": ("", "on" if val else "")}

        r = self.session.post(
            self.hf_base_url + "/chat/settings",
            headers={"Referer": "https://huggingface.co/chat"},
            cookies=self.get_cookies(),
            allow_redirects=True,
            files=settings,
        )

        if r.status_code != 200:
            raise Exception(
                f"Failed to set share conversation with status code: {r.status_code}"
            )

    def switch_llm(self, index: int) -> bool:
        """
        Attempts to change current conversation's Large Language Model.
        Requires an index to indicate the model you want to switch.
        See self.llms for available models.

        Note: 1. The effect of switch is limited to the current conversation,
        You can manually switch the llm when you start a new conversation.

        2. Only works *after creating a new conversation.*
        :)
        """
        # TODO: I will work on making it have a model for each conversation that is changeable. - @Zekaroni

        if index < len(self.llms) and index >= 0:
            self.active_model = self.llms[index]
            return True
        else:
            raise IndexError("Out of range of llm index")

    def get_llm_from_name(self, name: str) -> Union[Model, None]:
        for model in self.llms:
            if model.name == name:
                return model

    # Gives information such as name, websiteUrl, description, displayName, parameters, etc.
    # We can use it in the future if we need to get information about models
    def get_remote_llms(self) -> list:
        """
        Fetches all possible LLMs that could be used. Returns the LLMs in a list
        """

        r = self.session.post(
            self.hf_base_url + "/chat/__data.json",
            headers=self.get_headers(ref=False),
            cookies=self.get_cookies(),
        )

        if r.status_code != 200:
            raise Exception(
                f"Failed to get remote LLMs with status code: {r.status_code}"
            )

        data = r.json()["nodes"][0]["data"]
        modelsIndices = data[data[0]["models"]]
        model_list = []

        return_data_from_index = lambda index: None if index == -1 else data[index]

        for modelIndex in modelsIndices:
            model_data = data[modelIndex]

            # Model is unlisted, skip it
            if data[model_data["unlisted"]]:
                continue

            m = Model(
                id=return_data_from_index(model_data["id"]),
                name=return_data_from_index(model_data["name"]),
                displayName=return_data_from_index(model_data["displayName"]),
                preprompt=return_data_from_index(model_data["preprompt"]),
                # promptExamples = return_data_from_index(model_data["promptExamples"]),
                websiteUrl=return_data_from_index(model_data["websiteUrl"]),
                description=return_data_from_index(model_data["description"]),
                datasetName=return_data_from_index(model_data["datasetName"]),
                datasetUrl=return_data_from_index(model_data["datasetUrl"]),
                modelUrl=return_data_from_index(model_data["modelUrl"]),
                # parameters = return_data_from_index(model_data["parameters"]),
            )

            prompt_list = return_data_from_index(model_data["promptExamples"])
            if prompt_list is not None:
                _promptExamples = [
                    return_data_from_index(index) for index in prompt_list
                ]
                m.promptExamples = [
                    {"title": data[prompt["title"]], "prompt": data[prompt["prompt"]]}
                    for prompt in _promptExamples
                ]

            indices_parameters_dict = return_data_from_index(model_data["parameters"])
            out_parameters_dict = {}
            for key, value in indices_parameters_dict.items():
                if value == -1:
                    out_parameters_dict[key] = None
                    continue

                if isinstance(type(data[value]), list):
                    out_parameters_dict[key] = [data[index] for index in data[value]]
                    continue

                out_parameters_dict[key] = data[value]

            m.parameters = out_parameters_dict

            model_list.append(m)

        return model_list

    def get_remote_conversations(self, replace_conversation_list=True):
        """
        Returns all the remote conversations for the active account. Returns the conversations in a list.
        """

        r = self.session.post(
            self.hf_base_url + "/chat/__data.json",
            headers=self.get_headers(ref=False),
            cookies=self.get_cookies(),
        )

        if r.status_code != 200:
            raise Exception(
                f"Failed to get remote conversations with status code: {r.status_code}"
            )

        data = r.json()["nodes"][0]["data"]
        conversationIndices = data[data[0]["conversations"]]
        conversations = []

        for index in conversationIndices:
            conversation_data = data[index]
            c = Conversation(
                id=data[conversation_data["id"]],
                title=data[conversation_data["title"]],
                model=data[conversation_data["model"]],
            )

            conversations.append(c)

        if replace_conversation_list:
            self.conversation_list = conversations

        return conversations

    def get_conversation_info(self, conversation: Conversation = None) -> Conversation:
        """
        Fetches information related to the specified conversation. Returns the conversation object.
        """

        if conversation is None:
            conversation = self.current_conversation

        r = self.session.post(
            self.hf_base_url + f"/chat/conversation/{conversation.id}/__data.json",
            headers=self.get_headers(ref=False),
            cookies=self.get_cookies(),
        )

        if r.status_code != 200:
            raise Exception(
                f"Failed to get conversation info with status code: {r.status_code}"
            )

        data = r.json()["nodes"][1]["data"]

        conversation.model = data[data[0]["model"]]
        conversation.system_prompt = data[data[0]["preprompt"]]
        conversation.title = data[data[0]["title"]]

        messages: list = data[data[0]["messages"]]
        conversation.history = []
        
        # parse all message nodes (history) in the conversation
        for index in messages: # node's index
            _node_meta = data[index]
            conversation.history.append(MessageNode(
                id=data[_node_meta["id"]],
                role=data[_node_meta["from"]],
                content=data[_node_meta["content"]],
                created_at=datetime.datetime.strptime(data[_node_meta["createdAt"]][1], "%Y-%m-%dT%H:%M:%S.%fZ").timestamp(),
                updated_at=datetime.datetime.strptime(data[_node_meta["updatedAt"]][1], "%Y-%m-%dT%H:%M:%S.%fZ").timestamp()
            ))
            
        logging.debug(f"conversation {conversation.id} history: {conversation.history}")

        return conversation

    def get_conversation_from_id(self, conversation_id: str, return_index=False) -> Conversation:
        """
        Returns a conversation object that is already in the conversation list.
        """

        for i, conversation in enumerate(self.conversation_list):
            if conversation.id == conversation_id:
                if return_index:
                    return i
                return conversation
            
    def _parse_assistants(self, nodes_data: list) -> List[Assistant]:
        '''
        parse the assistants data from the response.
        '''
        index = nodes_data[1]
        ret = []
        for i in index:
            attribute_map: dict = nodes_data[i]
            assistant_id = nodes_data[attribute_map['_id']]
            author = nodes_data[attribute_map['createdByName']]
            name = nodes_data[attribute_map['name']].strip()
            model_name = nodes_data[attribute_map['modelId']]
            pre_prompt = nodes_data[attribute_map['preprompt']]
            description = nodes_data[attribute_map['description']]
            ret.append(Assistant(
                assistant_id,
                author,
                name,
                model_name,
                pre_prompt,
                description
            ))
        return ret

    def get_assistant_list_by_page(self, page: int) -> List[Assistant]:
        '''
        get assistant list by page number.
        if page < 0 or page > max_page then return `None`.
        '''
        url_cache = f"https://api.soulter.top/hugchat/assistants/__data.json?p={page}"
        url = f"https://huggingface.co/chat/assistants/__data.json?p={page}&x-sveltekit-invalidated=01"
        try:
            res = requests.get(url_cache, timeout=5)
        except BaseException:
            res = self.session.get(url, timeout=10)
        res = res.json()
        if res['nodes'][1]['type'] == 'error':
            return None
        # here we parse the result
        return self._parse_assistants(res['nodes'][1]['data'])
        
    def search_assistant(self, assistant_name: str = None, assistant_id: str = None) -> Assistant:
        '''
        - Search an available assistant by assistant name or assistant id.
        - Will search on api.soulter.top/hugchat because offifial api doesn't support search.
        - Return the `Assistant` object if found, return None if not found.
        '''
        if not assistant_name and not assistant_id:
            raise ValueError("assistant_name and assistant_id can not be both None.")
        if assistant_name:
            url = f"https://api.soulter.top/hugchat/assistant?name={assistant_name}"
        else:
            url = f"https://api.soulter.top/hugchat/assistant?id={assistant_id}"
        res = requests.get(url, timeout=10)
        if res.status_code != 200:
            raise Exception(f"Failed to search assistant with status code: {res.status_code}, please commit an issue to https://github.com/Soulter/hugging-chat-api/issues")
        res = res.json()
        if not res['data']:
            # empty dict
            return None
        if res['code'] != 0:
            raise Exception(f"Failed to search assistant with server's error: {res['message']}, please commit an issue to https://github.com/Soulter/hugging-chat-api/issues")
        return Assistant(**res['data'])

    def _stream_query(
        self,
        text: str,
        web_search: bool = False,
        temperature: float = 0.1,
        top_p: float = 0.95,
        repetition_penalty: float = 1.2,
        top_k: int = 50,
        truncate: int = 1000,
        watermark: bool = False,
        max_new_tokens: int = 1024,
        stop: list = ["</s>"],
        return_full_text: bool = False,
        use_cache: bool = False,
        is_retry: bool = False,
        retry_count: int = 5,
        _stream_yield_all: bool = False,  # yield all responses from the server.
        conversation: Conversation = None,
    ) -> typing.Generator[dict, None, None]:
        if conversation is None:
            conversation = self.current_conversation

        if retry_count <= 0:
            raise Exception("the parameter retry_count must be greater than 0.")
        if text == "":
            raise Exception("the prompt can not be empty.")
        if len(conversation.history) == 0:
            raise Exception("conversation history is empty, but we need the root message id of this conversation to continue.")  
    
        # get last message id
        last_assistant_message = conversation.history[-1]
        logging.debug(f"conversation {conversation.id} last message id: {last_assistant_message.id}")

        req_json = {
            "files": [],
            "id": last_assistant_message.id,
            "inputs": text,
            "is_continue": False,
            "is_retry": is_retry,
            "web_search": web_search,
        }
        headers = {
            'authority': 'huggingface.co',
            'accept': '*/*',
            'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,en-GB;q=0.6',
            'content-type': 'application/json',
            'origin': 'https://huggingface.co',
            'sec-ch-ua': '"Microsoft Edge";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
        }
        final_answer = {}

        break_flag = False

        while retry_count > 0:
            resp = self.session.post(
                self.hf_base_url + f"/chat/conversation/{conversation}",
                json=req_json,
                stream=True,
                headers=headers,
                cookies=self.session.cookies.get_dict(),
            )
            resp.encoding='utf-8'

            if resp.status_code != 200:
                retry_count -= 1
                if retry_count <= 0:
                    raise exceptions.ChatError(f"Failed to chat. ({resp.status_code})")

            try:
                for line in resp.iter_lines(decode_unicode=True):
                    if not line:
                        continue
                    res = line
                    obj = json.loads(res)
                    if obj.__contains__("type"):
                        _type = obj["type"]

                        if _type == "finalAnswer":
                            final_answer = obj
                            break_flag = True
                            break
                    else:
                        logging.error(f"No `type` found in response: {obj}")
                    yield obj
            except requests.exceptions.ChunkedEncodingError:
                pass
            except BaseException as e:
                traceback.print_exc()
                if "Model is overloaded" in str(e):
                    raise exceptions.ModelOverloadedError(
                        "Model is overloaded, please try again later or switch to another model."
                    )
                logging.debug(resp.headers)
                raise exceptions.ChatError(f"Failed to parse response: {res}")
            if break_flag:
                break
        
        # update the history of current conversation
        self.get_conversation_info(conversation)
        yield final_answer

    def query(
        self,
        text: str,
        web_search: bool = False,
        temperature: float = 0.1,
        top_p: float = 0.95,
        repetition_penalty: float = 1.2,
        top_k: int = 50,
        truncate: int = 1000,
        watermark: bool = False,
        max_new_tokens: int = 1024,
        stop: list = ["</s>"],
        return_full_text: bool = False,
        stream: bool = False,
        _stream_yield_all: bool = False,  # For stream mode, yield all responses from the server.
        use_cache: bool = False,
        is_retry: bool = False,
        retry_count: int = 5,
        conversation: Conversation = None,
    ) -> Message:
        """
        **Deprecated**
        Same as chat now
        """
        if conversation is None:
            conversation = self.current_conversation

        return self.chat(
            text=text,
            web_search=web_search,
            _stream_yield_all=_stream_yield_all,
            retry_count=retry_count,
            conversation=conversation,
        )

    def chat(
        self,
        text: str,
        web_search: bool = False,
        _stream_yield_all: bool = False,  # For stream mode, yield all responses from the server.
        retry_count: int = 5,
        conversation: Conversation = None,
        *args,
        **kvargs,
    ) -> Message:
        """
        Send a message to the current conversation. Return a Message object.
        
        You can turn on the web search by set the parameter `web_search` to True

        Stream is now the default mode, you can call Message.wait_until_done()

        About class `Message`:
        - `wait_until_done()`: Block until the response done processing or an error raised.
        - `__iter__()`: For loop call this Generator and get response.
        - `get_search_sources()`: The web search results. It is a list of WebSearchSource objects.

        For more detail please see Message documentation(Message.__doc__)
        """
        if conversation is None:
            conversation = self.current_conversation

        msg = Message(
            g=self._stream_query(
                text=text,
                web_search=web_search,
                _stream_yield_all=_stream_yield_all,  # For stream mode, yield all responses from the server.
                retry_count=retry_count,
                conversation=conversation,
            ),
            _stream_yield_all=_stream_yield_all,
            web_search=web_search,
        )
        return msg




# Log in to huggingface and grant authorization to huggingchat
EMAIL = "omega8299@gmail.com"
PASSWD = "ft;GasE/CTNw9ip"
cookie_path_dir = "./cookies/" # NOTE: trailing slash (/) is required to avoid errors
sign = Login(EMAIL, PASSWD)
cookies = sign.login(cookie_dir_path=cookie_path_dir, save_cookies=True)

# Create your ChatBot
chatbot = ChatBot(cookies=cookies.get_dict())  # or cookie_path="usercookies/<email>.json"

# Non stream response
# query_result = chatbot.chat("Hi!")
# print(query_result) # or query_result.text or query_result["text"]

# Stream response
for resp in chatbot.query(
    "Hwhat is name of current president of United States of America",
    stream=True
):
    print(resp)

# for resp in chatbot.query(
#     "what is my name",
#     stream=True
# ):
#     print(resp)


# # Web search (new feature)
# query_result = chatbot.query("Hi!", web_search=True)
# print(query_result)
# for source in query_result.web_search_sources:
#     print(source.link)
#     print(source.title)
#     print(source.hostname)

# # Create a new conversation
# chatbot.new_conversation(switch_to = True) # switch to the new conversation

# # Get conversations on the server that are not from the current session (all your conversations in huggingchat)
# conversation_list = chatbot.get_remote_conversations(replace_conversation_list=True)
# # Get conversation list(local)
# conversation_list = chatbot.get_conversation_list()

# # Get the available models (not hardcore)
# models = chatbot.get_available_llm_models()

# # Switch model with given index
# chatbot.switch_llm(0) # Switch to the first model
# chatbot.switch_llm(1) # Switch to the second model

# # Get information about the current conversation
# info = chatbot.get_conversation_info()
# print(info.id, info.title, info.model, info.system_prompt, info.history)

# # Assistant
# assistant = chatbot.search_assistant(assistant_name="ChatGpt") # assistant name list in https://huggingface.co/chat/assistants
# assistant_list = chatbot.get_assistant_list_by_page(page=0)
# chatbot.new_conversation(assistant=assistant, switch_to=True) # create a new conversation with assistant

# # [DANGER] Delete all the conversations for the logged in user
# chatbot.delete_all_conversations()