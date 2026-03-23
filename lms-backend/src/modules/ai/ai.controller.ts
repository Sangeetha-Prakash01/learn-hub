import { Request, Response } from 'express';
import OpenAI from 'openai';
import { env } from '../../config/env';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder', // User needs to provide this
});

export const aiChat = async (req: Request, res: Response) => {
  try {
    const { message, context } = req.body; // message: user text, context: { courseTitle, lessonTitle }

    if (!process.env.OPENAI_API_KEY) {
      // Mock AI response if no key
      setTimeout(() => {
        return res.json({
          success: true,
          reply: `[MOCK AI] I see you're asking about "${context?.lessonTitle || 'this course'}". To enable real AI, please add OPENAI_API_KEY to your .env file.`,
        });
      }, 1000);
      return;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are an expert educational assistant for LearnHub LMS. 
          Help the student with their questions about the course: "${context?.courseTitle || 'Unknown'}".
          Current lesson: "${context?.lessonTitle || 'Unknown'}".
          Give concise, helpful, and professional answers. If you don't know the specific content of the video, provide general expert knowledge on the topic.`
        },
        { role: "user", content: message }
      ],
    });

    return res.json({
      success: true,
      reply: completion.choices[0].message.content,
    });
  } catch (error: any) {
    console.error('AI Error:', error);
    return res.status(500).json({ success: false, message: 'AI Assistant is currently unavailable' });
  }
};
