package main

import (
	"context"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	ginadapter "github.com/awslabs/aws-lambda-go-api-proxy/gin"
	"github.com/danrog303/testportal-gpt/api"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Object which allows to proxy AWS Lambda requests to Gin framework
var ginLambda *ginadapter.GinLambda

// Passes AWS Lambda request to Gin adapter
func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	return ginLambda.ProxyWithContext(ctx, req)
}

// Handles AWS Lambda request
func main() {
	lambda.Start(Handler)
}

// Initializes Gin router
func init() {
	router := gin.Default()
	router.SetTrustedProxies(nil)
	router.Use(cors.Default())
	router.Use(JSONMiddleware())

	router.POST("/questions", api.HandleQuestion)
	router.NoMethod(api.HandleInvalidMethod)
	router.NoRoute(api.HandleNotFound)

	ginLambda = ginadapter.New(router)
}

// Ensures all requests are concidered to be JSON requests.
func JSONMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Content-Type", "application/json")
		c.Next()
	}
}
