# testportal-gpt-client
> Auto-solving client for **testportal-gpt** project.

## Client description
**testportal-gpt-client** is a simple Tampermonkey userscript, designed to be used with **testportal-gpt** project. The script is injected to the Testportal website, where it looks for questions to be answered using AI. On the question page, a button with text "Auto-solve" is mounted. After clicking this button, a request to **testportal-gpt-api** will be made and the question will be automatically answered.

## How to use?
1. You need to obtain your own OpenAI API key:  
https://platform.openai.com/account/
2. Install the Tampermonkey browser extension
   - Firefox: [link](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - Google Chrome: [link](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en)
   - Opera: [link](https://addons.opera.com/en/extensions/details/tampermonkey-beta/)
   - Microsoft Edge: [link](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
   - Safari: [link](https://apps.apple.com/app/apple-store/id1482490089?mt=8)
3. Click [here](https://raw.githubusercontent.com/danrog303/testportal-gpt/main/client/testportal-gpt.user.js) to call the user script installer
4. Install the script by following on-screen instructions
5. Edit the imported script and replace OPEN_AI_KEY constant with your OpenAI key.
6. You can use those example tests to check whether the plugin works correctly: 
   - [example test on Testportal - English](https://www.testportal.net/test.html?t=PmdmAwMU5A3J)
   - [example test on Testportal - Polish](https://www.testportal.net/test.html?t=puHQFKFVXpdW&lang=pl)