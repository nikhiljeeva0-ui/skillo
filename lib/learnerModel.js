import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_MODEL = {
  userId: "",
  profile: {
    name: "Student",
    grade: 9,
    board: "CBSE",
    language: "en",
    school_type: "government",
    goal: "board_exam"
  },
  signals: {
    topic_mastery: {},
    error_patterns: {},
    time_per_question: {},
    confidence: {}
  },
  learningStyle: {
    prefersAnalogy: true,
    prefersVisual: false,
    vocabularyLevel: "basic"
  },
  subjects: {
    maths: {
      curriculumId: "CBSE_G9_MATHS",
      topics: {}
    }
  },
  sessionStats: {
    totalSessions: 0,
    streakDays: 0,
    lastSeen: null
  },
  spacedRepetition: {}
};

export async function getLearnerModel(userId) {
  try {
    const { createClient } = await import(
      '@supabase/supabase-js'
    );
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('learner_models')
      .select('model_json')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.log('No model found, returning default');
      return getDefaultModel(userId);
    }

    return data.model_json;
  } catch (err) {
    console.error('getLearnerModel error:', err);
    return getDefaultModel(userId);
  }
}

function getDefaultModel(userId) {
  return {
    userId: userId,
    profile: {
      name: 'Student',
      grade: 9,
      board: 'CBSE',
      language: 'en',
      school_type: 'government',
      goal: 'board_exam'
    },
    signals: {
      topic_mastery: {},
      error_patterns: {},
      time_per_question: {},
      confidence: {}
    },
    learningStyle: {
      prefersAnalogy: true,
      prefersVisual: false,
      vocabularyLevel: 'basic'
    },
    subjects: {
      maths: {
        curriculumId: 'CBSE_G9_MATHS',
        topics: {}
      }
    },
    sessionStats: {
      totalSessions: 0,
      streakDays: 0,
      lastSeen: null
    },
    spacedRepetition: {}
  };
}

export async function saveLearnerModel(userId, model) {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase credentials not found. Skipping save.');
    return;
  }

  model.userId = userId;
  
  const { error } = await supabase
    .from('learner_models')
    .upsert({ 
      user_id: userId, 
      model_json: model,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('Failed to save learner model:', error);
  }
}

export function mergeInsights(model, insights) {
  if (!model.subjects) model.subjects = { maths: { curriculumId: "CBSE_G9_MATHS", topics: {} } };
  if (!model.subjects.maths) model.subjects.maths = { curriculumId: "CBSE_G9_MATHS", topics: {} };
  if (!model.subjects.maths.topics) model.subjects.maths.topics = {};
  if (!model.learningStyle) model.learningStyle = { prefersAnalogy: true, prefersVisual: false, vocabularyLevel: "basic" };
  if (!model.signals) model.signals = { confidence: {} };
  if (!model.signals.confidence) model.signals.confidence = {};
  if (!model.spacedRepetition) model.spacedRepetition = {};
  if (!model.sessionStats) model.sessionStats = { totalSessions: 0, streakDays: 0, lastSeen: null };

  const today = new Date().toISOString();
  const dateStr = today.split('T')[0];

  if (insights.topics_discussed && Array.isArray(insights.topics_discussed)) {
    const { updateReviewDate } = require("./spacedRepetition");
    insights.topics_discussed.forEach(t => {
      if (t.understood === true) {
        model.subjects.maths.topics[t.topic] = {
          status: "mastered",
          masteredAt: today,
          commonErrors: []
        };
        updateReviewDate(model, t.topic, true);
      } else if (t.understood === false) {
        model.subjects.maths.topics[t.topic] = {
          status: "shaky",
          lastAttempted: today,
          commonErrors: t.errors || []
        };
        updateReviewDate(model, t.topic, false);
      }
    });
  }

  if (insights.explanation_worked) {
    if (insights.explanation_worked.analogy === true) {
      model.learningStyle.prefersAnalogy = true;
    }
    if (insights.explanation_worked.step_by_step === true) {
      model.learningStyle.prefersVisual = true;
    }
  }

  if (insights.confidence_level) {
    model.signals.confidence[dateStr] = insights.confidence_level;
  }

  if (insights.needs_review && Array.isArray(insights.needs_review)) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 2);
    const nextDateStr = nextDate.toISOString().split('T')[0];
    insights.needs_review.forEach(topic => {
      model.spacedRepetition[topic] = nextDateStr;
    });
  }

  model.sessionStats.totalSessions = (model.sessionStats.totalSessions || 0) + 1;
  model.sessionStats.lastSeen = dateStr;

  return model;
}

