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
  const today = new Date().toISOString().split('T')[0];
  const lastSeen = model.sessionStats?.lastSeen;
  
  // Calculate streak
  let streak = model.sessionStats?.streakDays || 0;
  if (lastSeen) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yDate = yesterday.toISOString().split('T')[0];
    
    if (lastSeen === yDate) {
      streak = streak + 1;
    } else if (lastSeen !== today) {
      streak = 1;
    }
  } else {
    streak = 1;
  }

  // Update topics
  const topics = { ...(model.subjects?.maths?.topics || {}) };
  
  const { updateReviewDate } = require("./spacedRepetition");
  
  for (const item of insights.topics_discussed || []) {
    if (item.understood) {
      topics[item.topic] = {
        status: 'mastered',
        masteredAt: today,
        commonErrors: []
      };
      updateReviewDate(model, item.topic, true);
    } else {
      const existing = topics[item.topic] || {};
      const existingErrors = existing.commonErrors || [];
      const newErrors = item.errors || [];
      
      topics[item.topic] = {
        status: 'shaky',
        lastAttempted: today,
        commonErrors: [
          ...new Set([...existingErrors, ...newErrors])
        ].slice(0, 5)
      };
      updateReviewDate(model, item.topic, false);
    }
  }

  // Update spaced repetition
  const spaced = { ...(model.spacedRepetition || {}) };
  for (const topic of insights.needs_review || []) {
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + 2);
    spaced[topic] = reviewDate.toISOString().split('T')[0];
  }

  // Update learning style
  const style = { ...(model.learningStyle || {}) };
  if (insights.explanation_worked?.analogy) {
    style.prefersAnalogy = true;
  }
  if (insights.explanation_worked?.step_by_step) {
    style.prefersVisual = true;
  }

  return {
    ...model,
    subjects: {
      ...model.subjects,
      maths: {
        ...model.subjects?.maths,
        topics: topics
      }
    },
    learningStyle: style,
    spacedRepetition: spaced,
    sessionStats: {
      totalSessions: (model.sessionStats?.totalSessions || 0) + 1,
      streakDays: streak,
      lastSeen: today
    },
    signals: {
      ...model.signals,
      confidence: {
        ...(model.signals?.confidence || {}),
        [today]: insights.confidence_level || 'medium'
      }
    }
  };
}

