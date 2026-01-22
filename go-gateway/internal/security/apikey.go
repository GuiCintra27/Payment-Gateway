package security

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"os"
)

func HashAPIKey(apiKey string) string {
	secret := os.Getenv("API_KEY_SECRET")
	if secret == "" {
		env := os.Getenv("ENV")
		if env == "" {
			env = os.Getenv("APP_ENV")
		}
		if env != "dev" && env != "development" && env != "local" {
			panic("API_KEY_SECRET is required outside dev environments")
		}
		secret = "dev_secret"
	}

	hasher := hmac.New(sha256.New, []byte(secret))
	_, _ = hasher.Write([]byte(apiKey))
	return hex.EncodeToString(hasher.Sum(nil))
}
