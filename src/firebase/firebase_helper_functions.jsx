import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage, db } from './firebase'
import { collection, addDoc, setDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'

// Upload a Character Image and save its metadata
export async function uploadCharacterAndSaveMetadata(
  file,
  participantId,
  storyboardId,
  characterId,
  fullPrompt,
  prompt,
  selected = false
) {
  try {
    // Get all existing images for the given participant, storyboard, and scene
    const imagesRef = collection(db, participantId)
    const q = query(
      imagesRef,
      where('participantId', '==', participantId),
      where('storyboardId', '==', storyboardId),
      where('characterId', '==', characterId)
    )
    const snapshot = await getDocs(q)

    // Determine max imageId and increment
    const existingImageIds = snapshot.docs.map((doc) => doc.data().imageId || 0)
    const nextImageId = (existingImageIds.length > 0 ? Math.max(...existingImageIds) : 0) + 1

    const filePath = `userstudy-app-images/${participantId}/${storyboardId}/${sceneId}_${Date.now()}_${file.name}`
    const storageRef = ref(storage, filePath)

    // Upload image to Cloud Storage
    await uploadBytes(storageRef, file)

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef)

    // Save to Firestore
    const docRef = await addDoc(collection(db, 'participants'), {
      imageId: nextImageId,
      participantId,
      storyboardId,
      sceneId,
      downloadURL,
      selected,
      fullPrompt,
      prompt,
      createdAt: new Date(),
    })

    console.log('Document written with ID: ', docRef.id)
    return downloadURL
  } catch (error) {
    console.error('Error uploading image: ', error)
    throw error
  }
}

// Update Storyboard with the number of characters
export async function createEmptyCharacter(participantId, storyboardId, characterId) {
  try {
    const ref = doc(db, 'participants', String(participantId), 'storyboards', String(storyboardId), 'characters', String(characterId));
    await setDoc(ref, {
      selected_image: null,
      created_at: new Date().toISOString()
    });
    console.log(`Character ${characterId} created for storyboard ${storyboardId}`);
  } catch (err) {
    console.error("Error creating character:", err);
  }
}

// Fetch the number of characters for a specific participant and storyboard
export async function fetchCharacterCount(participantId, storyboardId) {
  try {
    const charsRef = collection(
      db,
      'participants',
      String(participantId),
      'storyboards',
      String(storyboardId),
      'characters'
    )
    const querySnapshot = await getDocs(charsRef)
    return querySnapshot.size // returns the number of character documents
  } catch (err) {
    console.error('Error fetching character count:', err)
    return 0
  }
}

export async function uploadImageAndSaveMetadata(
  file,
  participantId,
  storyboardId,
  sceneId,
  fullPrompt,
  prompt,
  selected = false
) {
  try {
    // Get all existing images for the given participant, storyboard, and scene
    const imagesRef = collection(db, 'participants')
    const q = query(
      imagesRef,
      where('participantId', '==', participantId),
      where('storyboardId', '==', storyboardId),
      where('sceneId', '==', sceneId)
    )
    const snapshot = await getDocs(q)

    // Determine max imageId and increment
    const existingImageIds = snapshot.docs.map((doc) => doc.data().imageId || 0)
    const nextImageId = (existingImageIds.length > 0 ? Math.max(...existingImageIds) : 0) + 1

    const filePath = `userstudy-app-images/${participantId}/${storyboardId}/${sceneId}_${Date.now()}_${file.name}`
    const storageRef = ref(storage, filePath)

    // Upload image to Cloud Storage
    await uploadBytes(storageRef, file)

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef)

    // Save to Firestore
    const docRef = await addDoc(collection(db, 'participants'), {
      imageId: nextImageId,
      participantId,
      storyboardId,
      sceneId,
      downloadURL,
      selected,
      fullPrompt,
      prompt,
      createdAt: new Date(),
    })

    console.log('Document written with ID: ', docRef.id)
    return downloadURL
  } catch (error) {
    console.error('Error uploading image: ', error)
    throw error
  }
}

