import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import GameContext from '../contexts/GameContext';
import { createGameRoomInFirebase, fetchGameRoomsFromFirebase } from '../services/firebaseService';

import '../styles/GameLobby.css'; // 스타일도 수정할 예정

const MAX_PLAYERS = 13; // 최대 참가자 수

const GameLobby = () => {
  const { gameState } = useContext(GameContext);
  const playerName = gameState.playerName;
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const fetchedRooms = await fetchGameRoomsFromFirebase();
        const roomList = Object.entries(fetchedRooms).map(([id, room]) => ({
          id,
          ...room
        }));
        setRooms(roomList);
      } catch (error) {
        console.error('방 목록 불러오기 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, []);

  const handleCreateRoom = async () => {
    if (!playerName) {
      alert('플레이어 이름을 먼저 입력하세요.');
      return;
    }

    try {
      const gameName = prompt('생성할 방 이름을 입력하세요.');
      if (gameName) {
        const roomId = await createGameRoomInFirebase(gameName, playerName);
        navigate(`/game/${roomId}`);
      }
    } catch (error) {
      console.error('방 생성 실패:', error);
      alert('방 생성 중 오류가 발생했습니다.');
    }
  };

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
          <div className="room-cards">
            {rooms.map((room) => {
              const currentPlayers = room.players ? room.players.length : 0;
              const isFull = currentPlayers >= MAX_PLAYERS;

              return (
                <div 
                  key={room.id} 
                  className={`room-card ${isFull ? 'full' : ''}`}
                  onClick={() => !isFull && handleJoinRoom(room.id)}
                  style={{ cursor: isFull ? 'not-allowed' : 'pointer' }}
                >
                  <div className="room-name">{room.name}</div>
                  <div className="room-players">{currentPlayers} / {MAX_PLAYERS} 명</div>
                  <div className="room-host">방장: {room.host}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <p>생성된 방이 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default GameLobby;
