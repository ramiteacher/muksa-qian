import { database } from '../firebase';  // 네 firebase.js에서 export한 database
import { ref, push, get, child } from 'firebase/database';

// ✅ 방 생성
export async function createGameRoomInFirebase(gameName, playerName) {
  try {
    const newRoomRef = push(ref(database, 'rooms'));
    const roomData = {
      name: gameName,
      host: playerName,
      players: [],
      createdAt: Date.now()
    };
    await set(newRoomRef, roomData);  // push 후 set!!
    console.log('Firebase 방 생성 완료:', newRoomRef.key);
    return newRoomRef.key;  // 생성된 방 ID 반환
  } catch (error) {
    console.error('Firebase 방 생성 오류:', error);
    throw error;
  }
}

// 방 목록 불러오기
export async function fetchGameRoomsFromFirebase() {
  try {
    const snapshot = await get(child(ref(database), 'rooms'));
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return {};
    }
  } catch (error) {
    console.error('Firebase 방 목록 불러오기 오류:', error);
    throw error;
  }
}