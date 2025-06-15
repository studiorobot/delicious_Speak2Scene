// import nlp from 'compromise'
// import Fuse from 'fuse.js'

// const validContexts = [
// 	'storyboard',
// 	'scene',
// 	'change image',
// 	'go back',
// 	'scroll right',
// 	'scroll left',
// ]
// const fuse = new Fuse(validContexts, { threshold: 0.3 }) // tighten threshold a bit

// export function parseVoiceCommand(transcript) {
// 	const lower = transcript.toLowerCase()
// 	const doc = nlp(lower)

// 	// Extract number
// 	let number = null
// 	const numbers = doc.numbers().toNumber().out('array')
// 	if (numbers.length > 0) {
// 		number = numbers[0]
// 	}

// 	// Extract context word (storyboard or scene)
// 	let context = null
// 	const words = lower.split(/\s+/)
// 	for (let word of words) {
// 		if (validContexts.includes(word)) {
// 			context = word // exact match!
// 			break
// 		}
// 	}

// 	if (!context) {
// 		// fallback to fuzzy search
// 		for (let word of words) {
// 			const match = fuse.search(word)
// 			if (match.length > 0) {
// 				context = match[0].item
// 				break
// 			}
// 		}
// 	}

// 	if (context && number !== null) {
// 		return { context, number }
// 	}

// 	return null // couldn't understand the command
// }

import nlp from 'compromise'
import Fuse from 'fuse.js'

const validContexts = [
	'storyboard',
	'scene',
  'moment',
	'change image',
	'go back',
	'scroll right',
	'scroll left',
]

const fuse = new Fuse(validContexts, { threshold: 0.5 })

export function parseVoiceCommand(transcript) {
	const lower = transcript.toLowerCase()
	let processedTranscript = lower

	// Extract and normalize numbers using compromise
	const doc = nlp(lower)
	const numbers = doc.numbers().toNumber().out('array') // outputs [1, 2, 3] not text
	const number = numbers.length > 0 ? numbers[0] : null

	// Also replace number words in text for regex matching
	doc.numbers().toNumber() // converts "one" to "1" in the nlp doc
	processedTranscript = doc.text()

	// Intent-based patterns
	const intentPatterns = [
		{ regex: /\b(?:go to|switch to|change to)?\s*(?:the\s*)?scene\s+(\d+)/, context: 'scene' },
		{
			regex: /\b(?:go to|switch to|change to)?\s*(?:the\s*)?storyboard\s+(\d+)/,
			context: 'storyboard',
		},
		{ regex: /\bchange\s+image\s+(?:to\s+)?(\d+)/, context: 'change image' },
	]

	for (let { regex, context } of intentPatterns) {
		const match = processedTranscript.match(regex)
		if (match && match[1]) {
			return {
				context,
				number: parseInt(match[1], 10),
			}
		}
	}

	// Fallback: fuzzy match context
	const words = processedTranscript.split(/\s+/)
	let context = null
	for (let word of words) {
		if (validContexts.includes(word)) {
			context = word
			break
		}
	}
	if (!context) {
		for (let word of words) {
			const match = fuse.search(word)
			if (match.length > 0) {
				context = match[0].item
				break
			}
		}
	}

	// Context + number fallback
	if (context && number !== null) {
		const contextIndex = words.findIndex((w) =>
			context.split(' ').some((part) => w.includes(part))
		)
		const numberIndex = words.findIndex((w) => w === number.toString())

		if (
			contextIndex !== -1 &&
			numberIndex !== -1 &&
			Math.abs(contextIndex - numberIndex) <= 3
		) {
			return { context, number }
		}
	}

	return null
}
