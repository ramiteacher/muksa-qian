import { io } from 'socket.io-client';

// 백엔드 서버 URL
const BACKEND_URL = 'https://muksa.onrender.com'; // 수정: URL 일관성 확보

class GameSocketService {
  constructor(socket) {
    if (!socket) {
      this.socket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],  // 폴링 백업 추가
        withCredentials: true,      // 크로스 도메인 지원
        autoConnect: true,          // 자동 연결
        reconnectionAttempts: 5,    // 재연결 시도 횟수
        reconnectionDelay: 1000,    // 재연결 지연 시간(ms)
        timeout: 20000              // 연결 타임아웃 늘림
      });
      console.log('새 소켓 연결 생성');
    } else {
      this.socket = socket;
      console.log('기존 소켓 연결 사용');
    }

    this.eventHandlers = new Map();

    // 기본 연결 이벤트 등록
    this.socket.on('connect', () => {
      console.log('[소켓 연결 성공] ID:', this.socket.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[소켓 연결 오류]', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[소켓 연결 끊김]', reason);
    });
  }

  // ✅ 서버로 "로비 입장" 요청 보내기
  enterLobby(playerName, callback) {
    console.log('[로비 입장 요청]', playerName);
    this.socket.emit('enterLobby', { playerName });
    this.registerHandler('gamesList', callback);
  }

  // ✅ 서버로 "게임 생성" 요청 보내기
  createGame(gameName, callback) {
    console.log('[게임 생성 요청]', gameName);
    this.socket.emit('createGame', { gameName });
    this.registerHandler('gameCreated', callback);
  }

  // ✅ 서버로 "게임 참가" 요청 보내기
  joinGame(gameId, playerName, callback) {
    console.log('[게임 참가 요청]', gameId, playerName);
    this.socket.emit('joinGame', { gameId, playerName });
    this.registerHandler('gameJoined', callback);
  }

  // ✅ 준비 상태 변경
  toggleReady(callback) {
    console.log('[준비 상태 토글]');
    this.socket.emit('toggleReady');
    if (callback) this.registerHandler('readyToggled', callback);
  }

  // ✅ 게임 시작 요청
  startGame(gameId, callback) {
    console.log('[게임 시작 요청]', gameId);
    this.socket.emit('startGame', { gameId });
    this.registerHandler('gameStarted', callback);
  }

  // ✅ 플레이어 행동 제출
  submitAction(action, callback) {
    console.log('[행동 제출]', action);
    this.socket.emit('submitAction', action);
    this.registerHandler('actionConfirmed', callback);
  }

  // ✅ 채팅 메시지 전송
  sendMessage(gameId, content) {
    console.log('[메시지 전송]', gameId, content);
    if (!this.socket.connected) {
      console.error('[메시지 전송 실패] 소켓 연결이 없습니다');
      return false;
    }
    this.socket.emit('sendMessage', { gameId, content });
    return true;
  }

  // ✅ 게임 나가기
  leaveGame(callback) {
    console.log('[게임 나가기 요청]');
    this.socket.emit('leaveGame');
    if (callback) this.registerHandler('leftGame', callback);
  }

  // ✅ 이벤트 핸들러 등록
  registerHandler(event, callback) {
    console.log('[이벤트 등록]', event);
    if (this.eventHandlers.has(event)) {
      this.socket.off(event, this.eventHandlers.get(event));
    }
    this.eventHandlers.set(event, callback);
    this.socket.on(event, callback);
  }

  // ✅ 이벤트 핸들러 해제
  removeHandler(event) {
    console.log('[이벤트 핸들러 제거]', event);
    if (this.eventHandlers.has(event)) {
      this.socket.off(event, this.eventHandlers.get(event));
      this.eventHandlers.delete(event);
    }
  }

  // ✅ 모든 핸들러 해제
  removeAllHandlers() {
    console.log('[모든 이벤트 핸들러 제거]');
    this.eventHandlers.forEach((handler, event) => {
      this.socket.off(event, handler);
    });
    this.eventHandlers.clear();
  }

  // ✅ 소켓 연결 상태 확인
  isConnected() {
    return this.socket && this.socket.connected;
  }

  // ✅ 소켓 ID 가져오기
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  // ✅ 소켓 연결 끊기
  disconnect() {
    if (this.socket) {
      console.log('[소켓 연결 해제]');
      this.socket.disconnect();
    }
  }

  // ✅ 소켓 다시 연결
  reconnect() {
    if (this.socket) {
      console.log('[소켓 재연결 시도]');
      this.socket.connect();
    }
  }
}

export default GameSocketService;
