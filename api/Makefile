# Builds testportal-gpt-api and creates zip archive 
# (SAM CLI requires .zip in order to deploy to AWS Lambda) 
build:
	env GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o main .
	mkdir -p bin/
	zip bin/main.zip main
	rm main
