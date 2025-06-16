import type { Answer, ClosedQuestion, Question } from "~models/questions"
import usePluginConfig from "~hooks/use-plugin-config"
import useOpenAI from "~hooks/use-openai"

function useQuestionSolver() {
    const { pluginConfig } = usePluginConfig();
    const { requestAI } = useOpenAI();

    function generatePrompt(question: Question): string {
        const lines: string[] = [];
        const answerType = question.answerType;

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
            lines.push("Please answer only with the number of correct answer, for example 3 or 1.");
            lines.push("Your answer must contain only digits.");
        } else if (answerType === "multipleChoices") {
            lines.push("Here is the list of possible answers.");
            lines.push("You can choose one answer or multiple answers.");
            lines.push('Please answer only with numbers of correct answers separated with comma, for example "1,2,5".');
            lines.push("Your answer must contain only digits and commas.");
        }

        if (answerType === "singleChoice" || answerType === "multipleChoices") {
            (question as ClosedQuestion).possibleAnswers.forEach((choice, index) => {
                lines.push(`${index + 1}. ${choice}`);
            });
        }

        if (pluginConfig.additionalContext) {
            lines.push("The additional context that might be useful for answering the question is:");
            lines.push(pluginConfig.additionalContext);
        }

        if (question.imageAttachmentUrl) {
            lines.push("The question has an image attachment. Please refer to the image for additional context.");
        }

        return lines.join("\n");
    }

    async function generateAnswer(question: Question): Promise<Answer> {
        const prompt = generatePrompt(question);
        const response = await requestAI(prompt, question.imageAttachmentUrl);
        if (question.answerType == "short" || question.answerType == "long") {
            return {
                content: response.trim()
            }
        } else {
            const answerIndices = response.split(",")
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
