import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

// Speech recognition imports
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { parseVoiceCommand } from './voice/voiceParser'

// OpenAI API imports
import { generateCharacterImage } from './api/openai'

// Firebase imports
import {
  setSelectedCharImage,
  setAllImagesUnselected,
  uploadCharAndSaveMetadata,
  fetchAllCharImages,
} from './firebase/firebase_helper_functions'

// Style imports
import './styles/App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleLeft,
  faArrowRight,
  faCircleRight,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons'
import Carousel from 'react-multi-carousel'
import 'react-multi-carousel/lib/styles.css'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Constants
import { STATUS, HOT_WORDS } from './constants'

export function Character({ participant, storyboard, character, onBack }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [status, setStatus] = useState(STATUS.WAITING)
  const [captured, setCaptured] = useState('')
  const [images, setImages] = useState([])
  const [loadingImg, setLoadingImg] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showInfo, setShowInfo] = useState(false)

  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition()

  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 2000 },
      items: 10,
    },
    desktop: {
      breakpoint: { max: 2000, min: 900 },
      items: 4,
    },
    tablet: {
      breakpoint: { max: 900, min: 768 },
      items: 3,
    },
    mobile: {
      breakpoint: { max: 768, min: 0 },
      items: 1,
    },
  }

  // Check for browser support for speech recognition and start listening
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
  }, [])

  useEffect(() => {
    const lower = transcript.toLowerCase().trim()

    if (!lower) return

    if (status === STATUS.WAITING && lower.includes(HOT_WORDS.START)) {
      setStatus(STATUS.LISTENING)
      setCaptured('')
      resetTranscript()
      return
    } else if (
      status === STATUS.LISTENING &&
      lower.includes(HOT_WORDS.GO_BACK) &&
      lower.includes(HOT_WORDS.STOP)
    ) {
      resetTranscript()
      setStatus(STATUS.WAITING)
      onBack()
      return
    } else if (
      status === STATUS.LISTENING &&
      lower.includes(HOT_WORDS.SCROLL_RIGHT) &&
      lower.includes(HOT_WORDS.STOP)
    ) {
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
      const leftArrow = document.querySelector('.carousel-left-arrow')
      if (leftArrow) {
        leftArrow.click()
      }
      setStatus(STATUS.WAITING)
      resetTranscript()
    } else if (
      status === STATUS.LISTENING &&
      lower.length <= 25 &&
      (lower.includes(HOT_WORDS.HELP) || lower.includes(HOT_WORDS.HELP_CLOSE)) &&
      lower.includes(HOT_WORDS.STOP)
    ) {
      onInfo()
      setStatus(STATUS.WAITING)
      resetTranscript()
    } else if (status === STATUS.LISTENING && lower.includes(HOT_WORDS.STOP)) {
      let cleanedTranscript = transcript.split(HOT_WORDS.STOP)[0].trim()
      setCaptured(cleanedTranscript)
      let parsed = parseVoiceCommand(cleanedTranscript)
      const updateImageAndRefresh = async () => {
        if (parsed && parsed.context === HOT_WORDS.CHANGE_IMAGE) {
          await setSelectedCharImage(
            participant,
            storyboard.id,
            character.id,
            parseInt(parsed.number)
          )
          await fetchAllImages()
          setStatus(STATUS.WAITING)
        } else {
          setStatus(STATUS.GENERATING_IMAGE)
          setImageUrl(null)
        }
        resetTranscript()
      }

      updateImageAndRefresh()
    } else if (status === STATUS.LISTENING && lower.includes(HOT_WORDS.CLEAR_TRANSCRIPT)) {
      resetTranscript()
    }
  }, [status, transcript, images])

  useEffect(() => {
    if (status === STATUS.GENERATING_IMAGE && captured.length > 0) {
      const generateAndUpload = async () => {
        let intervalId
        try {
          setLoadingImg(true)
          setProgress(0) // Reset progress
          intervalId = setInterval(() => {
            setProgress((prev) => {
              // Cap at 90%, leave room for final jump
              if (prev >= 99) return 99
              return prev + 1 + Math.random() * 0.3
            })
          }, 500)
          let imgDetails = await generateCharacterImage(captured)
          let url = imgDetails.imageUrl
          let imgPrompt = imgDetails.prompt
          let char_desc = imgDetails.char_description
          if (url) {
            setImageUrl(url)

            // Fetch as blob and convert to file
            const response = await fetch(url)
            const blob = await response.blob()
            const file = new File([blob], `generated_${Date.now()}.png`, {
              type: blob.type,
            })

            // Upload
            const participantId = participant
            const storyboardId = storyboard.id
            const characterId = character.id
            // make sure to set all other images as unselected
            await setAllImagesUnselected(participantId, storyboardId, characterId)
            // set the current image generated as selected
            await uploadCharAndSaveMetadata(
              file,
              participantId,
              storyboardId,
              characterId,
              imgPrompt,
              captured,
              char_desc,
              true
            )
            fetchAllImages()
          }
          setProgress(100)
          setStatus(STATUS.WAITING)
        } catch (error) {
          console.error('Error during image generation/upload:', error)
          clearInterval(intervalId)
          setLoadingImg(false)
          setProgress(100)
          setStatus(STATUS.WAITING)
        } finally {
          clearInterval(intervalId)
          setLoadingImg(false)
          setProgress(100)
        }
      }
      generateAndUpload()
    }
  }, [status])

  useEffect(() => {
    fetchAllImages()
  }, [storyboard, character])

  const fetchAllImages = async () => {
    let results = await fetchAllCharImages(participant, storyboard.id, character.id)
    setImages(results)
  }

  function onInfo() {
    setShowInfo(!showInfo)
  }

  return (
    <div style={{ border: '5px dotted #000', borderRadius: '8px', padding: '10px' }}>
      <div className="status-bar">
        <FontAwesomeIcon className="go-back-button" onClick={onBack} icon={faCircleLeft} />
        <h4 className="pagename" style={{ border: '5px dotted #000' }}>
          Create Character {character.id}
        </h4>
        <p className="participant">
          <strong>Participant:</strong> {participant}
        </p>
        <p
          className="status"
          style={{
            backgroundColor: status === STATUS.LISTENING ? '#0BDA51' : 'white',
          }}
        >
          <strong>Status:</strong> {status}
        </p>
        <button onClick={onInfo} className="participant">
          <FontAwesomeIcon icon={faCircleInfo} style={{ marginRight: '10px' }} />
          <u>start listening</u>{' '}
          <FontAwesomeIcon
            icon={faArrowRight}
            style={{ marginLeft: '10px', marginRight: '10px' }}
          />{' '}
          <i>help</i>{' '}
          <FontAwesomeIcon
            icon={faArrowRight}
            style={{ marginLeft: '10px', marginRight: '10px' }}
          />{' '}
          <u>stop listening</u>
        </button>
      </div>
      {showInfo && (
        <div className="box fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-11/12 relative">
            <p style={{ marginLeft: '10px' }}>
              <FontAwesomeIcon icon={faCircleInfo} style={{ marginRight: '10px' }} />
              <u>start listening</u> <FontAwesomeIcon icon={faArrowRight} />{' '}
              <i
                style={{
                  border: '#FFC20A 5px solid',
                  padding: '2px',
                  backgroundColor: '#FFC20A',
                }}
              >
                Action
              </i>{' '}
              <FontAwesomeIcon icon={faArrowRight} /> <u>stop listening</u>
            </p>
            <ul className="boxMini">
              <li>
                <i>[describe character] to generate image</i>
              </li>
              <li>
                <i>
                  <u>clear transcript</u> to clear and restart
                </i>
              </li>
              <li>
                <i>
                  <u>change image to [number]</u> to change selected image
                </i>
              </li>
              <li>
                <i>
                  <u>go back</u> to storyboard
                </i>
              </li>
              <li>
                <i>
                  <u>scroll [left/right]</u> to view hidden images
                </i>
              </li>
            </ul>
          </div>
        </div>
      )}

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
      {!imageUrl && loadingImg && (
        <div>
          <div
            style={{
              display: 'inline-block',
              width: '150px',
              height: '150px',
              border: '1px solid black',
              borderRadius: '6px',
              textAlign: 'center',
            }}
            className="leftInProgress"
          >
            <p>{STATUS.GENERATING_IMAGE}</p>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {loadingImg && progress < 100 && (
                <CircularProgress variant="determinate" value={progress} />
              )}
            </Box>
          </div>
          <div className="rightInProgress">
            <p>
              <u>Captured prompt: </u>
              {captured}
            </p>
          </div>
        </div>
      )}
      {imageUrl && (
        <div>
          <p style={{ marginTop: '0px' }}>Current Generated Image</p>
          <img
            src={imageUrl}
            alt="Generated from voice prompt"
            style={{
              width: '100px',
              height: 'auto',
              objectFit: 'cover',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            }}
          />
        </div>
      )}

      <div style={{ maxWidth: '90vw', overflow: 'hidden' }}>
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
              className="carousel-left-arrow"
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
              className="carousel-right-arrow"
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
          {images.map((img) => (
            <div
              key={img.id}
              style={{
                padding: '10px',
                margin: '10px',
                border:
                  img.selected === true ? '3px solid #000' : '1px solid #ccc',
                borderRadius: '10px',
                boxShadow:
                  img.selected === true
                    ? '0 4px 12px #000'
                    : '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <img
                src={img.downloadURL}
                alt={`Image ${img.imageId}`}
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '6px',
                  display: 'block',
                  cursor: 'pointer',
                }}
              />
              <div
                style={{
                  marginTop: '8px',
                  textAlign: 'center',
                }}
              >
                <strong>Image: </strong>
                {img.imageId}
                {img.selected === true && (
                  <div
                    style={{
                      color: '#000',
                      fontWeight: 'bold',
                    }}
                  >
                    SELECTED
                  </div>
                )}
                <p>
                  {img.prompt && img.prompt.length > 100
                    ? img.prompt.substring(0, 100) + '...'
                    : img.prompt}
                </p>
              </div>
            </div>
          ))}
        </Carousel>
      </div>
    </div>
  )
}

Character.propTypes = {
  participant: PropTypes.number.isRequired,
  storyboard: PropTypes.object.isRequired,
  character: PropTypes.object.isRequired,
  onBack: PropTypes.func.isRequired,
}
