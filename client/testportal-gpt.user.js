// ==UserScript==
// @name         testportal-gpt
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds auto-solve functionality to Testportal
// @author       github.com/danrog303
// @require      https://cdn.jsdelivr.net/npm/topbar@2.0.1/topbar.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/toastify-js/1.6.1/toastify.js
// @match        https://www.testportal.net/*
// @match        https://www.testportal.pl/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=testportal.net
// @grant        GM_addStyle
// ==/UserScript==
(function() {
    'use strict';
    /*global topbar, Toastify*/

    // OpenAI API key, required to make requests to ChatGPT API.
    const OPEN_AI_KEY = "YOUR KEY HERE";

    // Choose "gpt-3.5-turbo" for speed and cheaper API calls.
    // Choose or "gpt-4-1106-preview" for best possible results.
    const TARGET_GPT_MODEL = "gpt-3.5-turbo"

    // If true, the plugin will make auto-solve button barely visible and won't display the loading indicator.
    const INCOGNITO_MODE = false;

    // URL to testportal-gpt API.
    // The official URL is "https://testportal-gpt.danielrogowski.net/questions", but you can use your own self-hosted instance.
    const TESTPORTAL_GPT_API = "https://testportal-gpt.danielrogowski.net/questions";

    GM_addStyle(`@import "https://cdnjs.cloudflare.com/ajax/libs/toastify-js/1.6.1/toastify.min.css";`);

    // Obtains current question type (single-choice, multiple-choice, descriptive-short, descriptive-long).
    // Can also return null, if current page is not a question page.
    const getCurrentQuestionType = () => {
        if (document.querySelector(".question_answers .rich-text-answer-container") !== null) {
            return "open-ended-long";
        } else if (document.querySelector(".question_answers .all_short_answers") !== null) {
            return "open-ended-short";
        } else if (document.querySelector(".question_answers .mdc-checkbox") !== null) {
            return "closed-ended-multiple-choice";
        } else if (document.querySelector(".question_answers .mdc-radio") !== null) {
            return "closed-ended-single-choice";
        } else {
            return null;
        }
    };

    // Returns true, if the current question has any images attached.
    // Otherwise, returns false.
    const isQuestionWithImage = () => {
        if (getCurrentQuestionType() === null) {
            return false;
        }

        if (document.querySelector(".question-area img.lazy") !== null) {
            return true;
        }

        return document.querySelector(".question-area .image-zoom-wrapper") !== null;
    }

    // Reads question form and creates object that stores basic question information
    // (question type, content, possible answers)
    const parseCurrentQuestion = () => {
        const question = {
            "question-type": getCurrentQuestionType(),
            "question-content": document.querySelector(".question_essence").innerText
        };

        if (question["question-type"].startsWith("closed-ended")) {
            const answerElements = document.querySelectorAll(".answer_container");
            const answerElementsArray = Array.prototype.slice.call(answerElements);
            question["choices"] = answerElementsArray.map(elem => elem.innerText);
        }

        return question;
    };

    // Connects to the API and fetches the answer for a specified question
    const fetchResponseForQuestion = async (question) => {
        const apiRequestBody = {
            "question": question,
            "gpt-model": TARGET_GPT_MODEL,
            "open-ai-key": OPEN_AI_KEY
        };
        const apiRequestHeaders = {
            "Content-Type": "application/json"
        };
        const apiRequest = {method: "POST", body: JSON.stringify(apiRequestBody), headers: apiRequestHeaders};
        const apiResponse = await fetch(TESTPORTAL_GPT_API, apiRequest);
        return await apiResponse.json();
    };

    // Depending on the API response, imputes correct answers to the question form
    const autoSolveCurrentQuestion = (event) => {
        event.preventDefault();

        if (isQuestionWithImage()) {
            Toastify({
                text: "The plugin can not solve questions with images...",
                duration: 5000,
                gravity: "bottom"
            }).showToast();
            return;
        }

        setLoading(true);
        const currentQuestion = parseCurrentQuestion();
        let currentQuestionResponse = fetchResponseForQuestion(currentQuestion);

        currentQuestionResponse.then(currentQuestionAnswer => {
            setLoading(false);

            if (currentQuestionAnswer.hasOwnProperty("error")) {
                throw {msg: currentQuestionAnswer.error};
            }

            if (currentQuestion["question-type"] === "open-ended-long") {
                const answerFrame = document.getElementById("givenAnswer_ifr");
                const answerFrameDoc = answerFrame.contentDocument ? answerFrame.contentDocument : answerFrame.contentWindow.document;
                answerFrameDoc.body.innerHTML = currentQuestionAnswer["answer-content"];
            } else if (currentQuestion["question-type"] === "open-ended-short") {
                document.querySelector(".mdc-text-field__input").value = currentQuestionAnswer["answer-content"];
            } else if (currentQuestion["question-type"] === "closed-ended-single-choice") {
                const answerRadios = document.querySelectorAll("#questionForm input[type='radio']");
                const correctNum = parseInt(currentQuestionAnswer["answer-content"]) - 1;
                answerRadios[correctNum].checked = true;
            } else if (currentQuestion["question-type"] === "closed-ended-multiple-choice") {
                const answerCheckboxes = document.querySelectorAll("#questionForm input[type='checkbox']");
                const correctNums = currentQuestionAnswer["answer-content"].split(",").map(elem => parseInt(elem) - 1);
                for (let i = 0; i < answerCheckboxes.length; i++) {
                    answerCheckboxes[i].checked = correctNums.includes(i);
                }
            }
        }).catch(error => {
            console.error(error);
            const errorText = error?.msg ?? "Some error happened during the API communication...";
            Toastify({
                text: errorText,
                duration: 5000,
                gravity: "bottom"
            }).showToast();
            setLoading(false);
        });
    };

    // Allows to toggle the loading top bar
    const setLoading = (isLoading) => {
        // On incognito mode, the plugin should not display the loading indicator.
        if (INCOGNITO_MODE && isLoading) {
            return;
        }

        const gptBtn = document.getElementById("testportal-gpt-btn");
        gptBtn.disabled = !!isLoading;

        if (isLoading) {
            topbar['show']();
        } else {
            topbar['hide']();
        }
    };

    // Mounts the auto-solve button
    if (getCurrentQuestionType() !== null) {
        const autoSolveBtn = document.createElement("button");
        autoSolveBtn.id = "testportal-gpt-btn";
        autoSolveBtn.classList.add("mdc-button", "mdc-button--raised");
        autoSolveBtn.addEventListener("click", autoSolveCurrentQuestion);
        autoSolveBtn.innerText = "Auto-solve";
        if (INCOGNITO_MODE) {
            autoSolveBtn.style.opacity = "0.05";
            autoSolveBtn.style.backgroundColor = "transparent";
            autoSolveBtn.style.color = "black";
        }

        document.querySelector(".test_button_box").append(autoSolveBtn);
    }

    // Mounts the loading top bar
    topbar['config']({
        autoRun: true,
        barThickness: 3,
        barColors: {
            '0':    'rgba(26, 188, 156, .9)',
            '0.25': 'rgba(52, 152,219, .9)',
            '0.50': 'rgba(241, 196, 15, .9)',
            '0.75': 'rgba(230, 126,  34, .9)',
            '1.0':  'rgba(211, 84, 0, .9)'
        },
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, .6)'
    });
    
    // Handle questions with images
    if (isQuestionWithImage()) {
        const autoSolveBtn = document.getElementById("testportal-gpt-btn");
        autoSolveBtn.disabled = true;
        autoSolveBtn.innerText = "Image questions not supported..."
    }
})();
