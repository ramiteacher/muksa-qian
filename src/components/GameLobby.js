import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import GameContext from '../contexts/GameContext';
import { createGameRoomInFirebase } from '../services/firebaseService';
import { database } from '../firebase';  // database는 가져오고
import { ref, onValue, remove } from 'firebase/database'; // 리스너 추가!

import '../styles/GameLobby.css';

const MAX_PLAYERS = 13;

const GameLobby = () => {
  const { gameState } = useContext(GameContext);
  const playerName = gameState.playerName;
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roomsRef = ref(database, 'rooms');

    const unsubscribe = onValue(roomsRef, async (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const roomList = Object.entries(data).map(([id, room]) => ({
          id,
          ...room
        }));

        // 0명짜리 방 삭제 처리
        const filteredRooms = await Promise.all(roomList.map(async (room) => {
          const currentPlayers = room.players ? room.players.length : 0;
          if (currentPlayers === 0) {
            try {
              await remove(ref(database, `rooms/${room.id}`));
              console.log(`플레이어 0명이라 방 삭제됨: ${room.name}`);
              return null;
            } catch (error) {
              console.error('방 삭제 실패:', error);
            }
          }
          return room;
        }));

        // 필터링된 방만 세팅
        setRooms(filteredRooms.filter(r => r !== null));
      } else {
        setRooms([]);
      }

      setLoading(false);
    });

    return () => unsubscribe(); // 🔥 리스너 해제 (메모리 누수 방지)
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
