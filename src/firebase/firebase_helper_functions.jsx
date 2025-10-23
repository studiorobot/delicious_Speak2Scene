import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage, db } from './firebase'
import {
	collection,
	addDoc,
	setDoc,
	query,
	where,
	getDocs,
	updateDoc,
	doc,
} from 'firebase/firestore'

/**
 * Creates a character document on the database
 *
 * @param {Integer or String} participantId - Participant ID for which the empty character needs to be created
 * @param {Integer or String} storyboardId - Storyboard ID for which the empty character needs to be created
 * @param {Integer or String} characterId - Character ID for the empty character
 */
export async function createEmptyCharacter(participantId, storyboardId, characterId) {
	try {
		const ref = doc(
			db,
			'participants',
			String(participantId),
			'storyboards',
			String(storyboardId),
			'characters',
			String(characterId)
		)
		await setDoc(ref, {
			selected_image: null,
			created_at: new Date().toISOString(),
		})
	} catch (err) {
		console.error('Error creating character:', err)
	}
}

/**
 * Returns the number of characters that are present
 *
 * @param {Integer or String} participantId - Participant ID for which the empty character needs to be created
 * @param {Integer or String} storyboardId - Storyboard ID for which the empty character needs to be created
 */
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

/**
 * Uploads the character information and image to the database
 *
 * @param {file} file - character image that needs to be uploaded
 * @param {Integer or String} participantId - Participant ID for which the character image needs to be uploaded
 * @param {Integer or String} storyboardId - Storyboard ID for which the empty character needs to be created
 * @param {Integer or String} characterId - Character ID for the empty character
 * @param {String} fullPrompt - full prompt (including prompt engineering) that was used to generate the image (file)
 * @param {String} prompt - prompt as provided by the user that was used to generate the image (file)
 * @param {String} charDescription - Description of the character's image that is getting stored
 * @param {Boolean} selected - represents if this image for the characterId is the final image selected
 * @returns {String} - downloadURL which is a public URL to access the image
 */
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
					await updateDoc(doc.ref, { selected: false })
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
		return downloadURL
	} catch (error) {
		console.error('Error uploading image and saving metadata:', error)
		throw error
	}
}

/**
 * Returns the number of characters that are present
 *
 * @param {Integer or String} participantId - Participant ID for which the empty character needs to be created
 * @param {Integer or String} storyboardId - Storyboard ID for which the empty character needs to be created
 * @param {Integer or String} characterId - Character ID for the empty character
 * @returns {charImg[]} - List of characters
 */
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

/**
 * Fetches all the character images which are the selected image for the specific character in the storyboard
 *
 * @param {Integer or String} participantId - Participant ID for which the empty character needs to be created
 * @param {Integer or String} storyboardId - Storyboard ID for which the empty character needs to be created
 * @returns {charImg[]} - List of character images that are selected for each  character
 */
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

	return selectedImages
}

/**
 * Uploads the scene image created to the database
 *
 * @param {file} file - scene image that needs to be uploaded
 * @param {Integer or String} participantId - Participant ID for which the scene image needs to be uploaded
 * @param {Integer or String} storyboardId - Storyboard ID for which the scene image needs to be uploaded
 * @param {Integer or String} sceneId - Scene ID for the empty character
 * @param {String} fullPrompt - full prompt (including prompt engineering) that was used to generate the image (file)
 * @param {String} prompt - prompt as provided by the user that was used to generate the image (file)
 * @param {Boolean} selected - Description of the character's image that is getting stored
 * @returns {String} - downloadURL which is a public URL to access the image
 */
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
		// Ensure the scene document exists
		const sceneDocRef = doc(
			db,
			'participants',
			String(participantId),
			'storyboards',
			String(storyboardId),
			'scenes',
			String(sceneId)
		)

		await setDoc(sceneDocRef, { createdAt: new Date() }, { merge: true })

		// Reference images subcollection
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

		const existingImageIds = snapshot.docs.map((doc) => doc.data().imageId || 0)
		const nextImageId = (existingImageIds.length > 0 ? Math.max(...existingImageIds) : 0) + 1

		const filePath = `${import.meta.env.VITE_FIREBASE_STORAGE_FOLDER}/${participantId}/${storyboardId}/${sceneId}_${Date.now()}_${file.name}`
		const storageRef = ref(storage, filePath)

		await uploadBytes(storageRef, file)
		const downloadURL = await getDownloadURL(storageRef)

		if (selected) {
			for (const doc of snapshot.docs) {
				if (doc.data().selected === true) {
					await updateDoc(doc.ref, { selected: false })
				}
			}
		}

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

