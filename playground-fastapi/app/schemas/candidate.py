from __future__ import annotations
from datetime import date 
from typing import Any 
from pydantic import BaseModel, Field, field_validator


class PDFPageContent(BaseModel):
    page_number: int 
    text: str 
    tables: list[list[list[str]]] = Field(default_factory=list)


class ContactInfo(BaseModel):
    name: str | None = None 
    email: str | None = None 
    phone: str | None = None 
    linkedin: str | None = None 
    location: str | None = None 

class WorkExperience(BaseModel):
    company: str | None = None 
    title: str | None = None 
    start_date: str | None = None 
    end_date: str | None =  None 
    is_current: bool = False
    description: str | None = None 
    achievements: list[str] = Field(default_factory=list)


class Education(BaseModel):
    institution: str | None = None 
    degree: str | None = None 
    field_of_study: str | None = None 
    start_date: str | None = None 
    end_date: str | None = None 
    gpa: float | None = None 
    honors: str | None = None 

class Certification(BaseModel):
    name: str 
    issuer: str | None = None 
    date_obtained: str | None = None 
    expiry_date: str | None = None

class CVStructuredData(BaseModel):
    contact: ContactInfo = Field(default_factory=ContactInfo)
    summary: str | None = None 
    work_experience = list[WorkExperience] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    raw_skills: list[str] = Field(default_factory=list)
    certifications: list[Certification] = Field(default_factory=list)
    languages: list[str] = Field(default_factory=list)
    years_of_experience: int | None = None

    @field_validator("years_of_experience", mode="before")
    @classmethod
    def coerce_yoe(cls, v: Any) -> int | None:
        if v is None:
            return None
        try:
            return int(v)
        except (ValueError, TypeError):
            return None
        

class NormalizedSkill(BaseModel):
    raw: str 
    canonical: str 
    proficiency: str | None = None 
    is_big4_relevant: bool = False


class PDFExtractResponse(BaseModel):
    filename: str 
    total_pages: int 
    pages: list[PDFPageContent]
    full_text: str
    structured_data: CVStructuredData | None = None
    normalized_skills: list[NormalizedSkill] = Field(default_factory=list)


class ScoringCriteria(BaseModel):
    """
        Criteria sent from the HR user / job description 
    """
    job_title: str 
    required_skills: list[str] = Field(default_factory=list)
    preferred_skills: list[str] = Field(default_factory=list)
    min_years_experience: int = 0
    education_requirement: str | None = None 
    service_line: str | None = None

class ScoreBreakdown(BaseModel):
    skill_match: float 
    experience: float 
    education: float
    big4_fit: float 
    overall: float

class CandidateScore(BaseModel):
    candidate_id: int 
    name: str | None 
    score_breakdown: ScoreBreakdown 
    matched_skills: list[str]
    missing_skills: list[str]
    recommendation: str 
    ai_summary: str

class SearchRequest(BaseModel):
    query: str 
    top_k: int = 10
    filters: dict[str, Any] = Field(default_factory=dict)

class SearchResult(BaseModel):
    candidate_id: int 
    name: str | None 
    similarity_score: float 
    snippet: str 

class SearchResponse(BaseModel):
    query: str 
    results: list[SearchResult]
    total_found: int 

class UploadResponse(BaseModel):
    candidate_id: int
    message: str
    structured_data: CVStructuredData | None = None
    normalized_skills: list[NormalizedSkill] = Field(default_factory=list)
    score: CandidateScore | None = None
