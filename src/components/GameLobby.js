import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import GameContext from '../contexts/GameContext';
import { createGameRoomInFirebase, fetchGameRoomsFromFirebase } from '../services/firebaseService';

import '../styles/GameLobby.css'; // 스타일 있으면

const GameLobby = () => {
  const { gameState } = useContext(GameContext);
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // 로비 입장 시 방 목록 불러오기
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const fetchedRooms = await fetchGameRoomsFromFirebase();
        setRooms(fetchedRooms);
      } catch (error) {
        console.error('방 목록 불러오기 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);

  // 방 만들기
  const handleCreateRoom = async () => {
    if (!playerName) {
      alert('플레이어 이름을 먼저 입력하세요.');
      return;
    }
    
    try {
      const gameName = prompt('생성할 방 이름을 입력하세요.');
      if (gameName) {
        const roomId = await createGameRoomInFirebase(gameName, playerName);
        console.log('방 생성 완료, 방 ID:', roomId);
  
        // 방 생성 후 로비 방 목록 다시 불러오기
        const updatedRooms = await fetchGameRoomsFromFirebase();
        setRooms(updatedRooms);
      }
    } catch (error) {
      console.error('방 생성 실패:', error);
      alert('방 생성 중 오류가 발생했습니다.');
    }
  };

  // 방 참가하기
  const handleJoinRoom = (roomId) => {
    navigate(`/game/${roomId}`);
  };

  return (
    <div className="lobby-container">
      <h2>로비</h2>

      <div className="lobby-actions">
        <button className="primary" onClick={handleCreateRoom}>
          새 방 만들기
        </button>
      </div>

      <div className="room-list">
        {loading ? (
          <p>방 목록 불러오는 중...</p>
        ) : rooms.length > 0 ? (
          <ul>
            {rooms.map((room) => (
              <li key={room.id} className="room-item">
                <div>
                  <strong>{room.name}</strong> (방장: {room.host})
                </div>
                <button onClick={() => handleJoinRoom(room.id)}>참가하기</button>
              </li>
            ))}
          </ul>
        ) : (
          <p>생성된 방이 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default GameLobby;
