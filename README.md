# testportal-gpt
> Autosolver plugin for Testportal powered by ChatGPT

## Version v2 is coming
Version v2 is under active development. It will be packaged as a full-blown Chrome and Firefox extension (which means the plugin will not require Tampermonkey to work anymore). Other planned features are: support for MS Forms & Moodle, adding context information, GUI config menu and much more.

## Project summary
Testportal (https://testportal.net) is a popular site that allows users to create tests containing closed-ended and open-ended questions. The **testportal-gpt** project provides a browser plugin that enables automatic exercise solving using artificial intelligence.

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
6. Open a test on Testportal - there should be a button with text "Auto-solve". Clicking this button will auto-solve the question using AI.
7. You can use those example tests to check whether the plugin works correctly: 
   - [example test on Testportal - English](https://www.testportal.net/test.html?t=PmdmAwMU5A3J)
   - [example test on Testportal - Polish](https://www.testportal.net/test.html?t=puHQFKFVXpdW&lang=pl)

## Config options
You can edit the userscript to change configuration of **testportal-gpt-client**.
```
// You have to provide a valid OpenAI key here
const OPEN_AI_KEY = "YOUR KEY HERE";

// Here you can switch from official testportal-gpt-api instance 
// to your self-hosted one (see testportal-gpt-api docs for instructions)
const TESTPORTAL_GPT_API = "https://testportal-gpt.danielrogowski.net/questions";

// Please beware that GPT-4 models might not be available on all accounts
// And that GPT-4 calls are usually much slower than GPT-3.5
const TARGET_GPT_MODEL = "gpt-3.5-turbo"

// If true, the plugin will make auto-solve button barely visible
// and won't display the loading indicator.
const INCOGNITO_MODE = false;
```


## Project structure
1. **testportal-gpt-client**
   - Tampermonkey userscript written in JavaScript 
   - It is injected to Testportal website
   - It scrapes current question, sends it to **testportal-gpt-api**, and selects the correct answer
1. **testportal-gpt-api**
   - Simple REST API written in Go
   - it takes question, generates prompt for ChatGPT, proxies request to OpenAI API and returns 

## Disclaimer
The plugin is intended to be used for learning purposes only. The owner of the repository is not responsible for any consequences caused by improper use of the plugin (e.g. at school)
