from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

# Import emergent integrations for LLM
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# OpenAI Configuration
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# AI Chat Models
class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_message: str
    ai_response: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    message_type: str = Field(default="support")  # "support", "recommendation", "general"

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    message_type: str = Field(default="support")  # "support", "recommendation", "general"
    user_medications: Optional[List[Dict[str, Any]]] = None
    # Новые поля для персонализации
    user_context: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[Dict[str, Any]]] = None
    insights: Optional[List[Dict[str, Any]]] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    message_id: str

class RecommendationRequest(BaseModel):
    medications: List[Dict[str, Any]]
    session_id: Optional[str] = None

# Medication Models for context
class Medication(BaseModel):
    id: str
    name: str
    time: str
    days: List[int]
    icon: str = "💊"
    created_at: str

# AI Assistant Configuration
def get_system_message(message_type: str, medications: Optional[List[Dict]] = None) -> str:
    base_prompt = """You are a helpful AI assistant for a medication reminder app called "Simple Pill Reminder". 
    You provide friendly, informative support while being mindful that you're not a doctor and should not provide medical advice.
    
    Always be helpful, concise, and encourage users to consult healthcare professionals for medical decisions.
    """
    
    if message_type == "support":
        return base_prompt + """
        Your role is to help users with:
        - How to use the app features
        - Troubleshooting app issues
        - General questions about medication reminders
        - Technical support
        
        Keep responses friendly and helpful. If asked about medical advice, remind users to consult their healthcare provider.
        """
    
    elif message_type == "recommendation":
        med_context = ""
        if medications:
            med_context = f"\n\nUser's current medications: {medications}"
            
        return base_prompt + f"""
        Your role is to provide general wellness and medication management tips based on the user's medication schedule.
        {med_context}
        
        You can suggest:
        - General tips for medication adherence
        - Reminders about consistency
        - Lifestyle suggestions that complement medication routines
        - App features that might help
        
        NEVER provide specific medical advice, dosage recommendations, or suggest changes to medications.
        Always remind users to consult healthcare professionals for medical decisions.
        """
    
    else:  # general
        return base_prompt + """
        You're a general assistant for the pill reminder app. Help with any questions while staying within appropriate boundaries.
        """

# Initialize LLM Chat
def create_chat_instance(session_id: str, message_type: str, medications: Optional[List[Dict]] = None) -> LlmChat:
    system_message = get_system_message(message_type, medications)
    
    chat = LlmChat(
        api_key=OPENAI_API_KEY,
        session_id=session_id,
        system_message=system_message
    ).with_model("openai", "gpt-4o").with_max_tokens(1000)
    
    return chat

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# AI Chat Endpoints
@api_router.post("/ai/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    try:
        # Generate session_id if not provided
        session_id = request.session_id or str(uuid.uuid4())
        
        # Create chat instance
        chat = create_chat_instance(session_id, request.message_type, request.user_medications)
        
        # Create user message
        user_message = UserMessage(text=request.message)
        
        # Get AI response
        ai_response = await chat.send_message(user_message)
        
        # Save chat to database
        chat_record = ChatMessage(
            session_id=session_id,
            user_message=request.message,
            ai_response=ai_response,
            message_type=request.message_type
        )
        
        await db.chat_history.insert_one(chat_record.dict())
        
        return ChatResponse(
            response=ai_response,
            session_id=session_id,
            message_id=chat_record.id
        )
        
    except Exception as e:
        logger.error(f"AI Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@api_router.post("/ai/recommendations", response_model=ChatResponse)
async def get_medication_recommendations(request: RecommendationRequest):
    try:
        # Generate session_id if not provided
        session_id = request.session_id or str(uuid.uuid4())
        
        # Create chat instance with medication context
        chat = create_chat_instance(session_id, "recommendation", request.medications)
        
        # Generate recommendation prompt based on medications
        medication_names = [med.get('name', 'Unknown') for med in request.medications]
        medication_times = [med.get('time', 'Unknown') for med in request.medications]
        
        prompt = f"""
        Analyze my medication schedule and provide helpful tips:
        
        Medications: {', '.join(medication_names)}
        Times: {', '.join(medication_times)}
        Total medications: {len(request.medications)}
        
        Please provide personalized tips for:
        1. Medication adherence 
        2. Schedule optimization
        3. General wellness advice
        4. App features that might help
        
        Keep it practical and encouraging!
        """
        
        user_message = UserMessage(text=prompt)
        ai_response = await chat.send_message(user_message)
        
        # Save to database
        chat_record = ChatMessage(
            session_id=session_id,
            user_message=prompt,
            ai_response=ai_response,
            message_type="recommendation"
        )
        
        await db.chat_history.insert_one(chat_record.dict())
        
        return ChatResponse(
            response=ai_response,
            session_id=session_id,
            message_id=chat_record.id
        )
        
    except Exception as e:
        logger.error(f"AI Recommendations error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@api_router.get("/ai/chat/history/{session_id}")
async def get_chat_history(session_id: str, limit: int = 20):
    try:
        chat_history = await db.chat_history.find(
            {"session_id": session_id}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return {
            "session_id": session_id,
            "messages": [ChatMessage(**msg) for msg in chat_history]
        }
        
    except Exception as e:
        logger.error(f"Chat history error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@api_router.delete("/ai/chat/history/{session_id}")
async def clear_chat_history(session_id: str):
    try:
        result = await db.chat_history.delete_many({"session_id": session_id})
        return {
            "message": f"Deleted {result.deleted_count} messages",
            "session_id": session_id
        }
        
    except Exception as e:
        logger.error(f"Clear chat history error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Quick help endpoints
@api_router.get("/ai/quick-tips")
async def get_quick_tips():
    """Get quick medication adherence tips"""
    quick_tips = [
        "💊 Take medications at the same time daily for better habit formation",
        "⏰ Set up multiple reminder methods: app notifications + alarms",
        "📅 Use a weekly pill organizer for complex schedules",
        "🍽️ Link medication times to meals for better memory",
        "📱 Keep your phone charged to ensure you get notifications",
        "🩺 Never skip doses without consulting your healthcare provider",
        "💧 Always take pills with enough water",
        "📋 Keep an updated medication list for emergencies"
    ]
    
    return {"tips": quick_tips}

@api_router.get("/ai/app-help")
async def get_app_help():
    """Get help with app features"""
    help_topics = {
        "adding_medications": {
            "title": "Adding Medications",
            "steps": [
                "Tap the + button at the bottom right",
                "Enter your medication name",
                "Set the time you need to take it",
                "Select the days of the week",
                "Tap 'Add Medication'"
            ]
        },
        "notifications": {
            "title": "Setting Up Notifications",
            "steps": [
                "Allow notifications when prompted",
                "Notifications are automatically set when you add medications",
                "You can tap 'Taken' directly from the notification",
                "Make sure your phone isn't in Do Not Disturb mode"
            ]
        },
        "taking_medications": {
            "title": "Marking Medications as Taken",
            "steps": [
                "Find your medication on today's schedule",
                "Tap the 'Take' button",
                "The medication will be marked with a green checkmark",
                "You can also mark as taken from notifications"
            ]
        },
        "managing_medications": {
            "title": "Managing Your Medications",
            "steps": [
                "View all medications in the 'All Medications' section",
                "Tap the three dots (⋯) to see options",
                "Delete medications you no longer need",
                "Use Settings to clear all data if needed"
            ]
        }
    }
    
    return {"help_topics": help_topics}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()