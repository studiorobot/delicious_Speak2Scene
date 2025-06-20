import axios from 'axios'

const PROMPT_TO_CONVERT_CHARACTER_TO_TEXT = `Based on the provided image, generate a detailed and objective description of the character. Include physical attributes, clothing and appearance, any assistive or mobility features the character may use, and notable facial expressions or body language that might hint at their personality or emotional state. Do not attempt to identify or name the character—focus solely on descriptive analysis.`
const DESCRIPTION_OF_KINOVA = `The robot is a Kinova robotic arm that is lightweight, assistive manipulator designed for close human interaction. It features six or seven degrees of freedom with smooth and articulated joints, allowing for versatile object manipulation. Commonly used in assistive technology, it can be mounted on wide variety of platforms (e.g., wheelchair, table, tripod stand, etc.) to help users with tasks like eating, grabbing objects, or performing personal care. Its safe, low-force design and compatibility with various control interfaces (e.g., joystick, sip-and-puff, or voice commands) make it ideal for individuals with limited mobility.`
const PROMPT_TO_CONVERT_ROBOT_TO_TEXT = `Based on the provided robot image, provide a brief description of the emobodiment of the robot.`
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
	overall_prompt += `### Generate an image for the following description: ` + prompt + '\n\n'
	return await generateImage(overall_prompt)
}

// Provided a prompt, an image of the character, and an optional flag to use robot description, this function generates an image for the prompt
// First, converts the character image to a text description using OpenAI's gpt-4o model (https://platform.openai.com/docs/models/gpt-4o)
// Then, combines the character description + robot description (if applicable) with the prompt to generate the final image using OpenAI's gpt-image-1 model (https://platform.openai.com/docs/models/gpt-image-1)
export async function generateSceneWithCharacterRobotReference(
	prompt,
	charImg,
	useRobotImage = false,
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
		if (useRobotImage) {
			console.log('insite')
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
										url: robotImg.downloadURL,
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
				`### Robot's Character Description: ` +
				response_robot.data.choices[0].message.content +
				'\n\n'
		}
		let supporting_text = `### With this information, generate an image for the following description (Do not change the basic robot physical properties of a Kinova Arm): `
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

### Character Description: The character is a young adult male with short dark hair and facial hair, dressed in casual attire—a simple gray T-shirt and blue jeans. He is seated in a motorized wheelchair, which features a high back and supportive headrest, indicating it is designed for comfort and mobility assistance. 

In front of him is a joystick control, and attached to the chair is a flexible tube-like device, which the character uses with his mouth. This suggests that he utilizes this setup to navigate his surroundings, pointing to his adaptability and resourcefulness in managing mobility challenges.

His body posture is upright, and he maintains a composed facial expression, with his gaze directed forward, conveying a sense of calm determination. His relaxed posture and focused look may imply a confident and resilient personality.

### Original prompt used to generate the character: I would like to create a character based on my life I need is atharva 22-year-old male of Indian descent I'm wearing gray T-shirt with blue jeans black hair brown skin I also use a wheelchair to move around I use it electronic wheelchair and I control the wheelchair using Sip and puff method since I'm unable to use my hands

Use art style: sketch with watercolors

### Robot's Physical Description: The robot is a Kinova robotic arm that is lightweight, assistive manipulator designed for close human interaction. It features six or seven degrees of freedom with smooth and articulated joints, allowing for versatile object manipulation. Commonly used in assistive technology, it can be mounted on wide variety of platforms (e.g., wheelchair, table, tripod stand, etc.) to help users with tasks like eating, grabbing objects, or performing personal care. Its safe, low-force design and compatibility with various control interfaces (e.g., joystick, sip-and-puff, or voice commands) make it ideal for individuals with limited mobility.

### Robot's Character Description: The robot features a sleek, deep blue robotic arm mounted on a wheeled platform. It is designed with multiple joints for a high degree of flexibility and precision. The arm has an attached blue bow tie, adding a touch of personality. The wheels suggest mobility for dynamic tasks.

### With this information, generate an image for the following description: I am with my two other friends finished my dinner and we are all getting ready to pay and exit the restaurant the robot arm helps provide the check to me and I will be paying for all my friends


 */