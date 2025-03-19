import * as vscode from "vscode";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";

const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
	const envConfig = fs.readFileSync(envPath, "utf-8");
	envConfig.split("\n").forEach((line) => {
		const [key, value] = line.split("=");
		if (key && value) {
			process.env[key.trim()] = value.trim();
		}
	});
}

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
				panel.webview.postMessage({ result, language: lang });
			}
			catch (error) {
				console.error("Conversion error:", error);
				panel.webview.postMessage({
					result: "// Error: Failed to convert code.",
					language: "javascript"
				});
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
		<link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet" />
		<style>
		  :root {
			--primary: #6366f1;
			--primary-hover: #4f46e5;
			--primary-gradient: linear-gradient(135deg, #6366f1, #4f46e5);
			--bg-dark: #0a0a0f;
			--bg-card: #1a1a2e;
			--text: #f8fafc;
			--text-muted: #94a3b8;
			--border: #2d2d44;
			--success: #10b981;
			--error: #ef4444;
			--warning: #f59e0b;
		  }

		  * {
			box-sizing: border-box;
			margin: 0;
			padding: 0;
		  }

		  body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
			background: var(--bg-dark);
			color: var(--text);
			line-height: 1.6;
			padding: 2rem;
			min-height: 100vh;
			background-image: 
			  radial-gradient(circle at 100% 100%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
			  radial-gradient(circle at 0% 0%, rgba(79, 70, 229, 0.1) 0%, transparent 50%);
			background-attachment: fixed;
		  }

		  .container {
			display: flex;
			gap: 2rem;
			max-width: 1200px;
			margin: 0 auto;
		  }

		  .header {
			text-align: center;
			margin-bottom: 3rem;
			position: relative;
			padding: 2rem;
			background: rgba(26, 26, 46, 0.5);
			border-radius: 16px;
			border: 1px solid var(--border);
			box-shadow: 0 0 30px rgba(99, 102, 241, 0.1);
		  }

		  .header::before {
			content: '';
			position: absolute;
			top: -20px;
			left: 50%;
			transform: translateX(-50%);
			width: 60px;
			height: 4px;
			background: var(--primary-gradient);
			border-radius: 2px;
		  }

		  h2 {
			font-size: 2.5rem;
			font-weight: 800;
			margin-bottom: 0.75rem;
			background: var(--primary-gradient);
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			letter-spacing: -0.025em;
			position: relative;
			display: inline-block;
		  }

		  .subtitle {
			color: var(--text-muted);
			font-size: 1.125rem;
			max-width: 600px;
			margin: 0 auto;
		  }

		  .card {
			background: var(--bg-card);
			border-radius: 16px;
			padding: 2rem;
			border: 1px solid var(--border);
			box-shadow: 
			  0 4px 6px -1px rgba(0, 0, 0, 0.1),
			  0 2px 4px -1px rgba(0, 0, 0, 0.06),
			  0 0 0 1px rgba(255, 255, 255, 0.05) inset;
			backdrop-filter: blur(10px);
			transition: transform 0.2s ease, box-shadow 0.2s ease;
			flex: 1;
		  }

		  .card:hover {
			transform: translateY(-2px);
			box-shadow: 
			  0 8px 12px -1px rgba(0, 0, 0, 0.15),
			  0 4px 6px -1px rgba(0, 0, 0, 0.1),
			  0 0 0 1px rgba(255, 255, 255, 0.1) inset;
		  }

		  .input-group {
			display: flex;
			gap: 1rem;
			margin: 1.5rem 0;
		  }

		  textarea {
			width: 100%;
			min-height: 240px;
			background: rgba(10, 10, 15, 0.5);
			color: var(--text);
			border: 1px solid var(--border);
			border-radius: 12px;
			padding: 1.25rem;
			font-family: 'JetBrains Mono', 'Fira Code', monospace;
			font-size: 0.95rem;
			line-height: 1.6;
			resize: vertical;
			transition: all 0.2s ease;
			tab-size: 2;
			white-space: pre;
			overflow-x: auto;
		  }

		  textarea:focus {
			outline: none;
			border-color: var(--primary);
			box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
			background: rgba(10, 10, 15, 0.8);
		  }

		  select {
			background: rgba(10, 10, 15, 0.5);
			color: var(--text);
			border: 1px solid var(--border);
			border-radius: 12px;
			padding: 0.75rem 2.5rem 0.75rem 1.25rem;
			font-size: 0.95rem;
			font-weight: 500;
			cursor: pointer;
			min-width: 180px;
			appearance: none;
			background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236366f1'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
			background-repeat: no-repeat;
			background-position: right 1rem center;
			background-size: 1.25em;
			transition: all 0.2s ease;
		  }

		  select:focus {
			outline: none;
			border-color: var(--primary);
			box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
			background-color: rgba(10, 10, 15, 0.8);
		  }

		  button {
			background: var(--primary-gradient);
			color: white;
			border: none;
			border-radius: 12px;
			padding: 0.75rem 2rem;
			font-size: 0.95rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s ease;
			display: flex;
			align-items: center;
			gap: 0.75rem;
			position: relative;
			overflow: hidden;
		  }

		  button::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			background: linear-gradient(rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
			transform: translateX(-100%) rotate(45deg);
			transition: transform 0.5s ease;
		  }

		  button:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
		  }

		  button:hover::before {
			transform: translateX(100%) rotate(45deg);
		  }

		  button:active {
			transform: translateY(0);
		  }

		  .output-container {
			margin-top: 0;
			position: relative;
			background: var(--bg-card);
			border-radius: 16px;
			padding: 2rem;
			border: 1px solid var(--border);
			box-shadow: 
			  0 4px 6px -1px rgba(0, 0, 0, 0.1),
			  0 2px 4px -1px rgba(0, 0, 0, 0.06);
			flex: 1;
		  }

		  .output-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-bottom: 1rem;
		  }

		  .output-title {
			color: var(--text);
			font-size: 1.1rem;
			font-weight: 600;
			display: flex;
			align-items: center;
			gap: 0.5rem;
		  }

		  .output-title::before {
			content: '';
			display: block;
			width: 8px;
			height: 8px;
			background: var(--success);
			border-radius: 50%;
			box-shadow: 0 0 10px var(--success);
		  }

		  .copy-button {
			background: var(--primary-gradient);
			color: white;
			border: none;
			border-radius: 8px;
			padding: 0.5rem 1rem;
			font-size: 0.9rem;
			font-weight: 500;
			cursor: pointer;
			transition: all 0.2s ease;
		  }

		  .copy-button:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
		  }

		  .code-container {
			position: relative;
			margin-top: 1rem;
		  }

		  pre[class*="language-"] {
    background: rgba(10, 10, 15, 0.5) !important;
    border-radius: 12px !important;
    padding: 1.25rem !important;
    margin: 0 !important;
    border: 1px solid var(--border) !important;
    position: relative;
    overflow: auto;
    max-height: 500px;
    tab-size: 2;
  }

		  pre[class*="language-"]::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 1px;
			background: linear-gradient(to right, var(--primary), transparent);
		  }

		  code[class*="language-"] {
			font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
			font-size: 0.95rem !important;
			line-height: 1.6 !important;
			text-shadow: none !important;
			white-space: pre-wrap; /* Wrap long lines */
			word-wrap: break-word; /* Break long words */
		  }

		  .line-numbers {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3rem;
    padding: 1.25rem 0.5rem;
    text-align: right;
    background: rgba(10, 10, 15, 0.3);
    color: var(--text-muted);
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 0.95rem;
    line-height: 1.6;
    user-select: none;
    border-right: 1px solid var(--border);
  }

  .editor-container {
    position: relative;
    margin-bottom: 1rem;
  }

  .editor-actions {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    gap: 0.5rem;
    z-index: 10;
  }

  .editor-action-button {
    background: rgba(10, 10, 15, 0.7);
    color: var(--text-muted);
    border: 1px solid var(--border);
    border-radius: 4px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .editor-action-button:hover {
    color: var(--text);
    background: rgba(99, 102, 241, 0.2);
    border-color: var(--primary);
  }

		  .token.comment, .token.prolog, .token.doctype, .token.cdata {
		  	color: #94a3b8 !important;
			font-style: italic !important;
		  }

		  .token.function {
			color: #818cf8 !important;
			font-weight: 600 !important;
		  }

		  .token.keyword {
			color: #f472b6 !important;
			font-weight: 600 !important;
		  }

		  .token.string {
			color: #34d399 !important;
		  }

		  .token.number {
			color: #fbbf24 !important;
		  }

		  .token.operator {
			color: #e879f9 !important;
		  }

		  .token.class-name {
			color: #60a5fa !important;
			font-weight: 600 !important;
		  }

		  .loading {
			display: none;
			align-items: center;
			gap: 0.75rem;
			color: var(--text-muted);
			font-size: 0.95rem;
			font-weight: 500;
			padding: 0.5rem 1rem;
			border-radius: 8px;
			background: rgba(99, 102, 241, 0.1);
			border: 1px solid rgba(99, 102, 241, 0.2);
		  }

		  .loading.active {
			display: flex;
		  }

		  @keyframes spin {
			to { transform: rotate(360deg); }
		  }

		  .spinner {
			width: 1.25rem;
			height: 1.25rem;
			border: 2px solid rgba(99, 102, 241, 0.3);
			border-top-color: var(--primary);
			border-radius: 50%;
			animation: spin 1s linear infinite;
		  }

		  @media (max-width: 640px) {
			body {
			  padding: 1rem;
			}

			.header {
			  margin-bottom: 2rem;
			  padding: 1.5rem;
			}

			h2 {
			  font-size: 2rem;
			}

			.card {
			  padding: 1.5rem;
			}

			.input-group {
			  flex-direction: column;
			}

			select {
			  width: 100%;
			}

			button {
			  width: 100%;
			  justify-content: center;
			}
		  }

		  /* Custom Scrollbar */
		  ::-webkit-scrollbar {
			width: 8px;
			height: 8px;
		  }

		  ::-webkit-scrollbar-track {
			background: var(--bg-dark);
			border-radius: 4px;
		  }

		  ::-webkit-scrollbar-thumb {
			background: var(--border);
			border-radius: 4px;
		  }

		  ::-webkit-scrollbar-thumb:hover {
			background: var(--primary);
		  }
		</style>
	  </head>
	  <body>
		<div class="container">
		  <div class="card">
			<textarea id="inputCode" 
				placeholder="// Enter your code here...&#10;// Our AI will transform it to your selected language while preserving logic and structure"
			  	spellcheck="false"></textarea>
				<div class="input-group">
					<select id="language">
						<option value="c">C</option>
						<option value="c++">C++</option>
						<option value="c#">C#</option>
						<option value="python">Python</option>
						<option value="java">Java</option>
						<option value="javascript">JavaScript</option>
						<option value="typescript">TypeScript</option>
						<option value="rust">Rust</option>
						<option value="go">GoLang</option>
						<option value="kotlin">Kotlin</option>

					</select>
					<button onclick="convertCode()">
						<span>Transform Code</span>
					</button>
				</div>
		  </div>

		  <div class="output-container">
			<div class="output-header">
			  <div class="output-title">Transformed Code</div>
			  <button class="copy-button" onclick="copyOutput()">Copy</button>
			  <div class="loading" id="loading">
				<div class="spinner"></div>
				<span>Transforming your code...</span>
			  </div>
			</div>
			<div class="code-container">
				<pre><code id="outputCode" class="language-javascript"></code></pre>
			</div>
		  </div>
		</div>

		<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-java.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-cpp.min.js"></script>

		<script>
		  const vscode = acquireVsCodeApi();
		  const loading = document.getElementById('loading');
		  const outputCode = document.getElementById('outputCode');
		  const inputCode = document.getElementById('inputCode');

		  function convertCode() {
			const code = inputCode.value.trim();
			if (!code) {
			  outputCode.textContent = '// Please enter some code to transform';
			  outputCode.className = 'language-javascript';
			  Prism.highlightElement(outputCode);
			  return;
			}

			const language = document.getElementById("language").value;
			loading.classList.add('active');
			outputCode.style.opacity = '0.5';
			
			vscode.postMessage({ text: code, lang: language });
		  }

		  function copyOutput() {
			const code = outputCode.textContent;
			navigator.clipboard.writeText(code).then(() => {
			  alert('Code copied to clipboard!');
			}).catch(err => {
			  console.error('Failed to copy code: ', err);
			});
		  }

		  window.addEventListener("message", (event) => {
			loading.classList.remove('active');
			outputCode.style.opacity = '1';
			outputCode.textContent = event.data.result;
			outputCode.className = 'language-' + event.data.language;
			Prism.highlightElement(outputCode);
		  });

		  // Initialize syntax highlighting
		  Prism.highlightElement(outputCode);

		  // Add smooth transition for the output
		  outputCode.style.transition = 'opacity 0.3s ease';

		  // Add tab support for the textarea
		  inputCode.addEventListener('keydown', function(e) {
			if (e.key === 'Tab') {
			  e.preventDefault();
			  const start = this.selectionStart;
			  const end = this.selectionEnd;
			  this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
			  this.selectionStart = this.selectionEnd = start + 2;
			}
		  });
		</script>
	  </body>
	  </html>
	`;
}

async function convertCode(fromLang: string, toLang: string): Promise<string> {
	const apiKey = process.env.GEMINI_API_KEY;

	if (!apiKey) {
		console.error("Missing API Key");
		throw new Error("Missing API Key");
	}

	try {
		const requestPayload = {
			contents: [
				{
					parts: [
						{
							text: `Convert the ${fromLang} code to ${toLang}:\n\n${fromLang} and return only the code without the fenced code block`,
						},
					],
				},
			],
		};

		console.log("Sending request to Gemini API with payload:", JSON.stringify(requestPayload, null, 2));

		const response = await axios.post(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
			requestPayload,
			{
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

		console.log("API Response:", JSON.stringify(response.data, null, 2));

		const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

		if (!generatedText) {
			throw new Error("No output generated by the API.");
		}

		return generatedText;
	}
	catch (error: any) {
		console.error("API Request Failed:", error.message);
		if (error.response) {
			console.error("API Response Error:", JSON.stringify(error.response.data, null, 2));
		}
		else if (error.request) {
			console.error("No response received:", error.request);
		}
		else {
			console.error("Error setting up the request:", error.message);
		}
		return "Error: Failed to fetch data from API.";
	}
}