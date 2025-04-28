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
    try {
      const newRoom = {
        name: `${gameState.playerName}의 방`,
        createdAt: Date.now(),
        host: gameState.playerName,
        status: 'waiting' // 추가 정보
      };
      const roomId = await createGameRoomInFirebase(newRoom);
      navigate(`/game/${roomId}`); // 생성된 방으로 이동
    } catch (error) {
      console.error('방 생성 오류:', error);
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
