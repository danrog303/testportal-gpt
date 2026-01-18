import type { PlasmoCSConfig } from "plasmo";
import React, { useState, type CSSProperties, type MouseEvent } from "react";
import { toast, ToastContainer } from "react-toastify";

import usePluginConfig, { AutoSolveButtonVisibility } from "~hooks/use-plugin-config";
import useQuestionSolver from "~hooks/use-question-solver";
import type { Answer, ClosedQuestionAnswer, OpenQuestionAnswer, Question, QuestionType } from "~models/questions";
import { createRoot } from "react-dom/client";

// Moodle is self-hosted, so we need to match all possible URLs.
export const config: PlasmoCSConfig = {
    matches: [
        "*://*/*"
    ]
};

type MoodleAutoSolveProps = {
    questionElement: HTMLElement;
}

const MoodleAutoSolve = (props: MoodleAutoSolveProps) => {
    const [isDownloadingImg, setDownloadingImg] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const { generateAnswer } = useQuestionSolver();
    const { pluginConfig } = usePluginConfig();

    async function getBase64ImageFromUrl(imageUrl: string) {
        setDownloadingImg(true);

        try {
            const response = await chrome.runtime.sendMessage({
                type: "FETCH_IMAGE",
                url: imageUrl
            });

            setDownloadingImg(false);

            if (response && response.success) {
                return response.data;
            } else {
                console.error("Failed to fetch image via background script:", response?.error);
                throw new Error(response?.error || "Unknown error fetching image");
            }
        } catch (e) {
            setDownloadingImg(false);
            console.error("Error sending message to background script:", e);
            throw e;
        }
    }

    function getCurrentQuestionType(): QuestionType {
        if (props.questionElement.classList.contains("essay")) {
            return "openLong";
        } else if (props.questionElement.classList.contains("shortanswer")) {
            return "openShort";
        } else if (props.questionElement.classList.contains("multichoice")) {
            const isMultiple = props.questionElement.querySelectorAll("input[type='checkbox']").length > 0;
            return isMultiple ? "closedMultipleChoice" : "closedSingleChoice";
        } else if (props.questionElement.classList.contains("truefalse")) {
            return "closedSingleChoice";
        } else if (props.questionElement.classList.contains("numerical")) {
            return "openShort";
        } else {
            throw { msg: `Unknown question type` };
        }
    }

    // Moodle can have multiple questions on the same page, but we don't want to overwhelm the AI with
    // too much context, so currently we only use the first image found in the question element.
    // If needed, this can be extended to support multiple images in the future.
    function getImageAttachmentUrl(): string | null {
        const imageTag = props.questionElement.querySelector(".qtext img");
        if (imageTag !== null) {
            return (imageTag as HTMLImageElement).src;
        } else {
            return null;
        }
    }

    async function parseQuestion(): Promise<Question> {
        let question: Question;
        const questionType: QuestionType = getCurrentQuestionType();

        // Unlike in TestPortal, where all images are publicly accessible, in Moodle they might be behind authentication.
        // Thus, we need to convert them to base64 to send them directly to the AI.
        let questionImgUrl = getImageAttachmentUrl();
        let questionImgB64 = null;
        if (questionImgUrl) {
            questionImgB64 = await getBase64ImageFromUrl(questionImgUrl);
        }

        if (questionType === "openLong" || questionType === "openShort") {
            question = {
                answerType: questionType == "openLong" ? "long" : "short",
                content: (props.questionElement.querySelector(".qtext") as HTMLElement)?.innerText ?? "",
                imageAttachmentUrl: questionImgB64
            }
        } else if (questionType === "closedSingleChoice") {
            let answerElements = props.questionElement.querySelectorAll('div>div>div.flex-fill>p');
            if (answerElements.length === 0) {
                answerElements = props.questionElement.querySelectorAll('.answer label');
            }
            const answerElementsArray = Array.prototype.slice.call(answerElements);
            question = {
                answerType: "singleChoice",
                content: (props.questionElement.querySelector(".qtext") as HTMLElement)?.innerText ?? "",
                possibleAnswers: answerElementsArray.map((elem: HTMLElement) => elem.innerText),
                imageAttachmentUrl: questionImgB64,
                possibleAnswersImages: await Promise.all(answerElementsArray.map(async (elem: HTMLElement) => {
                    const img = elem.querySelector("img");
                    if (img) {
                        return await getBase64ImageFromUrl(img.src);
                    }
                    return null;
                }))
            }
        } else if (questionType === "closedMultipleChoice") {
            let answerElements = props.questionElement.querySelectorAll('.answer p');
            if (answerElements.length === 0) {
                answerElements = props.questionElement.querySelectorAll('.answer label');
            }
            const answerElementsArray = Array.prototype.slice.call(answerElements);
            question = {
                answerType: "multipleChoices",
                content: (props.questionElement.querySelector(".qtext") as HTMLElement)?.innerText ?? "",
                possibleAnswers: answerElementsArray.map((elem: HTMLElement) => elem.innerText),
                imageAttachmentUrl: questionImgB64,
                possibleAnswersImages: await Promise.all(answerElementsArray.map(async (elem: HTMLElement) => {
                    const img = elem.querySelector("img");
                    if (img) {
                        return await getBase64ImageFromUrl(img.src);
                    }
                    return null;
                }))
            }
        }

        return question;
    }

    async function autoSolveCurrentQuestion(event: MouseEvent) {
        event.preventDefault();
        setLoading(true);
        const currentQuestion: Question = await parseQuestion();

        let currentQuestionAnswer: Answer;
        try {
            currentQuestionAnswer = await generateAnswer(currentQuestion);
            setLoading(false);
        } catch (error: any) {
            console.error(error.toString());
            const errorText = error?.message ?? "Some error happened during the API communication...";
            toast(errorText, { type: "error" });
            setLoading(false);
        }

        if (currentQuestion.answerType === "long") {
            const answerFrame = props.questionElement.querySelector("iframe") as HTMLIFrameElement;
            const answerFrameDoc = answerFrame.contentDocument ? answerFrame.contentDocument : answerFrame.contentWindow.document;
            answerFrameDoc.body.innerHTML = (currentQuestionAnswer as OpenQuestionAnswer).content;
        } else if (currentQuestion.answerType === "short") {
            const answerInput = props.questionElement.querySelector("input[type='text']") as HTMLInputElement;
            answerInput.value = (currentQuestionAnswer as OpenQuestionAnswer).content;
        } else if (currentQuestion.answerType === "singleChoice") {
            const answerRadios = props.questionElement.querySelectorAll("input[type='radio']") as NodeListOf<HTMLInputElement>;
            const correctNum = (currentQuestionAnswer as ClosedQuestionAnswer).correctAnswerIndices[0];
            answerRadios[correctNum].checked = true;
        } else if (currentQuestion.answerType === "multipleChoices") {
            const answerCheckboxes = props.questionElement.querySelectorAll("input[type='checkbox']") as NodeListOf<HTMLInputElement>;
            const correctNums = (currentQuestionAnswer as ClosedQuestionAnswer).correctAnswerIndices;
            for (let i = 0; i < answerCheckboxes.length; i++) {
                answerCheckboxes[i].checked = correctNums.includes(i);
            }
        }
    }

    let stealthStyle: CSSProperties = {};
    if (pluginConfig.btnVisibility === AutoSolveButtonVisibility.BARELY_VISIBLE) {
        stealthStyle = { opacity: 0.05 };
    } else if (pluginConfig.btnVisibility === AutoSolveButtonVisibility.NOT_VISIBLE) {
        stealthStyle = { opacity: 0 };
    }

    return <>
        <button style={stealthStyle}
            className={"btn btn-secondary"} onClick={autoSolveCurrentQuestion}
            disabled={isLoading}>
            <span style={{ fontWeight: "normal" }}>
                {isDownloadingImg ? "Downloading image..." : isLoading ? "Solving..." : "Auto-solve question"}
            </span>
        </button>

        <ToastContainer />
    </>;
}

// Mount auto-solve button only on the exam solving subpage.
const isMoodle = document.querySelector('meta[name="keywords"]')?.getAttribute("content")?.includes("moodle");
const isExamSolvingSubpage = document.body.id === "page-mod-quiz-attempt";
const supportedClasses = ["essay", "shortanswer", "multichoice", "truefalse", "numerical"];
if (isMoodle && isExamSolvingSubpage) {
    const questions = document.querySelectorAll('.que');
    for (const question of questions) {
        const questionSupported = supportedClasses.some(cls => question.classList.contains(cls));
        const anchorPoint = question.querySelector(".formulation");
        const mountNode = document.createElement("span");
        anchorPoint.appendChild(mountNode);
        const root = createRoot(mountNode);
        if (questionSupported) {
            root.render(<MoodleAutoSolve questionElement={question as HTMLElement} />);
        }
    }
}

export default () => null;
