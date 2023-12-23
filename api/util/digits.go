package util

import (
	"regexp"
)

var nonDigitsRegexp = regexp.MustCompile(`[^0-9]+`)
var nonDigitsAndCommasRegexp = regexp.MustCompile(`[^0-9,]+`)

func StripNonDigits(s string) string {
	return nonDigitsRegexp.ReplaceAllString(s, "")
}

func StripNonDigitsAndCommas(s string) string {
	return nonDigitsAndCommasRegexp.ReplaceAllString(s, "")
}
