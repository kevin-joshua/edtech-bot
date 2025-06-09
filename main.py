from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from llm import generate_in_class_content
from json_to_markdown import ( 
    json_to_markdown_for_pre_class,
    json_to_markdown_for_in_class,
    json_to_markdown_for_post_class
)
import json

from pydantic import BaseModel

class TopicRequest(BaseModel):
    topic: str
    difficulty: str = "medium"




app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.post("/generate")
async def generate_content(request: TopicRequest):
    
    try:
      
        in_class_contents = generate_in_class_content(request.topic, request.difficulty)
        print(in_class_contents)
        # in_class_response = in_class_contents['in_class_content']
        # pre_class_response = in_class_contents['pre_class_content']
        # post_class_response = in_class_contents['post_class_content']

        # in_class_content = json.loads(in_class_response)
        # pre_class_content = json.loads(pre_class_response)
        # post_class_content = json.loads(post_class_response)
        # # Convert JSON content to Markdown
        # pre_class_markdown = json_to_markdown_for_pre_class(pre_class_content)
        # in_class_markdown = json_to_markdown_for_in_class(in_class_content)
        # post_class_markdown = json_to_markdown_for_post_class(post_class_content)
        
        return JSONResponse(content=in_class_contents)
    except Exception as e:  
        raise HTTPException(status_code=500, detail=f"Error generating content: {e}")


