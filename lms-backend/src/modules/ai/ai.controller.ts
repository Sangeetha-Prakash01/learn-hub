import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export const aiChat = async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
    });

    return res.json({
      success: true,
      reply: result.text,
    });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};