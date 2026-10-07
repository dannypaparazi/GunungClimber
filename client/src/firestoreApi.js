import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

// --- Users ---

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateUserRole(uid, role) {
  await updateDoc(doc(db, 'users', uid), { role });
}

// Removes the user's app profile only. Their Firebase Auth account still exists
// (deleting that requires the Admin SDK, which isn't available client-side) — they
// just won't have a profile to log into the app with anymore.
export async function deleteUserProfile(uid) {
  await deleteDoc(doc(db, 'users', uid));
}

export async function getOtherUsers(uid) {
  const users = await getAllUsers();
  return users.filter((u) => u.id !== uid && u.role !== 'admin');
}

// --- Itineraries ---

export async function createItinerary(uid, data) {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, 'itineraries'), {
    ...data,
    user_id: uid,
    created_at: now,
    updated_at: now,
  });
  return ref.id;
}

export async function updateItinerary(id, data) {
  await updateDoc(doc(db, 'itineraries', id), { ...data, updated_at: new Date().toISOString() });
}

export async function deleteItinerary(id) {
  await deleteDoc(doc(db, 'itineraries', id));
}

export async function getItinerary(id) {
  const snap = await getDoc(doc(db, 'itineraries', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getMyItineraries(uid) {
  const q = query(collection(db, 'itineraries'), where('user_id', '==', uid));
  const snap = await getDocs(q);
  const itineraries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  itineraries.sort((a, b) => (a.start_date < b.start_date ? 1 : -1));
  return itineraries;
}

// Pins for the shared map: the user's own itineraries plus other users' public ones.
export async function getMapPins(uid) {
  const [ownSnap, publicSnap, users] = await Promise.all([
    getDocs(query(collection(db, 'itineraries'), where('user_id', '==', uid))),
    getDocs(query(collection(db, 'itineraries'), where('is_public', '==', true))),
    getAllUsers(),
  ]);

  const usersById = Object.fromEntries(users.map((u) => [u.id, u]));
  const byId = new Map();

  for (const d of ownSnap.docs) byId.set(d.id, { id: d.id, ...d.data() });
  for (const d of publicSnap.docs) if (!byId.has(d.id)) byId.set(d.id, { id: d.id, ...d.data() });

  return [...byId.values()]
    .filter((it) => it.meeting_lat != null && it.meeting_lng != null)
    .map((it) => {
      const owner = usersById[it.user_id];
      return {
        ...it,
        is_own: it.user_id === uid,
        owner_username: owner?.username,
        owner_full_name: owner?.full_name,
      };
    });
}

// --- Friendships ---

export async function getMyFriendships(uid) {
  const [asRequester, asAddressee] = await Promise.all([
    getDocs(query(collection(db, 'friendships'), where('requester_id', '==', uid))),
    getDocs(query(collection(db, 'friendships'), where('addressee_id', '==', uid))),
  ]);
  const byId = new Map();
  for (const d of asRequester.docs) byId.set(d.id, { id: d.id, ...d.data() });
  for (const d of asAddressee.docs) byId.set(d.id, { id: d.id, ...d.data() });
  return [...byId.values()];
}

// Accepted friends, resolved to profile info (matches the old API's { friendship_id, id, username, full_name } shape).
export async function getMyFriends(uid) {
  const friendships = await getMyFriendships(uid);
  const accepted = friendships.filter((f) => f.status === 'accepted');
  const friendIds = accepted.map((f) => (f.requester_id === uid ? f.addressee_id : f.requester_id));
  const profiles = await Promise.all(friendIds.map((fid) => getUserProfile(fid)));

  return accepted.map((f, i) => ({
    friendship_id: f.id,
    id: profiles[i]?.id,
    username: profiles[i]?.username,
    full_name: profiles[i]?.full_name,
    friend_type: f.friend_type || 'hike',
  }));
}

// All other (non-admin) users, annotated with the current user's relationship to each.
export async function getUserDirectory(uid) {
  const [users, friendships] = await Promise.all([getOtherUsers(uid), getMyFriendships(uid)]);

  return users.map((u) => {
    const friendship = friendships.find(
      (f) => (f.requester_id === uid && f.addressee_id === u.id) || (f.addressee_id === uid && f.requester_id === u.id)
    );
    let relationship = 'none';
    if (friendship?.status === 'accepted') relationship = 'friends';
    else if (friendship?.status === 'pending') {
      relationship = friendship.requester_id === uid ? 'pending_sent' : 'pending_received';
    }
    return { ...u, friendship_id: friendship?.id, relationship, friend_type: friendship?.friend_type || 'hike' };
  });
}

// Pending requests addressed to the current user.
export async function getIncomingFriendRequests(uid) {
  const friendships = await getMyFriendships(uid);
  const pending = friendships.filter((f) => f.status === 'pending' && f.addressee_id === uid);
  const profiles = await Promise.all(pending.map((f) => getUserProfile(f.requester_id)));

  return pending.map((f, i) => ({
    friendship_id: f.id,
    id: profiles[i]?.id,
    username: profiles[i]?.username,
    full_name: profiles[i]?.full_name,
    friend_type: f.friend_type || 'hike',
  }));
}

export async function sendFriendRequest(uid, friendUid, friendType = 'hike') {
  await addDoc(collection(db, 'friendships'), {
    requester_id: uid,
    addressee_id: friendUid,
    status: 'pending',
    friend_type: friendType,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function acceptFriendship(friendshipId) {
  await updateDoc(doc(db, 'friendships', friendshipId), {
    status: 'accepted',
    updated_at: new Date().toISOString(),
  });
}

export async function removeFriendship(friendshipId) {
  await deleteDoc(doc(db, 'friendships', friendshipId));
}

// --- Itinerary invites ---

export async function getInvitesForItinerary(itineraryId) {
  const q = query(collection(db, 'itinerary_invites'), where('itinerary_id', '==', itineraryId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function inviteFriend(itinerary, friendUid) {
  await addDoc(collection(db, 'itinerary_invites'), {
    itinerary_id: itinerary.id,
    invitee_id: friendUid,
    status: 'invited',
    title: itinerary.title,
    mountain_name: itinerary.mountain_name,
    start_date: itinerary.start_date,
    end_date: itinerary.end_date,
    owner_id: itinerary.user_id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function removeInvite(inviteId) {
  await deleteDoc(doc(db, 'itinerary_invites', inviteId));
}

export async function getMyInvites(uid) {
  const q = query(collection(db, 'itinerary_invites'), where('invitee_id', '==', uid));
  const snap = await getDocs(q);
  const invites = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const ownerIds = [...new Set(invites.map((inv) => inv.owner_id))];
  const owners = await Promise.all(ownerIds.map((oid) => getUserProfile(oid)));
  const ownersById = Object.fromEntries(ownerIds.map((oid, i) => [oid, owners[i]]));

  return invites.map((inv) => ({
    invite_id: inv.id,
    status: inv.status,
    itinerary_id: inv.itinerary_id,
    title: inv.title,
    mountain_name: inv.mountain_name,
    start_date: inv.start_date,
    end_date: inv.end_date,
    owner_username: ownersById[inv.owner_id]?.username,
    owner_full_name: ownersById[inv.owner_id]?.full_name,
  }));
}

export async function respondToInvite(inviteId, status) {
  await updateDoc(doc(db, 'itinerary_invites', inviteId), { status, updated_at: new Date().toISOString() });
}

// --- Makan spots (user-submitted, in addition to the curated list) ---

export async function getUserMakanSpots() {
  const snap = await getDocs(collection(db, 'makan_spots'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addMakanSpot(uid, spot) {
  await addDoc(collection(db, 'makan_spots'), {
    ...spot,
    added_by: uid,
    created_at: new Date().toISOString(),
  });
}

export async function deleteMakanSpot(spotId) {
  await deleteDoc(doc(db, 'makan_spots', spotId));
}
