import type { PlasmoCSConfig } from "plasmo";
import React, { useState, type CSSProperties, type MouseEvent } from "react";
import { createRoot } from "react-dom/client";
import { toast, ToastContainer } from 'react-toastify';
import usePluginConfig from "~hooks/use-plugin-config";
import useQuestionSolver from "~hooks/use-question-solver";
import type { Answer, ClosedQuestionAnswer, OpenQuestionAnswer, Question, QuestionType } from "~models/questions";

export const config: PlasmoCSConfig = {
    matches: [
        "https://testportal.pl/*",
        "https://testportal.net/*",
        "https://*.testportal.pl/*",
        "https://*.testportal.net/*",
    ]
};

// Reload the page when the plugin configuration changes.
// chrome.runtime.onMessage.addListener((message) => {
//     if (message.name === MSG_GLOBAL_STATE_CHANGE) {
//         console.log("TestportalGPT content script received a message:", message);
//         window.location.reload();
//     }
// });

const TestportalAutoSolve = () => {
    const [ isLoading, setLoading ] = useState(false);
    const { generateAnswer } = useQuestionSolver();
    const { pluginConfig } = usePluginConfig();

    function getCurrentQuestionType(): QuestionType {
        if (document.querySelector(".question_answers .rich-text-answer-container") !== null) {
            return "openLong";
        } else if (document.querySelector(".question_answers .all_short_answers") !== null) {
            return "openShort";
        } else if (document.querySelector(".question_answers .mdc-checkbox") !== null) {
            return "closedMultipleChoice";
        } else if (document.querySelector(".question_answers .mdc-radio") !== null) {
            return "closedSingleChoice";
        } else {
            throw {msg: "Unknown question type"};
        }
    }

    function getImageAttachmentUrl(): string | null {
        const imageTag = document.querySelector(".question_essence img");
        if (imageTag !== null) {
            return (imageTag as HTMLImageElement).src;
        } else {
            return null;
        }
    }

    function parseCurrentQuestion(): Question {
        let question: Question;
        const questionType = getCurrentQuestionType();

        if (questionType === "openLong" || questionType === "openShort") {
            question = {
                answerType: questionType == "openLong" ? "long" : "short",
                content: (document.querySelector(".question_essence") as HTMLElement).innerText,
                imageAttachmentUrl: getImageAttachmentUrl()
            }
        } else if (questionType === "closedSingleChoice" || questionType === "closedMultipleChoice") {
            const answerElements = document.querySelectorAll(".answer_container");
            const answerElementsArray = Array.prototype.slice.call(answerElements);
            question = {
                answerType: questionType === "closedSingleChoice" ? "singleChoice" : "multipleChoices",
                content: (document.querySelector(".question_essence") as HTMLElement).innerText,
                possibleAnswers: answerElementsArray.map((elem: HTMLElement) => elem.innerText),
                imageAttachmentUrl: getImageAttachmentUrl()
            }
        }

        return question;
    }

    async function autoSolveCurrentQuestion(event: MouseEvent) {
        event.preventDefault();
        setLoading(true);
        const currentQuestion: Question = parseCurrentQuestion();
        let currentQuestionAnswer: Answer;

        try {
            currentQuestionAnswer = await generateAnswer(currentQuestion);
            setLoading(false);
        } catch(error: any) {
            console.error(error.toString());
            const errorText = error?.message ?? "Some error happened during the API communication...";
            toast(errorText, {type: "error"});
            setLoading(false);
        }

        if (currentQuestion.answerType === "long") {
            const answerFrame = document.getElementById("givenAnswer_ifr") as HTMLIFrameElement;
            const answerFrameDoc = answerFrame.contentDocument ? answerFrame.contentDocument : answerFrame.contentWindow.document;
            answerFrameDoc.body.innerHTML = (currentQuestionAnswer as OpenQuestionAnswer).content;
        } else if (currentQuestion.answerType === "short") {
            const answerInput = document.querySelector(".mdc-text-field__input") as HTMLInputElement;
            answerInput.value = (currentQuestionAnswer as OpenQuestionAnswer).content;
        } else if (currentQuestion.answerType === "singleChoice") {
            const answerRadios = document.querySelectorAll("#questionForm input[type='radio']") as NodeListOf<HTMLInputElement>;
            const correctNum = (currentQuestionAnswer as ClosedQuestionAnswer).correctAnswerIndices[0];
            answerRadios[correctNum].checked = true;
        } else if (currentQuestion.answerType === "multipleChoices") {
            const answerCheckboxes = document.querySelectorAll("#questionForm input[type='checkbox']") as NodeListOf<HTMLInputElement>;
            const correctNums = (currentQuestionAnswer as ClosedQuestionAnswer).correctAnswerIndices;
            for (let i = 0; i < answerCheckboxes.length; i++) {
                answerCheckboxes[i].checked = correctNums.includes(i);
            }
        }
    }

    let stealthStyle: CSSProperties = {};
    if (pluginConfig.stealthMode) {
        stealthStyle = {opacity: 0.05};
    }

    return <>
        <button style={stealthStyle}
                className={"mdc-button mdc-button--outlined"} onClick={autoSolveCurrentQuestion}
                disabled={isLoading}>
            <span style={{fontWeight: "normal"}}>
                {isLoading ? "Solving..." : "Auto-solve question"}
            </span>
        </button>

        <ToastContainer />
    </>;
}

// Mount auto-solve button only on the exam solving subpage.
const isExamSolvingSubpage = document.querySelector(".question_header_content") !== null;
if (isExamSolvingSubpage) {
    const mountNode = document.createElement("span");
    const anchorPoint1 = document.querySelectorAll(".navigation_buttons")[0];
    const anchorPoint2 = document.querySelectorAll(".test_button_box.section")[0];
    const anchorPoint = anchorPoint1 || anchorPoint2;
    anchorPoint.appendChild(mountNode)
    const root = createRoot(mountNode)
    root.render(<TestportalAutoSolve />);
}

