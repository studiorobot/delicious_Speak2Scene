import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

import { IndividualScene } from './IndividualScene'
import { Character } from './Character'
import { allStoryboards } from './constants'

// Speech recoginition imports
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { parseVoiceCommand } from './voice/voiceParser'

// Firebase imports
import {
	fetchSceneImagesBySelection,
	createEmptyCharacter,
	fetchCharacterCount,
	fetchAllSelectedChars,
} from './firebase/firebase_helper_functions'

// Style imports
import './styles/App.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
	faCircleRight,
	faCircleLeft,
	faCircleUp,
	faCircleDown,
	faArrowRight,
	faCircleInfo,
} from '@fortawesome/free-solid-svg-icons'
import fallbackImage from './styles/questionmark.jpg'
import Carousel from 'react-multi-carousel'
import 'react-multi-carousel/lib/styles.css'

// Constants
import { STATUS, HOT_WORDS } from './constants'

export function StoryBoard({ participant, storyboard, onBack }) {
	const [status, setStatus] = useState(STATUS.WAITING)
	const [currentScene, setCurrentScene] = useState(null)
	const [selectedImages, setSelectedImages] = useState({})
	const [currCharacter, setCurrCharacter] = useState(0)
	const [selectedCharImgs, setSelectedCharImgs] = useState({})
	const [numChar, setNumChar] = useState(0)
	const [showInfo, setShowInfo] = useState(false)

	const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition()

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
		resetTranscript()
	}, [currentScene, currCharacter, browserSupportsSpeechRecognition, resetTranscript])

	useEffect(() => {
		const lower = transcript.toLowerCase().trim()

		if (!lower) return

		if (status === STATUS.WAITING && lower.includes(HOT_WORDS.START)) {
			setStatus(STATUS.LISTENING)
			resetTranscript()
			return
		} else if (
			status === STATUS.LISTENING &&
			lower.includes(HOT_WORDS.GO_BACK) &&
			lower.includes(HOT_WORDS.STOP) &&
			!currentScene &&
			currCharacter == 0
		) {
			resetTranscript()
			onBack()
			return
		} else if (
			status === STATUS.LISTENING &&
			lower.includes(HOT_WORDS.ADD_CHARACTER) &&
			lower.includes(HOT_WORDS.STOP)
		) {
			addChar()
			setStatus(STATUS.WAITING)
			resetTranscript()
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
			lower.includes(HOT_WORDS.SCROLL_UP) &&
			lower.includes(HOT_WORDS.STOP)
		) {
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
			const downArrow = document.querySelector('.scroll-down')
			if (downArrow) {
				downArrow.click()
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
			if (
				cleanedTranscript &&
				cleanedTranscript.length > 0 &&
				!currentScene &&
				currCharacter == 0
			) {
				setStatus(STATUS.WAITING)
				handleVoiceCommand(cleanedTranscript)
			}
			setStatus(STATUS.WAITING)
			resetTranscript()
			return
		} else if (status === STATUS.LISTENING && lower.includes(HOT_WORDS.CLEAR_TRANSCRIPT)) {
			resetTranscript()
		}
	}, [status, transcript, currentScene])

	useEffect(() => {
		fetchThings()
	}, [currentScene, numChar, currCharacter])

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
	}

	const addChar = () => {
		createEmptyCharacter(participant, storyboard.id, numChar + 1)
		fetchThings()
	}

	function onInfo() {
		setShowInfo(!showInfo)
	}

	function handleVoiceCommand(command) {
		const parsed = parseVoiceCommand(command)

		if (!parsed) return

		if (parsed.context === 'scene') {
			const selected = storyboard.scenes.find((s) => s.id === parseInt(parsed.number))

			if (selected) {
				setCurrentScene(selected)
				resetTranscript()
			}
		} else if (parsed.context === 'character') {
			const selected = parseInt(parsed.number) <= numChar && parseInt(parsed.number) > 0

			if (selected) {
				setCurrCharacter(parseInt(parsed.number))
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
			{!currentScene && currCharacter == 0 ? (
				<div style={{ border: '5px dashed #000', borderRadius: '8px', padding: '10px' }}>
					<div>
						<div className="status-bar">
							<FontAwesomeIcon
								className="go-back-button"
								onClick={onBack}
								icon={faCircleLeft}
							/>
							<h4 className="pagename" style={{ border: '5px dashed #000' }}>
								SB {storyboard.id}: {storyboard.title}
							</h4>
							<p className="participant">
								<strong>Participant: </strong> {participant}
							</p>
							{/* <p className='voice'><strong>Voice On:</strong> {listening ? 'Yes' : 'No'}</p> */}
							<p
								className="status"
								style={{
									backgroundColor:
										status === STATUS.LISTENING ? '#0BDA51' : 'white',
								}}
							>
								<strong>Status: </strong> {status}
							</p>
							<button onClick={onInfo} className="participant">
								<FontAwesomeIcon
									icon={faCircleInfo}
									style={{ marginRight: '10px' }}
								/>
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
											<u>go to scene [number]</u> to navigate to that scene
										</i>
									</li>
									<li>
										<i>
											<u>clear transcript</u> to clear and restart
										</i>
									</li>
									<li>
										<i>
											<u>add character</u> to add a new character
										</i>
									</li>
									<li>
										<i>
											<u>scroll [left/right]</u> to view hidden scenes
										</i>
									</li>
									<li>
										<i>
											<u>scroll [up/down]</u> to view hidden characters
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
						<div
							style={{
								maxWidth: '70vw',
								overflow: 'hidden',
								marginTop: '10px',
							}}
							className="left"
						>
							<Carousel
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
								{/* Group scenes into chunks of 6 */}
								{Array.from(
									{ length: Math.ceil(storyboard.scenes.length / 6) },
									(_, index) => {
										const scenesChunk = storyboard.scenes.slice(
											index * 6,
											index * 6 + 6
										)
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
														<p
															style={{
																marginTop: '0px',
																marginBottom: '0px',
															}}
														>
															<strong>
																Scene {scene.id}: {scene.title}
															</strong>
														</p>

														<div
															className="scene-image-container"
															style={{ textAlign: 'center' }}
														>
															<img
																src={
																	selectedImages[scene.id]
																		?.downloadURL ||
																	fallbackImage
																}
																alt={`Scene ${scene.id}`}
																className="scene-image"
																style={{
																	width: '140px',
																	height: '120px',
																	objectFit: 'cover',
																	borderRadius: '6px',
																}}
															/>
														</div>

														{selectedImages[scene.id]?.prompt && (
															<p
																style={{
																	fontSize: '0.9em',
																	marginTop: '0px',
																	marginBottom: '0px',
																}}
															>
																{selectedImages[scene.id].prompt
																	.length > 50
																	? selectedImages[
																			scene.id
																		].prompt.substring(0, 50) +
																		'...'
																	: selectedImages[scene.id]
																			.prompt}
															</p>
														)}

														<button
															className="scene-button2"
															style={{ marginTop: '4px' }}
															onClick={() =>
																handleVoiceCommand(
																	`go to scene ${scene.id}`
																)
															}
														>
															Go
														</button>
													</div>
												))}
											</div>
										)
									}
								)}
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
							{numChar != 0 ? (
								<>
									<button
										className="scroll-up"
										onClick={() =>
											document
												.getElementById('charGrid')
												.scrollBy({ top: -200, behavior: 'smooth' })
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
									>
										<FontAwesomeIcon
											className="go-back-button"
											icon={faCircleUp}
											style={{
												border: 'none',
												background: 'transparent',
												cursor: 'pointer',
												marginBottom: '4px',
											}}
										/>
									</button>
									<div
										id="charGrid"
										style={{
											display: 'grid',
											gridTemplateColumns: 'repeat(2, 1fr)',
											gap: '8px',
											maxHeight: '300px', // visible 2x2 area
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
												<p
													style={{
														fontSize: '0.9em',
														fontWeight: 'bold',
														marginBottom: '4px',
													}}
												>
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
										className="scroll-down"
										onClick={() =>
											document
												.getElementById('charGrid')
												.scrollBy({ top: 200, behavior: 'smooth' })
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
									>
										<FontAwesomeIcon
											className="go-back-button"
											icon={faCircleDown}
											style={{
												border: 'none',
												background: 'transparent',
												cursor: 'pointer',
												marginBottom: '4px',
											}}
										/>
									</button>
								</>
							) : (
								''
							)}
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
			) : (
				<Character
					participant={participant}
					storyboard={storyboard}
					character={{ id: currCharacter }}
					onBack={() => setCurrCharacter(0)}
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
