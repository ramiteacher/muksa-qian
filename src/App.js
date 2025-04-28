import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom'; // ✅ BrowserRouter 삭제
import { io } from 'socket.io-client';
import HomePage from './components/HomePage';
import GameLobby from './components/GameLobby';
import GameRoom from './components/GameRoom';
import GameContext from './contexts/GameContext';
import SocketContext from './contexts/SocketContext';
import './styles/App.css';

// 백엔드 서버 URL
const BACKEND_URL = 'https://muksa.onrender.com';

const App = () => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState({
    isConnected: false,
    playerId: null,
    playerName: '',
    gameId: null,
    players: [],
    currentRound: 0,
    animal: null,
    location: null,
    gameStatus: 'waiting',
    messages: []
  });

  useEffect(() => {
    const socketConnection = io(BACKEND_URL, {
      withCredentials: true,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketConnection.on('connect', () => {
      console.log('소켓 서버에 연결되었습니다.');
      setGameState(prev => ({
        ...prev,
        isConnected: true,
        playerId: socketConnection.id
      }));
    });

    socketConnection.on('connect_error', (error) => {
      console.error('소켓 연결 오류:', error);
    });

    socketConnection.on('disconnect', (reason) => {
      console.log('소켓 연결이 끊어졌습니다:', reason);
      setGameState(prev => ({
        ...prev,
        isConnected: false
      }));
    });

    setSocket(socketConnection);

    return () => {
      if (socketConnection) {
        console.log('소켓 연결을 해제합니다.');
        socketConnection.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, setSocket }}>
      <GameContext.Provider value={{ gameState, setGameState }}>
        {/* Router 없앰 */}
        <div className="app-container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/lobby" element={<GameLobby />} />
            <Route path="/game/:gameId" element={<GameRoom />} />
          </Routes>
        </div>
      </GameContext.Provider>
    </SocketContext.Provider>
  );
};

export default App;
