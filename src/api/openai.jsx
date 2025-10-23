import axios from 'axios'

// Constants for OpenAI models
// import { endpoint_image_generation, image_generation_model, endpoint_read_image, read_image_model } from '../constants'

const PROMPT_TO_GENERATE_CHARACTER = `Generate a photorealistic image based on the following description.`
const PROMPT_TO_GENERATE_CHARACTER_WITHOUT_PHOTOREALISM = `Use sketchy, brush-based illustration techniques, like a concept to generate an avatar or character for the following prompt:`
const PROMPT_TO_CONVERT_CHARACTER_TO_TEXT = `Based on the provided image, generate a detailed and objective description of the character. Include physical attributes, clothing and appearance, any assistive or mobility features the character may use, and notable facial expressions or body language that might hint at their personality or emotional state. Do not attempt to identify or name the character—focus solely on descriptive analysis.`
const ART_STYLE = `### Avoid photorealism. Use sketchy brush-based illustration techniques and ensure it is color-blind friendly to generate an image for the following prompt:`

/**
 * Provided a prompt, this function generates an image using OpenAI's gpt-image-1 model
 * model info: https://platform.openai.com/docs/models/gpt-image-1
 *
 * @param {String} prompt - Prompt for which the image needs to be generated
 * @returns {{String: imageURL, String: overall_prompt}} - Generated image's URL and overall prompt including prompt engineering
 */
export async function generateImage(prompt) {
	try {
		const response = await axios.post('/api/generate-image', { prompt })
		console.log(response)
		const imageUrl = response.data.imageUrl
		return { imageUrl: imageUrl, prompt: prompt }
	} catch (error) {
		console.error('Image generation failed:', error?.response?.data || error.message)
		return null
	}
}

/**
 * Provided a prompt, this function generates an image of the character (ensures that the image generated is not photoralistic)
 *
 * @param {String} prompt - Prompt for which the image needs to be generated
 * @returns {{String: imageURL, String: overall_prompt, String: charDescription}} - Generated image's URL, overall prompt including prompt engineering, and character description
 */
export async function generateCharacterImage(prompt) {
	// generate initial character image
	let overall_prompt = PROMPT_TO_GENERATE_CHARACTER + '\n\n'
	overall_prompt += `### Character Description: ` + prompt + '\n\n'
	let { imageUrl, ret_prompt } = await generateImage(overall_prompt)
	try {
		const response = await axios.post('/api/convert-character-to-text', {
			imageUrl: imageUrl,
			prompt_to_convert_char_to_text: PROMPT_TO_CONVERT_CHARACTER_TO_TEXT,
		})
		const result_char = response.data.result_char

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

/**
 * Provided a prompt and a list of character images, this function generates an image based on the prompt and the reference characters in the list
 *
 * @param {String} prompt - Prompt for which the image needs to be generated
 * @param {char[]} charImgs - List of character images
 * @returns {{String: imageURL, String: overall_prompt}} - Generated image's URL and overall prompt including prompt engineering
 */
export async function generateSceneWithCharacterReference(prompt, charImgs) {
	try {
		let overall_prompt = `# Character Descriptions: \n`
		charImgs.forEach((charImg, index) => {
			overall_prompt += `## Character ${index + 1}: \n\n## Self description: ${charImg.prompt} \n\n## Character image description: ${charImg.charDescription}\n\n`
		})

		let supporting_text = `### Using the character information above, generate an image based on the following description. Respect the character's description provided. \n\n${ART_STYLE}\n\n`
		overall_prompt += supporting_text + prompt + '\n\n'

		return await generateImage(overall_prompt)
	} catch (error) {
		console.error(
			'Image generation with reference failed:',
			error?.response?.data || error.message
		)
		return null
	}
}
