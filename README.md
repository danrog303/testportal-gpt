# testportal-gpt
> 🛠️ Auto-solver browser extension for TestPortal powered by ChatGPT.

## ✨ Project summary
Testportal (https://testportal.net) is a popular site that allows users to create tests containing closed-ended and open-ended questions. The **testportal-gpt** project provides a browser plugin that enables automatic exercise solving using artificial intelligence.

## ❓ How to use?
1) Install the extension from the Chrome Web Store (link coming soon) or build it from source.
2) Open and start your TestPortal exam.
3) At the bottom of the question, you will see the "Auto-solve" button.
4) Click it and this plugin will automatically solve the question for you!
5) Disclaimer: this extension requires providing own OpenAI API key in order to work; click 'Testportal GPT' icon on your browser status bar to access the extension configuration.


## 💥 Features
- Supports all kinds of questions (open questions, single choice, multiple choice).
- Supports questions with images.
- Supports configuration of OpenAI model (e.g. gpt-4o, gpt-3.5-turbo).
- Integrated anti-testportal feature: disable "honest respondent" functionality .
- Stealth mode (makes auto-solve button barely visible).
- Configuring additional context for OpenAI API.

## 🔨 How to build?
TestportalGPT is a Plasmo website plugin, which means it can be built using the Plasmo CLI. To build the plugin, you need to have Node.js and pnpm installed on your machine.
Currently only the Chrome browser is supported, Firefox support is coming soon.
```bash
$ pnpm install
$ pnpm build
```

## 📋 Version v1
The current version of the extension is v2, which is a complete rewrite of the extension. 
The previous version (v1) was based on the Tampermonkey script and had limited functionality.
To access the old version, you can find it in the [release-v1](https://github.com/danrog303/testportal-gpt/tree/release-v1) branch of the repository.

## 🖼️ Screenshots
![Screenshot 1](https://github.com/user-attachments/assets/047bdc1b-92c2-4398-8802-2d9774d0390b)

## 🎓 Disclaimer
The plugin is intended to be used for learning purposes only. The owner of the repository is not responsible for any consequences caused by improper use of the plugin (e.g. at school)

