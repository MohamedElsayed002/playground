import json 
import asyncio 
import logging 
from typing import Any

import anthropic
import google.generativeai as genai
import openai 
import os 

logger = logging.getLogger(__name__)
openai.api_key = os.getenv("OPENAI_API_KEY")
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))


SYSTEM_PROMPT = """
You are an expert HR data extraction system used by Big 4 professional services firms
(Deloitte, PwC, EY, KPMG).

Your task is to parse a CV / résumé and return a single, valid JSON object.
Return ONLY the JSON — no markdown, no commentary, no preamble.

The JSON must conform to this exact schema:
{
  "contact": {
    "name": string | null,
    "email": string | null,
    "phone": string | null,
    "linkedin": string | null,
    "location": string | null
  },
  "summary": string | null,
  "work_experience": [
    {
      "company": string | null,
      "title": string | null,
      "start_date": string | null,   // "YYYY-MM" or "YYYY" or free text
      "end_date": string | null,
      "is_current": boolean,
      "description": string | null,
      "achievements": [string]
    }
  ],
  "education": [
    {
      "institution": string | null,
      "degree": string | null,
      "field_of_study": string | null,
      "start_date": string | null,
      "end_date": string | null,
      "gpa": number | null,
      "honors": string | null
    }
  ],
  "raw_skills": [string],
  "certifications": [
    {
      "name": string,
      "issuer": string | null,
      "date_obtained": string | null,
      "expiry_date": string | null
    }
  ],
  "languages": [string],
  "years_of_experience": integer | null
}

Rules:
- Extract ALL skills mentioned anywhere in the CV into raw_skills.
- For years_of_experience: calculate from earliest work start date to today if not stated explicitly.
- Preserve original company/institution names exactly.
- If a field is truly absent, use null.
- achievements must be bullet-point or sentence fragments as found.
""".strip()


async def extract_strctured_cv_data(
        full_text: str,
        provider: str = "openai",
        max_retries: int = 3
) -> dict[str, Any]:
    
    user_message = f"Parse this CV and return the JSON: \n\n{full_text[:15_000]}"

    last_error: Exception | None = None

    for attempt in range(1, max_retries + 1):
        try:
            if provider == "openai":
                response = await openai.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system","content": SYSTEM_PROMPT},
                        {"role": "user", "content": user_message}
                    ],
                    temperature=0
                )
                raw = response.choices[0].message.content.strip()
            elif provider == "google":
                model_instance = genai.GenerativeModel("gemini-2.5-flash")
                response = model_instance.generate_content(
                    SYSTEM_PROMPT + "\n\n" + user_message
                )
                raw = response.text.strip()
            else:
                raise ValueError(f"Unsupported provider: {provider}")

            # Clean JSON

            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
                raw = raw.strip()
            parsed = json.loads(raw)

            logger.info(
                "LLM CV parse succeeded via %s on attempt %d",
                provider,
                attempt
            )

            return parsed
        
        except json.JSONDecodeError as e:
            logger.warning("Attempt %d: JSON decode error — %s", attempt, e)
            last_error = e
        except Exception as e:
            wait = 2 ** attempt
            logger.warning("Attempt %d failed (%s), retrying in %ds", attempt, e, wait)
            last_error = e 
            await asyncio.sleep(wait)
    raise ValueError(
        f"Failed to extract structured CV data after {max_retries} attempts: {last_error}"
    )



async def generate_score_narrative(
        candidate_name: str | None,
        job_title: str,
        score_breakdown: dict[str,float],
        matched_skills: list[str],
        missing_skills: list[str],
        years_of_experience: int | None,
        provider: str = "openai"
) -> str:
    
    prompt = f"""
        You are a Big 4 senior recruiter. Write a concise 2-3 sentence assessment.

        Candidate: {candidate_name or "Unknown"}
        Target role: {job_title}
        Years of experience: {years_of_experience or "Unknown"}
        Score breakdown: {json.dumps(score_breakdown)}
        Matched skills: {', '.join(matched_skills[:10]) or 'None'}
        Missing skills: {', '.join(missing_skills[:5]) or 'None'}

        Response with the assessment only.
    """.strip()

    try:
        if provider == "openai":
            response = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "user","content": prompt}
                ],
                temperature=0.3
            )
            return response.choices[0].message.content.strip()
        elif provider == "google":
            model_instance = genai.GenerativeModel("gemini-2.5-flash")
            response = model_instance.generate_content(prompt)
            return response.text.strip()
    except Exception as e:
        logger.warning("Narrative generation failed %s",e)
    
    overall = score_breakdown.get("overall",0)

    return (
        f"{candidate_name or 'This candidate'} scored {overall:.0f}/100 for the "
        f"{job_title} role. "
        f"They match {len(matched_skills)} skills and are missing {len(missing_skills)}."
    )