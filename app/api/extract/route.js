import { GoogleGenerativeAI } from "@google/generative-ai";
import { getLearnerModel, saveLearnerModel, mergeInsights } from "@/lib/learnerModel";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req) {
  try {
    const { messages, userId } = await req.json();

    if (!userId || !messages || messages.length === 0) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const model = await getLearnerModel(userId);

    const systemPrompt = `You are an education analyst. Analyze this tutoring conversation
and extract learning insights. Respond ONLY in valid JSON.
No extra text, no markdown, no explanation.

Return exactly this structure:
{
  "topics_discussed": [
    {
      "topic": "string",
      "understood": true,
      "errors": ["string"]
    }
  ],
  "explanation_worked": {
    "analogy": true,
    "step_by_step": true,
    "formula": true
  },
  "confidence_level": "low",
  "needs_review": ["string"],
  "session_quality": "progressing"
}`;

    const geminiModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: systemPrompt
    });

    const conversationText = messages.map(m => `${m.role}: ${m.content}`).join("\n");
    const result = await geminiModel.generateContent(conversationText);
    const responseText = result.response.text();
    
    // Clean markdown if present
    const cleanJSON = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const insights = JSON.parse(cleanJSON);

    const updatedModel = mergeInsights(model, insights);
    await saveLearnerModel(userId, updatedModel);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Extraction API error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
