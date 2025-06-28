import React, { use, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

// Firebase imports
import { fetchImagesBySelection } from './firebase/firebase_helper_functions'

// Style imports
import './App.css'

export function ResearcherParticipantView({storyboards}) {
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
				const avatar = await fetchImagesBySelection(participant, 0)
				const trial = await fetchImagesBySelection(participant, 1)
				const storyboard = await fetchImagesBySelection(participant, 2)
        storyboard.sort((a, b) => a.sceneId - b.sceneId)
				const moments = await fetchImagesBySelection(participant, 3)
        moments.sort((a, b) => a.imageId - b.imageId)
				const robot = await fetchImagesBySelection(participant, 0.1)
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

			<h3>Storyboard</h3>
      {storyboardData && storyboardData.length > 0 ? (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(4, 1fr)',
						gap: '10px',
					}}
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
            >
              <p>
                <strong>Scene {index + 1}: {storyboards[1].scenes[index].title}</strong>
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

			<h3>Moments</h3>
      {momentsData && momentsData.length > 0 ? (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(4, 1fr)',
						gap: '10px',
					}}
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

			<h3>Robot</h3>
      {robotData && robotData.length > 0 ? (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(4, 1fr)',
						gap: '10px',
					}}
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
