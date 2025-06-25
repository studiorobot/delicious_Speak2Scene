import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { IndividualScene } from './IndividualScene'
import { allStoryboards } from './storyboards'

// Speech recoginition imports
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { parseVoiceCommand } from './voiceParser'

// Firebase imports
import { fetchImagesBySelection } from './firebase/firebase_helper_functions'

// Style imports
import './App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleLeft } from '@fortawesome/free-solid-svg-icons'
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
}

export function StoryBoard({ participant, storyboard, onBack }) {
	const [status, setStatus] = useState(STATUS.WAITING)
	const [captured, setCaptured] = useState('')
	const [currentScene, setCurrentScene] = useState(null)
	const [selectedImages, setSelectedImages] = useState({})

	const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
		useSpeechRecognition()

	const responsive = {
		superLargeDesktop: {
			breakpoint: { max: 4000, min: 2000 },
			items: 10,
		},
		desktop: {
			breakpoint: { max: 2000, min: 900 },
			items: 5,
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
		fetchImages()
	}, [currentScene])

	const fetchImages = async () => {
		let results = await fetchImagesBySelection(participant, storyboard.id)
		const imagesByScene = {}
		results.forEach((image) => {
			if (!imagesByScene[image.sceneId]) {
				imagesByScene[image.sceneId] = []
			}
			imagesByScene[image.sceneId].push(image)
		})

		setSelectedImages(imagesByScene)
	}

	function handleVoiceCommand(command) {
		const parsed = parseVoiceCommand(command)
		console.log('Parsed command:', parsed)
		if (!parsed) return

		if (
			(storyboard.type === 'Storyboard' && parsed.context === 'scene') ||
			(storyboard.type === 'Moments' && parsed.context === 'moment')
		) {
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

	return (
		<div>
			{!currentScene ? (
				<div style={{ border: '5px dashed #dc267f', borderRadius: '8px', padding: '10px' }}>
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
										backgroundColor:
											status === STATUS.LISTENING ? '#0BDA51' : 'white',
									}}
								>
									<strong>Status:</strong> {status}
								</p>
							</div>
							<h4>
								<u>{storyboard.type}:</u> {storyboard.title}
							</h4>
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
					</div>
					<div
						style={{
							maxWidth: '90vw',
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
							{storyboard.scenes.map((scene) => (
								<div
									key={scene.id}
									style={{
										padding: '10px',
										margin: '10px',
										border: '1px solid #ccc',
										borderRadius: '8px',
										height: '400px',
									}}
								>
									<p>
										{storyboard.type === 'Moments' ? (
											<strong>Moment {scene.id}: {scene.title}</strong>
										) : (
											<strong>Scene {scene.id}: </strong>
										)}
									</p>

									{selectedImages[scene.id]?.[0]?.downloadURL && (
										<div className="scene-image-container">
											<img
												src={selectedImages[scene.id][0].downloadURL}
												alt={`Scene ${scene.id}`}
												className="scene-image"
											/>
										</div>
									)}

									<button
										className="scene-button2"
										onClick={() =>
											storyboard.type === 'Moments'
												? handleVoiceCommand(`go to moment ${scene.id}`)
												: handleVoiceCommand(`go to scene ${scene.id}`)
										}
									>
										Go
									</button>
								</div>
							))}
						</Carousel>
					</div>
				</div>
			) : (
				<IndividualScene
					participant={participant}
					storyboard={storyboard}
					scene={currentScene}
					onBack={() => setCurrentScene(null)}
				/>
			)}
		</div>
	)
}

StoryBoard.propTypes = {
	participant: PropTypes.number.isRequired,
	storyboard: PropTypes.object.isRequired,
	onBack: PropTypes.func.isRequired,
}
