import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage, db } from './firebase'
import { collection, addDoc, setDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'

// Update Storyboard with the number of characters
// Oct 9
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
// Oct 9
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

// Upload the character image
// Oct 9
export async function uploadCharAndSaveMetadata(
  file,
  participantId,
  storyboardId,
  characterId,
  fullPrompt,
  prompt,
  charDescription,
  selected = false
) {
  try {
    // Reference to the character's images subcollection
    const imagesRef = collection(
      db,
      'participants',
      String(participantId),
      'storyboards',
      String(storyboardId),
      'characters',
      String(characterId),
      'images'
    )

    // Get existing images to determine next imageId
    const snapshot = await getDocs(imagesRef)

    const existingImageIds = snapshot.docs.map((doc) => doc.data().imageId || 0)
    const nextImageId = (existingImageIds.length > 0 ? Math.max(...existingImageIds) : 0) + 1

    // File upload path
    const filePath = `${import.meta.env.VITE_FIREBASE_STORAGE_FOLDER}/${participantId}/${storyboardId}/${characterId}_${Date.now()}_${file.name}`
    const storageRef = ref(storage, filePath)

    // Upload the file
    await uploadBytes(storageRef, file)

    // Get the public download URL
    const downloadURL = await getDownloadURL(storageRef)

    // If selected, mark all others as unselected first
    if (selected) {
      for (const doc of snapshot.docs) {
        if (doc.data().selected === true) {
          await updateDoc(doc.ref, { selected: false });
        }
      }
    }

    // Add a new image document under the images subcollection
    await addDoc(imagesRef, {
      imageId: nextImageId,
      participantId,
      storyboardId,
      characterId,
      downloadURL,
      selected,
      fullPrompt,
      prompt,
      charDescription,
      createdAt: new Date().toISOString(),
    })

    console.log(`Image ${nextImageId} uploaded for character ${characterId}`)
    return downloadURL
  } catch (error) {
    console.error('Error uploading image and saving metadata:', error)
    throw error
  }
}

// Fetches all the character images created for the specific character in the storyboard
// Oct 9
export async function fetchAllCharImages(participantId, storyboardId, characterId) {
  const charsRef = collection(
    db,
    'participants',
    String(participantId),
    'storyboards',
    String(storyboardId),
    'characters',
    String(characterId),
    'images'
  )

  const querySnapshot = await getDocs(charsRef)

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

// Fetches all the character images which are the selected image for the specific character in the storyboard
// Oct 9
export async function fetchAllSelectedChars(participantId, storyboardId) {
  const charsRef = collection(
    db,
    'participants',
    String(participantId),
    'storyboards',
    String(storyboardId),
    'characters'
  )

  // Get all character docs
  const charSnapshot = await getDocs(charsRef)

  // For each character, get the selected image (from its subcollection)
  const charactersWithSelectedImages = await Promise.all(
    charSnapshot.docs.map(async (charDoc) => {
      const charData = charDoc.data()
      const charId = charDoc.id

      const imagesRef = collection(
        db,
        'participants',
        String(participantId),
        'storyboards',
        String(storyboardId),
        'characters',
        String(charId),
        'images'
      )

      // Query for selected image(s)
      const q = query(imagesRef, where('selected', '==', true))
      const selectedSnapshot = await getDocs(q)

      let selectedImage = null
      if (!selectedSnapshot.empty) {
        selectedImage = selectedSnapshot.docs[0].data()
      }

      return {
        id: charId,
        ...charData,
        selectedImage,
      }
    })
  )

  // Sort by character number (assuming numeric IDs or a field like "number")
  charactersWithSelectedImages.sort((a, b) => {
    const numA = Number(a.id)
    const numB = Number(b.id)
    return numA - numB
  })

  const selectedImages = charactersWithSelectedImages
    .map((char) => char.selectedImage)
    .filter((img) => img !== null && img !== undefined)

  // console.log('Selected characters:', charactersWithSelectedImages)
  return selectedImages
}

// Upload the scene image
// Oct 9
export async function uploadSceneImageAndSaveMetadata(
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
    const imagesRef = collection(
      db,
      'participants',
      String(participantId),
      'storyboards',
      String(storyboardId),
      'scenes',
      String(sceneId),
      'images'
    )

    const snapshot = await getDocs(imagesRef)

    // Determine max imageId and increment
    const existingImageIds = snapshot.docs.map((doc) => doc.data().imageId || 0)
    const nextImageId = (existingImageIds.length > 0 ? Math.max(...existingImageIds) : 0) + 1

    const filePath = `${import.meta.env.VITE_FIREBASE_STORAGE_FOLDER}/${participantId}/${storyboardId}/${sceneId}_${Date.now()}_${file.name}`
    const storageRef = ref(storage, filePath)

    // Upload image to Cloud Storage
    await uploadBytes(storageRef, file)

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef)

    // If selected, mark all others as unselected first
    if (selected) {
      for (const doc of snapshot.docs) {
        if (doc.data().selected === true) {
          await updateDoc(doc.ref, { selected: false });
        }
      }
    }

    // Save to Firestore
    await addDoc(imagesRef, {
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

    return downloadURL
  } catch (error) {
    console.error('Error uploading image: ', error)
    throw error
  }
}

// fetch images for a specific participant, storyboard, and scene
export async function fetchSceneImages(participantId, storyboardId, sceneId) {
  const imagesRef = collection(
    db,
    'participants',
    String(participantId),
    'storyboards',
    String(storyboardId),
    'scenes',
    String(sceneId),
    'images'
  )

  const querySnapshot = await getDocs(imagesRef)

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

// Sets the image specified by imageId as selected for the given sceneId
// unselects any previously selected image for the same participant, storyboard, and scene
// Oct 9
export async function setSelectedSceneImage(participantId, storyboardId, sceneId, imageId) {
  try {
    const charsRef = collection(
      db,
      'participants',
      String(participantId),
      'storyboards',
      String(storyboardId),
      'scenes',
      String(sceneId),
      'images',
    )
    const q = query(charsRef)

    const snapshot = await getDocs(q)

    console.log(snapshot.docs)

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()

      // Step 1: Unselect any selected image
      if (data.selected && docSnap.id !== imageId) {
        await updateDoc(docSnap.ref, {
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
        await updateDoc(docSnap.ref, {
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

// Sets the image specified by imageId as selected for the given charId
// unselects any previously selected image for the same participant, storyboard, and scene
// Oct 9
export async function setSelectedCharImage(participantId, storyboardId, charId, imageId) {
  try {
    const charsRef = collection(
      db,
      'participants',
      String(participantId),
      'storyboards',
      String(storyboardId),
      'characters',
      String(charId),
      'images',
    )
    const q = query(charsRef)

    const snapshot = await getDocs(q)

    console.log(snapshot.docs)

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data()

      // Step 1: Unselect any selected image
      if (data.selected && docSnap.id !== imageId) {
        await updateDoc(docSnap.ref, {
          selected: false,
        })
      }

      // Step 2: Set the matching image to selected
      if (
        data.participantId === participantId &&
        data.storyboardId === storyboardId &&
        data.characterId === charId &&
        data.imageId === imageId
      ) {
        await updateDoc(docSnap.ref, {
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
