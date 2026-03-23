'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getLearnerModel } from "@/lib/learnerModel";
import { buildSystemPrompt } from "@/lib/buildSystemPrompt";

export async function POST(req) {
  try {
    const body = await req.json();
    const messages = body.messages || [];
    const userId = body.userId || 'student_001';

    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is missing!');
      return Response.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const learnerModel = await getLearnerModel(userId);
    const systemPrompt = buildSystemPrompt(learnerModel);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt 
    });

    const userMessages = messages.filter((m, i) => {
      if (i === 0 && m.role === 'assistant') return false;
      return true;
    });

    if (userMessages.length === 0) {
      return Response.json(
        { error: 'No messages' },
        { status: 400 }
      );
    }

    const lastMessage = userMessages[userMessages.length - 1].content;
    const history = userMessages
      .slice(0, -1)
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessage(lastMessage);
    const responseText = result.response.text();

    return new Response(responseText, { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('CHAT API ERROR:', error.message);
    const isRateLimit = error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED');
    return Response.json(
      { error: isRateLimit ? 'Too many requests. Please wait a moment and try again.' : 'Something went wrong. Please try again.' }, 
      { status: isRateLimit ? 429 : 500 }
    );
  }
}
