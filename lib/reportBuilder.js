export function buildReport(model) {
  const lang = model.profile?.language || "English";
  const name = model.profile?.name || "Student";
  const grade = model.profile?.grade || "9";
  const dateStr = new Date().toLocaleDateString("en-IN");
  
  const streak = model.sessionStats?.streakDays || 0;
  
  const mathTopics = model.subjects?.maths?.topics || {};
  const mastered = Object.entries(mathTopics)
    .filter(([_, d]) => d.status === "mastered")
    .map(([t]) => t);
  const shaky = Object.entries(mathTopics)
    .filter(([_, d]) => d.status === "shaky")
    .map(([t]) => t);
    
  const errorPatterns = Object.values(mathTopics)
    .filter(d => d.status === "shaky" && d.commonErrors?.length > 0)
    .flatMap(d => d.commonErrors);

  let styles = [];
  if (model.learningStyle?.prefersAnalogy) styles.push("analogy");
  if (model.learningStyle?.prefersVisual) styles.push("step-by-step");
  if (styles.length === 0) styles.push("standard");
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const nextWeek = Object.entries(model.spacedRepetition || {})
    .filter(([_, date]) => new Date(date) >= today)
    .map(([t]) => t);
    
  const MasteredStr = mastered.length > 0 ? mastered.join(", ") : "None yet";
  const ShakyStr = shaky.length > 0 ? shaky.join(", ") : "None";
  const ErrorStr = errorPatterns.length > 0 ? errorPatterns.join("\n- ") : "None recorded";
  const NextWeekStr = nextWeek.length > 0 ? nextWeek.join(", ") : "General revision";
  const StyleStr = styles.join("/");

  if (lang === "हिंदी" || lang === "hi") {
    return `विद्या साप्ताहिक रिपोर्ट — ${name}
कक्षा ${grade} | ${dateStr}

इस हफ्ते:
✅ समझ आया: ${MasteredStr}
📚 अभी practice चल रही है: ${ShakyStr}
🔥 पढ़ाई streak: ${streak} दिन

${name} सबसे अच्छे सीखते हैं:
${StyleStr} से

ध्यान देना है:
- ${ErrorStr}

अगले हफ्ते focus:
${NextWeekStr}

शाबाश ${name}! 💪
— विद्या AI Tutor`;
  } else {
    return `Skillo Weekly Report — ${name}
Class ${grade} | ${dateStr}

THIS WEEK:
✅ Topics mastered: ${MasteredStr}
📚 Still practicing: ${ShakyStr}
🔥 Study streak: ${streak} days

YOUR CHILD LEARNS BEST THROUGH:
${StyleStr} explanations

NEEDS ATTENTION:
- ${ErrorStr}

NEXT WEEK FOCUS:
${NextWeekStr}

Keep it up, ${name}! 💪
— Skillo AI Tutor`;
  }
}
