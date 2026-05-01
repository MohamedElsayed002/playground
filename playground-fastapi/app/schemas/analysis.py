from pydantic import BaseModel, EmailStr
from typing import List, Optional

class WorkExperience(BaseModel):
    company: Optional[str]
    role: Optional[str]
    duration: Optional[str]
    description: Optional[str]

class Education(BaseModel):
    degree: Optional[str]
    institution: Optional[str]
    year: Optional[str]

class CVStructuredData(BaseModel):
    name: Optional[str]
    email: Optional[EmailStr]
    phone: Optional[str]
    skills: List[str] = []
    years_of_experience: Optional[int]
    education: List[Education] = []
    work_experience: List[WorkExperience] = []

