// script.js
// Currently empty, but you can add client-side logic here if needed

function saveApiKey() {
    document.cookie = `OPENAI_KEY=${document.getElementById("api-key").value}`;
}

