package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	

	"github.com/gin-gonic/contrib/static" // Access static files: html,css,js
	"github.com/gin-gonic/gin"            // API

	jwtmiddleware "github.com/auth0/go-jwt-middleware" // JWT middleware. 
	jwt "github.com/form3tech-oss/jwt-go" // Latest version.
)

type Response struct {
	Message string `json:"message"`
}

type Jwks struct {
	Keys []JSONWebKeys `json:"keys"`
}

type JSONWebKeys struct {
	Kty string   `json:"kty"`
	Kid string   `json:"kid"`
	Use string   `json:"use"`
	N   string   `json:"n"`
	E   string   `json:"e"`
	X5c []string `json:"x5c"`
}

type Joke struct {
	ID    int    `json:"id" binding:"required"`
	Likes int    `json:"likes"`
	Joke  string `json:"joke" binding:"required"`
}

var jokes = []Joke{
	{1, 0, "Why did the teddy bear skip out on dessert when she was on a date? She was stuffed! Here are more bear puns that’ll make you growl with laughter."},
	{2, 0, "What is a little bear with no teeth is called? A gummy bear."},
	{3, 0, "What do you call a noodle that is fake? An im-pasta. Foodies of all ages will also love these pasta puns that’ll spice up your daily rotini."},
	{4, 0, "What’s an alligator in a vest called? An investi-gator."},
	{5, 0, "What’s the best way to throw a birthday party on Mars? You planet."},
	{6, 0, "Why did the chocolate chip cookie go to see the doctor? He felt crummy. Poor little guy—maybe we could cheer him up with these cookie puns that are batter than you think."},
	{7, 0, "Why did the toddler toss the butter out the window? So she could see a butter-fly."},
	{8, 0, "What is cheese that doesn’t belong to you called? Nacho cheese!"},
	{9, 0, "What’s one way we know the ocean is friendly? It waves."},
	{10, 0, "Why is Cinderella so bad at playing football? She runs away from the ball."},
}

var jwtMiddleWare *jwtmiddleware.JWTMiddleware

func main() {
	// Securing API Endpoints
	jwtMiddleware := jwtmiddleware.New(jwtmiddleware.Options{
		ValidationKeyGetter: func(token *jwt.Token) (interface{}, error) {

			// Variable to get api audience
			audience := os.Getenv("AUTH0_API_AUDIENCE")
			// Variable to varify audience
			checkAudience := token.Claims.(jwt.MapClaims).VerifyAudience(audience, false)
			if !checkAudience {
				return token, errors.New("invalid audience")
			}

			// Verify Token issuer
			iss := os.Getenv("AUTH0_DOMAIN")
			// Variable to verify token issuer
			checkIss := token.Claims.(jwt.MapClaims).VerifyIssuer(iss, false)
			if !checkIss {
				return token, errors.New("invalid token issuer")
			}

			cert, err := getPemCert(token)
			if err != nil {
				log.Fatalf("could not get cert: %+v", err)
			}

			result, _ := jwt.ParseRSAPublicKeyFromPEM([]byte(cert))
			return result, nil
		},

		SigningMethod: jwt.SigningMethodES256,
	})

	
	jwtMiddleWare = jwtMiddleware

	// Set the router as the default one shipped with Gin
	router := gin.Default()

	// Serve frontend static files
	router.Use(static.Serve("/", static.LocalFile("./views", true)))

	// Setup route group for the API
	api := router.Group("/api")
	{
		api.GET("/", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"message": "pong",
			})
		})
	}

	api.GET("/jokes", authMiddleware(), jokeHandler)           // Retrieve list of jokes a user can see
	api.POST("/jokes/like/jokeID", authMiddleware(), likeJoke) // Capture likes sent to a joke

	// Start and run the server
	router.Run(":3000")
}

func getPemCert(token *jwt.Token) (string, error) {
	cert := ""
	resp, err := http.Get(os.Getenv("AUTH0_DOMAIN") + ".well-known/jwks.json")
	if err != nil {
		return cert, err
	}
	defer resp.Body.Close()

	var jwks = Jwks{}
	err = json.NewDecoder(resp.Body).Decode(&jwks)

	if err != nil {
		return cert, err
	}

	x5c := jwks.Keys[0].X5c
	for k, v := range x5c {
		if token.Header["kid"] == jwks.Keys[k].Kid {
			cert = "-----BEGIN CERTIFICATE-----\n" + v + "\n-----END CERTIFICATE-----"
		}
	}

	if cert == "" {
		return cert, errors.New("unable to find appropriate key")
	}

	return cert, nil
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the client secret key
		err := jwtMiddleWare.CheckJWT(c.Writer, c.Request)
		if err != nil {
			// Token not found
			fmt.Println(err)
			c.Abort()
			c.Writer.WriteHeader(http.StatusUnauthorized)
			c.Writer.Write([]byte("Unauthorized"))
			return
		}
	}
}

// Function to retrieve a list of available jokes
func jokeHandler(c *gin.Context) {
	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, jokes)
}

// Function to increment the likes of a particular joke item
func likeJoke(c *gin.Context) {
	// Check joke ID is valid
	if jokeid, err := strconv.Atoi(c.Param("jokeID")); err == nil {
		// find joke and increment likes
		for i := 0; i < len(jokes); i++ {
			if jokes[i].ID == jokeid {
				jokes[i].Likes = jokes[i].Likes + 1
			}
		}
		c.JSON(http.StatusOK, &jokes)
	} else {
		// the jokes ID is invalid
		c.AbortWithStatus(http.StatusNotFound)
	}

}
