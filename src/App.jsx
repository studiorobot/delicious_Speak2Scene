import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'

import { WelcomeScreen } from './Welcome'
import { AllStoryBoards } from './AllStoryBoards'
import { Researcher } from './Researcher'
import { ResearcherParticipantView } from './ResearcherParticipantView'
import { allStoryboards } from './constants'

// Style imports
import './styles/App.css'

function App() {
	// Keeps the screen awake as long as the web app is open
	useEffect(() => {
		let wakeLock = null

		const requestWakeLock = async () => {
			try {
				wakeLock = await navigator.wakeLock.request('screen')
				console.log('Wake Lock is active')
			} catch (err) {
				console.error('Wake Lock failed:', err)
			}
		}

		if ('wakeLock' in navigator) {
			requestWakeLock()

			// Re-request wake lock on tab becoming active again
			document.addEventListener('visibilitychange', () => {
				if (wakeLock !== null && document.visibilityState === 'visible') {
					requestWakeLock()
				}
			})
		}

		return () => {
			if (wakeLock) {
				wakeLock.release()
				wakeLock = null
			}
		}
	}, [])

	return (
		<Routes>
			<Route path="/" element={<WelcomeScreen />} />
			<Route path="/:participant" element={<AllStoryBoards storyboards={allStoryboards} />} />
			<Route path="/researcher" element={<Researcher />} />
			<Route
				path="/researcher/:participant"
				element={<ResearcherParticipantView storyboards={allStoryboards} />}
			/>
		</Routes>
	)
}

export default App
