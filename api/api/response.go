package api

import (
	"github.com/danrog303/testportal-gpt/models"
)

type ApiResponse struct {
	Error  *string                `json:"error,omitempty"`
	Answer *models.QuestionAnswer `json:"answer,omitempty"`
}
