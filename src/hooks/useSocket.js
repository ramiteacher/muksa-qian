import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// 소켓 서비스 생성
const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 소켓 연결
    const socketInstance = io(process.env.REACT_APP_SOCKET_URL || window.location.origin);

    // 연결 이벤트 리스너
    socketInstance.on('connect', () => {
      console.log('소켓 연결됨');
      setIsConnected(true);
    });

    // 연결 해제 이벤트 리스너
    socketInstance.on('disconnect', () => {
      console.log('소켓 연결 해제됨');
      setIsConnected(false);
    });

    // 에러 이벤트 리스너
    socketInstance.on('error', (error) => {
      console.error('소켓 에러:', error);
    });

    setSocket(socketInstance);

    // 컴포넌트 언마운트 시 소켓 연결 해제
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected };
};

export default useSocket;
