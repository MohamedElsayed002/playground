import os 
import logging 
from typing import List, Dict, Any, Optional 

from dotenv import load_dotenv 
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse 
from fastapi.middleware.cors import CORSMiddleware 
from pydantic import BaseModel 
from openai import AsyncOpenAI 

from tanstack_ai import StreamChunkConverter, format_messages_for_openai, format_sse_chunk, format_sse_done

# Configure logging 
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="Tanstack AI python FastAPI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError(
        "OpenAI key is required"
        "Please provide openai key"
    )

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

class Message(BaseModel):
    role: str 
    content: str | None = None 
    name: Optional[str] = None 
    toolCalls: Optional[List[Dict[str,Any]]] = None 
    toolCallId: Optional[str] = None

class ChatRequest(BaseModel):
    messages: List[Message]
    data: Optional[Dict[str,Any]] = None


@app.post("/python-chat")
async def chat_endpoint(request: ChatRequest):

    try:
        logger.info(f"POST - {len(request.messages)} messages")

        # Convert messages to OPENAI format 
        openai_messages = format_messages_for_openai(request.messages)
        logger.info(f"Converted {len(openai_messages)} messages to OPENAI format")

        model = request.data.get("model") if request.data and request.data.get("model") else "gpt-4o-mini"
        logger.info(f"Using model: {model}")


        # Initialize converter (specify provider for better performance)
        converter = StreamChunkConverter(model=model,provider="openai")

        async def generate_stream():
            """Generate SSE Stream from OPENAI events"""
            event_count = 0
            chunk_count = 0

            try:
                logger.info(f"Starting Openai stream for model: {model}")

                stream = await client.chat.completions.create(
                    model=model, 
                    messages=openai_messages,
                    max_tokens=1024,
                    temperature=0.7,
                    stream=True
                )

                async for event in stream:
                    event_count+=1
                    logger.debug(f"Received OPENAI event {event_count}: {type(event).__name__} ")

                    # Convert OPENAI event to stream chunk format using tanstack converter 
                    chunks = await converter.convert_event(event)

                    for chunk in chunks: 
                        chunk_count+=1
                        chunk_type = chunk.get("type","unknown")
                        logger.debug(f"Sending chunk {chunk_count} (type: {chunk_type})")
                        yield format_sse_chunk(chunk)
                    
                logger.info(f"Stream complete - {event_count} events, {chunk_count} chunks sent")

                yield format_sse_done()
            except Exception as e:
                logger.error(f"Error in stream: {type(e).__name__} : {str(e)}",exc_info=True)
                error_chunk = await converter.convert_error(e)
                yield format_sse_chunk(error_chunk)

        logger.info("return response")
        return StreamResponse(
            generate_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500,detail=str(e))



@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "service": "tanstack-ai-fastapi-openai"}


@app.get('/')
def main():
    return 'Mohamedfff'