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

  // 소켓 서비스 초기화
  useEffect(() => {
    if (socket) {
      const service = new GameSocketService(socket);
      setSocketService(service);
      
      // 새 메시지 이벤트 리스너
      service.registerHandler('newMessage', (message) => {
        if (typeof onSendMessage === 'function') {
          // 외부에서 메시지 처리하도록 콜백 호출
          onSendMessage(message.content, message);
        }
      });
      
      return () => {
        service.removeHandler('newMessage');
      };
    }
  }, [socket, onSendMessage]);

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      if (socketService && gameId) {
        // 소켓을 통해 서버로 메시지 전송
        socketService.sendMessage(gameId, message);
      }
      
      // 로컬 UI 업데이트를 위해 기존 콜백도 호출
      onSendMessage(message);
      setMessage('');
    }
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

  return (
    <div className="game-chat">
      <div className="chat-header">
        <h3>채팅</h3>
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
              key={msg.id} 
              className={`chat-message ${msg.isSystem ? 'system-message' : ''}`}
            >
              <div className="message-header">
                <span className="message-sender">{msg.sender}</span>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          placeholder="메시지를 입력하세요..."
          className="chat-input"
        />
        <button type="submit" className="chat-send-button">
          전송
        </button>
      </form>
    </div>
  );
};

export default GameChat;
