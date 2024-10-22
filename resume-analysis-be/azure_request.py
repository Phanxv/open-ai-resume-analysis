from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.search.documents import SearchClient
import os
from dotenv import load_dotenv
import requests
import json
import string 
import random
import data_utils

load_dotenv()

AZURE_SEARCH_SERVICE_NAME = os.environ.get('AZURE_SEARCH_SERVICE_NAME')
AZURE_SEARCH_API_KEY = os.environ.get('AZURE_SEARCH_API_KEY')
INDEX_NAME = 'resume-index-test'
AZURE_OPENAI_PREVIEW_API_VERSION=os.environ.get("AZURE_OPENAI_PREVIEW_API_VERSION")
AZURE_OPENAI_API_KEY=os.environ.get("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT=os.environ.get("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_MODEL=os.environ.get("AZURE_OPENAI_MODEL")
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=os.environ.get("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
AZURE_DOCUMENT_INTELLIGENCE_KEY=os.environ.get("AZURE_DOCUMENT_INTELLIGENCE_KEY")
RANDOMER_API_KEY = os.environ.get("RANDOMER_API_KEY")

azure_search_client = SearchClient(
        endpoint=f"https://{AZURE_SEARCH_SERVICE_NAME}.search.windows.net",
        index_name=INDEX_NAME,
        credential=AzureKeyCredential(AZURE_SEARCH_API_KEY)
)

document_intelligence_endpoint = AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT
document_intelligence_credential = AzureKeyCredential(AZURE_DOCUMENT_INTELLIGENCE_KEY)
form_recognizer_client = DocumentAnalysisClient(document_intelligence_endpoint, document_intelligence_credential)

def get_random_generated_name():
    header = {
        "X-Api-Key" : RANDOMER_API_KEY
    }
    try:
        response = requests.get('https://randommer.io/api/Name?nameType=fullname&quantity=1', headers=header)
        return response.json()[0]
    except:
        return "Lorem Ipsum"

def search_index(query, owner, language='english'):
    print(query)
    results = azure_search_client.search(search_text=f'{query}', 
                                         select=["content", "summary", "name", "id", "file_name"], 
                                         query_type="semantic",
                                         semantic_configuration_name="my-semantic-config",
                                         query_answer="extractive",
                                         query_caption="extractive",
                                         top=3, 
                                         filter=f"owner eq '{owner}'")
    data_list = []
    for result in results:  
        data = {
            "id" : f"{result['id']}",
            "score" : f"{result['@search.score']}",
            "name" : f"{result['name']}",
            "content" : f"{result['content']}",
            "file_name" : f"{result['file_name'].split('/')[3]}",
            "summary" : f"{respone_extraction(get_openai_summary_request(result['content'], 'OUTPUT_SUMMARY', language, query))}"
            }
        data_list.append(data)
    return(data_list)

def get_openai_summary_request(full_content, mode='KEYWORD_EXTRACTION', language='English', requirement=None):  
    if mode == 'KEYWORD_EXTRACTION':
        system_prompt = f"""You are HR department assistant you job is to help summarize the data from job applicant
                the data you need to extract is the keyword of Job title, short summary of responsibility and Skill only answer with the keyword that found
                in the form of plain text separate Job title, short summary and responsibility with new line symbol do not include any markdown
                reply in {language} language"""
    elif mode == 'OUTPUT_SUMMARY':
        system_prompt = f"""You are HR department assistant you job is to help validate wheter or not this applicant qualify for the job position or not 
                based on this qualification or requirement : {requirement}
                then return the result in the form of json object with 4 keys 1. 'evaluation' containing evaluation process in a form of plain text, 
                2. 'conclusion' containing the conclusion of the evaluation 3. 'verdict' containing the result of the evaluation. 
                4. 'rating' containing a rating score of this applicant on the scale of 1 to 10 the more requirement this applicant met the higher the score
                return all value in every key in {language} language"""
    
    headers = {  
        "Content-Type": "application/json",  
        "api-key": AZURE_OPENAI_API_KEY,  
    }  
    
    # Construct payload
    payload = {  
        "messages": [  
            {  
                "role": "system",  
                "content": [  
                    {  
                        "type": "text",  
                        "text": f"{system_prompt}" 
                    }  
                ]  
            },  
            {  
                "role": "user",  
                "content": full_content
            },  
        ],  
        "temperature": 0.7,  
        "top_p": 0.95,  
        "max_tokens": 1500  
    }   
    
    try:  
        response = requests.post(AZURE_OPENAI_ENDPOINT+f'/openai/deployments/gpt-4o-mini/chat/completions?api-version=2024-02-15-preview', headers=headers, json=payload, timeout=120)  
        response.raise_for_status()  
    except requests.RequestException as e:  
        raise SystemExit(f"Failed to make the request. Error: {e}")  
    except requests.exceptions.Timeout as e:
        raise SystemExit(f"Request timeout: {e}")  
    
    return response

def respone_extraction(response: requests.Response):
    response_json = response.json()
    response_json_dump = json.dumps(response_json, indent=2)
    extracted_data = json.loads(response_json_dump)["choices"][0]["message"]["content"]
    return extracted_data

def index_pdf(file_name, folder_path, owner):
    file_path = os.path.join(folder_path, file_name)
    full_text_extract = data_utils.extract_pdf_content(file_path, form_recognizer_client, False)
    summary_text = respone_extraction(get_openai_summary_request(full_text_extract))
    search_client = SearchClient(
        endpoint=f"https://{AZURE_SEARCH_SERVICE_NAME}.search.windows.net",
        index_name=INDEX_NAME,
        credential=AzureKeyCredential(AZURE_SEARCH_API_KEY)
    )
    name = get_random_generated_name()
    try :
        id = int(file_name)
    except :
        id = ''.join(random.choice(string.ascii_uppercase + string.digits) for i in range(8))
    document = {
        "id": str(id),
        "name": str(name),
        "owner": str(owner),
        "content": str(full_text_extract),
        "summary": str(summary_text),
        "file_name": str(file_path)
    }

    # Upload the document to Azure Search
    result = search_client.upload_documents(documents=[document])
    print(f"Uploaded document: {result}")
    return {"id":str(file_name[:-4]), "name":str(name), "summary":str(summary_text), "file_name":str(file_name), "owner":str(owner)}
