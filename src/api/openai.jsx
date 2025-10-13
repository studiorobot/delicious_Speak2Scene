import axios from 'axios'

const PROMPT_TO_GENERATE_CHARACTER = `Generate a photorealistic image based on the following description.`
const PROMPT_TO_GENERATE_CHARACTER_WITHOUT_PHOTOREALISM = `Use sketchy, brush-based illustration techniques, like a concept to generate an avatar or character for the following prompt:`
const PROMPT_TO_CONVERT_CHARACTER_TO_TEXT = `Based on the provided image, generate a detailed and objective description of the character. Include physical attributes, clothing and appearance, any assistive or mobility features the character may use, and notable facial expressions or body language that might hint at their personality or emotional state. Do not attempt to identify or name the character—focus solely on descriptive analysis.`
const ART_STYLE = `### Avoid photorealism. Use sketchy, brush-based illustration techniques, like a concept to generate an image for the following prompt:`

// Provided a prompt, this function generates an image using OpenAI's gpt-image-1 model
// model info: https://platform.openai.com/docs/models/gpt-image-1
export async function generateImage(prompt) {
	const endpoint = 'https://api.openai.com/v1/images/generations'
	const apiKey = import.meta.env.VITE_OPEN_AI_API_KEY

	try {
		const response = await axios.post(
			endpoint,
			{
				model: 'gpt-image-1',
				prompt: prompt,
				n: 1,
				size: '1024x1024', // can also use 256x256 or 1024x1024
			},
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
			}
		)

		const imageUrl = `data:image/png;base64,${response.data.data[0].b64_json}`
		console.log(response.data)
		let overall_prompt = ART_STYLE + '\n\n' + prompt
		return { imageUrl: imageUrl, prompt: overall_prompt }
	} catch (error) {
		console.error('Image generation failed:', error?.response?.data || error.message)
		return null
	}
}

// Provided a prompt, this function generates an image of the character (ensures that the image generated is not photoralistic)
export async function generateCharacterImage(prompt) {
	const endpoint = 'https://api.openai.com/v1/chat/completions'
	const apiKey = import.meta.env.VITE_OPEN_AI_API_KEY

	// generate initial character image
	let overall_prompt = PROMPT_TO_GENERATE_CHARACTER + '\n\n'
	overall_prompt += `### Character Description: ` + prompt + '\n\n'
	let imgDetails = await generateImage(overall_prompt)
	console.log(imgDetails.imageUrl)
	try {
		const response_character = await axios.post(
			endpoint,
			{
				model: 'gpt-4o',
				messages: [
					{
						role: 'user',
						content: [
							{
								type: 'text',
								text: PROMPT_TO_CONVERT_CHARACTER_TO_TEXT,
							},
							{
								type: 'image_url',
								image_url: {
									url: imgDetails.imageUrl,
								},
							},
						],
					},
				],
			},
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
			}
		)

		let result_char = response_character.data.choices[0].message.content

		// regenerate character image to ensure it is not photorealistic
		let overall_prompt_avatar =
			`### Character Description (as provided by user): ` + prompt + `\n\n`
		overall_prompt_avatar += `### Character Image Description: ` + result_char + `\n\n`
		overall_prompt_avatar += PROMPT_TO_GENERATE_CHARACTER_WITHOUT_PHOTOREALISM
		let char_img = await generateImage(overall_prompt_avatar)
		return {
			imageUrl: char_img.imageUrl,
			prompt: overall_prompt_avatar,
			char_description: result_char,
		}
	} catch (error) {
		console.error(
			'Image generation with reference failed:',
			error?.response?.data || error.message
		)
		return null
	}
}

// Provided a prompt, an image of the character, and an optional flag to use robot description, this function generates an image for the prompt
// First, converts the character image to a text description using OpenAI's gpt-4o model (https://platform.openai.com/docs/models/gpt-4o)
export async function generateSceneWithCharacterReference(prompt, charImgs) {
	try {
		let overall_prompt = `# Character Descriptions: \n`
		charImgs.forEach((charImg, index) => {
			overall_prompt += `## Character ${index + 1}: \n\n## Self description: ${charImg.prompt} \n\n## Character image description: ${charImg.charDescription}\n\n`
		})

		let supporting_text = `### Using the character information above, generate an image based on the following description. Respect the character's description provided. \n\n${ART_STYLE}\n\n`
		overall_prompt += supporting_text + prompt + '\n\n'

		console.log('Overall prompt:', overall_prompt)

		return await generateImage(overall_prompt)
	} catch (error) {
		console.error(
			'Image generation with reference failed:',
			error?.response?.data || error.message
		)
		return null
	}
}

// Given an image of the character, generates a description
export async function generateCharDescription(charImg) {
	const endpoint = 'https://api.openai.com/v1/chat/completions'
	const apiKey = import.meta.env.VITE_OPEN_AI_API_KEY

	try {
		const response_character = await axios.post(
			endpoint,
			{
				model: 'gpt-4o',
				messages: [
					{
						role: 'user',
						content: [
							{
								type: 'text',
								text: PROMPT_TO_CONVERT_CHARACTER_TO_TEXT,
							},
							{
								type: 'image_url',
								image_url: {
									url: charImg.downloadURL,
								},
							},
						],
					},
				],
			},
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
			}
		)
		let result = response_character.data.choices[0].message.content
		console.log(result)
		return result
	} catch (error) {
		console.error(
			'Image generation with reference failed:',
			error?.response?.data || error.message
		)
		return null
	}
}
