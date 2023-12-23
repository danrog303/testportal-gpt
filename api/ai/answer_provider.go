package ai

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/danrog303/testportal-gpt/models"
	"github.com/danrog303/testportal-gpt/util"
)

func GetAnswerForQuestion(question *models.Question, apiKey string, model models.GptModel) (models.QuestionAnswer, error) {
	result, _ := models.NewQuestionAnswer("testportal-gpt-error")
	prompt := GetAiPrompt(question)

	requestData := models.GptApiRequest{
		Model: string(model),
		Messages: []models.GptMessage{
			{Role: "user", Content: prompt},
		},
		Temperature: 0.7,
	}

	requestJSON, err := json.Marshal(requestData)
	if err != nil {
		return result, err
	}

	req, err := http.NewRequest("POST", models.GPT_API_URL, bytes.NewBuffer(requestJSON))
	if err != nil {
		return result, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return result, err
	}
	if resp.StatusCode != http.StatusOK {
		return result, fmt.Errorf("server returned with %s", resp.Status)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return result, err
	}

	var responseData models.GptApiResponse
	if err := json.Unmarshal(body, &responseData); err != nil {
		return result, err
	}

	if len(responseData.Choices) > 0 {
		answer, _ := models.NewQuestionAnswer(responseData.Choices[0].Message.Content)
		if question.QuestionType == models.QuestionClosedEndedSingleChoice {
			answer.AnswerContent = util.StripNonDigits(answer.AnswerContent)
		} else if question.QuestionType == models.QuestionClosedEndedMultipleChoice {
			answer.AnswerContent = util.StripNonDigitsAndCommas(answer.AnswerContent)
		}

		return answer, nil
	} else {
		return result, errors.New("no response text found in the API response")
	}
}
