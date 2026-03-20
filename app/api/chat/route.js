import { getLearnerModel } from "@/lib/learnerModel";
import { buildSystemPrompt } from "@/lib/buildSystemPrompt";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

export async function POST(req) {
  try {
    const { messages, userId } = await req.json();
    
    if (!messages || messages.length === 0) {
      return Response.json(
        { error: 'No messages provided' }, 
        { status: 400 }
      );
    }

    const model = await getLearnerModel(
      userId || 'student_001'
    );
    const systemPrompt = buildSystemPrompt(model);

    console.log('System prompt:', systemPrompt);
    console.log('Messages count:', messages.length);

    const validMessages = messages.filter((m, i) => {
      if (i === 0 && m.role === "assistant") return false;
      return true;
    });

    if (validMessages.length === 0) {
      return Response.json(
        { error: 'No valid messages' }, 
        { status: 400 }
      );
    }

    const lastMessage = 
      validMessages[validMessages.length - 1].content;
    
    const history = validMessages
      .slice(0, -1)
      .map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

    if (history.length > 0 && history[0].role === "model") {
      history.shift();
    }

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt
      },
      history: history
    });

    const response = await chat.sendMessage({ 
      message: lastMessage 
    });

    return new Response(response.text, { status: 200 });

  } catch (error) {
    console.error('CHAT API ERROR:', error);
    return Response.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}
