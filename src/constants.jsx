// List of Storyboards + Scenes
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

export const STATUS = {
  WAITING: 'Waiting',
  LISTENING: 'Listening...',
  GENERATING_IMAGE: 'Generating image',
}

export const HOT_WORDS = {
  START: 'start listening',
  STOP: 'stop listening',
  CLEAR_TRANSCRIPT: 'clear transcript',
  GO_BACK: 'go back',
  SCROLL_RIGHT: 'scroll right',
  SCROLL_LEFT: 'scroll left',
  SCROLL_UP: 'scroll up',
  SCROLL_DOWN: 'scroll down',
  ADD_CHARACTER: 'add character',
  CHANGE_IMAGE: 'change image'
}

export const endpoint_image_generation = 'https://api.openai.com/v1/images/generations'
export const image_generation_model = 'gpt-image-1'
export const endpoint_read_image = 'https://api.openai.com/v1/chat/completions'
export const read_image_model = 'gpt-4o'