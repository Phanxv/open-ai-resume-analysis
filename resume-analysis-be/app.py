from quart import Quart, request, jsonify, send_from_directory
from quart_cors import cors
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import jwt
import os
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv()

MONGODB_CONNECTION_STRING = os.getenv("MONGODB_CONNECTION_STRING")
SECRET_KEY = os.getenv("SECRET_KEY")

#app = Quart(__name__, static_folder='./react-frontend/build')
app = Quart(__name__)
app.config['SECRET_KEY'] = SECRET_KEY
app = cors(app)

client = AsyncIOMotorClient(MONGODB_CONNECTION_STRING)
db = client["resume-analysis-db"]
users_collection = db["Users"]

async def create_token(username):
    token = jwt.encode({
        'username': username,
        'exp': datetime.now(tz=timezone.utc) + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    return token

#For serving static

'''
@app.route('/static/<path:path>')
async def static_files(path):
    return await send_from_directory(os.path.join(app.static_folder, 'static'), path)

@app.route('/')
@app.route('/<path:path>')
async def serve_react(path=None):
    return await send_from_directory(app.static_folder, 'index.html')
'''

@app.route('/register', methods=['POST'])
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

@app.route('/login', methods=['POST'])
async def login():
    data = await request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = await users_collection.find_one({"username": username})
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({"message": "Invalid credentials"}), 401

    token = await create_token(username)
    return jsonify({"message": "Login successful", "token": token})

@app.route('/protected', methods=['GET'])
async def protected():
    token = request.headers.get('Authorization').split()[1]
    
    try:
        data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return jsonify({"message": f"Welcome {data['username']}!"}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"message": "Token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"message": "Invalid token"}), 401

if __name__ == '__main__':
    app.run(port=8000)
