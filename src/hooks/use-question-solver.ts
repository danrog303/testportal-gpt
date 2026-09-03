import type { Answer, ClosedQuestion, Question } from "~models/questions";
import useAI from "~hooks/use-ai";

function useQuestionSolver() {
    const { requestAI, streamAI } = useAI();

    function extractImages(question: Question): (string | null | undefined)[] {
        const images: (string | null | undefined)[] = [question.imageAttachmentUrl];
        if (question.answerType === "singleChoice" || question.answerType === "multipleChoices") {
            const closedQuestion = question as ClosedQuestion;
            if (closedQuestion.possibleAnswersImages) {
                images.push(...closedQuestion.possibleAnswersImages);
            }
        }
        return images;
    }

    function generatePrompt(question: Question): string {
        const lines: string[] = [];
        const answerType = question.answerType;

        lines.push("You are an expert in this field. Analyze the question step-by-step and assume the persona of a professional.");
        lines.push("Please answer the question.");

        if (answerType === "long" || answerType === "short") {
            lines.push("Your answer must be written in the same language in which the question was asked.");
            lines.push("IMPORTANT: Output pure, plain cleartext ONLY. Do NOT use any Markdown formatting, asterisks for bold or italic (** or *), backticks (`), hashes for headings (#), bullet points, or HTML tags.");
        }

        if (answerType === "long") {
            lines.push("Your answer should be moderately detailed and written in clear, natural paragraphs without any Markdown.");
        } else if (answerType === "short") {
            lines.push("Your answer should be as short and concise as possible, returning only the direct text without any Markdown formatting or extra punctuation.");
        }

        lines.push(`The question is: ${question.content}`);

        if (answerType === "singleChoice") {
            lines.push("Here is the list of possible answers.");
            lines.push("You can choose only one answer.");
            lines.push("First, explain your reasoning step-by-step. Then, provide the number of the correct answer at the very end in format 'FINAL ANSWER: X'.");
            lines.push("For example: '... therefore the answer is 1. FINAL ANSWER: 1'");
        } else if (answerType === "multipleChoices") {
            lines.push("Here is the list of possible answers.");
            lines.push("You can choose one answer or multiple answers.");
            lines.push("First, explain your reasoning step-by-step. Then, provide the numbers of correct answers at the very end in format 'FINAL ANSWER: X,Y'.");
            lines.push("For example: '... therefore the answers are 1 and 2. FINAL ANSWER: 1,2'");
        }

        if (answerType === "singleChoice" || answerType === "multipleChoices") {
            (question as ClosedQuestion).possibleAnswers.forEach((choice, index) => {
                lines.push(`${index + 1}. ${choice}`);
            });
        }

        if (question.imageAttachmentUrl) {
            lines.push("The question has an image attachment. Please refer to the image for additional context.");
        }

        if (question.answerType === "singleChoice" || question.answerType === "multipleChoices") {
            const closedQuestion = question as ClosedQuestion;
            if (closedQuestion.possibleAnswersImages && closedQuestion.possibleAnswersImages.some(img => img)) {
                lines.push("Some or all answers have image attachments. The images are sent in the same order as validity of the answers.");
            }
        }

        return lines.join("\n");
    }

    function generateExplanationPrompt(question: Question): string {
        const lines: string[] = [];
        const answerType = question.answerType;

        lines.push("You are an expert tutor and educator. Your goal is to help the user understand and solve the question with clear, step-by-step reasoning.");
        lines.push("Always write your entire response, including all Markdown headings, in the same language in which the question was asked. For example, if the question is in Polish, translate all headings to Polish (e.g. use '### Rekomendowana odpowiedź' instead of '### Recommended Answer', '### Poprawna odpowiedź' instead of '### Correct Answer', and '### Wyjaśnienie i uzasadnienie' instead of '### Explanation & Reasoning').");
        lines.push(`The question is: ${question.content}`);

        if (answerType === "singleChoice" || answerType === "multipleChoices") {
            lines.push("Here is the list of possible answers:");
            (question as ClosedQuestion).possibleAnswers.forEach((choice, index) => {
                lines.push(`${index + 1}. ${choice}`);
            });
            lines.push("");
            lines.push("Please provide your answer in the following structured Markdown format (translating the headings into the language of the question):");
            lines.push("### Correct Answer");
            if (answerType === "singleChoice") {
                lines.push("Clearly state the correct answer number and its text (e.g. '**Option 2: ...**').");
            } else {
                lines.push("Clearly state all correct answer numbers and their texts (e.g. '**Option 1 and Option 3: ...**').");
            }
            lines.push("");
            lines.push("### Step-by-Step Explanation & Reasoning");
            lines.push("Walk through the fundamental concepts and explain thoroughly why the correct answer is right.");
            lines.push("");
            lines.push("### Analysis of Options");
            lines.push("Briefly review each option and explain why it is correct or incorrect.");
        } else {
            lines.push("");
            lines.push("Please provide your response in the following structured Markdown format (translating the headings into the language of the question):");
            lines.push("### Recommended Answer");
            if (answerType === "short") {
                lines.push("Provide the concise, direct answer to the question.");
            } else {
                lines.push("Provide a well-formulated, complete answer to the question.");
            }
            lines.push("");
            lines.push("### Explanation & Reasoning");
            lines.push("Explain step-by-step how to arrive at this answer, including any relevant formulas, definitions, context, or methodology.");
        }

        if (question.imageAttachmentUrl) {
            lines.push("");
            lines.push("The question has an image attachment. Please refer to the image for additional context.");
        }

        if (question.answerType === "singleChoice" || question.answerType === "multipleChoices") {
            const closedQuestion = question as ClosedQuestion;
            if (closedQuestion.possibleAnswersImages && closedQuestion.possibleAnswersImages.some(img => img)) {
                lines.push("Some or all answers have image attachments. The images are sent in the same order as the answers.");
            }
        }

        return lines.join("\n");
    }

function stripMarkdown(text: string): string {
    if (!text) return "";

    return text
        // Remove fenced code blocks ```lang ... ```
        .replace(/```[\s\S]*?```/g, m => {
            const lines = m.split("\n");
            return lines.slice(1, -1).join("\n");
        })
        // Remove inline code `code`
        .replace(/`([^`]+)`/g, "$1")
        // Remove bold/italic: ***text***, **text**, *text*, ___text___, __text__, _text_
        .replace(/(\*\*|__)(.*?)\1/g, "$2")
        .replace(/(\*|_)(.*?)\1/g, "$2")
        // Remove strikethrough ~~text~~
        .replace(/~~(.*?)~~/g, "$1")
        // Remove headers (# Header)
        .replace(/^#{1,6}\s+(.*)$/gm, "$1")
        // Remove blockquotes (> quote)
        .replace(/^>\s+(.*)$/gm, "$1")
        // Remove links [text](url) -> text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        // Remove images ![alt](url) -> alt
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
        // Remove bullet markers at beginning of line (- or * or +)
        .replace(/^[\t ]*[-*+]\s+/gm, "")
        .trim();
}

    async function generateAnswer(question: Question): Promise<Answer> {
        const prompt = generatePrompt(question);
        const images = extractImages(question);

        const response = await requestAI(prompt, images);
        if (question.answerType == "short" || question.answerType == "long") {
            return {
                content: stripMarkdown(response)
            }
        } else {
            let processedResponse = response;
            const finalAnswerMatch = response.match(/FINAL ANSWER:\s*([0-9, ]+)/i);
            if (finalAnswerMatch) {
                processedResponse = finalAnswerMatch[1];
            }

            const answerIndices = processedResponse.split(",")
                .map(s => s.trim())
                .map(s => parseInt(s, 10) - 1)
                .filter(s => !isNaN(s) && s >= 0);
            if (answerIndices.length === 0) {
                throw new Error("No valid answer indices found in the response: " + response);
            }
            return {
                correctAnswerIndices: answerIndices
            }
        }
    }

    async function explainQuestion(
        question: Question,
        onChunk: (chunk: string) => void,
        signal?: AbortSignal
    ): Promise<string> {
        const prompt = generateExplanationPrompt(question);
        const images = extractImages(question);
        return streamAI(prompt, onChunk, images, signal);
    }

    return {
        generateAnswer,
        explainQuestion
    }
}

export default useQuestionSolver;
