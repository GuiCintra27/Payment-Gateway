package domain

import "math"

const centsFactor = 100

func AmountToCents(amount float64) int64 {
	return int64(math.Round(amount * centsFactor))
}

func CentsToAmount(cents int64) float64 {
	return float64(cents) / float64(centsFactor)
}
