import { getLearnerModel } from "@/lib/learnerModel";
import { buildReport } from "@/lib/reportBuilder";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return new Response("Missing userId", { status: 400 });
    }

    const model = await getLearnerModel(userId);
    if (!model || !model.profile) {
      return new Response("No data found. Complete onboarding first.", { status: 404 });
    }

    const text = buildReport(model);
    return new Response(text, { status: 200 });
  } catch (error) {
    console.error("Report generation error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
