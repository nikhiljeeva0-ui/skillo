export function getTopicsForToday(model) {
  if (!model || !model.spacedRepetition) return [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  let topicsToReview = [];

  // Rules 1: topics where review date <= today
  for (const [topic, dateStr] of Object.entries(model.spacedRepetition)) {
    const reviewDate = new Date(dateStr);
    if (reviewDate <= today) {
      topicsToReview.push(topic);
    }
  }

  // Rules 2: topics where status === "shaky" and lastAttempted 2+ days ago
  const mathTopics = model.subjects?.maths?.topics || {};
  for (const [topic, data] of Object.entries(mathTopics)) {
    if (data.status === "shaky" && data.lastAttempted) {
      if (!topicsToReview.includes(topic)) {
        const lastAttempted = new Date(data.lastAttempted);
        const diffDays = Math.floor((today - lastAttempted) / (1000 * 60 * 60 * 24));
        if (diffDays >= 2) {
          topicsToReview.push(topic);
        }
      }
    }
  }

  // Return max 3 topics
  return topicsToReview.slice(0, 3);
}

export function updateReviewDate(model, topic, understood) {
  if (!model.spacedRepetition) model.spacedRepetition = {};
  
  const nextDate = new Date();
  if (understood === true) {
    nextDate.setDate(nextDate.getDate() + 7);
  } else {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  model.spacedRepetition[topic] = nextDate.toISOString().split('T')[0];
  return model;
}
