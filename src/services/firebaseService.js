import { database } from '../firebase';  // 네 firebase.js에서 export한 database
import { ref, push, set, get, child, remove } from 'firebase/database';


// ✅ 방 생성
export async function createGameRoomInFirebase(gameName, playerName) {
  try {
    const roomsRef = ref(database, 'rooms');        // rooms 경로로 ref 만들고
    const newRoomRef = push(roomsRef);               // rooms 하위에 새로운 키 생성
    const roomData = {
      name: gameName,
      host: playerName,
      players: [],
      createdAt: Date.now()
    };
    await set(newRoomRef, roomData);                 // 그 새 키에 데이터 저장
    console.log('Firebase 방 생성 완료:', newRoomRef.key);
    return newRoomRef.key;                           // 생성된 방 ID 반환
  } catch (error) {
    console.error('Firebase 방 생성 오류:', error);
    throw error;
  }
}

// ✅ 방 목록 불러오기
export async function fetchGameRoomsFromFirebase() {
  try {
    const roomsRef = ref(database, 'rooms');         // rooms 전체 참조
    const snapshot = await get(roomsRef);             // rooms 데이터 가져오기
    if (snapshot.exists()) {
      return snapshot.val();                         // 데이터 있으면 반환
    } else {
      return {};                                     // 없으면 빈 객체 반환
    }
  } catch (error) {
    console.error('Firebase 방 목록 불러오기 오류:', error);
    throw error;
  }
}
