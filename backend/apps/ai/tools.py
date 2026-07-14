import logging
import requests
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
import json

logger = logging.getLogger(__name__)

import os

def search_web(query: str, search_type: str = "text", max_results: int = 5) -> str:
    """
    Search the web using Google Custom Search API if configured, otherwise fallback to DuckDuckGo.
    """
    logger.info(f"Tool called: search_web(query='{query}', search_type='{search_type}')")
    
    brave_api_key = os.environ.get("BRAVE_API_KEY")
    google_api_key = os.environ.get("GOOGLE_API_KEY")
    google_cx = os.environ.get("GOOGLE_CX")
    
    try:
        results = []
        search_success = False
        
        # 1. Try Brave Search first
        if brave_api_key:
            try:
                logger.info("Using Brave Search API")
                url = "https://api.search.brave.com/res/v1/web/search"
                headers = {
                    "Accept": "application/json",
                    "Accept-Encoding": "gzip",
                    "X-Subscription-Token": brave_api_key.strip()
                }
                params = {
                    "q": query,
                    "count": min(max_results, 20)
                }
                response = requests.get(url, headers=headers, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                # Brave Search structure: data['web']['results']
                for item in data.get("web", {}).get("results", []):
                    results.append({
                        "title": item.get("title", ""),
                        "href": item.get("url", ""),
                        "body": item.get("description", "")
                    })
                search_success = True
            except Exception as e:
                logger.warning(f"Brave Search API failed: {e}. Falling back to Google/DuckDuckGo.")
                search_success = False
        
        # 2. Use Google Search if credentials are provided and Brave failed/wasn't used
        if not search_success and google_api_key and google_cx:
            try:
                logger.info("Using Google Custom Search API")
                url = "https://www.googleapis.com/customsearch/v1"
                params = {
                    "key": google_api_key.strip(),
                    "cx": google_cx.strip(),
                    "q": query,
                    "num": min(max_results, 10)  # Google API limits num to 10 per request
                }
                response = requests.get(url, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                for item in data.get("items", []):
                    results.append({
                        "title": item.get("title", ""),
                        "href": item.get("link", ""),
                        "body": item.get("snippet", "")
                    })
                search_success = True
            except Exception as e:
                logger.warning(f"Google Custom Search API failed: {e}. Falling back to DuckDuckGo.")
                search_success = False
                
        if not search_success:
            # Fallback to DuckDuckGo
            logger.info("Using DuckDuckGo fallback")
            with DDGS() as ddgs:
                if search_type == "news":
                    for r in ddgs.news(query, max_results=max_results):
                        results.append({
                            "title": r.get("title", ""),
                            "url": r.get("url", ""),
                            "source": r.get("source", ""),
                            "date": r.get("date", ""),
                            "body": r.get("body", "")
                        })
                else:
                    for r in ddgs.text(query, max_results=max_results):
                        results.append({
                            "title": r.get("title", ""),
                            "href": r.get("href", ""),
                            "body": r.get("body", "")
                        })
        
        if not results:
            return "No results found."
            
        return json.dumps(results, indent=2)
    except Exception as e:
        logger.error(f"search_web error: {e}")
        return f"Error searching the web: {str(e)}"

def fetch_page(url: str) -> str:
    """
    Fetch a webpage and extract its main text content.
    """
    logger.info(f"Tool called: fetch_page(url='{url}')")
    try:
        if not url.startswith('http://') and not url.startswith('https://'):
            url = 'https://' + url
            
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script, style, nav, header, footer elements
        for element in soup(["script", "style", "nav", "header", "footer", "aside"]):
            element.decompose()
            
        text = soup.get_text(separator='\n')
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = '\n'.join(chunk for chunk in chunks if chunk)
        
        # Truncate to avoid blowing up context window (roughly 15k chars)
        if len(text) > 15000:
            text = text[:15000] + "\n...[Content truncated]..."
            
        return text
    except Exception as e:
        logger.error(f"fetch_page error: {e}")
        return f"Error fetching the page: {str(e)}"

def fetch_current_weather(city: str) -> str:
    """
    Fetch the current weather for a given city.
    """
    logger.info(f"Tool called: fetch_current_weather(city='{city}')")
    try:
        url = f"https://wttr.in/{city}?format=3"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return response.text.strip()
    except Exception as e:
        logger.error(f"fetch_current_weather error: {e}")
        return f"Error fetching weather for {city}: {str(e)}"

def calculate_math(expression: str) -> str:
    """
    Evaluate a mathematical expression.
    """
    logger.info(f"Tool called: calculate_math(expression='{expression}')")
    try:
        import math
        safe_dict = {k: v for k, v in math.__dict__.items() if not k.startswith("__")}
        safe_dict["__builtins__"] = None
        result = eval(expression, safe_dict)
        return str(result)
    except Exception as e:
        logger.error(f"calculate_math error: {e}")
        return f"Error calculating math expression: {str(e)}"

def query_knowledge_base(search_query: str) -> str:
    """
    Search the local ChromaDB knowledge base for relevant document chunks.
    """
    logger.info(f"Tool called: query_knowledge_base(search_query='{search_query}')")
    try:
        import os
        from django.conf import settings
        import chromadb
        CHROMA_DB_DIR = os.environ.get('CHROMA_DB_DIR', getattr(settings, 'CHROMA_DB_DIR', None))
        if not CHROMA_DB_DIR:
            try:
                CHROMA_DB_DIR = os.path.join(settings.BASE_DIR, 'chroma_db')
            except Exception:
                CHROMA_DB_DIR = '/app/chroma_db'
        client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
        
        collections = client.list_collections()
        collection_names = [col.name if hasattr(col, 'name') else col for col in collections]
        if "documents_collection" in collection_names:
            collection = client.get_collection("documents_collection")
        else:
            return "Knowledge base is empty."
            
        results = collection.query(
            query_texts=[search_query],
            n_results=5
        )
        
        docs = results.get('documents', [])
        metadatas = results.get('metadatas', [])
        if not docs or not docs[0]:
            return "No relevant information found in the knowledge base."
            
        formatted_results = []
        for idx, doc_text in enumerate(docs[0]):
            meta = metadatas[0][idx] if (metadatas and len(metadatas) > 0 and len(metadatas[0]) > idx) else None
            filename = meta.get("filename", "Unknown file") if meta else "Unknown file"
            formatted_results.append({
                "content": doc_text,
                "filename": filename
            })
        return json.dumps(formatted_results, indent=2)
    except Exception as e:
        logger.error(f"query_knowledge_base error: {e}")
        return f"Error querying knowledge base: {str(e)}"

# OpenAI Tool Schemas
OPENAI_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "CRITICAL: You MUST use this tool to search the internet whenever the user asks for current information, news, facts, or things you don't know.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query."
                    },
                    "search_type": {
                        "type": "string",
                        "description": "The type of search to perform. Use 'text' for general factual searches, and 'news' for current events and headlines.",
                        "enum": ["text", "news"]
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "fetch_page",
            "description": "CRITICAL: You MUST use this tool to read the contents of a website URL BEFORE attempting to summarize or discuss it. Do not guess the contents of a website.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The URL to fetch. Can be with or without https://."
                    }
                },
                "required": ["url"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "fetch_current_weather",
            "description": "Fetch the current weather conditions for a given city.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "The city to fetch the weather for, e.g., 'San Francisco'."
                    }
                },
                "required": ["city"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate_math",
            "description": "Calculate a mathematical expression.",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "The mathematical expression to evaluate, e.g., '2 + 2' or 'cos(pi / 2)'."
                    }
                },
                "required": ["expression"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "query_knowledge_base",
            "description": "Search the local knowledge base for private documents and information.",
            "parameters": {
                "type": "object",
                "properties": {
                    "search_query": {
                        "type": "string",
                        "description": "The search query to find relevant document chunks."
                    }
                },
                "required": ["search_query"]
            }
        }
    }
]

# Dispatcher
def execute_tool(name: str, arguments: dict) -> str:
    if name == "search_web":
        return search_web(arguments.get("query", ""), arguments.get("search_type", "text"))
    elif name == "fetch_page":
        return fetch_page(arguments.get("url", ""))
    elif name == "fetch_current_weather":
        return fetch_current_weather(arguments.get("city", ""))
    elif name == "calculate_math":
        return calculate_math(arguments.get("expression", ""))
    elif name == "query_knowledge_base":
        return query_knowledge_base(arguments.get("search_query", ""))
    else:
        return f"Unknown tool: {name}"
