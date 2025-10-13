import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

// Speech recognition imports
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { parseVoiceCommand } from './voiceParser'

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
import './App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import Carousel from 'react-multi-carousel'
import 'react-multi-carousel/lib/styles.css'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

const STATUS = {
	WAITING: 'Waiting',
	LISTENING: 'Listening...',
	GENERATING_IMAGE: 'Generating image',
}

const HOT_WORDS = {
	START: 'start listening',
	STOP: 'stop listening',
	CLEAR_TRANSCRIPT: 'clear transcript',
	CHANGE_IMAGE: 'change image',
	GO_BACK: 'go back',
	SCROLL_RIGHT: 'scroll right',
	SCROLL_LEFT: 'scroll left',
}

export function Character({ participant, storyboard, character, onBack }) {
	const [imageUrl, setImageUrl] = useState(null)
	const [status, setStatus] = useState(STATUS.WAITING)
	const [captured, setCaptured] = useState('')
	const [images, setImages] = useState([])
	const [loadingImg, setLoadingImg] = useState(false)
	const [progress, setProgress] = useState(0)

	const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
		useSpeechRecognition()

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
		console.log('listening: ' + listening)
		resetTranscript()
	}, [])

	useEffect(() => {
		const lower = transcript.toLowerCase().trim()

		if (!lower) return
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
			lower.includes(HOT_WORDS.STOP)
		) {
			console.log('Go back triggered')
			console.log(transcript)
			resetTranscript()
			console.log(transcript)
			setStatus(STATUS.WAITING)
			onBack()
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
		} else if (status === STATUS.LISTENING && lower.includes(HOT_WORDS.STOP)) {
			console.log('Stop triggered')
			let cleanedTranscript = transcript.split(HOT_WORDS.STOP)[0].trim()
			setCaptured(cleanedTranscript)
			let parsed = parseVoiceCommand(cleanedTranscript)
			console.log('Parsed command:', parsed)
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
			console.log('clear triggered')
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
					console.log('Generating image for:', captured)
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
						console.log(characterId)
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
						console.log('Image uploaded and referenced in Firestore')
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
		console.log('Fetched images:', results)
	}

	return (
		<div style={{ border: '5px dotted #648fff', borderRadius: '8px', padding: '10px' }}>
			<div className="container-lr">
				<div className="leftIS">
					<div className="status-bar">
						<FontAwesomeIcon
							className="go-back-button"
							onClick={onBack}
							icon={faCircleLeft}
						/>
						<h4 className="pagename" style={{ border: '5px dotted #648fff' }}>
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
				</div>
				<div className="rightIS">
					<p style={{ marginLeft: '10px' }}>
						<u>start listening</u> <FontAwesomeIcon icon={faArrowRight} />{' '}
						<i
							style={{
								borderRadius: '10px',
								border: '#648fff 5px solid',
								padding: '2px',
							}}
						>
							Action
						</i>{' '}
						<FontAwesomeIcon icon={faArrowRight} /> <u>stop listening</u>
					</p>
					<ul className="box">
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
				>
					{images.map((img) => (
						<div
							key={img.id}
							style={{
								padding: '10px',
								margin: '10px',
								border:
									img.selected === true ? '3px solid #648fff' : '1px solid #ccc',
								borderRadius: '10px',
								boxShadow:
									img.selected === true
										? '0 4px 12px #648fff'
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
											color: '#648fff',
											fontWeight: 'bold',
										}}
									>
										Selected
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
