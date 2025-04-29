import React, { useState, useRef, useEffect, useMemo, useContext } from 'react';
import '../styles/GameChat.css';
import SocketContext from '../contexts/SocketContext';
import { useParams } from 'react-router-dom';
import GameSocketService from '../services/GameSocketService';

const GameChat = ({ messages, onSendMessage }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const { socket } = useContext(SocketContext);
  const [socketService, setSocketService] = useState(null);
  const { gameId } = useParams();
  
  // 메시지 수 제한 (최대 50개)
  const MAX_MESSAGES = 50;
  
  // 표시할 메시지 제한
  const limitedMessages = useMemo(() => {
    // 메시지가 MAX_MESSAGES를 초과하면 최신 메시지만 표시
    return messages.length > MAX_MESSAGES 
      ? messages.slice(messages.length - MAX_MESSAGES) 
      : messages;
  }, [messages]);
  
  // 메시지 수 정보
  const messageCountInfo = useMemo(() => {
    if (messages.length <= MAX_MESSAGES) return null;
    return `${messages.length - MAX_MESSAGES}개의 이전 메시지가 숨겨져 있습니다.`;
  }, [messages]);

  // 소켓 서비스 초기화 - 의존성 배열에서 socket만 사용하여 불필요한 재생성 방지
  useEffect(() => {
    if (socket) {
      console.log('[GameChat] 소켓 서비스 초기화');
      const service = new GameSocketService(socket);
      setSocketService(service);
      
      // 새 메시지 이벤트 리스너
      const handleNewMessage = (message) => {
        console.log('[GameChat] 새 메시지 수신:', message);
        if (typeof onSendMessage === 'function') {
          // 외부에서 메시지 처리하도록 콜백 호출
          onSendMessage(message.content, message);
        }
      };
      
      // 이벤트 리스너 등록
      service.registerHandler('newMessage', handleNewMessage);
      service.registerHandler('game_message', handleNewMessage);
      
      return () => {
        console.log('[GameChat] 이벤트 리스너 정리');
        service.removeHandler('newMessage');
        service.removeHandler('game_message');
      };
    }
  }, [socket]);

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    console.log('[GameChat] 메시지 전송 시도:', message, gameId);
    
    // 소켓이 연결되어 있고 서비스가 초기화되었는지 확인
    if (socketService && gameId) {
      try {
        // 소켓을 통해 서버로 메시지 전송
        const sent = socketService.sendMessage(gameId, message);
        console.log('[GameChat] 메시지 전송 결과:', sent);
        
        if (!sent) {
          // 소켓이 연결되어 있지 않은 경우 사용자에게 알림
          console.error('[GameChat] 메시지 전송 실패: 서버 연결 없음');
          
          // 로컬 시스템 메시지 추가
          if (typeof onSendMessage === 'function') {
            onSendMessage('서버 연결이 끊어져 메시지를 보낼 수 없습니다. 페이지를 새로고침해 보세요.', {
              id: Date.now().toString(),
              sender: 'System',
              content: '서버 연결이 끊어져 메시지를 보낼 수 없습니다. 페이지를 새로고침해 보세요.',
              timestamp: new Date().toISOString(),
              isSystem: true
            });
          }
        }
      } catch (error) {
        console.error('[GameChat] 메시지 전송 중 오류:', error);
      }
    } else {
      console.log('[GameChat] 로컬로 메시지 처리');
    }
    
    // 로컬 UI 업데이트를 위해 기존 콜백도 호출 (소켓 전송과 별개로)
    if (typeof onSendMessage === 'function') {
      onSendMessage(message);
    }
    
    // 입력 필드 초기화
    setMessage('');
  };

  // 새 메시지가 추가될 때마다 스크롤을 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [limitedMessages]);
  
  // 수동 스크롤 함수
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // 스크롤 이벤트 처리
  useEffect(() => {
    const handleScroll = () => {
      // 스크롤 위치에 따른 추가 로직을 구현할 수 있음
    };
    
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
      return () => chatContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // 연결 상태 확인
  const isConnected = socketService?.isConnected() ?? false;

  return (
    <div className="game-chat">
      <div className="chat-header">
        <h3>채팅 {isConnected ? '(연결됨)' : '(연결 끊김)'}</h3>
        <button 
          className="scroll-bottom-button" 
          onClick={scrollToBottom}
          title="스크롤 아래로"
        >
          ↓
        </button>
      </div>
      
      <div className="chat-messages" ref={chatContainerRef}>
        {messageCountInfo && (
          <div className="message-count-info">
            {messageCountInfo}
          </div>
        )}
        
        {limitedMessages.length === 0 ? (
          <div className="no-messages">아직 메시지가 없습니다.</div>
        ) : (
          limitedMessages.map(msg => (
            <div 
              key={msg.id || `msg-${Date.now()}-${Math.random()}`} 
              className={`chat-message ${msg.isSystem ? 'system-message' : ''}`}
            >
              <div className="message-header">
                <span className="message-sender">{msg.sender || '알 수 없음'}</span>
                <span className="message-time">
                  {msg.timestamp 
                    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                </span>
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={message}
          onChange={handleMessageChange}
          placeholder={isConnected ? "메시지를 입력하세요..." : "연결 중..."}
          className="chat-input"
          disabled={!isConnected}
        />
        <button type="submit" className="chat-send-button" disabled={!isConnected}>
          전송
        </button>
      </form>
    </div>
  );
};

export default GameChat;
