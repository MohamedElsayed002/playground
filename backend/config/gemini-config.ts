export const GeminiConfig = {
    models: {
      chat: 'gemini-2.5-flash',
      vision: 'gemini-2.5-flash',
      imageGen: 'gemini-2.5-flash-image-preview',
      pro: 'gemini-2.5-pro',
      embedding: 'text-embedding-004',
    },
  
    thinkingBudgets: {
      simple: 1024,
      medium: 4096,
      complex: 8192,
      advanced: 16384,
    },
  
    pricing: {
      'gemini-2.5-flash': {
        inputPer1M: 0.075,
        outputPer1M: 0.3,
        cachedDiscount: 0.75,
      },
      'gemini-2.5-pro': {
        inputPer1M: 1.25,
        outputPer1M: 5.0,
        cachedDiscount: 0.75,
      },
    },
  };
  