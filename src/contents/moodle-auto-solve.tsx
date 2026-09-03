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

        // Unlike in Testportal, where all images are publicly accessible, in Moodle they might be behind authentication.
        // Thus, we need to convert them to base64 to send them directly to the AI.
        let questionImgUrl = getImageAttachmentUrl();
        let questionImgB64 = null;
        if (questionImgUrl) {
            questionImgB64 = await fetchImageBase64(questionImgUrl);
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
                        return await fetchImageBase64(img.src);
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
                        return await fetchImageBase64(img.src);
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
            const errorText = error?.message ?? t("apiError");
            toast(errorText, { type: "error" });
            setLoading(false);
            return;
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
            const question = questionToExplain || (await parseQuestion());
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
        <div style={{ display: "inline-flex", gap: "8px", alignItems: "center", marginTop: "12px", marginBottom: "8px", padding: "2px 0" }}>
            <button style={stealthStyle}
                className={"btn btn-secondary"} onClick={autoSolveCurrentQuestion}
                disabled={isLoading || isDownloadingImg || isHelpStreaming}>
                <span style={{ fontWeight: "normal" }}>
                    {isDownloadingImg ? t("downloadingImage") : isLoading ? t("solving") : t("autoSolve")}
                </span>
            </button>

            <button style={stealthStyle}
                className={"btn btn-secondary"} onClick={handleAiHelpClick}
                disabled={isLoading || isDownloadingImg || isHelpStreaming}>
                <span style={{ fontWeight: "normal" }}>
                    {t("aiHelp")}
                </span>
            </button>
        </div>

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
const isMoodle = document.querySelector('meta[name="keywords"]')?.getAttribute("content")?.includes("moodle");
const isExamSolvingSubpage = document.body.id === "page-mod-quiz-attempt";
const supportedClasses = ["essay", "shortanswer", "multichoice", "truefalse", "numerical"];
if (isMoodle && isExamSolvingSubpage) {
    const questions = document.querySelectorAll('.que');
    for (const question of questions) {
        const questionSupported = supportedClasses.some(cls => question.classList.contains(cls));
        const anchorPoint = question.querySelector(".formulation");
        const mountNode = document.createElement("div");
        mountNode.style.display = "block";
        anchorPoint.appendChild(mountNode);
        const root = createRoot(mountNode);
        if (questionSupported) {
            root.render(<MoodleAutoSolve questionElement={question as HTMLElement} />);
        }
    }
}

export default () => null;
