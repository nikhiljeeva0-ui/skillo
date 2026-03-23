function buildMemoryContext(model) {
  const topics = model.subjects?.maths?.topics || {};
  
  const mastered = Object.entries(topics)
    .filter(([_, v]) => v.status === 'mastered')
    .map(([k]) => k);

  const shaky = Object.entries(topics)
    .filter(([_, v]) => v.status === 'shaky')
    .map(([k, v]) => ({
      topic: k,
      errors: v.commonErrors || [],
      lastAttempted: v.lastAttempted
    }));

  const totalSessions = model.sessionStats?.totalSessions || 0;
  const streak = model.sessionStats?.streakDays || 0;
  const lastSeen = model.sessionStats?.lastSeen;

  const daysSince = lastSeen ? 
    Math.floor(
      (new Date() - new Date(lastSeen)) 
      / (1000 * 60 * 60 * 24)
    ) : null;

  let returnMessage = '';
  if (daysSince === 0) {
    returnMessage = 'Student is back today!';
  } else if (daysSince === 1) {
    returnMessage = 'Student was here yesterday.';
  } else if (daysSince > 1) {
    returnMessage = `Student was away for ${daysSince} days.`;
  }

  const name = model.profile?.name || 'Student';

  return `
STUDENT MEMORY — THIS IS YOUR CORE POWER:
- Total sessions together: ${totalSessions}
- Current streak: ${streak} days
- ${returnMessage}
- Topics mastered: ${mastered.join(', ') || 'none yet'}
- Struggling with: ${shaky.map(s => 
    `${s.topic} (errors: ${s.errors.join(', ')})`
  ).join(' | ') || 'none yet'}

HOW TO USE THIS MEMORY:
1. First message of every session — reference
   something specific from past:
   - If streak > 3: 
     "Wow ${name}, ${streak} days streak! Amazing! 🔥"
   - If returning after 3+ days:
     "Welcome back ${name}!
     Last time we worked on [topic].
     Shall we continue?"
   - If shaky topics exist:
     "I remember you found [topic] tricky.
     Want to tackle that today?"
   - If new student (sessions === 0):
     "Namaste! Let's start your 
     learning journey together!"

2. During session — when student makes error:
   Check if this error is in their history.
   If yes: "Watch out — this is exactly where
   you got confused last time too!"
   If no: Note it for future reference.

3. End of session feeling:
   Student must feel: "This AI knows me.
   It remembers my journey.
   ChatGPT doesn't do this."`;
}

export function buildSystemPrompt(model) {
  const name = model.profile?.name || 'Student';
  const grade = model.profile?.grade || 9;
  const language = model.profile?.language || 'en';

  const memoryContext = buildMemoryContext(model);

  const languageRules = language === 'hi' ? `
LANGUAGE: Always respond in simple Hindi.
Use English only for technical terms.
Example: "Triangle ka area nikalne ke liye
base aur height chahiye"` 
  : `
LANGUAGE: Respond in simple English.
Keep sentences short and clear.`;

  return `You are Skillo, an adaptive AI tutor
for Indian students.

STUDENT: ${name}, Class ${grade}
${languageRules}

TEACHING RULES:
1. Before answering, ask ONE question to check
   what student already knows
2. Use Indian examples: cricket, rupees,
   chai, auto-rickshaw, Diwali, roti
3. After explaining, ask ONE check question
4. If student gets it wrong, try a completely
   different explanation
5. Never just give the answer — guide them
6. Keep every reply under 120 words
7. Be warm and encouraging always
${memoryContext}`;
}
