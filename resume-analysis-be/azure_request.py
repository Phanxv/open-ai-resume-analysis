from azure.core.credentials import AzureKeyCredential
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import ComplexField, SearchableField, SimpleField, SearchIndex
import base64
import os
from dotenv import load_dotenv
from openai import AzureOpenAI
import requests
import json
import string
import random

load_dotenv()

AZURE_SEARCH_SERVICE_NAME = os.environ.get('AZURE_SEARCH_SERVICE_NAME')
AZURE_SEARCH_API_KEY = os.environ.get('AZURE_SEARCH_API_KEY')
INDEX_NAME = 'resume-index'
AZURE_OPENAI_PREVIEW_API_VERSION=os.environ.get("AZURE_OPENAI_PREVIEW_API_VERSION")
AZURE_OPENAI_API_KEY=os.environ.get("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT=os.environ.get("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_MODEL=os.environ.get("AZURE_OPENAI_MODEL")

client = AzureOpenAI(
    api_version= AZURE_OPENAI_PREVIEW_API_VERSION,
    api_key=AZURE_OPENAI_API_KEY,
    azure_endpoint=AZURE_OPENAI_ENDPOINT
)

search_client = SearchClient(
        endpoint=f"https://{AZURE_SEARCH_SERVICE_NAME}.search.windows.net",
        index_name="resume-index",
        credential=AzureKeyCredential(AZURE_SEARCH_API_KEY)
)

def search_index(query):
    print(query)
    results = search_client.search(search_text=f'{query}', select=["content", "summary", "name"], top=3)
    data_list = []
    for result in results:  
        data = {
            "score" : f"{result['@search.score']}",
            "name" : f"{result['name']}",
            "content" : f"{result['content']}",
            "summary" : f"{result['summary']}"
            }
        data_list.append(data)
    return(data_list)