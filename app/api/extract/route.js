import { getLearnerModel, saveLearnerModel, mergeInsights } from "@/lib/learnerModel";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const { messages, userId } = await req.json();
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is missing');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const learnerModel = await getLearnerModel(
      userId || 'student_001'
    );

    const conversation = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const extractionPrompt = `
You are an education analyst.
Analyze this tutoring conversation and extract insights.
Respond ONLY in valid JSON.

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

    const result = await model.generateContent(extractionPrompt);
    const responseText = result.response.text();

    const insights = JSON.parse(responseText);
    const updatedModel = mergeInsights(learnerModel, insights);
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
