package api

import (
	"errors"
	"fmt"
	"slices"

	"github.com/danrog303/testportal-gpt/models"
)

type ApiRequest struct {
	Question  *models.Question `json:"question"`
	GptModel  *string          `json:"gpt-model"`
	OpenAiKey *string          `json:"open-ai-key"`
}

func (req *ApiRequest) Validate() error {
	allowedModels := []models.GptModel{
		models.GPT_MODEL_3_5_TURBO,
		models.GPT_MODEL_4_TURBO_PREVIEW,
	}

	if req.GptModel == nil || *req.GptModel == "" {
		return errors.New("you must provide gpt-model field")
	} else if req.OpenAiKey == nil || *req.OpenAiKey == "" {
		return errors.New("you must provide open-ai-key field")
	} else if req.Question == nil {
		return errors.New("you must provide question field")
	} else if !slices.Contains(allowedModels, models.GptModel(*req.GptModel)) {
		return fmt.Errorf("gpt model not allowed: %s", *req.GptModel)
	}

	return req.Question.Validate()
}
