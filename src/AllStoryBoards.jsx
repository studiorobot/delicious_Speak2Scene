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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faCircleInfo,
	faCircleRight,
	faCircleLeft,
	faArrowRight,
} from '@fortawesome/free-solid-svg-icons'

// Constants
import { STATUS, HOT_WORDS } from './constants'

export function AllStoryBoards({ storyboards }) {
	const [status, setStatus] = useState(STATUS.WAITING)
	const [currentStoryboard, setCurrentStoryboard] = useState(null)
	const [selectedImages, setSelectedImages] = useState({})
	const participant = useParams().participant
	const [showInfo, setShowInfo] = useState(false)

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

	function onInfo() {
		setShowInfo(!showInfo)
	}

	return (
		<div style={{ height: '100vh' }}>
			{!currentStoryboard ? (
				<div style={{ border: '5px solid #000', borderRadius: '8px', padding: '10px' }}>
					<div className="status-bar">
						<h4 className="pagename" style={{ border: '5px solid #000' }}>
							Main Menu
						</h4>
						<p className="participant">
							<strong>Participant: </strong>
							{participant}
						</p>
						<p
							className="status"
							style={{
								backgroundColor: status === STATUS.LISTENING ? '#0BDA51' : 'white',
							}}
						>
							<strong>Status: </strong> {status}
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
									<FontAwesomeIcon
										icon={faCircleInfo}
										style={{ marginRight: '10px' }}
									/>
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
										<i>
											<u>go to storyboard [number]</u> to navigate to that
											storyboard
										</i>
									</li>
									<li>
										<i>
											<u>clear transcript</u> to clear and restart
										</i>
									</li>
									<li>
										<i>
											<u>scroll [left/right]</u> to view hidden storyboards
										</i>
									</li>
									<li>
										<i>
											<u>close help</u> to close the help screen
										</i>
									</li>
								</ul>
							</div>
						</div>
					)}
					<div className="container-lr">
						<div className="left">
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
									maxWidth: '75vw',
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
