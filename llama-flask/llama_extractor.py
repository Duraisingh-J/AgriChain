from fastapi import FastAPI, HTTPException, BackgroundTasks
from transformers import pipeline
import json
import re
import requests
import firebase_admin
from firebase_admin import credentials, db
from datetime import datetime
import asyncio
import uvicorn
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="AgriChain AI Extractor", version="2.0")

# Initialize Firebase
if not firebase_admin._apps:
    # Option 1: Using service account key file
    # cred = credentials.Certificate("serviceAccountKey.json")
    
    # Option 2: Using environment variables (recommended for production)
    cred = credentials.ApplicationDefault()
    
    firebase_admin.initialize_app(cred, {
        'databaseURL': os.getenv('FIREBASE_DATABASE_URL', 'https://your-project-id-default-rtdb.firebaseio.com')
    })

# Initialize the LLM pipeline
extractor = pipeline("text2text-generation", model="google/flan-t5-base")

# Pydantic models for request/response
class ProduceInput(BaseModel):
    text: str
    farmer_id: Optional[str] = None
    farmer_name: Optional[str] = None
    location: Optional[str] = None
    harvest_date: Optional[str] = None
    auto_match: Optional[bool] = True

class ProduceOutput(BaseModel):
    item: str
    quantity: int
    price: int
    farmer_id: Optional[str] = None
    farmer_name: Optional[str] = None
    location: Optional[str] = None
    harvest_date: Optional[str] = None
    confidence: Optional[float] = None
    raw_llm_output: Optional[str] = None

class MatchRequest(BaseModel):
    produce_id: str

# Enhanced extraction function
async def extract_produce_details(text: str) -> Dict[str, Any]:
    """Extract agricultural product details using LLM with multiple fallback strategies"""
    
    # Enhanced prompt with better instructions
    prompt = f"""Extract agricultural product details from the following text and return ONLY a valid JSON object:

Text: {text}

Instructions:
1. Find the product name (item)
2. Find the quantity in kilograms (quantity)
3. Find the price per kilogram (price)
4. Return ONLY the JSON object, no other text

Required JSON format:
{{"item": "product_name", "quantity": number, "price": number}}

Examples:
- "50kg potatoes at ₹30/kg" → {{"item": "potatoes", "quantity": 50, "price": 30}}
- "100 kg onions for ₹25 per kg" → {{"item": "onions", "quantity": 100, "price": 25}}

JSON:"""

    try:
        # Generate the output
        result = extractor(prompt, max_new_tokens=80, temperature=0.3)[0]["generated_text"]
        
        # Log the raw output
        print("🔍 Raw LLM output:", result)
        
        # Clean and parse the result
        cleaned = result.strip()
        
        # Remove any text before the JSON
        json_start = cleaned.find('{')
        if json_start != -1:
            cleaned = cleaned[json_start:]
        
        # Remove any text after the JSON
        json_end = cleaned.rfind('}')
        if json_end != -1:
            cleaned = cleaned[:json_end + 1]
        
        # Fix common JSON issues
        cleaned = cleaned.replace("'", '"')
        cleaned = re.sub(r'(\w+):', r'"\1":', cleaned)  # Add quotes to keys
        cleaned = re.sub(r':\s*([^",\{\}\[\]]+)(?=\s*[,\}])', r': "\1"', cleaned)  # Add quotes to string values
        
        # Parse JSON
        parsed = json.loads(cleaned)
        
        # Validate required fields
        if not all(key in parsed for key in ['item', 'quantity', 'price']):
            raise ValueError("Missing required fields")
        
        # Convert to proper types
        parsed['item'] = str(parsed['item']).lower().strip()
        parsed['quantity'] = int(parsed['quantity'])
        parsed['price'] = int(parsed['price'])
        
        return {
            "success": True,
            "data": parsed,
            "raw_output": result,
            "confidence": 0.9
        }
        
    except Exception as e:
        print(f"🔥 LLM parsing failed: {e}")
        return await fallback_regex_extraction(text)

async def fallback_regex_extraction(text: str) -> Dict[str, Any]:
    """Fallback extraction using regex patterns"""
    
    patterns = [
        # Pattern 1: "50kg potatoes at ₹30/kg"
        r'(\d+)\s*kg\s*([a-zA-Z\s]+?)(?:\s*at\s*|\s*@\s*|\s*for\s*)₹?(\d+)(?:/kg|per\s*kg)?',
        # Pattern 2: "100 kg onions ₹25"
        r'(\d+)\s*kg\s*([a-zA-Z\s]+?)\s*₹?(\d+)',
        # Pattern 3: "potatoes 50kg ₹30"
        r'([a-zA-Z\s]+?)\s*(\d+)\s*kg\s*₹?(\d+)',
        # Pattern 4: "50 potatoes at 30 rupees"
        r'(\d+)\s*([a-zA-Z\s]+?)(?:\s*at\s*|\s*@\s*)(\d+)',
    ]
    
    for i, pattern in enumerate(patterns):
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                groups = match.groups()
                
                # Handle different group orders
                if i == 2:  # Pattern 3 has different order
                    item, quantity, price = groups
                else:
                    quantity, item, price = groups
                
                return {
                    "success": True,
                    "data": {
                        "item": item.strip().lower(),
                        "quantity": int(quantity),
                        "price": int(price)
                    },
                    "raw_output": f"Regex pattern {i+1} matched",
                    "confidence": 0.7
                }
            except ValueError:
                continue
    
    return {
        "success": False,
        "error": "Could not extract produce details",
        "raw_output": text,
        "confidence": 0.0
    }

