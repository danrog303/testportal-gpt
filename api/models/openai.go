package models

const GPT_API_URL = "https://api.openai.com/v1/chat/completions"

type GptApiRequest struct {
	Model       string       `json:"model"`
	Messages    []GptMessage `json:"messages"`
	Temperature float64      `json:"temperature"`
}

type GptApiResponse struct {
	Choices []gptChoice `json:"choices"`
}

type GptMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type gptChoice struct {
	Message GptMessage `json:"message"`
}

type GptModel string

const (
	GPT_MODEL_3_5_TURBO       = "gpt-3.5-turbo"
	GPT_MODEL_4_TURBO_PREVIEW = "gpt-4-1106-preview"
)
