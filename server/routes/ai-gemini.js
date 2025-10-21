// Simple Gemini-Only AI Router
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google AI
let genAI = null;
if (process.env.GOOGLE_AI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
}

// Check if Gemini is available
const isGeminiAvailable = () => {
  const hasKey = process.env.GOOGLE_AI_API_KEY && 
         process.env.GOOGLE_AI_API_KEY !== 'your_google_ai_key_here' && 
         process.env.GOOGLE_AI_API_KEY !== '';
  
  // Debug logging for production
  console.log('🔍 AI Service Debug:', {
    hasKey: !!hasKey,
    genAI: !!genAI,
    keyLength: process.env.GOOGLE_AI_API_KEY ? process.env.GOOGLE_AI_API_KEY.length : 0
  });
  
  return genAI && hasKey;
};

// Query Gemini
const queryGemini = async (prompt) => {
  if (!genAI) {
    throw new Error('Google AI not configured. Please add GOOGLE_AI_API_KEY to your .env file');
  }
  
  try {
    // Use the correct model name for Gemini API
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro', // Fixed: Changed from 'gemini-1.5-flash' to 'gemini-pro'
      generationConfig: {
        temperature: 0.7, // Balanced creativity and accuracy
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    throw new Error(`Gemini error: ${error.message}`);
  }
};

// Post-process response to improve formatting and code suggestions
const improveResponse = (text) => {
  // Clean up markdown and make it more conversational
  let improved = text
    // Remove code block markers
    .replace(/```[\w]*\n?/g, '\n')
    .replace(/```/g, '')
    // Remove bold and italic markdown
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Clean up bullet points to be more natural
    .replace(/^\*\s+/gm, '• ')
    .replace(/^-\s+/gm, '• ')
    // Remove line numbers from code (Line 1:, Line 2:, etc.)
    .replace(/^Line \d+:\s*/gm, '')
    .replace(/^\d+:\s*/gm, '')
    .replace(/^\d+\.\s*/gm, '')
    // Remove excessive line breaks
    .replace(/\n{3,}/g, '\n\n')
    // Remove redundant phrases
    .replace(/Here's the.*?:/gi, '')
    .replace(/I hope this helps!?/gi, '')
    .replace(/Let me know if you have any.*?questions.*/gi, '')
    .replace(/Feel free to ask.*?/gi, '')
    // Make it more conversational
    .replace(/In order to/gi, 'To')
    .replace(/It is important to note that/gi, 'Keep in mind that')
    .replace(/Please note that/gi, 'Just so you know,')
    // Improve code placement instructions
    .replace(/You should add/gi, 'Add')
    .replace(/You need to/gi, 'Just')
    .replace(/You can/gi, 'You can')
    // Clean up any remaining line number patterns
    .replace(/(\n|^)\s*\d+\s*[\.\:\|\-]\s*/gm, '\n')
    // Trim whitespace
    .trim();
    
  return improved;
};

// Enhanced prompt for better coding responses
const createCodingPrompt = (userPrompt, code, fileName) => {
  // Detect different types of requests
  const isCodeModification = /add|insert|include|implement|create function|create method|fix|update|modify|change/i.test(userPrompt);
  const isAutocomplete = /complete|finish|what comes next|continue/i.test(userPrompt) || userPrompt.length < 20;
  const isErrorCheck = /error|bug|wrong|broken|not working|issue|debug/i.test(userPrompt);
  const isImprovement = /optimize|improve|better|refactor|clean up/i.test(userPrompt);
  
  let prompt = `You are an intelligent coding assistant with autocomplete and error-checking capabilities. Respond naturally like a helpful coding buddy.

User's question: ${userPrompt}`;

  if (code && fileName) {
    const fileExtension = fileName.split('.').pop();
    const codeLines = code.split('\n');
    const lineCount = codeLines.length;
    
    prompt += `

Current file: ${fileName} (${lineCount} lines)
Current code:
${code}`;

    // Analyze the code for context
    if (isAutocomplete) {
      const lastLine = codeLines[codeLines.length - 1];
      const lastNonEmptyLine = codeLines.reverse().find(line => line.trim() !== '') || '';
      
      prompt += `

AUTOCOMPLETE MODE: The user wants you to complete their code.
Last line: "${lastLine}"
Context: Look at the existing code structure and suggest what should come next.
Provide intelligent completions based on:
- Current function/class structure
- Variable names and types being used  
- Common patterns in ${fileExtension} files
- Proper syntax and indentation`;
    }

    if (isErrorCheck) {
      prompt += `

ERROR CHECKING MODE: Analyze the code for potential issues:
- Syntax errors
- Logic errors  
- Undefined variables
- Missing imports/dependencies
- Type mismatches
- Common ${fileExtension} pitfalls
Explain what's wrong and how to fix it specifically.`;
    }

    if (isImprovement) {
      prompt += `

OPTIMIZATION MODE: Suggest improvements:
- Performance optimizations
- Code readability
- Best practices for ${fileExtension}
- Security considerations
- Maintainability improvements
Show before/after examples with explanations.`;
    }

    if (isCodeModification) {
      prompt += `

CODE MODIFICATION MODE: Help them modify existing code:
1. Show EXACTLY where to place new code (use descriptive references like "after the handleClick function" or "inside the useEffect hook")
2. Match their existing coding style and indentation
3. Ensure the new code integrates properly with existing functions/variables
4. Check for potential conflicts or issues`;
    }
  }

  prompt += `

RESPONSE GUIDELINES:
- Write in plain text, conversational tone
- NO markdown formatting (no triple backticks, no bold/italic)
- When showing code, present it as clean, copyable blocks with proper indentation
- NEVER use line numbers (like "Line 6:", "Line 7:") - just show the actual code
- Use descriptive location references like "Add this after your existing function:" or "Replace the current if statement with:"
- If there are errors, explain them clearly and provide fixes
- For autocomplete, suggest 2-3 logical next lines
- Keep responses focused and under 400 words
- Make all code easily copyable without any prefixes or line numbers`;

  return prompt;
};

// Main chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { prompt, code, fileName, context } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    if (!isGeminiAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Gemini AI is not configured. Please add GOOGLE_AI_API_KEY to your .env file.',
        setup: {
          step1: 'Go to https://makersuite.google.com/app/apikey',
          step2: 'Create a free API key',
          step3: 'Add GOOGLE_AI_API_KEY=your_key to your .env file',
          step4: 'Restart the server'
        }
      });
    }

    const enhancedPrompt = createCodingPrompt(prompt, code, fileName);
    const rawResponse = await queryGemini(enhancedPrompt);
    const improvedResponse = improveResponse(rawResponse);

    res.json({
      success: true,
      response: improvedResponse,
      aiService: 'gemini-pro',
      message: 'Powered by CodeUnity AI (Google Gemini)',
      metadata: {
        hasCode: !!code,
        fileName: fileName || null,
        responseLength: improvedResponse.length,
        requestType: detectRequestType(prompt)
      }
    });

  } catch (error) {
    console.error('Gemini chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Gemini AI service error',
      error: error.message,
      fallback: 'Please check your GOOGLE_AI_API_KEY configuration'
    });
  }
});

