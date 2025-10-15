import express from 'express'
import axios from 'axios'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Ensure dotenv loads the .env file next to this server.js file regardless of cwd
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.join(__dirname, '..', '.env')
console.log(envPath)
dotenv.config({ path: envPath })

console.log('OPEN_AI_API_KEY set:', !!process.env.OPEN_AI_API_KEY)
const app = express()
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Path to generate an image
app.post('/api/generate-image', async (req, res) => {
  try {
    const prompt = req.body.prompt
    const response = await axios.post(
      process.env.ENDPOINT_IMAGE_GENERATION,
      {
        model: process.env.IMAGE_GENERATION_MODEL,
        prompt: prompt,
        n: 1,
        size: '1024x1024',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPEN_AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )
    const imageUrl = `data:image/png;base64,${response.data.data[0].b64_json}`
    res.json({ imageUrl: imageUrl })
  } catch (error) {
    console.error(error.response?.data || error.message)
    res.status(500).json({ error: error.message })
  }
})

// Path to convert character image to text description
app.post('/api/convert-character-to-text', async (req, res) => {
  try {
    const { imageUrl, prompt_to_convert_char_to_text } = req.body

    const response_character = await axios.post(
      process.env.ENDPOINT_READ_IMAGE,
      {
        model: process.env.READ_IMAGE_MODEL,
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
                  url: imageUrl,
                },
              },
            ],
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPEN_AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    let result_char = response_character.data.choices[0].message.content
    res.json({ result_char })
  } catch (error) {
    console.error(error.response?.data || error.message)
    res.status(500).json({ error: error.message })
  }
})

app.listen(3000, () => console.log('Server running on port 3000'))
