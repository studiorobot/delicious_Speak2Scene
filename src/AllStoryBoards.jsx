import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PropTypes from 'prop-types'

import { StoryBoard } from './StoryBoard'

// Speech recoginition imports
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { parseVoiceCommand } from './voice/voiceParser'

// Firebase imports
import { fetchSceneImagesBySelection } from './firebase/firebase_helper_functions'

// Style imports
import './styles/App.css'
import Carousel from 'react-multi-carousel'
import 'react-multi-carousel/lib/styles.css'
import fallbackImage from './styles/questionmark.jpg'

// Constants
import { STATUS, HOT_WORDS } from './constants'

export function AllStoryBoards({ storyboards }) {
  const [status, setStatus] = useState(STATUS.WAITING)
  const [currentStoryboard, setCurrentStoryboard] = useState(null)
  const [selectedImages, setSelectedImages] = useState({})
  const participant = useParams().participant

  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition()

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
    resetTranscript()
  }, [currentStoryboard])

  useEffect(() => {
    const lower = transcript.toLowerCase().trim()

    if (!lower) return

    if (status === STATUS.WAITING && lower.includes(HOT_WORDS.START)) {
      setStatus(STATUS.LISTENING)
      resetTranscript()
      return
    } else if (
      status === STATUS.LISTENING &&
      lower.includes(HOT_WORDS.SCROLL_RIGHT) &&
      lower.includes(HOT_WORDS.STOP)
    ) {
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
      const leftArrow = document.querySelector('.react-multiple-carousel__arrow--left')
      if (leftArrow) {
        leftArrow.click()
      }
      setStatus(STATUS.WAITING)
      resetTranscript()
    } else if (status === STATUS.LISTENING && lower.includes(HOT_WORDS.STOP)) {
      let cleanedTranscript = transcript.split(HOT_WORDS.STOP)[0].trim()
      setStatus(STATUS.WAITING)
      if (cleanedTranscript && cleanedTranscript.length > 0 && !currentStoryboard) {
        setStatus(STATUS.WAITING)
        handleVoiceCommand(cleanedTranscript)
      }
      resetTranscript()
    } else if (status === STATUS.LISTENING && lower.includes(HOT_WORDS.CLEAR_TRANSCRIPT)) {
      resetTranscript()
    }
  }, [transcript, currentStoryboard])

  // Function when there are multiple storyboards
  function handleVoiceCommand(command) {
    const parsed = parseVoiceCommand(command)
    if (!parsed) return

    if (parsed.context === 'storyboard') {
      const selected = storyboards.find((sb) => sb.id === parseInt(parsed.number))
      if (selected) {
        setCurrentStoryboard(selected)
        resetTranscript()
      }
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        let sbsImages = []
        for (let i = 0; i < storyboards.length; i++) {
          let results = await fetchSceneImagesBySelection(participant, storyboards[i].id)
          const imagesByScene = {}
          results.forEach((image) => {
            if (!imagesByScene[image.sceneId]) {
              imagesByScene[image.sceneId] = []
            }
            imagesByScene[image.sceneId].push(image)
          })
          sbsImages.push(imagesByScene)
        }
        setSelectedImages(sbsImages)
      } catch (error) {
        console.error('Error:', error)
      }
    }
    fetchData()
  }, [currentStoryboard])

  function backFunc() {
    setCurrentStoryboard(null)
    setStatus(STATUS.WAITING)
  }

  return (
    <div style={{ height: '100vh' }}>
      {!currentStoryboard ? (
        <div style={{ border: "5px solid #ffb000", borderRadius: "8px", padding: "10px" }}>
          <div className="status-bar">
            <p className="participant">
              <strong>Participant:</strong>
              {participant}
            </p>
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
                        <strong>
                          Storyboard {sb.id}: {sb.title}
                        </strong>
                      </p>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '10px',
                        }}
                      >
                        {storyboards[sb.id - 1].scenes.map(
                          (scene, index) =>
                            selectedImages[sb.id - 1] &&
                              selectedImages[sb.id - 1][scene.id] &&
                              selectedImages[sb.id - 1][scene.id][0] ? (
                              <img
                                key={index}
                                src={
                                  selectedImages[sb.id - 1][
                                    scene.id
                                  ][0].downloadURL
                                }
                                alt={`Scene ${index}`}
                                style={{
                                  width: '100%', // Will auto-fit column width
                                  height: 'auto',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <img
                                key={index}
                                src={fallbackImage}
                                alt={`Scene ${index}`}
                                style={{
                                  width: '100%', // Will auto-fit column width
                                  height: 'auto',
                                  objectFit: 'cover',
                                }}
                              />
                            )
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