// Quick autocomplete endpoint for real-time suggestions
router.post('/autocomplete', async (req, res) => {
  try {
    const { code, fileName, cursorPosition } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Code is required for autocomplete'
      });
    }

    if (!isGeminiAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Gemini AI not available'
      });
    }

    const lines = code.split('\n');
    const currentLine = cursorPosition ? lines[cursorPosition.line] || '' : lines[lines.length - 1];
    
    const autocompletePrompt = `You are a code autocomplete assistant. Look at this code and suggest what should come next.

File: ${fileName || 'untitled'}
Code:
${code}

Current/last line: "${currentLine}"

Provide 1-3 intelligent next lines that would logically follow. Consider:
- Function signatures and implementations
- Variable declarations and usage
- Control flow (if/else, loops, etc.)
- Proper syntax and indentation
- Common patterns for this file type

Respond in plain text with just the suggested code lines, properly indented. No explanations needed - just the code.`;

    const rawResponse = await queryGemini(autocompletePrompt);
    const suggestions = rawResponse.trim().split('\n').slice(0, 3); // Max 3 suggestions

    res.json({
      success: true,
      suggestions: suggestions,
      aiService: 'gemini-autocomplete'
    });

  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({
      success: false,
      message: 'Autocomplete service error',
      suggestions: []
    });
  }
});

// Helper function to detect request type
const detectRequestType = (prompt) => {
  if (/complete|finish|what comes next|continue/i.test(prompt)) return 'autocomplete';
  if (/error|bug|wrong|broken|not working|issue|debug/i.test(prompt)) return 'error-check';
  if (/optimize|improve|better|refactor|clean up/i.test(prompt)) return 'optimization';
  if (/add|insert|include|implement|create|fix|update|modify|change/i.test(prompt)) return 'modification';
  if (/what does|how does|explain|understand/i.test(prompt)) return 'explanation';
  return 'general';
};







// Status endpoint to check AI service availability
router.get('/status', async (req, res) => {
  try {
    const geminiAvailable = isGeminiAvailable();
    
    res.json({
      success: true,
      currentService: geminiAvailable ? 'gemini' : 'unavailable',
      services: {
        gemini: geminiAvailable,
        fallback: false // No fallback in Gemini-only system
      },
      model: 'Google Gemini Pro',
      capabilities: [
        'General AI chat and conversation',
        'Code questions and guidance',
        'Technical problem solving',
        'Multi-language support'
      ],
      message: geminiAvailable 
        ? 'Google Gemini AI is ready and available' 
        : 'Google AI API key is not configured. Please add GOOGLE_AI_API_KEY to your .env file',
      setup: !geminiAvailable ? {
        instruction: 'Get a free API key from https://makersuite.google.com/app/apikey',
        envVariable: 'GOOGLE_AI_API_KEY'
      } : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check AI status',
      error: error.message
    });
  }
});

module.exports = router;
