import React from 'react'
import { Routes, Route } from 'react-router-dom'

import { WelcomeScreen } from './Welcome'
import { AllStoryBoards } from './AllStoryBoards'
import { allStoryboards } from './storyboards'

// Style imports
import './App.css'

function App() {
	return (
		<Routes>
			<Route path="/" element={<WelcomeScreen />} />
			<Route path="/:participant" element={<AllStoryBoards storyboards={allStoryboards} />} />
		</Routes>
	)
}

export default App
