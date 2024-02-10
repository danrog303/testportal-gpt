package models

import "errors"

type QuestionAnswer struct {
	AnswerContent string `json:"answer-content"`
}

func NewQuestionAnswer(answerContent string) (QuestionAnswer, error) {
	answer := QuestionAnswer{answerContent}

	if len(answerContent) == 0 {
		return answer, errors.New("answer content can not be empty")
	}

	return answer, nil
}