// Sets all images specified by participantId, storyboardId, and sceneId as unselected
export async function setAllImagesUnselected(participantId, storyboardId, sceneId) {
  try {
    const q = query(
      collection(db, 'participants'),
      where('participantId', '==', participantId),
      where('storyboardId', '==', storyboardId),
      where('sceneId', '==', sceneId)
    )

    const snapshot = await getDocs(q)

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()

      if (data.selected) {
        await updateDoc(doc(db, 'participants', docSnap.id), {
          selected: false,
        })
      }
    }
  } catch (error) {
    console.error('Error setting selected image:', error)
    throw error
  }
}

// Sets the image specified by imageId as selected
// unselects any previously selected image for the same participant, storyboard, and scene
export async function setSelectedImage(participantId, storyboardId, sceneId, imageId) {
  try {
    const q = query(
      collection(db, 'participants'),
      where('participantId', '==', participantId),
      where('storyboardId', '==', storyboardId),
      where('sceneId', '==', sceneId)
    )

    const snapshot = await getDocs(q)

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()

      // Step 1: Unselect any selected image
      if (data.selected && docSnap.id !== imageId) {
        await updateDoc(doc(db, 'participants', docSnap.id), {
          selected: false,
        })
      }

      // Step 2: Set the matching image to selected
      if (
        data.participantId === participantId &&
        data.storyboardId === storyboardId &&
        data.sceneId === sceneId &&
        data.imageId === imageId
      ) {
        await updateDoc(doc(db, 'participants', docSnap.id), {
          selected: true,
        })
      }
    }

    console.log(`Image ${imageId} is now selected.`)
  } catch (error) {
    console.error('Error setting selected image:', error)
    throw error
  }
}

export async function fetchImages(participantId, storyboardId, sceneId) {
  const q = query(
    collection(db, 'participants'),
    where('participantId', '==', participantId),
    where('storyboardId', '==', storyboardId),
    where('sceneId', '==', sceneId)
  )

  const querySnapshot = await getDocs(q)

  const results = querySnapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
    }
  })

  results.sort((a, b) => {
    // First: selected first
    if (a.selected && !b.selected) return -1
    if (!a.selected && b.selected) return 1

    // Then: descending imageId
    return b.imageId - a.imageId
  })
  return [...results]
}

// fetch images for a specific participant, storyboard, and if selected
export async function fetchImagesBySelection(participantId, storyboardId) {
  try {
    const q = query(
      collection(db, 'participants'),
      where('participantId', '==', participantId),
      where('storyboardId', '==', storyboardId),
      where('selected', '==', true)
    )

    const querySnapshot = await getDocs(q)

    const results = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
      }
    })

    return results
  } catch (error) {
    console.error('Error fetching images:', error)
    throw error
  }
}

// fetch character for a specific participant
export async function fetchCharacter(participantId) {
  console.log(participantId)
  try {
    const q = query(
      collection(db, 'participants'),
      where('participantId', '==', participantId),
      where('storyboardId', '==', 0),
      where('sceneId', '==', 0),
      where('selected', '==', true)
    )

    const querySnapshot = await getDocs(q)

    const results = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
      }
    })
    console.log(results)
    return results
  } catch (error) {
    console.error('Error fetching images:', error)
    throw error
  }
}

// fetch robot for a specific participant
export async function fetchRobot(participantId) {
  console.log(participantId)
  try {
    const q = query(
      collection(db, 'participants'),
      where('participantId', '==', participantId),
      where('storyboardId', '==', 0.1),
      where('sceneId', '==', 0.1),
      where('selected', '==', true)
    )

    const querySnapshot = await getDocs(q)

    const results = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
      }
    })
    console.log(results)
    return results
  } catch (error) {
    console.error('Error fetching images:', error)
    throw error
  }
}

// Fetch all unique participant IDs
export async function fetchAllParticipants() {
  try {
    const snapshot = await getDocs(collection(db, 'participants'))

    const participantIds = new Set()
    snapshot.forEach((doc) => {
      const data = doc.data()
      if (data.participantId) {
        participantIds.add(data.participantId)
      }
    })

    return Array.from(participantIds)
  } catch (error) {
    console.error('Error fetching participant IDs:', error)
    throw error
  }
}
