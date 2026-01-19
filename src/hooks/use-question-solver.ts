import type { Answer, ClosedQuestion, Question } from "~models/questions"
import useOpenAI from "~hooks/use-openai"

function useQuestionSolver() {
    const { requestAI } = useOpenAI();

    function generatePrompt(question: Question): string {
        const lines: string[] = [];
        const answerType = question.answerType;

        lines.push("You are an expert in this field. Analyze the question step-by-step and assume the persona of a professional.");
        lines.push("Please answer the question.");

        if (answerType === "long" || answerType === "short") {
            lines.push("Your answer must be written in the same language in which the question was asked.");
        }

        if (answerType === "long") {
            lines.push("Your answer should be moderately detailed.");
        } else if (answerType === "short") {
            lines.push("Your answer should be as short and concise as possible.");
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

    async function generateAnswer(question: Question): Promise<Answer> {
        const prompt = generatePrompt(question);

        const images: (string | null | undefined)[] = [question.imageAttachmentUrl];
        if (question.answerType === "singleChoice" || question.answerType === "multipleChoices") {
            const closedQuestion = question as ClosedQuestion;
            if (closedQuestion.possibleAnswersImages) {
                images.push(...closedQuestion.possibleAnswersImages);
            }
        }

        const response = await requestAI(prompt, images);
        if (question.answerType == "short" || question.answerType == "long") {
            return {
                content: response.trim()
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

    return {
        generateAnswer
    }
}

export default useQuestionSolver;
