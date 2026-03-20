'use server';

import { GoogleGenAI } from "@google/genai";
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

    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY 
    });

    const learnerModel = await getLearnerModel(userId);
    const systemPrompt = buildSystemPrompt(learnerModel);

    console.log('userId:', userId);
    console.log('GEMINI_KEY exists:', !!process.env.GEMINI_API_KEY);
    console.log('messages:', messages.length);

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

    const lastMessage = 
      userMessages[userMessages.length - 1].content;

    const history = userMessages
      .slice(0, -1)
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
      .filter((_, i, arr) => {
        if (i === 0 && arr[0].role === 'model') 
          return false;
        return true;
      });

    const chat = ai.chats.create({
      model: 'gemini-2.0-flash',
      system: systemPrompt,
      history: history
    });

    const response = await chat.sendMessage({ 
      message: lastMessage 
    });

    console.log('Response received successfully');

    return new Response(response.text, { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error('CHAT API ERROR:', error.message);
    console.error('Full error:', error);
    return Response.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}
