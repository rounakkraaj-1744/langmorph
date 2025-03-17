import * as vscode from "vscode";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "langmorph" is now active!');

	const disposable = vscode.commands.registerCommand("extension.langmorph", () => {
		const panel = vscode.window.createWebviewPanel(
			"langmorph",
			"LangMorph",
			vscode.ViewColumn.Two,
			{ 
				enableScripts: true 
			}
		);

		panel.webview.html = getWebviewContent();

		panel.webview.onDidReceiveMessage(async (message) => {
			const { text, lang } = message;
			try {
				const result = await convertCode(text, lang);
				panel.webview.postMessage({ result });
			}
			catch (error) {
				panel.webview.postMessage({ result: "Error: Failed to convert code." });
			}
		});
	});

	context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
	return `
	  <!DOCTYPE html>
	  <html lang="en">
	  <head>
		<meta charset="UTF-8">
		<title>LangMorph</title>
	  </head>
	  <body>
		<h2>Code Converter</h2>
		<textarea id="inputCode" placeholder="Enter your code here..."></textarea>
		<br>
		<select id="language">
		  <option value="python">Python</option>
		  <option value="javascript">JavaScript</option>
		  <option value="typescript">TypeScript</option>
		  <option value="java">Java</option>
		  <option value="cpp">C++</option>
		</select>
		<button onclick="convertCode()">Convert</button>
		<h3>Output:</h3>
		<pre id="outputCode"></pre>

		<script>
		  const vscode = acquireVsCodeApi();

		  function convertCode() {
			const inputCode = document.getElementById("inputCode").value;
			const language = document.getElementById("language").value;
			vscode.postMessage({ text: inputCode, lang: language });
		  }

		  window.addEventListener("message", (event) => {
			document.getElementById("outputCode").textContent = event.data.result;
		  });
		</script>
	  </body>
	  </html>
	`;
}

async function convertCode(fromLang: string, toLang: string): Promise<string> {
	// Debug: Check if the API key is loaded
	console.log("API Key:", process.env.STARCODER_API_KEY);

	if (!process.env.STARCODER_API_KEY) {
		throw new Error("Missing API Key");
	}

	const response = await axios.post(
		"https://api-inference.huggingface.co/models/bigcode/starcoder",
		{ inputs: `Translate this code to ${toLang}:\n\n${fromLang}` },
		{ headers: { Authorization: `Bearer ${process.env.STARCODER_API_KEY}` } }
	);

	// Debugging: Log response from Hugging Face
	console.log("API Response:", response.data);

	if (response.data.error) {
		throw new Error(response.data.error);
	}

	return response.data[0]?.generated_text || "Error: No output generated.";
}

