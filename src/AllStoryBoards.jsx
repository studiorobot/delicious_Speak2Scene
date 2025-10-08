import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PropTypes from 'prop-types'

import { StoryBoard } from './StoryBoard'
import { IndividualScene } from './IndividualScene'

// Speech recoginition imports
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { parseVoiceCommand } from './voiceParser'

// Firebase imports
import {
  fetchCharacter,
  fetchRobot,
  fetchImagesBySelection,
} from './firebase/firebase_helper_functions'

// Style imports
import './App.css'
import Carousel from 'react-multi-carousel'
import 'react-multi-carousel/lib/styles.css'

const STATUS = {
  WAITING: 'Waiting',
  LISTENING: 'Listening...',
}

const HOT_WORDS = {
  START: 'start listening',
  STOP: 'stop listening',
  CLEAR_TRANSCRIPT: 'clear transcript',
  CHARACTER: 'avatar',
  ROBOT: 'robot',
  TRIAL: 'trial',
  STORYBOARD: 'storyboard',
  MOMENTS: 'moments',
  SCROLL_RIGHT: 'scroll right',
  SCROLL_LEFT: 'scroll left',
}
/*
View: All Storyboards (as little cards) 
- "go into storyboard"
*/
export function AllStoryBoards({ storyboards }) {
  const [status, setStatus] = useState(STATUS.WAITING)
  const [captured, setCaptured] = useState('')
  const [currentStoryboard, setCurrentStoryboard] = useState(null)
  const [selectedImages, setSelectedImages] = useState({})
  const participant = useParams().participant

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition()

  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 2000 },
      items: 10,
    },
    desktop: {
      breakpoint: { max: 2000, min: 900 },
      items: 3,
    },
    tablet: {
      breakpoint: { max: 900, min: 768 },
      items: 2,
    },
    mobile: {
      breakpoint: { max: 768, min: 0 },
      items: 1,
    },
  }

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      alert('Your browser does not support speech recognition')
      return
    }
    SpeechRecognition.startListening({
      continuous: true,
      language: 'en-US',
    })
    console.log('listening: ' + listening)
    resetTranscript()
  }, [currentStoryboard])

  useEffect(() => {
    const lower = transcript.toLowerCase().trim()

    if (!lower) return

    if (status === STATUS.WAITING && lower.includes(HOT_WORDS.START)) {
      console.log('Start triggered')
      setStatus(STATUS.LISTENING)
      setCaptured('')
      resetTranscript()
      return
    } else if (
      status === STATUS.LISTENING &&
      lower.includes(HOT_WORDS.TRIAL) &&
      lower.includes(HOT_WORDS.STOP) &&
      !robot &&
      !character
    ) {
      console.log('Robot creation triggered')
      const selected = storyboards.find((sb) => sb.id === 1)
      setStatus(STATUS.WAITING)
      setCurrentStoryboard(selected)
      resetTranscript()
      return
    } else if (
      status === STATUS.LISTENING &&
      lower.includes(HOT_WORDS.STORYBOARD) &&
      lower.includes(HOT_WORDS.STOP) &&
      !robot &&
      !character
    ) {
      console.log('Robot creation triggered')
      const selected = storyboards.find((sb) => sb.id === 2)
      setStatus(STATUS.WAITING)
      setCurrentStoryboard(selected)
      resetTranscript()
      return
    } else if (
      status === STATUS.LISTENING &&
      lower.includes(HOT_WORDS.MOMENTS) &&
      lower.includes(HOT_WORDS.STOP) &&
      !robot &&
      !character
    ) {
      console.log('Robot creation triggered')
      const selected = storyboards.find((sb) => sb.id === 3)
      setStatus(STATUS.WAITING)
      setCurrentStoryboard(selected)
      resetTranscript()
      return
    } else if (
      status === STATUS.LISTENING &&
      lower.includes(HOT_WORDS.SCROLL_RIGHT) &&
      lower.includes(HOT_WORDS.STOP)
    ) {
      console.log('Scroll right triggered')
      const rightArrow = document.querySelector('.react-multiple-carousel__arrow--right')
      if (rightArrow) {
        rightArrow.click()
      }
      setStatus(STATUS.WAITING)
      resetTranscript()
    } else if (
      status === STATUS.LISTENING &&
      lower.includes(HOT_WORDS.SCROLL_LEFT) &&
      lower.includes(HOT_WORDS.STOP)
    ) {
      console.log('Scroll left triggered')
      const leftArrow = document.querySelector('.react-multiple-carousel__arrow--left')
      if (leftArrow) {
        leftArrow.click()
      }
      setStatus(STATUS.WAITING)
      resetTranscript()
      // } else if (status === STATUS.LISTENING && lower.includes(HOT_WORDS.STOP)) {
      // 	console.log('Stop triggered')
      // 	let cleanedTranscript = transcript.split(HOT_WORDS.STOP)[0].trim()
      // 	setCaptured(cleanedTranscript)
      // 	setStatus(STATUS.WAITING)
      // 	if (cleanedTranscript && cleanedTranscript.length > 0 && !currentStoryboard) {
      // 		console.log('Handling voice command:', cleanedTranscript)
      // 		setStatus(STATUS.WAITING)
      // 		handleVoiceCommand(cleanedTranscript)
      // 	}
      // 	resetTranscript()
    } else if (status === STATUS.LISTENING && lower.includes(HOT_WORDS.CLEAR_TRANSCRIPT)) {
      console.log('clear triggered')
      resetTranscript()
    }
  }, [transcript, currentStoryboard])

  // Function when there are multiple storyboards
  // function handleVoiceCommand(command) {
  // 	const parsed = parseVoiceCommand(command)
  // 	console.log('Parsed command:', parsed)
  // 	if (!parsed) return

  // 	if (parsed.context === 'storyboard') {
  // 		const selected = storyboards.find((sb) => sb.id === parseInt(parsed.number))
  // 		console.log(selected)
  // 		if (selected) {
  // 			console.log('Selected storyboard:', selected)
  // 			setCurrentStoryboard(selected)
  // 			resetTranscript()
  // 		}
  // 	}
  // }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const charImg = await fetchCharacter(participant)
        const roboImg = await fetchRobot(participant)
        console.log('Avatar image:', charImg)
        console.log('Robot image:', roboImg)
        if (charImg.length > 0) {
          setCharacterImage(charImg[0].downloadURL)
        }
        if (roboImg.length > 0) {
          setRobotImage(roboImg[0].downloadURL)
        }
        let sbsImages = []
        for (let i = 0; i < storyboards.length; i++) {
          let results = await fetchImagesBySelection(participant, storyboards[i].id)
          const imagesByScene = {}
          results.forEach((image) => {
            if (!imagesByScene[image.sceneId]) {
              imagesByScene[image.sceneId] = []
            }
            imagesByScene[image.sceneId].push(image)
          })
          sbsImages.push(imagesByScene)
        }
        console.log(sbsImages)
        setSelectedImages(sbsImages)
      } catch (error) {
        console.error('Error:', error)
      }
    }
    fetchData()
  }, [])

  function backFunc() {
    setCurrentStoryboard(null)
    setStatus(STATUS.WAITING)
  }

  return (
    <div style={{ height: '100vh' }}>
      {!currentStoryboard ? (
        <div style={{ border: '5px solid #ffb000', borderRadius: '8px', padding: '10px' }}>
          <div className="status-bar">
            <p className="participant">
              <strong>Participant:</strong>
              {participant}
            </p>
            {/* <p className='voice'><strong>Voice On:</strong> {listening ? 'Yes' : 'No'}</p> */}
            <p
              className="status"
              style={{
                backgroundColor: status === STATUS.LISTENING ? '#0BDA51' : 'white',
              }}
            >
              <strong>Status:</strong> {status}
            </p>
          </div>
          <div className="container-lr">
            <div className="left">
              <h4>Main Menu</h4>
              {status === STATUS.LISTENING ? (
                <>
                  <p>
                    <strong>Transcript:</strong> {transcript}
                  </p>{' '}
                  {/* <p>
										<strong>Captured Prompt:</strong> {captured}
									</p> */}
                </>
              ) : (
                ''
              )}

              <div
                style={{
                  maxWidth: '60vw',
                  overflow: 'hidden',
                  marginTop: '10px',
                }}
              >
                <Carousel
                  responsive={responsive}
                  infinite={false}
                  arrows={true}
                  keyBoardControl={true}
                  containerClass="carousel-container"
                  itemClass="carousel-item-padding-40-px"
                  removeArrowOnDeviceType={[]}
                  customTransition="all 0.3s ease-in-out"
                  transitionDuration={300}
                >
                  {storyboards.map((sb) => (
                    <div
                      key={sb.id}
                      // className="scene-card"
                      style={{
                        padding: '10px',
                        margin: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        height: 'auto',
                      }}
                    >
                      <p>
                        <strong>{sb.type}</strong>
                      </p>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '10px',
                        }}
                      >
                        {selectedImages[sb.id - 1] &&
                          Object.keys(selectedImages[sb.id - 1]).length >
                          0 ? (
                          Object.keys(selectedImages[sb.id - 1]).map(
                            (key, index) => {
                              const sceneImages =
                                selectedImages[sb.id - 1][key]
                              return Array.isArray(sceneImages) &&
                                sceneImages[0] ? (
                                <img
                                  key={index}
                                  src={sceneImages[0].downloadURL}
                                  alt={`Scene ${index}`}
                                  style={{
                                    width: '100%', // Will auto-fit column width
                                    height: 'auto',
                                    objectFit: 'cover',
                                  }}
                                />
                              ) : (
                                <p key={index}>
                                  Invalid image at index {key}
                                </p>
                              )
                            }
                          )
                        ) : (
                          <p>No images available</p>
                        )}
                      </div>

                      <button
                        className="scene-button1"
                        onClick={() =>
                          setCurrentStoryboard(
                            storyboards.find((sbb) => sbb.id === sb.id)
                          )
                        }
                      >
                        Go
                      </button>
                    </div>
                  ))}
                </Carousel>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <StoryBoard
          participant={participant}
          storyboard={currentStoryboard}
          onBack={() => backFunc()}
        />
      )}
    </div>
  )
}

AllStoryBoards.propTypes = {
  storyboards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      scenes: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.number.isRequired,
          title: PropTypes.string.isRequired,
        })
      ).isRequired,
    })
  ).isRequired,
}
