import { io } from 'socket.io-client';

const BACKEND_URL = 'https://food-chain-game.onrender.com';

// 게임 소켓 이벤트 관리 서비스
class GameSocketService {
  constructor(socket) {
    // 소켓이 전달되지 않은 경우 새로 생성
    if (!socket) {
      this.socket = io(BACKEND_URL, {
        withCredentials: true,
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      console.log('새 소켓 연결을 생성했습니다.');
    } else {
      this.socket = socket;
      console.log('기존 소켓 연결을 사용합니다.');
    }
    
    this.eventHandlers = new Map();
    
    // 기본 이벤트 리스너 설정
    this.socket.on('connect', () => {
      console.log('소켓 서버에 연결되었습니다. ID:', this.socket.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('소켓 연결 오류:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('소켓 연결이 끊어졌습니다:', reason);
    });
  }

  // 로비 입장
  enterLobby(playerName, callback) {
    console.log('로비 입장 요청:', playerName);
    this.socket.emit('enterLobby', playerName);
    this.registerHandler('gamesList', callback);
  }

  // 게임 생성
  createGame(gameName, callback) {
    console.log('게임 생성 요청:', gameName);
    this.socket.emit('createGame', gameName);
    this.registerHandler('gameCreated', callback);
  }

  // 게임 참가
  joinGame(gameId, playerName, callback) {
    console.log('게임 참가 요청:', gameId, playerName);
    this.socket.emit('joinGame', { gameId, playerName });
    this.registerHandler('gameJoined', callback);
  }

  // 준비 상태 변경
  toggleReady() {
    console.log('준비 상태 변경 요청');
    this.socket.emit('toggleReady');
  }

  // 게임 시작
  startGame(gameId, callback) {
    console.log('게임 시작 요청:', gameId);
    this.socket.emit('startGame', gameId);
    this.registerHandler('gameStarted', callback);
  }

  // 행동 제출
  submitAction(action, callback) {
    console.log('행동 제출 요청:', action);
    this.socket.emit('submitAction', action);
    this.registerHandler('actionConfirmed', callback);
  }

  // 메시지 전송
  sendMessage(gameId, content) {
    console.log('메시지 전송 요청:', gameId, content);
    this.socket.emit('sendMessage', { gameId, content });
  }

  // 게임 나가기
  leaveGame() {
    console.log('게임 나가기 요청');
    this.socket.emit('leaveGame');
  }

  // 이벤트 핸들러 등록
  registerHandler(event, callback) {
    console.log('이벤트 핸들러 등록:', event);
    // 기존 핸들러가 있으면 제거
    if (this.eventHandlers.has(event)) {
      this.socket.off(event, this.eventHandlers.get(event));
    }

    // 새 핸들러 등록
    this.eventHandlers.set(event, callback);
    this.socket.on(event, callback);
  }

  // 이벤트 핸들러 제거
  removeHandler(event) {
    console.log('이벤트 핸들러 제거:', event);
    if (this.eventHandlers.has(event)) {
      this.socket.off(event, this.eventHandlers.get(event));
      this.eventHandlers.delete(event);
    }
  }

  // 모든 이벤트 핸들러 제거
  removeAllHandlers() {
    console.log('모든 이벤트 핸들러 제거');
    this.eventHandlers.forEach((handler, event) => {
      this.socket.off(event, handler);
    });
    this.eventHandlers.clear();
  }
  
  // 소켓 연결 상태 확인
  isConnected() {
    return this.socket && this.socket.connected;
  }
  
  // 소켓 ID 반환
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }
  
  // 소켓 연결 해제
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
  
  // 소켓 재연결
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }
}

export default GameSocketService;