/**
 * Uploads the scene image created to the database
 *
 * @param {Integer or String} participantId - Participant ID for which the scene image needs to be uploaded
 * @param {Integer or String} storyboardId - Storyboard ID for which the scene image needs to be uploaded
 * @param {Integer or String} sceneId - Scene ID for the empty character
 * @returns {sceneImg[]} - fetches all the scene images created for participantId, storyboardId, and sceneId
 */
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

/**
 * Sets all images specified by participantId, storyboardId, and sceneId as unselected
 *
 * @param {Integer or String} participantId - Participant ID for which the scene image needs to be uploaded
 * @param {Integer or String} storyboardId - Storyboard ID for which the scene image needs to be uploaded
 * @param {Integer or String} sceneId - Scene ID for the empty character
 */
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

/**
 * Sets all images specified by participantId, storyboardId, and sceneId as unselected
 *
 * @param {Integer or String} participantId - Participant ID for which the scene image needs to be uploaded
 * @param {Integer or String} storyboardId - Storyboard ID for which the scene image needs to be uploaded
 * @param {Integer or String} sceneId - Scene ID for the empty character
 * @param {Integer} imageId - Image ID which needs to be set to selected
 */
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
			'images'
		)
		const q = query(charsRef)

		const snapshot = await getDocs(q)

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
	} catch (error) {
		console.error('Error setting selected image:', error)
		throw error
	}
}

/**
 * Sets the image specified by imageId as selected for the given charId; unselects any previously selected image for the same participant, storyboard, and scene
 *
 * @param {Integer or String} participantId - Participant ID for which the scene image needs to be uploaded
 * @param {Integer or String} storyboardId - Storyboard ID for which the scene image needs to be uploaded
 * @param {Integer or String} sceneId - Scene ID for the empty character
 * @param {Integer} imageId - Image ID which needs to be set to selected
 */
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
			'images'
		)
		const q = query(charsRef)

		const snapshot = await getDocs(q)

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
	} catch (error) {
		console.error('Error setting selected image:', error)
		throw error
	}
}

/**
 * Fetch scene images for a specific participant, storyboard, and if selected
 *
 * @param {Integer or String} participantId - Participant ID for which the scene image needs to be uploaded
 * @param {Integer or String} storyboardId - Storyboard ID for which the scene image needs to be uploaded
 * @returns {img[]} - fetches all scene images that are selected
 */
export async function fetchSceneImagesBySelection(participantId, storyboardId) {
	// Reference to scenes collection
	const scenesRef = collection(
		db,
		'participants',
		String(participantId),
		'storyboards',
		String(storyboardId),
		'scenes'
	)

	// Get all scenes
	const sceneSnapshot = await getDocs(scenesRef)

	// For each scene, get selected images
	const scenesWithSelectedImages = await Promise.all(
		sceneSnapshot.docs.map(async (sceneDoc) => {
			const sceneId = sceneDoc.id
			const sceneData = sceneDoc.data()

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

			const q = query(imagesRef, where('selected', '==', true))
			const imageSnapshot = await getDocs(q)

			let selectedImage = null
			if (!imageSnapshot.empty) {
				selectedImage = imageSnapshot.docs[0].data()
			}
			return {
				id: sceneId,
				...sceneData,
				selectedImage,
			}
		})
	)

	// Sort by character number (assuming numeric IDs or a field like "number")
	scenesWithSelectedImages.sort((a, b) => {
		const numA = Number(a.id)
		const numB = Number(b.id)
		return numA - numB
	})

	const selectedImages = scenesWithSelectedImages
		.map((char) => char.selectedImage)
		.filter((img) => img !== null && img !== undefined)

	return selectedImages
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
