from quart import Quart, request, jsonify, send_from_directory, send_file
from quart_cors import cors
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from jwt_verification import token_required
from azure_request import search_index, index_pdf
import bcrypt
import jwt
import os
import json
from bson import ObjectId 

load_dotenv()

MONGODB_CONNECTION_STRING = os.getenv("MONGODB_CONNECTION_STRING")
SECRET_KEY = os.getenv("SECRET_KEY")

app = Quart(__name__, static_folder='./react-build')
#app = Quart(__name__)
app.config['SECRET_KEY'] = SECRET_KEY
app = cors(app)

client = AsyncIOMotorClient(MONGODB_CONNECTION_STRING)
db = client["resume-analysis-db"]
users_collection = db["Users"]
resumes_collection = db["Resumes"]

async def create_token(username):
    token = jwt.encode({
        'username': username,
        'exp': datetime.now(tz=timezone.utc) + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    return token

#For serving static

@app.route('/static/<path:path>')
async def static_files(path):
    return await send_from_directory(os.path.join(app.static_folder, 'static'), path)

@app.route('/')
@app.route('/<path:path>')
async def serve_react(path=None):
    return await send_from_directory(app.static_folder, 'index.html')

@app.route('/auth/register', methods=['POST'])
async def register():
    data = await request.get_json() 
    username = data.get('username')
    password = data.get('password')

    user = await users_collection.find_one({"username": username})
    if user:
        return jsonify({"message": "User already exists"}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    await users_collection.insert_one({
        "username": username,
        "password": hashed_password
    })

    token = await create_token(username)
    return jsonify({"message": "User registered successfully", "token": token}), 201

@app.route('/auth/login', methods=['POST'])
async def login():
    data = await request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = await users_collection.find_one({"username": username})
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({"message": "Invalid credentials"}), 401

    token = await create_token(username)
    return jsonify({"message": "Login successful", "token": token})

UPLOAD_FOLDER = './uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/api/upload', methods=['POST'])
@token_required
async def upload_files():
    # Check if files are in the request
    username = request.user
    print(username)
    files = await request.files  # Await the files data

    # Get the list of uploaded files
    files_list = files.getlist('files')
    print(files_list)
    # If no files are selected
    if len(files_list) == 0:
        return jsonify({"error": "No files selected"}), 400

    saved_files = []
    for file in files_list:
        if file.filename == '':
            continue  # Skip files with no filename

        # Save each file asynchronously
        file_directory = os.path.join(UPLOAD_FOLDER, username)
        os.makedirs(file_directory, exist_ok=True)
        file_path = os.path.join(file_directory, file.filename)
        if(not os.path.exists(file_path)):
            await file.save(file_path)
            index = index_pdf(file.filename, file_directory, username)
            await resumes_collection.insert_one(index)
            saved_files.append(file_path)

    return jsonify({
        "message": "Files successfully uploaded",
        "files": saved_files
    }), 200

@app.route('/api/resumes', methods=['GET'])
@token_required
async def get_resumes():
    username = request.user
    resumes = resumes_collection.find({"owner": username})
    resumes_list = await resumes.to_list(length=None)
    print(resumes_list)
    for resume in resumes_list:
        if '_id' in resume:
            resume['_id'] = str(resume['_id'])
    return jsonify(resumes_list), 200

@app.route('/file/resume', methods=['GET'])
@token_required
def get_file():
    username = request.user
    file_name = request.args.get('filename')
    file_path = os.path.join(UPLOAD_FOLDER, username, file_name)
    print(file_path)
    if not os.path.exists(file_path):
        return jsonify({'error': 'file not found'}), 404
    
    return send_file(file_path)
    

@app.route('/api/search', methods=['GET'])
@token_required
async def search_candidate():
    username = request.user
    query = request.args.get('query')
    lang = request.args.get('lang')
    if not lang :
        lang = 'english'

    try:
        result = search_index(query=query, owner=username, language=lang)
        if len(result) == 0 :
            return jsonify({"error" : "Applicant that matches requirement not found"}), 204
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error', str(e)}), 400
   
        

if __name__ == '__main__':
    app.run(port=8000)
