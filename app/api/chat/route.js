import { GoogleGenerativeAI } from "@google/generative-ai";
import { getLearnerModel } from "@/lib/learnerModel";
import { buildSystemPrompt } from "@/lib/buildSystemPrompt";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req) {
  try {
    const { messages, userId } = await req.json();
    
    if (!userId) {
      return Response.json({ error: "Missing userId" }, { status: 400 });
    }

    const model = await getLearnerModel(userId);
    const systemPrompt = buildSystemPrompt(model);
    
    console.log("=== SYSTEM PROMPT ===");
    console.log(systemPrompt);
    console.log("=====================");
    
    const geminiModel = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt
    });

    const history = messages
      .slice(0, -1)
      .filter((m, index) => {
        if (index === 0 && m.role === "assistant") return false;
        return true;
      })
      .map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

    if (history.length > 0 && history[0].role === "model") {
      history.shift();
    }

    const chat = geminiModel.startChat({ history });
    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = result.response.text();

    return new Response(response, { 
      status: 200, 
      headers: { "Content-Type": "text/plain" } 
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const errorMessage = error.message || "Internal server error";
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
