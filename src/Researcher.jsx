import React, { useEffect, useState } from 'react'

// Firebase imports
import { fetchAllParticipants } from './firebase/firebase_helper_functions'

// Style imports
import './styles/App.css'

export function Researcher() {
  const [participants, setParticipants] = useState([])

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const participants = await fetchAllParticipants()
        setParticipants(participants)
        console.log('Fetched participants:', participants)
      } catch (error) {
        console.error('Error fetching participants:', error)
      }
    }
    fetchParticipants()
  }, [])

  return (
    <div className="container">
      <h1>Researcher Dashboard</h1>
      <div className="participant-list">
        <h2>Participants</h2>
        <ul>
          {participants.map((participant) => (
            <li key={participant}>
              <a href={`/researcher/${participant}`}>{participant}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
