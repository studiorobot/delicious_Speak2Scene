import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

// Speech recognition imports
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { parseVoiceCommand } from './voiceParser'

// OpenAI API imports
import { generateImage, generateImageWithReference } from './api/openai'

// Firebase imports
import {
	uploadImageAndSaveMetadata,
	setSelectedImage,
	setAllImagesUnselected,
	fetchCharacter,
} from './firebase/firebase_helper_functions'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from './firebase/firebase'

// Style imports
import './App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleLeft } from '@fortawesome/free-solid-svg-icons'
import Carousel from 'react-multi-carousel'
import 'react-multi-carousel/lib/styles.css'

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

export function IndividualScene({ participant, storyboard, scene, onBack }) {
	const [imageUrl, setImageUrl] = useState(null)
	const [status, setStatus] = useState(STATUS.WAITING)
	const [captured, setCaptured] = useState('')
	const [images, setImages] = useState([])
	const [selectedImageId, setSelectedImageId] = useState(null)

	const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
		useSpeechRecognition()

	const responsive = {
		superLargeDesktop: {
			breakpoint: { max: 4000, min: 2000 },
			items: 10,
		},
		desktop: {
			breakpoint: { max: 2000, min: 900 },
			items: 6,
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
			// setStatus(STATUS.WAITING);
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
			if (parsed && parsed.context === HOT_WORDS.CHANGE_IMAGE) {
				setSelectedImage(participant, storyboard.id, scene.id, parseInt(parsed.number))
				setSelectedImageId(parseInt(parsed.number))
				setStatus(STATUS.WAITING)
			} else {
				setStatus(STATUS.GENERATING_IMAGE)
			}
			resetTranscript()
		} else if (status === STATUS.LISTENING && lower.includes(HOT_WORDS.CLEAR_TRANSCRIPT)) {
			console.log('clear triggered')
			resetTranscript()
		}
	}, [status, transcript, selectedImageId])

	useEffect(() => {
		if (status === STATUS.GENERATING_IMAGE && captured.length > 0) {
			const generateAndUpload = async () => {
				try {
					console.log('Generating image for:', captured)
					let url = null
					if (storyboard.id === 0) {
						// character creation
						url = await generateImage(captured)
					} else {
						console.log('here')
						const characterImageURL = await fetchCharacter(participant)
						const useRobotImage = storyboard.robot
						console.log('characterImageURL', characterImageURL[0].downloadURL)
						url = await generateImageWithReference(
							captured,
							characterImageURL[0],
							useRobotImage
						)
					}
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
						const sceneId = scene.id
						// make sure to set all other images as unselected
						await setAllImagesUnselected(participantId, storyboardId, sceneId)
						// set the current image generated as selected
						await uploadImageAndSaveMetadata(
							file,
							participantId,
							storyboardId,
							sceneId,
							captured,
							true
						)
						fetchImages()
						console.log('Image uploaded and referenced in Firestore')
					}
					setStatus(STATUS.WAITING)
				} catch (error) {
					console.error('Error during image generation/upload:', error)
					setStatus(STATUS.WAITING)
				}
			}

			generateAndUpload()
		}
	}, [status])

	useEffect(() => {
		fetchImages()
	}, [storyboard, scene])

	const fetchImages = async () => {
		const q = query(
			collection(db, 'participants'),
			where('participantId', '==', participant),
			where('storyboardId', '==', storyboard.id),
			where('sceneId', '==', scene.id)
		)

		const querySnapshot = await getDocs(q)

		let selectedId = null
		const results = querySnapshot.docs.map((doc) => {
			const data = doc.data()
			if (data.selected) selectedId = data.imageId
			return {
				id: doc.id,
				...data,
			}
		})

		setImages(results)
		setSelectedImageId(selectedId)
	}

	return (
		<div>
			<div className="container-lr">
				<div>
					<div className="status-bar">
						<FontAwesomeIcon
							className="go-back-button"
							onClick={onBack}
							icon={faCircleLeft}
						/>
						<p className="participant">
							<strong>Participant:</strong> {participant}
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
					{storyboard.id === 0 ? (
						<h4 style={{ marginTop: '0px', marginBottom: '0px' }}>
							Create your character
						</h4>
					) : (
						<h4 style={{ marginTop: '0px', marginBottom: '0px' }}>
							Scene: {scene.title}
						</h4>
					)}
					{status === STATUS.LISTENING ? (
						<>
							<p>
								<strong>Transcript:</strong> {transcript}
							</p>
							<p>
								<strong>Captured Prompt:</strong> {captured}
							</p>
						</>
					) : (
						''
					)}
					{imageUrl && (
						<div>
							<p style={{ marginTop: '0px' }}>Current Generated Image</p>
							<img
								src={imageUrl}
								alt="Generated from voice prompt"
								style={{
									width: '150px',
									height: 'auto',
									objectFit: 'cover',
									borderRadius: '12px',
									boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
								}}
							/>
						</div>
					)}
				</div>
			</div>

			<p style={{ marginTop: '5px' }}>Previously Generated Images</p>

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
									img.imageId === selectedImageId
										? '3px solid green'
										: '1px solid #ccc',
								borderRadius: '10px',
								boxShadow:
									img.imageId === selectedImageId
										? '0 4px 12px green'
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
								{selectedImageId === img.imageId && (
									<div
										style={{
											color: 'green',
											fontWeight: 'bold',
										}}
									>
										Selected
									</div>
								)}
							</div>
						</div>
					))}
				</Carousel>
			</div>
		</div>
	)
}

IndividualScene.propTypes = {
	participant: PropTypes.number.isRequired,
	storyboard: PropTypes.object.isRequired,
	scene: PropTypes.object.isRequired,
	onBack: PropTypes.func.isRequired,
}