async def save_to_firebase(produce_data: Dict[str, Any], farmer_info: Dict[str, Any]) -> str:
    """Save produce data to Firebase and return the ID"""
    
    try:
        # Prepare the data for Firebase
        firebase_data = {
            **produce_data,
            **farmer_info,
            "status": "pending",
            "created_at": datetime.now().isoformat(),
            "source": "fastapi_extractor"
        }
        
        # Save to Firebase
        ref = db.reference('produce/pending')
        new_ref = ref.push(firebase_data)
        
        print(f"✅ Saved to Firebase with ID: {new_ref.key}")
        return new_ref.key
        
    except Exception as e:
        print(f"❌ Firebase save error: {e}")
        raise HTTPException(status_code=500, detail=f"Firebase error: {str(e)}")

async def trigger_matching(produce_id: str):
    """Trigger the matching process by calling the Node.js agent"""
    
    try:
        # This would call your Node.js agent
        # For now, we'll just log it
        print(f"🔍 Triggering matching for produce ID: {produce_id}")
        
        # Optional: Make HTTP request to Node.js agent
        # agent_url = os.getenv('AGENT_URL', 'http://localhost:3000')
        # response = requests.post(f"{agent_url}/match", json={"produce_id": produce_id})
        
        # Update status to processing
        ref = db.reference(f'produce/pending/{produce_id}')
        ref.update({
            "status": "processing",
            "processing_started_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Matching trigger error: {e}")

# API Endpoints
@app.post("/extract", response_model=Dict[str, Any])
async def extract_fields(input_data: ProduceInput, background_tasks: BackgroundTasks):
    """Extract agricultural product details and optionally save to Firebase"""
    
    try:
        # Extract produce details
        extraction_result = await extract_produce_details(input_data.text)
        
        if not extraction_result["success"]:
            raise HTTPException(
                status_code=400, 
                detail=extraction_result.get("error", "Extraction failed")
            )
        
        produce_data = extraction_result["data"]
        
        # Add farmer information
        farmer_info = {
            "farmer_id": input_data.farmer_id,
            "farmer_name": input_data.farmer_name,
            "location": input_data.location,
            "harvest_date": input_data.harvest_date or datetime.now().date().isoformat()
        }
        
        # Save to Firebase
        produce_id = await save_to_firebase(produce_data, farmer_info)
        
        # Trigger matching in background if requested
        if input_data.auto_match:
            background_tasks.add_task(trigger_matching, produce_id)
        
        return {
            "success": True,
            "produce_id": produce_id,
            "extracted_data": produce_data,
            "farmer_info": farmer_info,
            "confidence": extraction_result["confidence"],
            "raw_llm_output": extraction_result["raw_output"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Extraction error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@app.post("/match")
async def trigger_manual_match(match_request: MatchRequest):
    """Manually trigger matching for a specific produce ID"""
    
    try:
        await trigger_matching(match_request.produce_id)
        return {"success": True, "message": f"Matching triggered for {match_request.produce_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/produce/{produce_id}")
async def get_produce_details(produce_id: str):
    """Get produce details from Firebase"""
    
    try:
        # Try pending first
        ref = db.reference(f'produce/pending/{produce_id}')
        data = ref.get()
        
        if not data:
            # Try matched
            ref = db.reference(f'produce/matched/{produce_id}')
            data = ref.get()
        
        if not data:
            raise HTTPException(status_code=404, detail="Produce not found")
        
        return {"success": True, "data": data}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/produce")
async def list_produce(status: Optional[str] = None, farmer_id: Optional[str] = None):
    """List all produce with optional filtering"""
    
    try:
        if status:
            ref = db.reference(f'produce/{status}')
        else:
            ref = db.reference('produce')
        
        data = ref.get()
        
        if not data:
            return {"success": True, "data": []}
        
        # Flatten the data structure
        result = []
        for status_key, items in data.items():
            if isinstance(items, dict):
                for item_id, item_data in items.items():
                    item_data['id'] = item_id
                    item_data['status'] = status_key
                    
                    # Filter by farmer_id if provided
                    if farmer_id and item_data.get('farmer_id') != farmer_id:
                        continue
                    
                    result.append(item_data)
        
        return {"success": True, "data": result}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/test-extraction")
async def test_extraction(text: str):
    """Test extraction without saving to Firebase"""
    
    result = await extract_produce_details(text)
    return result

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Run the server
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)