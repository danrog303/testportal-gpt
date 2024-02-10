package ai

import (
	"bytes"
	"strings"
	"text/template"

	"github.com/danrog303/testportal-gpt/models"
)

const promptTemplateContent string = `Please answer the question.

{{- if or (eq .QuestionType "open-ended-long") (eq .QuestionType "open-ended-short") }}
Your answer must be written in the same language in which the question was asked.
{{- end }}

{{- if eq .QuestionType "open-ended-long" }} 
Your answer should should be moderately detailed.
{{- else if eq .QuestionType "open-ended-short" }} 
Your answer should be as short and concise as possible.
{{- end }}
The question is: {{ .QuestionContent -}}

{{ if eq .QuestionType "closed-ended-single-choice" }}
Here is the list of possible answers. 
You can choose only one answer. 
Please answer only with the number of correct answer, for example 3 or 1.
Your answer must contain only digits.
{{ else if eq .QuestionType "closed-ended-multiple-choice" }}
Here is the list of possible answers. 
You can choose one answer or multiple answers. 
Please answer only with numbers of correct answers separated with comma, for example "1,2,5".
Your answer must contain only digits and commas.
{{- end }}
{{ if or (eq .QuestionType "closed-ended-single-choice") (eq .QuestionType "closed-ended-multiple-choice") }}
{{- range $choiceIndex, $choiceContent := .Choices }}
{{- add $choiceIndex 1 }}. {{ $choiceContent }}
{{ end }}
{{- end -}}`

var funcMap = template.FuncMap{
	"add": func(a int, b int) int {
		return a + b
	},
}

func GetAiPrompt(question *models.Question) string {
	promptTemplate, err := template.New("ai-prompt").Funcs(funcMap).Parse(promptTemplateContent)
	if err != nil {
		panic(err)
	}

	var promptTemplateRendered bytes.Buffer
	err = promptTemplate.Execute(&promptTemplateRendered, *question)
	if err != nil {
		panic(err)
	}

	return strings.TrimSpace(promptTemplateRendered.String())
}
