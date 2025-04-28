import React, { createContext, useState, useEffect } from 'react';
import GameSocketService from '../services/GameSocketService';
import useSocket from '../hooks/useSocket';

// 멀티플레이어 컨텍스트 생성
export const MultiplayerContext = createContext({
  gameSocketService: null,
  isConnected: false,
  gameRooms: [],
  currentRoom: null,
  players: [],
  messages: [],
  joinRoom: () => {},
  createRoom: () => {},
  leaveRoom: () => {},
  sendMessage: () => {},
  startGame: () => {},
  submitAction: () => {},
  toggleReady: () => {}
});

// 멀티플레이어 프로바이더 컴포넌트
export const MultiplayerProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const [gameSocketService, setGameSocketService] = useState(null);
  const [gameRooms, setGameRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);

  // 소켓 연결 시 게임 소켓 서비스 초기화
  useEffect(() => {
    if (socket) {
      const service = new GameSocketService(socket);
      setGameSocketService(service);

      // 게임 목록 업데이트 이벤트 리스너
      service.registerHandler('gamesList', (rooms) => {
        setGameRooms(rooms);
      });

      // 새 게임 추가 이벤트 리스너
      service.registerHandler('gameAdded', (room) => {
        setGameRooms(prev => [...prev, room]);
      });

      // 게임 업데이트 이벤트 리스너
      service.registerHandler('gameUpdated', (updatedRoom) => {
        setGameRooms(prev => prev.map(room => 
          room.id === updatedRoom.id ? { ...room, ...updatedRoom } : room
        ));
      });

      // 게임 삭제 이벤트 리스너
      service.registerHandler('gameRemoved', ({ id }) => {
        setGameRooms(prev => prev.filter(room => room.id !== id));
      });

      // 플레이어 참가 이벤트 리스너
      service.registerHandler('playerJoined', (player) => {
        setPlayers(prev => [...prev, player]);
      });

      // 플레이어 준비 상태 변경 이벤트 리스너
      service.registerHandler('playerReadyChanged', ({ id, isReady }) => {
        setPlayers(prev => prev.map(player => 
          player.id === id ? { ...player, isReady } : player
        ));
      });

      // 플레이어 퇴장 이벤트 리스너
      service.registerHandler('playerLeft', ({ id }) => {
        setPlayers(prev => prev.filter(player => player.id !== id));
      });

      // 새 호스트 지정 이벤트 리스너
      service.registerHandler('newHost', ({ id }) => {
        setPlayers(prev => prev.map(player => 
          ({ ...player, isHost: player.id === id })
        ));
      });

      // 새 메시지 이벤트 리스너
      service.registerHandler('newMessage', (message) => {
        setMessages(prev => [...prev, message]);
      });

      // 에러 이벤트 리스너
      service.registerHandler('error', ({ message }) => {
        console.error('게임 에러:', message);
        // 실제 구현에서는 에러 메시지를 사용자에게 표시
      });

      return () => {
        service.removeAllHandlers();
      };
    }
  }, [socket]);

  // 로비 입장
  const enterLobby = (playerName) => {
    if (gameSocketService) {
      gameSocketService.enterLobby(playerName, (rooms) => {
        setGameRooms(rooms);
      });
    }
  };

  // 게임 방 생성
  const createRoom = (roomName) => {
    if (gameSocketService) {
      gameSocketService.createGame(roomName, ({ gameId, game }) => {
        setCurrentRoom({ id: gameId, ...game });
        setPlayers(game.players);
      });
    }
  };

  // 게임 방 참가
  const joinRoom = (roomId, playerName) => {
    if (gameSocketService) {
      gameSocketService.joinGame(roomId, playerName, ({ gameId, game, player }) => {
        setCurrentRoom({ id: gameId, ...game });
        setPlayers(game.players);
      });
    }
  };

  // 게임 방 퇴장
  const leaveRoom = () => {
    if (gameSocketService) {
      gameSocketService.leaveGame();
      setCurrentRoom(null);
      setPlayers([]);
      setMessages([]);
    }
  };

  // 준비 상태 토글
  const toggleReady = () => {
    if (gameSocketService) {
      gameSocketService.toggleReady();
    }
  };

  // 게임 시작
  const startGame = () => {
    if (gameSocketService && currentRoom) {
      gameSocketService.startGame(currentRoom.id, ({ game, message }) => {
        setCurrentRoom({ ...currentRoom, ...game });
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'System',
          content: message,
          timestamp: new Date().toISOString(),
          isSystem: true
        }]);
      });
    }
  };

  // 행동 제출
  const submitAction = (action) => {
    if (gameSocketService) {
      gameSocketService.submitAction(action, ({ message }) => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          sender: 'System',
          content: message,
          timestamp: new Date().toISOString(),
          isSystem: true
        }]);
      });
    }
  };

  // 메시지 전송
  const sendMessage = (content) => {
    if (gameSocketService && currentRoom) {
      gameSocketService.sendMessage(currentRoom.id, content);
    }
  };

  // 컨텍스트 값
  const contextValue = {
    gameSocketService,
    isConnected,
    gameRooms,
    currentRoom,
    players,
    messages,
    enterLobby,
    joinRoom,
    createRoom,
    leaveRoom,
    sendMessage,
    startGame,
    submitAction,
    toggleReady
  };

  return (
    <MultiplayerContext.Provider value={contextValue}>
      {children}
    </MultiplayerContext.Provider>
  );
};

export default MultiplayerContext;
