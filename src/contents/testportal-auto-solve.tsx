import type { PlasmoCSConfig } from "plasmo";
import React, { useState, useRef, type CSSProperties, type MouseEvent } from "react";
import { createRoot } from "react-dom/client";
import { toast, ToastContainer } from "react-toastify";

import usePluginConfig, { AutoSolveButtonVisibility } from "~hooks/use-plugin-config";
import useQuestionSolver from "~hooks/use-question-solver";
import type { Answer, ClosedQuestionAnswer, OpenQuestionAnswer, Question, QuestionType } from "~models/questions";
import { getBase64ImageFromUrl } from "~utils/image";
import { AiHelpModal } from "~components/AiHelpModal";
import { t } from "~i18n";

export const config: PlasmoCSConfig = {
    matches: [
        "https://testportal.pl/*",
        "https://testportal.net/*",
        "https://*.testportal.pl/*",
        "https://*.testportal.net/*",
        "https://testportal.com/*",
        "https://*.testportal.com/*",
        "https://teams.microsoft.com/*"
    ],
    all_frames: true
};

const TestportalAutoSolve = () => {
    const [isLoading, setLoading] = useState(false);
    const [isDownloadingImg, setDownloadingImg] = useState(false);
    const { generateAnswer, explainQuestion } = useQuestionSolver();
    const { pluginConfig } = usePluginConfig();

    const [isHelpOpen, setHelpOpen] = useState(false);
    const [isHelpStreaming, setHelpStreaming] = useState(false);
    const [streamedExplanation, setStreamedExplanation] = useState("");
    const [helpError, setHelpError] = useState<string | null>(null);
    const [cachedQuestion, setCachedQuestion] = useState<Question | null>(null);
    const helpAbortControllerRef = useRef<AbortController | null>(null);

    async function fetchImageBase64(url: string) {
        setDownloadingImg(true);
        try {
            return await getBase64ImageFromUrl(url);
        } finally {
            setDownloadingImg(false);
        }
    }

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
            throw { msg: "Unknown question type" };
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

    async function parseCurrentQuestion(): Promise<Question> {
        let question: Question;
        const questionType = getCurrentQuestionType();

        let questionImgUrl = getImageAttachmentUrl();
        let questionImgB64 = null;
        if (questionImgUrl) {
            questionImgB64 = await fetchImageBase64(questionImgUrl);
        }

        if (questionType === "openLong" || questionType === "openShort") {
            question = {
                answerType: questionType == "openLong" ? "long" : "short",
                content: (document.querySelector(".question_essence") as HTMLElement).innerText,
                imageAttachmentUrl: questionImgB64
            }
        } else if (questionType === "closedSingleChoice" || questionType === "closedMultipleChoice") {
            const answerElements = document.querySelectorAll(".answer_container");
            const answerElementsArray = Array.prototype.slice.call(answerElements);
            question = {
                answerType: questionType === "closedSingleChoice" ? "singleChoice" : "multipleChoices",
                content: (document.querySelector(".question_essence") as HTMLElement).innerText,
                possibleAnswers: answerElementsArray.map((elem: HTMLElement) => elem.innerText),
                possibleAnswersImages: await Promise.all(answerElementsArray.map(async (elem: HTMLElement) => {
                    const img = elem.querySelector("img");
                    return img ? await fetchImageBase64(img.src) : null;
                })),
                imageAttachmentUrl: questionImgB64
            }
        }

        return question;
    }

    async function autoSolveCurrentQuestion(event: MouseEvent) {
        event.preventDefault();
        setLoading(true);
        let currentQuestion: Question;
        let currentQuestionAnswer: Answer;

        try {
            currentQuestion = await parseCurrentQuestion();
            currentQuestionAnswer = await generateAnswer(currentQuestion);
            setLoading(false);
        } catch (error: any) {
            console.error(error.toString());
            const errorText = error?.message ?? t("apiError");
            toast(errorText, { type: "error" });
            setLoading(false);
            return;
        }

        if (currentQuestion!.answerType === "long") {
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

    const [activeHelpInfo, setActiveHelpInfo] = useState<{ provider: string; model: string } | null>(null);

    async function startAiHelp(questionToExplain?: Question) {
        setHelpOpen(true);
        setHelpStreaming(true);
        setStreamedExplanation("");
        setHelpError(null);

        const providerDisplayName = pluginConfig.provider === "claude" ? "Anthropic Claude" : pluginConfig.provider === "gemini" ? "Google Gemini" : "OpenAI";
        setActiveHelpInfo({
            provider: providerDisplayName,
            model: pluginConfig.apiModel
        });

        const abortController = new AbortController();
        helpAbortControllerRef.current = abortController;

        try {
            const question = questionToExplain || (await parseCurrentQuestion());
            setCachedQuestion(question);

            await explainQuestion(
                question,
                chunk => {
                    setStreamedExplanation(prev => prev + chunk);
                },
                abortController.signal
            );
        } catch (error: any) {
            if (abortController.signal.aborted) {
                return;
            }
            console.error("AI Help error:", error);
            setHelpError(error?.message ?? t("apiError"));
        } finally {
            setHelpStreaming(false);
        }
    }

    function handleAiHelpClick(event: MouseEvent) {
        event.preventDefault();
        startAiHelp();
    }

    function handleStopStreaming() {
        if (helpAbortControllerRef.current) {
            helpAbortControllerRef.current.abort();
            helpAbortControllerRef.current = null;
        }
        setHelpStreaming(false);
    }

    function handleCloseModal() {
        handleStopStreaming();
        setHelpOpen(false);
    }

    let stealthStyle: CSSProperties = {};
    if (pluginConfig.btnVisibility === AutoSolveButtonVisibility.BARELY_VISIBLE) {
        stealthStyle = { opacity: 0.05 };
    } else if (pluginConfig.btnVisibility === AutoSolveButtonVisibility.NOT_VISIBLE) {
        stealthStyle = { opacity: 0 };
    }

    return <>
        <span style={{ display: "inline-flex", gap: "8px", alignItems: "center", margin: "4px 8px" }}>
            <button style={stealthStyle}
                className={"mdc-button mdc-button--outlined"} onClick={autoSolveCurrentQuestion}
                disabled={isLoading || isDownloadingImg || isHelpStreaming}>
                <span style={{ fontWeight: "normal" }}>
                    {isDownloadingImg ? t("downloadingImage") : (isLoading ? t("solving") : t("autoSolve"))}
                </span>
            </button>

            <button style={stealthStyle}
                className={"mdc-button mdc-button--outlined"} onClick={handleAiHelpClick}
                disabled={isLoading || isDownloadingImg || isHelpStreaming}>
                <span style={{ fontWeight: "normal" }}>
                    {t("aiHelp")}
                </span>
            </button>
        </span>

        <AiHelpModal
            isOpen={isHelpOpen}
            onClose={handleCloseModal}
            onStop={handleStopStreaming}
            onRetry={() => cachedQuestion && startAiHelp(cachedQuestion)}
            isStreaming={isHelpStreaming}
            streamedText={streamedExplanation}
            error={helpError}
            providerName={activeHelpInfo?.provider}
            modelName={activeHelpInfo?.model}
        />

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

export default () => null;
