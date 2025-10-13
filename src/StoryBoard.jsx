import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { IndividualScene } from './IndividualScene'
import { Character } from './Character'
import { allStoryboards } from './storyboards'

// Speech recoginition imports
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { parseVoiceCommand } from './voiceParser'

// Firebase imports
import {
  fetchSceneImagesBySelection,
  createEmptyCharacter,
  fetchCharacterCount,
  fetchAllSelectedChars,
} from './firebase/firebase_helper_functions'

// Style imports
import './App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleRight, faCircleLeft, faCircleUp, faCircleDown } from '@fortawesome/free-solid-svg-icons'
import fallbackImage from './questionmark.jpg';
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
  GO_BACK: 'go back',
  SCROLL_RIGHT: 'scroll right',
  SCROLL_LEFT: 'scroll left',
  SCROLL_UP: 'scroll up',
  SCROLL_DOWN: 'scroll down'
}

export function StoryBoard({ participant, storyboard, onBack }) {
  const [status, setStatus] = useState(STATUS.WAITING)
  const [captured, setCaptured] = useState('')
  const [currentScene, setCurrentScene] = useState(null)
  const [selectedImages, setSelectedImages] = useState({})
  const [currCharacter, setCurrCharacter] = useState(0)
  const [selectedCharImgs, setSelectedCharImgs] = useState({})
  const [numChar, setNumChar] = useState(0)

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition()

  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 2000 },
      items: 1,
    },
    desktop: {
      breakpoint: { max: 2000, min: 900 },
      items: 1,
    },
    tablet: {
      breakpoint: { max: 900, min: 768 },
      items: 1,
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
  }, [currentScene, browserSupportsSpeechRecognition, resetTranscript])

  useEffect(() => {
    const lower = transcript.toLowerCase().trim()

    if (!lower) return
    console.log('Transcripttttt: ', transcript)
    console.log('Transcript:', lower)

    if (status === STATUS.WAITING && lower.includes(HOT_WORDS.START)) {
      console.log('Start triggered')
      setStatus(STATUS.LISTENING)
      setCaptured('')
      resetTranscript()
      return
    } else if (
      status === STATUS.LISTENING &&
      lower.includes(HOT_WORDS.GO_BACK) &&
      lower.includes(HOT_WORDS.STOP) &&
      !currentScene
    ) {
      console.log('Go back triggered')
      // setStatus(STATUS.WAITING);
      resetTranscript()
      onBack()
      return
    } else if (
      status === STATUS.LISTENING &&
      lower.includes(HOT_WORDS.SCROLL_RIGHT) &&
      lower.includes(HOT_WORDS.STOP)
    ) {
      console.log('Scroll right triggered')
      const rightArrow = document.querySelector('.carousel-right-arrow')
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
      const leftArrow = document.querySelector('.carousel-left-arrow')
      if (leftArrow) {
        leftArrow.click()
      }
      setStatus(STATUS.WAITING)
      resetTranscript()
    } else if (
      status === STATUS.LISTENING &&
      lower.includes(HOT_WORDS.SCROLL_UP) &&
      lower.includes(HOT_WORDS.STOP)
    ) {
      console.log('Scroll up triggered')
      const upArrow = document.querySelector('.scroll-up')
      if (upArrow) {
        upArrow.click()
      }
      setStatus(STATUS.WAITING)
      resetTranscript()
    } else if (
      status === STATUS.LISTENING &&
      lower.includes(HOT_WORDS.SCROLL_DOWN) &&
      lower.includes(HOT_WORDS.STOP)
    ) {
      console.log('Scroll down triggered')
      const downArrow = document.querySelector('.scroll-down')
      if (downArrow) {
        downArrow.click()
      }
      setStatus(STATUS.WAITING)
      resetTranscript()
    } else if (status === STATUS.LISTENING && lower.includes(HOT_WORDS.STOP)) {
      console.log('Stop triggered')
      let cleanedTranscript = transcript.split(HOT_WORDS.STOP)[0].trim()
      setCaptured(cleanedTranscript)
      if (cleanedTranscript && cleanedTranscript.length > 0 && !currentScene) {
        console.log('Handling voice command:', cleanedTranscript)
        setStatus(STATUS.WAITING)
        handleVoiceCommand(cleanedTranscript)
      }
      setStatus(STATUS.WAITING)
      resetTranscript()
      return
    } else if (status === STATUS.LISTENING && lower.includes(HOT_WORDS.CLEAR_TRANSCRIPT)) {
      console.log('clear triggered')
      resetTranscript()
    }
  }, [status, transcript, currentScene])

  useEffect(() => {
    fetchThings()
  }, [currentScene, numChar])

  const fetchThings = async () => {
    let results = await fetchSceneImagesBySelection(participant, storyboard.id)
    const imagesByScene = {}
    results.forEach((image) => {
      if (!imagesByScene[image.sceneId]) {
        imagesByScene[image.sceneId] = []
      }
      imagesByScene[image.sceneId] = image
    })
    setSelectedImages(imagesByScene)
    console.log(participant, storyboard.id)
    console.log('Scene images:', imagesByScene)

    let num_chars = await fetchCharacterCount(participant, storyboard.id)
    setNumChar(num_chars)

    let charImgs = await fetchAllSelectedChars(participant, storyboard.id)
    const charImgsById = {}
    charImgs.forEach((charImg) => {
      if (!charImgsById[charImg.characterId]) {
        charImgsById[charImg.characterId] = []
      }
      charImgsById[charImg.characterId] = charImg
    })
    setSelectedCharImgs(charImgsById)
    console.log('Character images:', charImgsById)
  }

  const addChar = () => {
    createEmptyCharacter(participant, storyboard.id, numChar + 1)
    fetchThings()
  }


  function handleVoiceCommand(command) {
    const parsed = parseVoiceCommand(command)
    console.log('Parsed command:', parsed)
    if (!parsed) return

    if (parsed.context === 'scene') {
      const selected = storyboard.scenes.find((s) => s.id === parseInt(parsed.number))

      if (selected) {
        console.log('Selected scene:', selected)
        setCurrentScene(selected)
        resetTranscript()
      }
    }
  }

  const actual_storyboard = allStoryboards.find((sb) => sb.id === storyboard.id)

  if (!actual_storyboard) {
    return <div>Storyboard not found!</div>
  }

  function backFunc() {
    setCurrCharacter(0)
    setCurrentScene(null)
    setStatus(STATUS.WAITING)
  }

  return (
    <div>
      {!currentScene && currCharacter == 0 ? (
        <div style={{ border: '5px dashed #dc267f', borderRadius: '8px', padding: '10px' }}>
          <div>
            <div className="status-bar">
              <FontAwesomeIcon
                className="go-back-button"
                onClick={onBack}
                icon={faCircleLeft}
              />
              <h4 className="pagename" style={{ border: '5px dashed #dc267f' }}>
                SB {storyboard.id}: {storyboard.title}
              </h4>
              <p className="participant">
                <strong>Participant:</strong> {participant}
              </p>
              {/* <p className='voice'><strong>Voice On:</strong> {listening ? 'Yes' : 'No'}</p> */}
              <p
                className="status"
                style={{
                  backgroundColor:
                    status === STATUS.LISTENING ? '#0BDA51' : 'white',
                }}
              >
                <strong>Status:</strong> {status}
              </p>
            </div>
            {status === STATUS.LISTENING ? (
              <>
                <p>
                  <strong>Transcript:</strong> {transcript}
                </p>
                {/* <p>
										<strong>Captured Prompt:</strong> {captured}
									</p> */}
              </>
            ) : (
              ''
            )}
          </div>
          <div className="container-lr">
            <div
              style={{
                maxWidth: '80vw',
                overflow: 'hidden',
                marginTop: '10px',
              }}
              className="left"
            >
              <Carousel
                rtl={"false"}
                responsive={responsive}
                infinite={false}
                arrows={true}
                keyBoardControl={true}
                containerClass="carousel-container"
                itemClass="carousel-item"
                removeArrowOnDeviceType={[]}
                customTransition="all 0.3s ease-in-out"
                transitionDuration={300}
                customLeftArrow={
                  <button
                    aria-label="Previous"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '50%',
                      padding: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      zIndex: 2,
                    }}
                    className='carousel-left-arrow'
                  >
                    <FontAwesomeIcon
                      className="go-back-button"
                      icon={faCircleLeft}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        marginBottom: '4px',
                      }}
                    />
                  </button>
                }
                customRightArrow={
                  <button
                    aria-label="Next"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '50%',
                      padding: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      zIndex: 2,
                    }}
                    className='carousel-right-arrow'
                  >
                    <FontAwesomeIcon
                      className="go-back-button"
                      icon={faCircleRight}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        marginBottom: '4px',
                      }}
                    />
                  </button>
                }
              >
                {/* Group scenes into chunks of 6 */}
                {Array.from({ length: Math.ceil(storyboard.scenes.length / 6) }, (_, index) => {
                  const scenesChunk = storyboard.scenes.slice(index * 6, index * 6 + 6)
                  return (
                    <div
                      key={index}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gridTemplateRows: 'repeat(2, auto)',
                        gap: '8px',
                        // padding: '10px',
                      }}
                    >
                      {scenesChunk.map((scene) => (
                        <div
                          key={scene.id}
                          style={{
                            padding: '10px',
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            backgroundColor: '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                        >
                          <p>
                            <strong>
                              Scene {scene.id}: {scene.title}
                            </strong>
                          </p>

                          <div className="scene-image-container" style={{ textAlign: 'center' }}>
                            <img
                              src={selectedImages[scene.id]?.downloadURL || fallbackImage}
                              alt={`Scene ${scene.id}`}
                              className="scene-image"
                              style={{
                                width: '100px',
                                height: '100px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                              }}
                            />
                          </div>

                          {selectedImages[scene.id]?.prompt && (
                            <p style={{ fontSize: '0.9em', marginTop: '5px' }}>
                              {selectedImages[scene.id].prompt.length > 100
                                ? selectedImages[scene.id].prompt.substring(0, 100) + '...'
                                : selectedImages[scene.id].prompt}
                            </p>
                          )}

                          <button
                            className="scene-button2"
                            style={{ marginTop: '4px' }}
                            onClick={() => handleVoiceCommand(`go to scene ${scene.id}`)}
                          >
                            Go
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </Carousel>
            </div>

            <div
              className="right"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: 'fit-content',
                paddingLeft: '10px',
              }}
            >
              {numChar != 0 ? (<>
                <button
                  className='scroll-up'
                  onClick={() =>
                    document.getElementById('charGrid').scrollBy({ top: -200, behavior: 'smooth' })
                  }
                  aria-label="Scroll up"
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '50%',
                    padding: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                ><FontAwesomeIcon
                    className="go-back-button"
                    icon={faCircleUp}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      marginBottom: '4px',
                    }}
                  /></button>

                {/* Scrollable grid */}
                <div
                  id="charGrid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    maxHeight: '260px', // visible 2x2 area
                    overflowY: 'auto',
                    scrollBehavior: 'smooth',
                    paddingRight: '4px',
                  }}
                >
                  {Array.from({ length: numChar }, (_, i) => (
                    <div
                      key={i + 1}
                      style={{
                        padding: '10px',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        backgroundColor: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        width: '100px',
                        height: 'auto',
                      }}
                    >
                      <p style={{ fontSize: '0.9em', fontWeight: 'bold', marginBottom: '4px' }}>
                        Character {i + 1}
                      </p>

                      <img
                        src={
                          selectedCharImgs[i + 1]
                            ? selectedCharImgs[i + 1].downloadURL
                            : fallbackImage
                        }
                        alt={`Character ${i + 1}`}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          marginBottom: '6px',
                        }}
                      />

                      <button
                        className="scene-button2"
                        onClick={() => setCurrCharacter(i + 1)}
                      >
                        Go
                      </button>
                    </div>
                  ))}
                </div>

                {/* Scroll down button */}
                <button
                  className='scroll-down'
                  onClick={() =>
                    document.getElementById('charGrid').scrollBy({ top: 200, behavior: 'smooth' })
                  }
                  aria-label="Scroll down"
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '50%',
                    padding: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                ><FontAwesomeIcon
                    className="go-back-button"
                    icon={faCircleDown}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      marginBottom: '4px',
                    }}
                  /></button>
              </>) : ('')}
              {/* Add Character button */}
              <button
                className="scene-button2"
                onClick={() => addChar()}
                style={{ marginTop: '8px' }}
              >
                Add Character
              </button>
            </div>

          </div>
        </div>
      ) : currCharacter == 0 ? (
        <IndividualScene
          participant={participant}
          storyboard={storyboard}
          scene={currentScene}
          onBack={() => setCurrentScene(null)}
        />
      ) : <Character
        participant={participant}
        storyboard={storyboard}
        character={{ id: currCharacter }}
        onBack={() => backFunc()}
      />}
    </div>
  )
}

StoryBoard.propTypes = {
  participant: PropTypes.number.isRequired,
  storyboard: PropTypes.object.isRequired,
  onBack: PropTypes.func.isRequired,
}
