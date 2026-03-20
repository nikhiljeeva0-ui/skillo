const userId = "student_001";

async function verify() {
  console.log("1. Triggering extraction API with 5 messages simulating struggle with Polynomials...");
  const mockMessages = [
    { role: "assistant", content: "What is a polynomial?" },
    { role: "user", content: "I don't know, is it a shape?" },
    { role: "assistant", content: "Not quite! A polynomial is an expression consisting of variables and coefficients. For example x^2 + 2x + 1. Let's try this: what is the coefficient of x in that?" },
    { role: "user", content: "Is it 1?" },
    { role: "assistant", content: "Actually it is 2, because the term is 2x. Let's review the parts of an expression." },
  ];

  try {
    const extractRes = await fetch("http://localhost:3000/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: mockMessages, userId })
    });
    
    if (!extractRes.ok) {
      console.error("Extraction failed:", await extractRes.text());
      process.exit(1);
    }
    console.log("Extraction successful.");

    console.log("2. Waiting a moment for Supabase to persist...");
    await new Promise(r => setTimeout(r, 2000));

    console.log("3. Triggering Chat API to get new system prompt...");
    const chatRes = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hi" }], userId })
    });
    
    if (!chatRes.ok) {
      console.error("Chat API failed:", await chatRes.text());
      process.exit(1);
    }
    
    console.log("Chat responded:", await chatRes.text());
    console.log("Done! Check Next.js console for the System Prompt containing memory rules.");
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

verify();
