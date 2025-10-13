import React, { use, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// Firebase imports
import { fetchSceneImagesBySelection } from './firebase/firebase_helper_functions'

// Style imports
import './App.css'

export function ResearcherParticipantView({ storyboards }) {
	console.log(storyboards)
	const participant = useParams().participant
	const [avatarData, setAvatarData] = useState(null)
	const [trialData, setTrialData] = useState(null)
	const [storyboardData, setStoryboardData] = useState(null)
	const [momentsData, setMomentsData] = useState(null)
	const [robotData, setRobotData] = useState(null)

	useEffect(() => {
		const fetchData = async () => {
			try {
				const avatar = await fetchSceneImagesBySelection(participant, 0)
				const trial = await fetchSceneImagesBySelection(participant, 1)
				const storyboard = await fetchSceneImagesBySelection(participant, 2)
				storyboard.sort((a, b) => a.sceneId - b.sceneId)
				const moments = await fetchSceneImagesBySelection(participant, 3)
				moments.sort((a, b) => a.imageId - b.imageId)
				const robot = await fetchSceneImagesBySelection(participant, 0.1)
				setAvatarData(avatar)
				setTrialData(trial)
				setStoryboardData(storyboard)
				setMomentsData(moments)
				setRobotData(robot)
			} catch (error) {
				console.error('Error fetching participants:', error)
			}
		}
		fetchData()
	}, [])

	return (
		<div>
			<h1>Researcher Dashboard</h1>
			<h2>Currently viewing: {participant}</h2>
			<h3>Avatar</h3>
			{avatarData && avatarData.length > 0 ? (
				<div
					className="print-grid"
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(4, 1fr)',
						gap: '10px',
					}}
				>
					{avatarData.map((img, index) => (
						<div
							style={{
								padding: '10px',
								margin: '10px',
								border: '1px solid #ccc',
								borderRadius: '8px',
								height: 'auto',
							}}
							className="print-image-container"
						>
							<p>
								<strong>Avatar</strong>
							</p>
							<img
								key={index}
								src={img.downloadURL}
								alt={`Image ${index}`}
								style={{ width: '100%', objectFit: 'cover' }}
								className="scene-image"
							/>
							<details>
								<summary>Prompt</summary>
								<p>{img.prompt}</p>
							</details>
						</div>
					))}
				</div>
			) : (
				<p>No Trial data available</p>
			)}

			<h3>Trial</h3>
			{trialData && trialData.length > 0 ? (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(4, 1fr)',
						gap: '10px',
					}}
					className="print-grid"
				>
					{trialData.map((img, index) => (
						<div
							style={{
								padding: '10px',
								margin: '10px',
								border: '1px solid #ccc',
								borderRadius: '8px',
								height: 'auto',
							}}
							className="print-image-container"
						>
							<p>
								<strong>Trial</strong>
							</p>
							<img
								key={index}
								src={img.downloadURL}
								alt={`Image ${index}`}
								style={{ width: '100%', objectFit: 'cover' }}
								className="scene-image"
							/>
							<details>
								<summary>Prompt</summary>
								<p>{img.prompt}</p>
							</details>
						</div>
					))}
				</div>
			) : (
				<p>No Trial data available</p>
			)}

			<h3 className="page-break">Storyboard</h3>
			{storyboardData && storyboardData.length > 0 ? (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(4, 1fr)',
						gap: '10px',
					}}
					className="print-grid"
				>
					{storyboardData.map((img, index) => (
						<div
							style={{
								padding: '10px',
								margin: '10px',
								border: '1px solid #ccc',
								borderRadius: '8px',
								height: 'auto',
							}}
							className="print-image-container"
						>
							<p>
								<strong>
									Scene {index + 1}: {storyboards[1].scenes[index].title}
								</strong>
							</p>
							<img
								key={index}
								src={img.downloadURL}
								alt={`Image ${index}`}
								style={{ width: '100%', objectFit: 'cover' }}
								className="scene-image"
							/>
							<details>
								<summary>Prompt</summary>
								<p>{img.prompt}</p>
							</details>
						</div>
					))}
				</div>
			) : (
				<p>No Storyboard data available</p>
			)}

			<h3 className="page-break">Moments</h3>
			{momentsData && momentsData.length > 0 ? (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(4, 1fr)',
						gap: '10px',
					}}
					className="print-grid"
				>
					{momentsData.map((img, index) => (
						<div
							style={{
								padding: '10px',
								margin: '10px',
								border: '1px solid #ccc',
								borderRadius: '8px',
								height: 'auto',
							}}
							className="print-image-container"
						>
							<p>
								<strong>Moment: {storyboards[2].scenes[index].title}</strong>
							</p>
							<img
								key={index}
								src={img.downloadURL}
								alt={`Image ${index}`}
								style={{ width: '100%', objectFit: 'cover' }}
								className="scene-image"
							/>
							<details>
								<summary>Prompt</summary>
								<p>{img.prompt}</p>
							</details>
						</div>
					))}
				</div>
			) : (
				<p>No Moments data available</p>
			)}

			<h3 className="page-break">Robot</h3>
			{robotData && robotData.length > 0 ? (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(4, 1fr)',
						gap: '10px',
					}}
					className="print-grid"
				>
					{robotData.map((img, index) => (
						<div
							style={{
								padding: '10px',
								margin: '10px',
								border: '1px solid #ccc',
								borderRadius: '8px',
								height: 'auto',
							}}
							className="print-image-container"
						>
							<p>
								<strong>Robot</strong>
							</p>
							<img
								key={index}
								src={img.downloadURL}
								alt={`Image ${index}`}
								style={{ width: '100%', objectFit: 'cover' }}
								className="scene-image"
							/>
							<details>
								<summary>Prompt</summary>
								<p>{img.prompt}</p>
							</details>
						</div>
					))}
				</div>
			) : (
				<p>No Robot data available</p>
			)}
		</div>
	)
}
