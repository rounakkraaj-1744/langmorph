import * as vscode from 'vscode';
import axios from "axios";
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "langmorph" is now active!');
	const disposable = vscode.commands.registerCommand('extension.langmorph', () => {
		const panel = vscode.window.createWebviewPanel(
			"langmorph", "LangMorph",
			vscode.ViewColumn.Two,
			{
				enableScripts: true
			}
		);
		panel.webview.html = getWebviewContent();
	});
	context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
	return `
	  <!DOCTYPE html>
	  <html lang="en">
	  <head>
		<meta charset="UTF-8">
		<script>
		  function convert() {
			const inputCode = document.getElementById('inputCode').value;
			const language = document.getElementById('language').value;
			vscode.postMessage({ text: inputCode, lang: language });
		  }
		</script>
	  </head>
	  <body>
		<textarea id="inputCode"></textarea>
		<select id="language">
		  <option value="python">Python</option>
		  <option value="javascript">JavaScript</option>
		  <option value="typescript">TypeScript</option>
		  <option value="java">Java</option>
		  <option value="cpp">C++</option>
		</select>
		<button onclick="convertCode()">Convert</button>
	  </body>
	  </html>
	`;
}

async function convertCode(fromLang: string, toLang: string): Promise<string> {
	const res = await axios.post("https://api.openai.com/v1/chat/completions", {
	  model: "gpt-4-turbo",
	  messages: [
		{ 
			role: "system",
			content: "You are an AI that converts code between languages with 100% accuracy." 
		},
			{
				role: "user",
				content: `Convert the following code to ${toLang}:\n\n${fromLang}`
			}
		]
	},
		{
			headers: { Authorization: `Bearer ${process.env.OPENAI_KEY}` }
		}
	);
  
	return res.data.choices[0].message.content;
  }