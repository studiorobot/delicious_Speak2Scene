import axios from 'axios'

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
		return imageUrl
	} catch (error) {
		console.error('Image generation failed:', error?.response?.data || error.message)
		return null
	}
}

// Provided a prompt, an image of the character, and an optional flag to use robot description, this function generates an image for the prompt
// First, converts the character image to a text description using OpenAI's gpt-4o model (https://platform.openai.com/docs/models/gpt-4o)
// Then, combines the character description + robot description (if applicable) with the prompt to generate the final image using OpenAI's gpt-image-1 model (https://platform.openai.com/docs/models/gpt-image-1)
export async function generateImageWithReference(prompt, charImg, useRobotImage = true) {
	const prompt_to_convert_char_to_text =
		'Based on the provided image, can you generate a detailed description of this character. Include physical attributes, clothing style, notable features or expressions that reflects the character’s personality and character traits.'
	const endpoint = 'https://api.openai.com/v1/chat/completions'
	const apiKey = import.meta.env.VITE_OPEN_AI_API_KEY

	try {
		const response = await axios.post(
			endpoint,
			{
				model: 'gpt-4o',
				messages: [
					{
						role: 'user',
						content: [
							{
								type: 'text',
								text: prompt_to_convert_char_to_text,
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

		console.log(response.data.choices[0].message.content)

		let overall_prompt =
			'Description of the character: ' + response.data.choices[0].message.content + '\n\n'
		overall_prompt +=
			'Original prompt used to generate the character: ' + charImg.prompt + '\n\n'
		if (useRobotImage) {
			let prompt_for_robot_desc =
				'The robot is a Kinova robotic arm that is lightweight, assistive manipulator designed for close human interaction. It features seven degrees of freedom with smooth and articulated joints, allowing for versatile object manipulation. Commonly used in assistive technology, it can be mounted on wide variety of platforms (eg: wheelchair, table, tripod stand, etc.) to help users with tasks like eating, grabbing objects, or performing personal care. Its safe, low-force design and compatibility with various control interfaces (e.g., joystick, sip-and-puff, or voice commands) make it ideal for individuals with limited mobility.'
			overall_prompt += 'Robot description: ' + prompt_for_robot_desc + '\n\n'
		}
		let supporting_text =
			'With this information about the character and the robot, generate an image for the following description: '
		overall_prompt += supporting_text + prompt + '\n\n'

		console.log('Overall prompt:', overall_prompt)

		let image_url = await generateImage(overall_prompt)
		return image_url
	} catch (error) {
		console.error(
			'Image generation with reference failed:',
			error?.response?.data || error.message
		)
		return null
	}
}
