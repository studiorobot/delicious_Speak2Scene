# <span style="font-variant:small-caps;">Speak2Scene</span>

## What is <span style="font-variant:small-caps;">Speak2Scene</span>?
<span style="font-variant:small-caps;">Speak2Scene</span> is a voice-based tool that leverages `gpt-image-1` model to generate images to create a storyboard. This is a tool designed for participatory design and HCI research. It was originally developed for a speculative co-design study that was submitted to CHI 2026. The purpose of the study was to speculate social dining scenarios with the presence of a robot-assisted feeding system. This version generalizes the tool for broader research and educational use.

## Usage

### Repository Structure
```
delicious_userstudy-app/
│
├── src/                  # Core source code
│   ├── api/              # Open
│   └── firebase/
│
├── examples/             # Example scripts and sample storyboards
│   ├── demo_notebook.ipynb
│   └── sample_storyboard.json
│
├── data/                 # Optional small test data (if license allows)
│
├── requirements.txt      # Python dependencies
│
├── README.md             # This file
│
├── LICENSE               # Open source license (MIT, Apache 2.0, etc.)
│
└── CITATION.cff          # Citation metadata (for SoftwareX / Zenodo)

```

### Requirements

### Installation

### Usage
1. Make sure to create a `.env` file in the root folder and add the following: 
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

## Examples

## Citation

## License

## Acknowledgements

## Contact
