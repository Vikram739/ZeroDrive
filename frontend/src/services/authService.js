import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth, googleProvider } from '../config/firebase'
import api from './api'
import content from '../config/content.json'

const FIREBASE_ERROR_MAP = {
  'auth/email-already-in-use': content.auth.errors.emailInUse,
  'auth/wrong-password': content.auth.errors.wrongPassword,
  'auth/invalid-credential': content.auth.errors.wrongPassword,
  'auth/user-not-found': content.auth.errors.userNotFound,
  'auth/weak-password': content.auth.errors.weakPassword,
  'auth/invalid-email': content.auth.errors.invalidEmail,
  'auth/popup-closed-by-user': content.auth.errors.googlePopupClosed,
  'auth/cancelled-popup-request': content.auth.errors.googlePopupClosed,
}

function friendlyError(err) {
  return FIREBASE_ERROR_MAP[err.code] ?? content.auth.errors.generic
}

export async function signUpWithEmail(name, email, password) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName: name })
    const idToken = await credential.user.getIdToken()
    await api.post('/auth/signup', { id_token: idToken, name })
    return credential.user
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function signInWithEmail(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    return credential.user
  } catch (err) {
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function signInWithGoogle() {
  try {
    const credential = await signInWithPopup(auth, googleProvider)
    const user = credential.user
    const idToken = await user.getIdToken()
    try {
      await api.post('/auth/signup', {
        id_token: idToken,
        name: user.displayName ?? user.email.split('@')[0],
      })
    } catch (apiErr) {
      if (apiErr.response?.status !== 409) {
        throw apiErr
      }
    }
    return user
  } catch (err) {
    if (err.message && !err.code) throw err
    throw new Error(friendlyError(err), { cause: err })
  }
}

export async function signOut() {
  await firebaseSignOut(auth)
}

export async function getCurrentUserProfile() {
  const response = await api.get('/auth/me')
  return response.data
}
