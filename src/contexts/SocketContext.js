import React, { createContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

// 백엔드 URL 일관성 유지
const BACKEND_URL = 'https://muksa-qian.onrender.com';

// 소켓 컨텍스트 생성
const SocketContext = createContext({
  socket: null,
  isConnected: false,
  socketId: null,
  connect: () => {},
  disconnect: () => {},
  reconnect: () => {},
  setSocket: () => {}
});

// 소켓 프로바이더 컴포넌트
export const SocketProvider = ({ children }) => {
  const [socket, setSocketState] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);
  
  // 소켓 초기 연결 설정
  useEffect(() => {
    // 소켓 객체 생성 및 연결
    const socketInstance = io(BACKEND_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    // 연결 이벤트 핸들러
    const handleConnect = () => {
      console.log('[Socket] 연결됨:', socketInstance.id);
      setIsConnected(true);
      setSocketId(socketInstance.id);
    };

    // 연결 오류 이벤트 핸들러
    const handleConnectError = (error) => {
      console.error('[Socket] 연결 오류:', error);
      setIsConnected(false);
    };

    // 연결 해제 이벤트 핸들러
    const handleDisconnect = (reason) => {
      console.log('[Socket] 연결 해제됨:', reason);
      setIsConnected(false);
      
      // 자동 재연결 시도 (원치 않는 연결 해제인 경우)
      if (reason === 'io server disconnect' || reason === 'transport close') {
        console.log('[Socket] 자동 재연결 시도...');
        setTimeout(() => {
          socketInstance.connect();
        }, 2000);
      }
    };

    // 재연결 이벤트 핸들러
    const handleReconnect = (attemptNumber) => {
      console.log(`[Socket] 재연결 성공 (${attemptNumber}회 시도)`);
      setIsConnected(true);
    };

    // 소켓 이벤트 리스너 등록
    socketInstance.on('connect', handleConnect);
    socketInstance.on('connect_error', handleConnectError);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('reconnect', handleReconnect);

    // 소켓 객체 설정
    setSocketState(socketInstance);

    // 컴포넌트 언마운트 시 소켓 정리
    return () => {
      console.log('[Socket] 소켓 정리');
      socketInstance.off('connect', handleConnect);
      socketInstance.off('connect_error', handleConnectError);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('reconnect', handleReconnect);
      socketInstance.disconnect();
    };
  }, []);

  // 소켓 수동 연결 함수
  const connect = useCallback(() => {
    if (socket && !socket.connected) {
      console.log('[Socket] 수동 연결 시도');
      socket.connect();
    }
  }, [socket]);

  // 소켓 연결 해제 함수
  const disconnect = useCallback(() => {
    if (socket && socket.connected) {
      console.log('[Socket] 수동 연결 해제');
      socket.disconnect();
    }
  }, [socket]);

  // 소켓 재연결 함수
  const reconnect = useCallback(() => {
    if (socket) {
      console.log('[Socket] 수동 재연결 시도');
      socket.disconnect();
      setTimeout(() => {
        socket.connect();
      }, 500);
    }
  }, [socket]);

  // 소켓 설정 함수 (외부에서 호출)
  const setSocket = useCallback((newSocket) => {
    if (socket && socket !== newSocket) {
      socket.disconnect();
    }
    setSocketState(newSocket);
  }, [socket]);

  // 컨텍스트 값
  const contextValue = {
    socket,
    isConnected,
    socketId,
    connect,
    disconnect,
    reconnect,
    setSocket
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
