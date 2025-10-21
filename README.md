# <span style="font-variant:small-caps;">Speak2Scene</span>

## What is <span style="font-variant:small-caps;">Speak2Scene</span>?
<span style="font-variant:small-caps;">Speak2Scene</span> is a voice-based tool that leverages GPT model to generate images to create a storyboard. This is a tool designed for participatory design and HCI research. It was originally developed for a speculative co-design study that was submitted to CHI 2026. The purpose of the study was to speculate social dining scenarios with the presence of a robot-assisted feeding system. This version generalizes the tool for broader research and educational use.

## Usage

### Repository Structure
```
delicious_userstudy-app/
│
├── server/
│   ├── server.js                           # Server Routes to make OpenAI API calls
├── src/                  
│   ├── api/              
│       └── openai.jsx                      # Frontend function defintions to interact with OpenAI API through `server.js`
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
- Google Chrome browser
- Terminal or Command Prompt
- 
#### Node
Ensure that you have Node installed. Follow the steps outlined: `https://nodejs.org/en/download`.



### Installation
1. Clone this repository: For ssh: `git clone git@github.com:studiorobot/delicious_Speak2Scene.git` and For https (use this if you don't have ssh configured with GitHub): `git clone https://github.com/studiorobot/delicious_Speak2Scene.git` to a local folder of your choice.
2. Change directory into the app: `cd delicious_Speak2Scene`
3. Install all the relevant packages: `npm install`
> If you get an error `npm: command not found`, then navigate to a new terminal window and follow the steps to install [Node](#node). Then make sure to restart the terminal and start from Step 2 of the Installation procedure.

#### OpenAI API
You will need an OpenAI API key which you can acquire through the OpenAI dashboard: https://platform.openai.com/docs/quickstart. Keep the API key in a file on your computer so you don't lose it. And, make sure to add enough funds into your account.

#### Firebase
1. Create a Firebase project. Follow the instructions: https://firebase.google.com/docs/web/setup#create-project
2. Note that you will need to be on Spark Plan
3. Create a Firebase app within the project. Make sure to also setup Firebase Hosting for the app. While registering the app, you will come across a step that has `const firebaseConfig = {...}`. Make sure to record the information that is present there in a safe place on your computer so you don't lose it. You will need it for (setting up the .env)[#.env-file]. Finish all the steps and proceed to the console.
4. In the console, create a Firebase storage. You will find this under `Product Categories > Build`. You will need the pay-as-you go blaze plan.
5. Create a database: `Product Categories > Firestore Database`. Default options should work. Ensure that you start in `test` mode.

#### Getting connected to database + ensuring the app works with OpenAI API
1. Create a `.env` file within the `delicious_userstudy-app` folder. Follow the instructions outlined [here](#env-file). Refer to [OpenAI API](#openai-api) and [Firebase](#firebase) sections to get the API keys and other details.
2. Perform `npm run dev` and it should start the app. 

4. Perform: `npm run dev`. This should start a server and the app on your computer with a localhost url. Open the localhost url in your web browser (tested with Google Chrome browser). It should open the app with a [researcher] screen. You can enter a name and it will take you to the landing page. This step simply ensures that you have cloned your repository and installed the packages correctly.
> If the application starts correctly, you should notice something that looks like the following (Note: It's okay if not each line is exactly the same!):
> ```
> > userstudy-app@0.0.0 dev
> concurrently "npm run dev:frontend" "npm run dev:backend"
> [1]
> [1] > userstudy-app@0.0.0 dev:backend
> [1] > node server/server.js
> [1] 
> [0] 
> [0] > userstudy-app@0.0.0 dev:frontend
> [0] > vite
> [0] 
> [1] /Users/atharvakashyap/Documents/CodeProjects/LLMs_Disabilities_AssistiveRobotics/temp_speak2scene/delicious_userstudy-app/.env
> [1] [dotenv@17.2.3] injecting env (12) from .env -- tip: 🗂️ backup and recover secrets: https://dotenvx.com/ops
> [1] OPEN_AI_API_KEY set: true
> [1] Server running on port 3000
> [0] 
> [0]   VITE v6.3.3  ready in 176 ms
> [0] 
> [0]   ➜  Local:   http://localhost:5173/
> [0]   ➜  Network: use --host to expose
> ```
> If your OpenAI API key is correctly configured and set in the `.env` file, then you should notice `OPEN_AI_API_KEY set: true`. Otherwise, you might notice: `OPEN_AI_API_KEY set: false`, which means you will need to go back and follow steps outlined under [OpenAI API](#openai-api).
>
5. 



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
VITE_FIREBASE_STORAGE_FOLDER=<FOLDER NAME YOU WANT TO STORE IMAGES IN DATASTORE>
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
