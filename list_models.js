const apiKey = "AIzaSyAN3Kb_3QTo5m-3iNsYE0BiEmGqCA2eyKQ";

async function check() {
  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=" + apiKey);
    const data = await response.json();
    console.log(JSON.stringify(data.models || data, null, 2));
  } catch (e) {
    console.error(e);
  }
}
check();
