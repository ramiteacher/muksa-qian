import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import GameLobby from './components/GameLobby';
import GameRoom from './components/GameRoom';
import GameContext from './contexts/GameContext';
import SocketContext, { SocketProvider } from './contexts/SocketContext';
import './styles/App.css';

const App = () => {
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

  return (
    <SocketProvider>
      <GameContext.Provider value={{ gameState, setGameState }}>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/lobby" element={<GameLobby />} />
            <Route path="/game/:gameId" element={<GameRoom />} />
          </Routes>
        </div>
      </GameContext.Provider>
    </SocketProvider>
  );
};

export default App;
