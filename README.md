# <span style="font-variant:small-caps;">Speak2Scene</span>

## What is <span style="font-variant:small-caps;">Speak2Scene</span>?
<span style="font-variant:small-caps;">Speak2Scene</span> is a voice-based tool that leverages GPT model to generate images to create a storyboard. This is a tool designed for participatory design and HCI research. It was originally developed for a speculative co-design study that was submitted to CHI 2026. The purpose of the study was to speculate social dining scenarios with the presence of a robot-assisted feeding system. This version generalizes the tool for broader research and educational use.

## Usage

### Repository Structure
```
delicious_userstudy-app/
│
├── src/                  
│   ├── api/              
│       └── openai.jsx                      # Function definitions interacting with OpenAI API
│   ├── firebase/
│       ├── firebase.jsx                    # Firebase configuration file
│       └── firebase_helper_functions.jsx   # Function definitions interacting with Firebase DB
│   ├── styles/
│       ├── App.css                         # Overall application stylesheet
│       ├── index.css                      
│       └── questionmark.jpg
│   ├── voice/
│       └── voiceParser.jsx                 # Function definition to parse voice commands
│   ├── AllStoryboards.jsx
│   ├── App.jsx
│   ├── Character.jsx
│   ├── IndividualScene.jsx
│   ├── Researcher.jsx
│   ├── ResearcherParticipantView.jsx
│   ├── Storyboard.jsx
│   ├── Welcome.jsx
│   ├── constants.jsx                       # Constants (storyboard, keywords, endpoints for OpenAI)
│   └── main.jsx
│
├── ...                                     # ReactJS requirements, firebase, gitignore, etc.
│
├── README.md                               # This file
│
├── LICENSE                                 # Open source license (MIT, Apache 2.0, etc.)
│
└── CITATION.cff                            # Citation metadata (for SoftwareX / Zenodo)

```

### Requirements

### Installation

### `.env` file
Make sure to create a `.env` file in the root folder and add the following: 
```
# OpenAI API details: 
VITE_OPEN_AI_API_KEY=<YOUR OPEN AI API KEY>

# Firebase details:
VITE_FIREBASE_API_KEY=<YOUR FIREBASE API KEY>
VITE_FIREBASE_AUTH_DOMAIN=<YOUR FIREBASE_AUTH_DOMAIN>
VITE_FIREBASE_PROJECT_ID=<YOUR FIREBASE PROJECT ID>
VITE_FIREBASE_STORAGE_BUCKET=<YOUR FIREBASE STORAGE BUCKET>
VITE_FIREBASE_MESSAGING_SENDER_ID=<YOUR FIREBASE MESSAGEING SENDER ID>
VITE_FIREBASE_APP_ID=<YOUR FIREBASE APP ID>
```

### `constants.jsx` file
Edit `constants.jsx` to your specific application. Fill out the `allStoryboards` section with your specific storyboards and scenes pertaining to them.
```
export const allStoryboards = [
  {
    id: 1,
    title: '<Example>',
    scenes: [
      { id: 1, title: '<Example>' },
      { id: 2, title: '<Example>' },
      { id: 3, title: '<Example>' },
    ],
  },
  {
    id: 2,
    title: '<Example>',
    scenes: [
      { id: 1, title: '<Example>' },
      { id: 2, title: '<Example>' },
      { id: 3, title: '<Example>' },
      { id: 4, title: '<Example>' },
      { id: 5, title: '<Example>' },
      { id: 6, title: '<Example>' },
      { id: 7, title: '<Example>' },
      { id: 8, title: '<Example>' },
    ],
  },
]
``` 
For example, if we are creating a storyboard to gather experience dining at a fine-dining restaurant with six scenes:
```
export const allStoryboards = [
  {
    id: 1,
    title: 'Experience dining at a fine-dining restaurant',
    scenes: [
      { id: 1, title: 'Greeting' },
      { id: 2, title: 'Seating' },
      { id: 3, title: 'Taking orders' },
      { id: 5, title: 'Eating' },
      { id: 6, title: 'Drinking' },
      { id: 6, title: 'Paying' },
    ],
  },
]
```

Changes to `STATUS` or `HOT_WORDS` are not necessary unless you wish to change the trigger words that you will be using to interact with the interface.

If you wish to change the OpenAI models that are being used to generate the image and read the image, then feel free to edit the following in `constants.jsx`:
```
// Endpoint used for image generation (might change based on the model chosen)
export const endpoint_image_generation = 'https://api.openai.com/v1/images/generations'

// Model chosen for image generation
export const image_generation_model = 'gpt-image-1'
```
```
// Endpoint used to read the image (might change based on the model chosen)
export const endpoint_read_image = 'https://api.openai.com/v1/chat/completions'

// Model chosen to read the image
export const read_image_model = 'gpt-4o'
```
## Examples

## Citation

## License

## Acknowledgements

## Contact
Atharva S. Kashyap (katharva@umich.edu; GitHub: @atharva-kashyap)
