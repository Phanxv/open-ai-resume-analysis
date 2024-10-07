from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer import DocumentAnalysisClient
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
import html

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

openai_client = AzureOpenAI(
    api_version= AZURE_OPENAI_PREVIEW_API_VERSION,
    api_key=AZURE_OPENAI_API_KEY,
    azure_endpoint=AZURE_OPENAI_ENDPOINT
)

azure_search_client = SearchClient(
        endpoint=f"https://{AZURE_SEARCH_SERVICE_NAME}.search.windows.net",
        index_name=INDEX_NAME,
        credential=AzureKeyCredential(AZURE_SEARCH_API_KEY)
)

PDF_HEADERS = {
    "title": "h1",
    "sectionHeading": "h2"
}

document_intelligence_endpoint = AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT
document_intelligence_credential = AzureKeyCredential(AZURE_DOCUMENT_INTELLIGENCE_KEY)

form_recognizer_client = DocumentAnalysisClient(document_intelligence_endpoint, document_intelligence_credential)
def table_to_html(table):
    table_html = "<table>"
    rows = [sorted([cell for cell in table.cells if cell.row_index == i], key=lambda cell: cell.column_index) for i in range(table.row_count)]
    for row_cells in rows:
        table_html += "<tr>"
        for cell in row_cells:
            tag = "th" if (cell.kind == "columnHeader" or cell.kind == "rowHeader") else "td"
            cell_spans = ""
            if cell.column_span > 1: cell_spans += f" colSpan={cell.column_span}"
            if cell.row_span > 1: cell_spans += f" rowSpan={cell.row_span}"
            table_html += f"<{tag}{cell_spans}>{html.escape(cell.content)}</{tag}>"
        table_html +="</tr>"
    table_html += "</table>"
    return table_html

def extract_pdf_content(file_path, form_recognizer_client, use_layout=False): 
    offset = 0
    page_map = []
    model = "prebuilt-layout" if use_layout else "prebuilt-read"
    with open(file_path, "rb") as f:
        poller = form_recognizer_client.begin_analyze_document(model, document = f)
    form_recognizer_results = poller.result()
    # (if using layout) mark all the positions of headers
    roles_start = {}
    roles_end = {}
    for paragraph in form_recognizer_results.paragraphs:
        if paragraph.role!=None:
            para_start = paragraph.spans[0].offset
            para_end = paragraph.spans[0].offset + paragraph.spans[0].length
            roles_start[para_start] = paragraph.role
            roles_end[para_end] = paragraph.role

    for page_num, page in enumerate(form_recognizer_results.pages):
        tables_on_page = [table for table in form_recognizer_results.tables if table.bounding_regions[0].page_number == page_num + 1]

        # (if using layout) mark all positions of the table spans in the page
        page_offset = page.spans[0].offset
        page_length = page.spans[0].length
        table_chars = [-1]*page_length
        for table_id, table in enumerate(tables_on_page):
            for span in table.spans:
                # replace all table spans with "table_id" in table_chars array
                for i in range(span.length):
                    idx = span.offset - page_offset + i
                    if idx >=0 and idx < page_length:
                        table_chars[idx] = table_id

        # build page text by replacing charcters in table spans with table html and replace the characters corresponding to headers with html headers, if using layout
        page_text = ""
        added_tables = set()
        for idx, table_id in enumerate(table_chars):
            if table_id == -1:
                position = page_offset + idx
                if position in roles_start.keys():
                    role = roles_start[position]
                    if role in PDF_HEADERS:
                        page_text += f"<{PDF_HEADERS[role]}>"
                if position in roles_end.keys():
                    role = roles_end[position]
                    if role in PDF_HEADERS:
                        page_text += f"</{PDF_HEADERS[role]}>"

                page_text += form_recognizer_results.content[page_offset + idx]
                
            elif not table_id in added_tables:
                page_text += table_to_html(tables_on_page[table_id])
                added_tables.add(table_id)

        page_text += " "
        page_map.append((page_num, offset, page_text))
        offset += len(page_text)

    full_text = "".join([page_text for _, _, page_text in page_map])
    return full_text

def get_random_generated_name():
    header = {
        "X-Api-Key" : RANDOMER_API_KEY
    }
    try:
        response = requests.get('https://randommer.io/api/Name?nameType=fullname&quantity=1', headers=header)
        return response.json()[0]
    except:
        return "Lorem Ipsum"

def search_index(query):
    print(query)
    results = azure_search_client.search(search_text=f'{query}', select=["content", "summary", "name"], top=3)
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

def get_openai_summary_request(full_text_extract):  
    system_prompt = """You are HR department assistant you job is to help summarize the data from job applicant
            the data you need to extract is the keyword of Job title and Skill only answer with the keyword
            in the form of plain text do not include any markdown
            """
            
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
                "content": full_text_extract 
            },  
        ],  
        "temperature": 0.7,  
        "top_p": 0.95,  
        "max_tokens": 1500  
    }   

    try:  
        response = requests.post(AZURE_OPENAI_ENDPOINT+'/openai/deployments/gpt-35-turbo-16k/chat/completions?api-version=2023-03-15-preview', headers=headers, json=payload, timeout=120)  
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

def index_pdf(file_name, folder_path):
    file_path = os.path.join(folder_path, file_name)
    full_text_extract = extract_pdf_content(file_path, form_recognizer_client, False)
    summary_text = respone_extraction(get_openai_summary_request(full_text_extract))
    search_client = SearchClient(
        endpoint=f"https://{AZURE_SEARCH_SERVICE_NAME}.search.windows.net",
        index_name=INDEX_NAME,
        credential=AzureKeyCredential(AZURE_SEARCH_API_KEY)
    )
    
    # Create a document to index (adjust fields as per your index definition)
    document = {
        "id": str(file_name[:-4]),
        "name": str(get_random_generated_name()),
        "content": str(full_text_extract),
        "summary": str(summary_text),
        "file_name": str(file_path)
    }

    # Upload the document to Azure Search
    result = search_client.upload_documents(documents=[document])
    print(f"Uploaded document: {result}")
