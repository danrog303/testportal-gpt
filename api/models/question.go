package models

import (
	"errors"
)

type QuestionType string

const (
	QuestionClosedEndedSingleChoice   QuestionType = "closed-ended-single-choice"
	QuestionClosedEndedMultipleChoice QuestionType = "closed-ended-multiple-choice"
	QuestionOpenEndedLong             QuestionType = "open-ended-long"
	QuestionOpenEndedShort            QuestionType = "open-ended-short"
)

type Question struct {
	QuestionContent string       `json:"question-content"`
	QuestionType    QuestionType `json:"question-type"`
	Choices         []string     `json:"choices"`
}

func (q *Question) ClosedEnded() bool {
	return q.QuestionType == QuestionClosedEndedSingleChoice || q.QuestionType == QuestionClosedEndedMultipleChoice
}

func (q *Question) OpenEnded() bool {
	return q.QuestionType == QuestionOpenEndedLong || q.QuestionType == QuestionOpenEndedShort
}

func (q *Question) Validate() error {
	isOpenEnded := q.OpenEnded()

	if len(q.QuestionContent) == 0 {
		return errors.New("question content cannot be empty")
	}

	if !isValidQuestionType(q.QuestionType) {
		return errors.New("not a valid question type: " + string(q.QuestionType))
	}

	if !isOpenEnded && (len(q.Choices) == 0 || q.Choices == nil) {
		return errors.New("you must provide choices for closed-ended questions")
	}

	if isOpenEnded && q.Choices != nil && len(q.Choices) == 0 {
		q.Choices = nil
	} else if isOpenEnded && q.Choices != nil && len(q.Choices) > 0 {
		return errors.New("you cannot provide choices for closed-ended questions")
	}

	return nil

}

func isValidQuestionType(questionType QuestionType) bool {
	switch questionType {
	case
		QuestionClosedEndedSingleChoice,
		QuestionClosedEndedMultipleChoice,
		QuestionOpenEndedLong,
		QuestionOpenEndedShort:
		return true
	}
	return false
}

func NewQuestion(questionContent string, questionType QuestionType, choices []string) (Question, error) {
	question := Question{questionContent, questionType, choices}
	return question, question.Validate()
}
