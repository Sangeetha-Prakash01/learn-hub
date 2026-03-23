import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const aiChat = async (req: Request, res: Response) => {
  try {
    const { message, context } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes('PLACEHOLDER')) {
      return res.json({
        success: true,
        reply: "[Demo Mode] Please add your free GEMINI_API_KEY to the .env file to enable the real AI!",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Model names to try in sequence - using v1 standard IDs
    const modelNames = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];
    let lastError = null;

    for (const modelName of modelNames) {
      try {
        console.log(`🤖 Attempting AI query with: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const prompt = `You are an expert AI study assistant for the LearnHub LMS.
        Context:
        - Course: "${context?.courseTitle || 'Main Studies'}"
        - Lesson: "${context?.lessonTitle || 'Introduction'}"
        
        Answer this student question clearly:
        "${message}"`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        
        console.log(`✅ Success with ${modelName}`);
        return res.json({ success: true, reply: text });
      } catch (err: any) {
        lastError = err;
        console.warn(`⚠️ ${modelName} fail:`, err.message || err);
        // If it's a 404, we continue to the next model
        if (err.message?.includes('404') || err.message?.includes('not found')) continue;
        // If it's a quota error, keep trying others too just in case
        continue;
      }
    }

    // If we reach here, ALL models failed
    console.error('Final failure for all models');
    const msg = lastError?.message || "AI service is temporarily unavailable.";
    return res.status(500).json({ success: false, message: `AI Error: ${msg}` });
  } catch (error: any) {
    console.error('AI Route Error:', error.message || error);
    return res.status(500).json({ success: false, message: `AI Error: ${error.message}` });
  }
};
