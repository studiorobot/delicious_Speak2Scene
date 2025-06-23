import axios from 'axios'
import { ROBOT_TYPE } from '../constants'

const PROMPT_TO_CONVERT_CHARACTER_TO_TEXT = `Based on the provided image, generate a detailed and objective description of the character. Include physical attributes, clothing and appearance, any assistive or mobility features the character may use, and notable facial expressions or body language that might hint at their personality or emotional state. Do not attempt to identify or name the character—focus solely on descriptive analysis.`
const DESCRIPTION_OF_KINOVA = `The robot is a Kinova robotic arm that is lightweight, assistive manipulator designed for close human interaction. It features six or seven degrees of freedom with smooth and articulated joints, allowing for versatile object manipulation. Commonly used in assistive technology, it can be mounted on wide variety of platforms (e.g., wheelchair, table, tripod stand, etc.) to help users with tasks like eating, grabbing objects, or performing personal care. Its safe, low-force design and compatibility with various control interfaces (e.g., joystick, sip-and-puff, or voice commands) make it ideal for individuals with limited mobility.`
const PROMPT_TO_CONVERT_ROBOT_TO_TEXT = `Based on the provided robot image, provide a brief description of the emobodiment of the robot. Capture all the details such that I can replicate the image without ever looking at the image.`
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
				n: 1, // generate 1 image
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

// Provided a prompt, this function generates an image of the robot using description of the robot
export async function generateRobotWithRobotReference(prompt) {
	let overall_prompt = `### Robot description: ` + DESCRIPTION_OF_KINOVA + '\n\n'
	overall_prompt += `### Generate an image for the following description. Do not alter the fundamental physical characteristics of the Kinova robotic arm: ` + prompt + '\n\n'
	return await generateImage(overall_prompt)
}

// Provided a prompt, an image of the character, and an optional flag to use robot description, this function generates an image for the prompt
// First, converts the character image to a text description using OpenAI's gpt-4o model (https://platform.openai.com/docs/models/gpt-4o)
// Then, combines the character description + robot description (if applicable) with the prompt to generate the final image using OpenAI's gpt-image-1 model (https://platform.openai.com/docs/models/gpt-image-1)
export async function generateSceneWithCharacterRobotReference(
	prompt,
	charImg,
	useRobotImage = ROBOT_TYPE.NONE,
	robotImg = null
) {
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

		console.log(response_character.data.choices[0].message.content)

		let overall_prompt =
			`### Character Description: ` +
			response_character.data.choices[0].message.content +
			'\n\n'
		overall_prompt +=
			`### Original prompt used to generate the character: ` + charImg.prompt + '\n\n'
		if (useRobotImage != ROBOT_TYPE.NONE) {
			const response_robot = await axios.post(
				endpoint,
				{
					model: 'gpt-4o',
					messages: [
						{
							role: 'user',
							content: [
								{
									type: 'text',
									text: PROMPT_TO_CONVERT_ROBOT_TO_TEXT,
								},
								{
									type: 'image_url',
									image_url: {
										url: useRobotImage === ROBOT_TYPE.ROBOT_CHARACTER ? robotImg.downloadURL : "https://www.kinovarobotics.com/uploads/_1000x1000_crop_center-center_none/22037/Gen3-robot-img-Cover-img-is-loaded-block-1B.webp",
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

			console.log(response_robot.data.choices[0].message.content)
			overall_prompt += `### Robot's Physical Description: ` + DESCRIPTION_OF_KINOVA + '\n\n'
			overall_prompt +=
				`### Robot Image Description: ` +
				response_robot.data.choices[0].message.content +
				'\n\n'
		}
		let supporting_text = `### Using the information above, generate an image based on the following description. Do not alter the fundamental physical characteristics of the Kinova robotic arm: `
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
/**
 * ### Avoid photorealism. Use sketchy, brush-based illustration techniques, like a concept to generate an image for the following prompt:

### Character Description: The character is a young individual with a short, neatly-groomed hairstyle. They are sitting in a motorized wheelchair, equipped with a headrest and joystick controls, which suggests they use it for mobility assistance. The joystick is equipped with a flexible tube controller positioned near the person's mouth, indicating it may be used for hands-free operation.

They are wearing a simple, casual gray t-shirt and blue jeans, presenting a comfortable and relaxed appearance. The person’s expression is neutral and focused, with their gaze directed forward, suggesting attentiveness or contemplation. The posture is upright, and both arms rest naturally on the armrests, indicating a calm and composed demeanor. The overall impression is one of practicality and self-sufficiency, reflecting adaptability in using assistive technology for mobility.

### Original prompt used to generate the character: I would like to create a character based on my life I need is atharva 22-year-old male of Indian descent I'm wearing gray T-shirt with blue jeans black hair brown skin I also use a wheelchair to move around I use it electronic wheelchair and I control the wheelchair using Sip and puff method since I'm unable to use my hands

Use art style: sketch with watercolors

### Robot's Physical Description: The robot is a Kinova robotic arm that is lightweight, assistive manipulator designed for close human interaction. It features six or seven degrees of freedom with smooth and articulated joints, allowing for versatile object manipulation. Commonly used in assistive technology, it can be mounted on wide variety of platforms (e.g., wheelchair, table, tripod stand, etc.) to help users with tasks like eating, grabbing objects, or performing personal care. Its safe, low-force design and compatibility with various control interfaces (e.g., joystick, sip-and-puff, or voice commands) make it ideal for individuals with limited mobility.

### Robot's Character Description: The robot is composed of a sleek, segmented arm with a white, glossy surface. It has multiple cylindrical joints that allow for flexible movement. At the top section of the arm, which appears to be in an angled position, the word "KINOVA" is printed in a bold blue font. The arm culminates in a sophisticated, black end effector or gripper with two main fingers designed for precision gripping. The overall design suggests a blend of functionality and modern aesthetics, suitable for tasks requiring dexterous manipulation.

### Using the information above, generate an image based on the following description. Do not alter the fundamental physical characteristics of the Kinova robotic arm: generate the robot welcoming into the restaurant


 */