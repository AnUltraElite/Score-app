import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db } from "./firebase.js";

const userRef = uid => doc(db, "users", uid);
const usernameRef = username => doc(db, "usernames", username);

export async function loadCloudProfile(uid) {
  const snapshot = await getDoc(userRef(uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    name: data.name || data.username || "",
    username: data.username || "",
    bio: data.bio || "",
    onboardingComplete: Boolean(data.username),
  };
}

export async function saveCloudProfile(uid, profile) {
  const username = String(profile.username || "").trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,20}$/.test(username)) {
    const error = new Error("Choose a valid username.");
    error.code = "invalid-username";
    throw error;
  }

  await runTransaction(db, async transaction => {
    const profileSnapshot = await transaction.get(userRef(uid));
    const reservedSnapshot = await transaction.get(usernameRef(username));
    if (reservedSnapshot.exists() && reservedSnapshot.data().uid !== uid) {
      const error = new Error("That username is already taken.");
      error.code = "username-taken";
      throw error;
    }

    const existing = profileSnapshot.exists() ? profileSnapshot.data() : {};
    transaction.set(userRef(uid), {
      uid,
      username,
      name: String(profile.name || username).trim(),
      bio: String(profile.bio || "").trim(),
      createdAt: existing.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.set(usernameRef(username), {
      uid,
      username,
      createdAt: reservedSnapshot.exists() ? reservedSnapshot.data().createdAt : serverTimestamp(),
    }, { merge: true });
  });
}

export async function loadCloudMatches(uid) {
  const snapshot = await getDocs(query(collection(db, "matches"), where("ownerId", "==", uid)));
  return snapshot.docs.map(matchDoc => matchDoc.data());
}

export async function saveCloudMatch(uid, match) {
  // JSON removes the undefined optional fields used by the local match model;
  // Firestore rejects undefined values by default.
  const cleanMatch = JSON.parse(JSON.stringify(match));
  await setDoc(doc(db, "matches", match.id), {
    ...cleanMatch,
    ownerId: uid,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
