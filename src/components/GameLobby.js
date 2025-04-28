import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameContext from '../contexts/GameContext';
import SocketContext from '../contexts/SocketContext';
import '../styles/GameLobby.css';

const GameLobby = () => {
  const { gameState, setGameState } = useContext(GameContext);
  const { socket } = useContext(SocketContext);
  const navigate = useNavigate();
  
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  useEffect(() => {
    // 실제 구현에서는 소켓을 통해 방 목록을 가져옵니다
    // 여기서는 더미 데이터를 사용합니다
    const dummyRooms = [
      { id: '1', name: '초보자 환영', players: 3, maxPlayers: 12, status: 'waiting' },
      { id: '2', name: '고수만', players: 8, maxPlayers: 12, status: 'waiting' },
      { id: '3', name: '즐겜방', players: 5, maxPlayers: 12, status: 'playing' }
    ];
    setRooms(dummyRooms);
    
    // 플레이어 이름이 없으면 홈페이지로 리다이렉트
    if (!gameState.playerName) {
      navigate('/');
    }
  }, [gameState.playerName, navigate]);

  const handleCreateRoom = () => {
    setIsCreatingRoom(true);
  };

  const handleRoomNameChange = (e) => {
    setNewRoomName(e.target.value);
  };

  const handleSubmitRoom = (e) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      // 실제 구현에서는 소켓을 통해 방 생성 요청을 보냅니다
      const newRoomId = Date.now().toString();
      setGameState({
        ...gameState,
        gameId: newRoomId
      });
      navigate(`/game/${newRoomId}`);
    }
  };

  const handleJoinRoom = (roomId) => {
    // 실제 구현에서는 소켓을 통해 방 참가 요청을 보냅니다
    setGameState({
      ...gameState,
      gameId: roomId
    });
    navigate(`/game/${roomId}`);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>게임 로비</h1>
        <p>환영합니다, <strong>{gameState.playerName}</strong>님!</p>
      </div>
      
      <div className="lobby-actions">
        <button className="primary" onClick={handleCreateRoom}>
          새 게임 만들기
        </button>
        <button className="secondary" onClick={handleBackToHome}>
          홈으로 돌아가기
        </button>
      </div>
      
      {isCreatingRoom && (
        <div className="create-room-form card">
          <h2>새 게임 만들기</h2>
          <form onSubmit={handleSubmitRoom}>
            <div className="form-group">
              <label htmlFor="roomName">방 이름</label>
              <input
                type="text"
                id="roomName"
                value={newRoomName}
                onChange={handleRoomNameChange}
                placeholder="방 이름을 입력하세요"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="primary">
                방 만들기
              </button>
              <button 
                type="button" 
                className="secondary"
                onClick={() => setIsCreatingRoom(false)}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="room-list-container">
        <h2>참가 가능한 게임</h2>
        {rooms.length === 0 ? (
          <p className="no-rooms">현재 참가 가능한 게임이 없습니다.</p>
        ) : (
          <div className="room-list">
            {rooms.map(room => (
              <div key={room.id} className={`room-card ${room.status === 'playing' ? 'playing' : ''}`}>
                <h3>{room.name}</h3>
                <div className="room-info">
                  <span>플레이어: {room.players}/{room.maxPlayers}</span>
                  <span className={`room-status ${room.status}`}>
                    {room.status === 'waiting' ? '대기중' : '게임중'}
                  </span>
                </div>
                <button 
                  className="primary join-button"
                  onClick={() => handleJoinRoom(room.id)}
                  disabled={room.status === 'playing' || room.players >= room.maxPlayers}
                >
                  {room.status === 'playing' ? '게임중' : 
                   room.players >= room.maxPlayers ? '정원초과' : '참가하기'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameLobby;
