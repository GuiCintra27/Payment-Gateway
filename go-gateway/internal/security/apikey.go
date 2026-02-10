package security

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"os"
	"strings"
	"sync"
)

type APIKeySecrets struct {
	ActiveKeyID string
	Secrets     map[string]string
}

type KeyHash struct {
	KeyID string
	Hash  string
}

var secretsOnce sync.Once
var secretsCache APIKeySecrets
var secretsErr error

func ActiveKeyID() (string, error) {
	cfg, err := loadAPIKeySecrets()
	if err != nil {
		return "", err
	}
	return cfg.ActiveKeyID, nil
}

func HashAPIKey(apiKey, keyID string) (string, error) {
	cfg, err := loadAPIKeySecrets()
	if err != nil {
		return "", err
	}
	secret, ok := cfg.Secrets[keyID]
	if !ok {
		return "", errors.New("api key secret not found for key id")
	}
	return hashWithSecret(apiKey, secret), nil
}

func HashAPIKeyWithActiveKey(apiKey string) (string, string, error) {
	cfg, err := loadAPIKeySecrets()
	if err != nil {
		return "", "", err
	}
	secret, ok := cfg.Secrets[cfg.ActiveKeyID]
	if !ok {
		return "", "", errors.New("active api key secret not found")
	}
	return hashWithSecret(apiKey, secret), cfg.ActiveKeyID, nil
}

func HashAPIKeyCandidates(apiKey string) ([]KeyHash, error) {
	cfg, err := loadAPIKeySecrets()
	if err != nil {
		return nil, err
	}

	hashes := make([]KeyHash, 0, len(cfg.Secrets))
	for keyID, secret := range cfg.Secrets {
		hashes = append(hashes, KeyHash{
			KeyID: keyID,
			Hash:  hashWithSecret(apiKey, secret),
		})
	}
	return hashes, nil
}

func loadAPIKeySecrets() (APIKeySecrets, error) {
	secretsOnce.Do(func() {
		active := os.Getenv("API_KEY_ACTIVE_KEY_ID")
		if active == "" {
			active = "v1"
		}

		secrets := map[string]string{}
		raw := os.Getenv("API_KEY_SECRETS")
		if raw != "" {
			for _, pair := range strings.Split(raw, ",") {
				parts := strings.SplitN(strings.TrimSpace(pair), ":", 2)
				if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
					secretsErr = errors.New("invalid API_KEY_SECRETS format")
					return
				}
				secrets[parts[0]] = parts[1]
			}
		} else {
			secret := os.Getenv("API_KEY_SECRET")
			if secret == "" {
				if !isDevEnv() {
					secretsErr = errors.New("API_KEY_SECRET is required outside dev environments")
					return
				}
				secret = "dev_secret"
			}
			secrets["v1"] = secret
		}

		if _, ok := secrets[active]; !ok {
			secretsErr = errors.New("API_KEY_ACTIVE_KEY_ID not found in API_KEY_SECRETS")
			return
		}

		secretsCache = APIKeySecrets{
			ActiveKeyID: active,
			Secrets:     secrets,
		}
	})

	return secretsCache, secretsErr
}

func isDevEnv() bool {
	env := os.Getenv("ENV")
	if env == "" {
		env = os.Getenv("APP_ENV")
	}
	if env == "" {
		env = os.Getenv("NODE_ENV")
	}
	return env == "dev" || env == "development" || env == "local"
}

func hashWithSecret(apiKey, secret string) string {
	hasher := hmac.New(sha256.New, []byte(secret))
	_, _ = hasher.Write([]byte(apiKey))
	return hex.EncodeToString(hasher.Sum(nil))
}
