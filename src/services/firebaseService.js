import { database } from '../firebase';  // 네 firebase.js에서 export한 database
import { ref, push, get, child } from 'firebase/database';

// 방 생성
export const createGameRoomInFirebase = async (roomData) => {
  const roomsRef = ref(database, 'gameRooms');
  const newRoomRef = push(roomsRef);
  await newRoomRef.set(roomData);
  return newRoomRef.key;  // 생성된 방 ID 반환
};

// 방 목록 불러오기
export const fetchGameRoomsFromFirebase = async () => {
  const dbRef = ref(database);
  const snapshot = await get(child(dbRef, 'gameRooms'));
  if (snapshot.exists()) {
    const rooms = snapshot.val();
    return Object.entries(rooms).map(([id, data]) => ({ id, ...data }));
  } else {
    return [];
  }
};
