package api

import (
	"fmt"
	"net/http"

	"github.com/danrog303/testportal-gpt/ai"
	"github.com/danrog303/testportal-gpt/models"
	"github.com/gin-gonic/gin"
)

func HandleQuestion(c *gin.Context) {
	var req ApiRequest
	err := c.Bind(&req)

	if err != nil {
		errMsg := "you must provide valid request body"
		errResponse := ApiResponse{Error: &errMsg}
		c.JSON(http.StatusBadRequest, errResponse)
		return
	}

	err = req.Validate()
	if err != nil {
		errMsg := fmt.Sprintf("bad request: %s", err.Error())
		errResponse := ApiResponse{Error: &errMsg}
		c.JSON(http.StatusBadRequest, errResponse)
		return
	}

	answer, err := ai.GetAnswerForQuestion(req.Question, *req.OpenAiKey, models.GptModel(*req.GptModel))
	if err != nil {
		errMsg := fmt.Sprintf("error while querying GPT API: %s", err.Error())
		errResponse := ApiResponse{Error: &errMsg}
		c.JSON(http.StatusBadRequest, errResponse)
		return
	}

	c.JSON(200, answer)
}

func HandleInvalidMethod(c *gin.Context) {
	invalidMethodMsg := fmt.Sprintf("invalid method %s for path %s", c.Request.Method, c.Request.RequestURI)
	invalidMethodResponse := ApiResponse{Error: &invalidMethodMsg}
	c.JSON(http.StatusNotFound, invalidMethodResponse)
}

func HandleNotFound(c *gin.Context) {
	notFoundMsg := fmt.Sprintf("page not found: %s %s", c.Request.Method, c.Request.RequestURI)
	notFoundResponse := ApiResponse{Error: &notFoundMsg}
	c.JSON(http.StatusNotFound, notFoundResponse)
}
