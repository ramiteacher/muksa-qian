import React, { createContext } from 'react';

const GameContext = createContext({
  gameState: {
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
  },
  setGameState: () => {}
});

export default GameContext;
