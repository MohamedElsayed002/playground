from openai import AsyncOpenAI
from app.core.config import settings
import json 
import re 

client = AsyncOpenAI(
    api_key=settings.OPENAI_API_KEY
)

def safe_json_parse(text: str) -> dict:
    try:
        return json.loads(text)
    except:
        text = re.sub(r"```json|```", "", text)
        return json.loads(text)
    
def safe_int(value):
    try:
        return int(value)
    except:
        return 0

async def extract_structured_cv_data(full_text: str) -> dict:
    prompt = f"""
    You are an AI that extracts structured data from CVs.

    Return ONLY valid JSON (no explanation)

    Schema:
        {{
    "name": string | null,
    "email": string | null,
    "phone": string | null,
    "skills": string[],
    "years_of_experience": string | null,
    "education": [
        {{
        "degree": string | null,
        "institution": string | null,
        "year": string | null
        }}
    ],
    "work_experience": [
        {{
        "company": string | null,
        "role": string | null,
        "duration": string | null,
        "description": string | null
        }}
    ]
    }}

    Rules 
    - Do not hallucinate 
    - If missing -> NULL
    - Extract Skills as keywords (lowercase)

        CV:
        \"\"\"
    {full_text[:12000]}
    \"\"\"
    """

    response = await llm_call(prompt)
    return safe_json_parse(response)


async def llm_call(prompt: str) -> str:
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "you extract structured CV data."},
            {"role": "user", "content": prompt}
        ],
        temperature=0
    )

    return response.choices[0].message.content