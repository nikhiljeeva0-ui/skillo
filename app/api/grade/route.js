'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const { assignmentId, userId, answers } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: 'GEMINI_API_KEY missing' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Fetch assignment
    const { data: assignment, error: fetchErr } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (fetchErr || !assignment) {
      return Response.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Fetch learner model for memory-aware grading
    const { data: learnerData } = await supabase
      .from('learner_models')
      .select('model_json')
      .eq('user_id', userId || 'student_001')
      .single();

    const learnerModel = learnerData?.model_json || null;
    const shakyTopics = learnerModel?.subjects?.[assignment.subject]?.topics 
      ? Object.entries(learnerModel.subjects[assignment.subject].topics)
          .filter(([_, v]) => v.status === 'shaky')
          .map(([k]) => k.replace(/_/g, ' '))
      : [];

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const questions = assignment.questions;
    const gradingResults = [];
    let totalScore = 0;
    let totalMax = 0;

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const studentAnswer = answers[i] || '';
      totalMax += question.maxMarks || 10;

      const gradingPrompt = `
You are a strict but fair teacher grading a student answer.
You have memory of the student's past performance to give personalized feedback.

Student Name: ${learnerModel?.profile?.name || 'Student'}
Student's Weak Areas: ${shakyTopics.join(", ") || "None yet"}
Learning Strategy: ${JSON.stringify(learnerModel?.learningStyle || {})}

Question: ${question.text}
Correct Answer: ${question.answerKey}
Student Answer: ${studentAnswer}
Max Marks: ${question.maxMarks || 10}

Grade this answer and respond in JSON only:
{
  "marks_awarded": number,
  "is_correct": true or false,
  "feedback": "specific feedback in simple Hindi or English. Mention if they are making the same mistake as in their weak areas if applicable.",
  "explanation": "why correct answer is right",
  "improvement_tip": "how student can improve, tailored to their learning style"
}

Be encouraging but honest.
If partially correct, give partial marks.
If student answer is empty or blank, give 0 marks.`;

      try {
        const result = await model.generateContent(gradingPrompt);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);
        totalScore += parsed.marks_awarded || 0;
        gradingResults.push({
          questionIndex: i,
          questionText: question.text,
          correctAnswer: question.answerKey,
          studentAnswer,
          maxMarks: question.maxMarks || 10,
          ...parsed
        });
      } catch (e) {
        console.error(`Grading error for Q${i + 1}:`, e.message);
        gradingResults.push({
          questionIndex: i,
          questionText: question.text,
          correctAnswer: question.answerKey,
          studentAnswer,
          maxMarks: question.maxMarks || 10,
          marks_awarded: 0,
          is_correct: false,
          feedback: "Could not grade this answer automatically.",
          explanation: question.answerKey,
          improvement_tip: "Try studying this topic again."
        });
      }
    }

    // Save submission
    const submissionId = `sub_${Date.now()}`;
    await supabase.from('submissions').insert({
      id: submissionId,
      assignment_id: assignmentId,
      user_id: userId || 'student_001',
      answers: answers,
      ai_score: totalScore,
      ai_feedback: gradingResults,
      status: 'graded',
      submitted_at: new Date().toISOString()
    });

    // Update learner model with weak topics found
    try {
      const { data: learnerData } = await supabase
        .from('learner_models')
        .select('model_json')
        .eq('user_id', userId || 'student_001')
        .single();

      if (learnerData) {
        const lm = learnerData.model_json;
        if (!lm.subjects) lm.subjects = { maths: { topics: {} } };
        if (!lm.subjects[assignment.subject]) lm.subjects[assignment.subject] = { topics: {} };

        gradingResults.forEach(r => {
          const topicKey = r.questionText.substring(0, 30).replace(/\s+/g, '_').toLowerCase();
          if (r.is_correct) {
            lm.subjects[assignment.subject].topics[topicKey] = {
              status: "mastered",
              masteredAt: new Date().toISOString()
            };
          } else {
            lm.subjects[assignment.subject].topics[topicKey] = {
              status: "shaky",
              lastAttempted: new Date().toISOString(),
              commonErrors: [r.feedback]
            };
          }
        });

        await supabase.from('learner_models').upsert({
          user_id: userId || 'student_001',
          model_json: lm,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }
    } catch (e) {
      console.error('Learner model update error:', e.message);
    }

    return Response.json({
      submissionId,
      totalScore,
      totalMax,
      results: gradingResults
    });

  } catch (error) {
    console.error('GRADE API ERROR:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
