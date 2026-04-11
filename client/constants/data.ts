export const cvReviewerFreeExample = `{
    "tier": "free",
    "analysis": {
      "matchPercentage": 68,
      "isGoodMatch": true,
      "verdict": "Good fit overall with a few skill gaps.",
      "matchedSkills": ["React", "TypeScript", "Node.js", "REST APIs", "Git"],
      "missingSkills": ["AWS", "CI/CD", "Testing"],
      "strengths": ["Strong frontend foundation", "Clear project impact", "Relevant stack"],
      "upgradePrompt": {
        "hiddenFeatures": [
          "Detailed weaknesses analysis",
          "5-7 actionable recommendations",
          "Experience level comparison",
          "Key highlights and achievements"
        ],
        "message": "Upgrade to Pro for full, job-specific optimization."
      }
    }
  }`;


export const cvReviewerProExample = `{
    "tier": "pro",
    "analysis": {
      "matchPercentage": 83,
      "isGoodMatch": true,
      "verdict": "Strong match with clear role alignment.",
      "matchedSkills": ["...all matched skills"],
      "missingSkills": ["...critical gaps"],
      "strengths": ["4-6 evidence-based strengths"],
      "weaknesses": ["3-5 specific weak points"],
      "recommendations": ["5-7 actionable improvements"],
      "experienceMatch": {
        "yearsRequired": "3+ years",
        "yearsInCV": "4 years",
        "assessment": "Meets requirement"
      },
      "keyHighlights": ["Top achievements from CV"]
    }
  }`;

export const jobTailorFreeExample = `{
    "tier": "free",
    "tailoredCV": {
      "tailoredSummary": "Job-focused summary...",
      "tailoredExperience": [
        { "company": "A", "tailoredBullets": ["max 3 bullets"] },
        { "company": "B", "tailoredBullets": ["max 3 bullets"] }
      ],
      "matchScoreImprovement": { "original": 62, "tailored": 74, "improvement": 12 },
      "topAddedKeywords": ["Top 5 ATS keywords"],
      "upgradePrompt": {
        "limitationsApplied": ["Only first 2 experiences", "No cover letter", "Limited ATS analysis"],
        "proFeatures": ["Full CV tailoring", "Cover letter", "Full ATS report", "Detailed changes summary"],
        "message": "Upgrade to unlock full optimization."
      }
    }
  }`;

export   const jobTailorProExample = `{
    "tier": "pro",
    "tailoredCV": {
      "tailoredSections": {
        "summary": "...",
        "experience": ["fully tailored entries with change reasons"],
        "skills": {
          "reordered": ["..."],
          "emphasized": ["..."],
          "addedKeywords": ["..."]
        }
      },
      "coverLetter": { "content": "...optional...", "tone": "professional", "wordCount": 300 },
      "matchAnalysis": {
        "original": 61,
        "tailored": 86,
        "improvement": 25,
        "breakdown": { "skillsMatch": 88, "experienceMatch": 82, "keywordsMatch": 90 }
      },
      "atsOptimization": {
        "addedKeywords": ["..."],
        "keywordDensity": [{ "keyword": "TypeScript", "density": 4 }],
        "compatibilityScore": 89
      },
      "changesSummary": { "totalChanges": 24, "sectionsModified": ["summary", "experience", "skills"] }
    }
  }`;