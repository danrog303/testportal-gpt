export interface OpenQuestion {
    content: string;
    imageAttachmentUrl?: string;
    answerType: "short" | "long";
}

export interface ClosedQuestion {
    content: string;
    imageAttachmentUrl?: string;
    possibleAnswers: string[];
    possibleAnswersImages?: (string | null)[];
    answerType: "singleChoice" | "multipleChoices";
}

export type Question = OpenQuestion | ClosedQuestion;

export type QuestionType = "openShort" | "openLong" | "closedSingleChoice" | "closedMultipleChoice";

export interface OpenQuestionAnswer {
    content: string;
}

export interface ClosedQuestionAnswer {
    correctAnswerIndices: number[];
}

export type Answer = OpenQuestionAnswer | ClosedQuestionAnswer;