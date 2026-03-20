import { getLearnerModel, saveLearnerModel, mergeInsights } from "@/lib/learnerModel";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY 
});

export async function POST(req) {
  try {
    const { messages, userId } = await req.json();
    
    const model = await getLearnerModel(
      userId || 'student_001'
    );

    const conversation = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const extractionPrompt = `
You are an education analyst.
Analyze this tutoring conversation and extract insights.
Respond ONLY in valid JSON. No markdown, no extra text.

{
  "topics_discussed": [
    {
      "topic": "string",
      "understood": true or false,
      "errors": ["error1", "error2"]
    }
  ],
  "explanation_worked": {
    "analogy": true or false,
    "step_by_step": true or false,
    "formula": true or false
  },
  "confidence_level": "low or medium or high",
  "needs_review": ["topic1", "topic2"],
  "session_quality": "struggling or progressing or strong"
}

Conversation:
${conversation}`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: extractionPrompt
    });

    let responseText = result.text;
    responseText = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const insights = JSON.parse(responseText);
    const updatedModel = mergeInsights(model, insights);
    await saveLearnerModel(
      userId || 'student_001', 
      updatedModel
    );

    return Response.json({ success: true });

  } catch (error) {
    console.error('EXTRACT ERROR:', error);
    return Response.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}
