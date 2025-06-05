import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PropTypes from 'prop-types'

import { StoryBoard } from './StoryBoard'
import { IndividualScene } from './IndividualScene'

// Speech recoginition imports
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import { parseVoiceCommand } from './voiceParser'

// Firebase imports
import { fetchCharacter } from './firebase/firebase_helper_functions'

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
	CHARACTER: 'character',
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
	const [character, setCharacter] = useState(false)
	const [characterImage, setCharacterImage] = useState(null)
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
			lower.includes(HOT_WORDS.CHARACTER) &&
			lower.includes(HOT_WORDS.STOP) &&
			!currentStoryboard
		) {
			console.log('Character creation triggered')
			setCharacter(true)
			setStatus(STATUS.WAITING)
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
		} else if (status === STATUS.LISTENING && lower.includes(HOT_WORDS.STOP)) {
			console.log('Stop triggered')
			let cleanedTranscript = transcript.split(HOT_WORDS.STOP)[0].trim()
			setCaptured(cleanedTranscript)
			setStatus(STATUS.WAITING)
			if (cleanedTranscript && cleanedTranscript.length > 0 && !currentStoryboard) {
				console.log('Handling voice command:', cleanedTranscript)
				setStatus(STATUS.WAITING)
				handleVoiceCommand(cleanedTranscript)
			}
			resetTranscript()
		} else if (status === STATUS.LISTENING && lower.includes(HOT_WORDS.CLEAR_TRANSCRIPT)) {
			console.log('clear triggered')
			resetTranscript()
		}
	}, [transcript, currentStoryboard])

	function handleVoiceCommand(command) {
		const parsed = parseVoiceCommand(command)
		console.log('Parsed command:', parsed)
		if (!parsed) return

		if (parsed.context === 'storyboard') {
			const selected = storyboards.find((sb) => sb.id === parseInt(parsed.number))
			console.log(selected)
			if (selected) {
				console.log('Selected storyboard:', selected)
				setCurrentStoryboard(selected)
				resetTranscript()
			}
		}
	}

	useEffect(() => {
		const fetchData = async () => {
			try {
				const charImg = await fetchCharacter(participant)
				console.log('Character image:', charImg)
				setCharacterImage(charImg[0].downloadURL)
			} catch (error) {
				console.error('Error:', error)
			}
		}
		fetchData()
	}, [character])

	function backFunc() {
		setCurrentStoryboard(null)
		setCharacter(false)
	}

	return (
		<div>
			{!currentStoryboard && !character ? (
				<>
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
							<h4>Storyboards</h4>
							{status === STATUS.LISTENING ? (
								<>
									<p>
										<strong>Transcript:</strong> {transcript}
									</p>{' '}
									<p>
										<strong>Captured Prompt:</strong> {captured}
									</p>
								</>
							) : (
								''
							)}

							<div
								style={{
									maxWidth: '70vw',
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
												height: '250px',
											}}
										>
											<p>
												<strong>
													{sb.id}. {sb.title}
												</strong>
											</p>
											<button
												className="scene-button"
												onClick={() =>
													handleVoiceCommand(`go to storyboard ${sb.id}`)
												}
											>
												Go
											</button>
										</div>
									))}
								</Carousel>
							</div>
						</div>
						{/* <div className="right">
							<ul>
								<li>
									Say{' '}
									<strong
										style={{
											backgroundColor:
												status === STATUS.WAITING
													? '#FFC6E2'
													: '#C6E2FF',
										}}
									>
										<u>start listening</u>
									</strong>{' '}
									to begin voice control.
								</li>
								<li>
									While listening:
									<ul>
										<li>
											Say{' '}
											<strong>
												<u>go to storyboard [number]</u>
											</strong>{' '}
											to navigate to a storyboard.
										</li>
										<li>
											Say{' '}
											<strong>
												<u>clear transcript</u>
											</strong>{' '}
											to clear and restart.
										</li>
										<li>
											Say{' '}
											<strong>
												<u>scroll [right/left]</u>
											</strong>{' '}
											to view storyboards hidden
										</li>
									</ul>
								</li>
								<li>
									Say{' '}
									<strong
										style={{
											backgroundColor:
												status === STATUS.LISTENING
													? '#0BDA51'
													: '#C6E2FF',
										}}
									>
										<u>stop listening</u>
									</strong>{' '}
									to end voice control.
								</li>
							</ul>
						</div> */}

						<div className="right">
							<div
								style={{
									padding: '10px',
									margin: '10px',
									border: '1px solid #ccc',
									borderRadius: '8px',
									width: '200px',
									height: 'auto',
								}}
							>
								<p>
									<strong>Character</strong>
								</p>
								<img src={characterImage} className="scene-image" width="100%" />
								<button className="scene-button" onClick={() => setCharacter(true)}>
									Go
								</button>
							</div>
						</div>
					</div>
				</>
			) : !character ? (
				<StoryBoard
					participant={participant}
					storyboard={currentStoryboard}
					onBack={() => backFunc()}
				/>
			) : (
				<IndividualScene
					participant={participant}
					storyboard={{ id: 0 }}
					scene={{ id: 0 }}
					onBack={() => setCharacter(false)}
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
