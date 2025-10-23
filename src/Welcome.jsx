import { useNavigate } from 'react-router-dom'
import React, { useState } from 'react'

// Style imports
import './styles/App.css'

export function WelcomeScreen() {
	const [name, setName] = useState('')
	const navigate = useNavigate()

	const handleSubmit = (e) => {
		e.preventDefault()
		if (name.trim()) {
			navigate(`/${name.trim()}`)
		}
	}

	return (
		<div className="container">
			<h1>[Researcher] Enter Participant Name</h1>
			<form onSubmit={handleSubmit}>
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Participant Name"
				/>
				<button type="submit">Continue</button>
			</form>
		</div>
	)
}
