# testportal-gpt-api
> **ChatGPT API** proxy server for **testportal-gpt** project.

## API description
**testportal-gpt-api** is a simple REST API written in Go, designed to be used with **testportal-gpt** project. It takes a Testportal question, generates prompt for ChatGPT, proxies request to OpenAI API and returns the answer for the provided question.

## How to run
**testportal-gpt-api** is designed to be used with AWS SAM toolkit, so in order to test API locally or deploy it to the cloud, you need to install AWS SAM tool.
```
# First, compile the project
cd api/ && make build

# Run the API locally
sam local start-api

# Deploy API to AWS cloud
sam deploy --guided
```

Alternatively, you can use this pre-created instance:  
https://testportal-gpt.danielrogowski.net/questions

## API usage
**Open-ended question (short answer required):**  
```
$ curl -s -XPOST -H 'Content-Type: application/json' -d '{"gpt-model": "gpt-3.5-turbo", "open-ai-key": "YOUR KEY HERE", "question": {"question-content": "Is an apple a fruit?", "question-type": "open-ended-short"}}' 'https://testportal-gpt.danielrogowski.net/questions'


{"answer-content":"Yes."}
```

**Open-ended question (long answer required)**
```
$ curl -s -XPOST -H 'Content-Type: application/json' -d '{"gpt-model": "gpt-3.5-turbo", "open-ai-key": "YOUR KEY HERE", "question": {"question-content": "Is an apple a fruit?", "question-type": "open-ended-long"}}' 'https://testportal-gpt.danielrogowski.net/questions'

{"answer-content":"Yes, an apple is indeed a fruit. In botanical terms, a fruit is defined as the mature ovary of a flowering plant, typically containing seeds. Apples are the fruit of the apple tree (Malus domestica), which belongs to the Rosaceae family. \n\nApples are characterized by their round shape, crisp or juicy texture, and a sweet or tart taste."}
```

**Closed-ended question (single choice)**
```
$ curl -s -XPOST -H 'Content-Type: application/json' -d '{"gpt-model": "gpt-3.5-turbo", "open-ai-key": "YOUR KEY HERE", "question": {"question-content": "Is an apple a fruit?", "question-type": "closed-ended-single-choice", "choices": ["Yes", "No", "I do not know"]}}' 'https://testportal-gpt.danielrogowski.net/questions'

{"answer-content":"1"}
```

**Closed-ended question (multiple choice)**
```
curl -s -XPOST -H 'Content-Type: application/json' -d '{"gpt-model": "gpt-3.5-turbo", "open-ai-key": "YOUR KEY HERE", "question": {"question-content": "Which of these are fruits?", "question-type": "closed-ended-multiple-choice", "choices": ["Apple", "Potato", "Pear"]}}' 'https://testportal-gpt.danielrogowski.net/questions'

{"answer-content":"1,3"}
```
