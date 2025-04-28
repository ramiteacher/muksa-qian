import React, { memo, useMemo } from 'react';
import '../styles/GameBoard.css';

const GameBoard = memo(({ 
  currentRound, 
  currentPhase,
  selectedLocation, 
  onLocationSelect, 
  players, 
  selectedAction, 
  targetPlayer, 
  onTargetSelect 
}) => {
  // 서식지 목록과 아이콘 - useMemo로 최적화
  const habitats = useMemo(() => [
    { id: '강', name: '강', icon: '🌊', className: 'habitat-river' },
    { id: '하늘', name: '하늘', icon: '☁️', className: 'habitat-sky' },
    { id: '들', name: '들', icon: '🌾', className: 'habitat-field' },
    { id: '숲', name: '숲', icon: '🌳', className: 'habitat-forest' }
  ], []);
  
  // 액션에 따른 UI 렌더링
  const actionUI = useMemo(() => {
    if (!selectedAction) {
      return (
        <div className="board-message fade-in">
          <div className="message-icon">❓</div>
          <p>행동을 선택해주세요.</p>
        </div>
      );
    }
    
    if (selectedAction === 'move') {
      return (
        <div className="habitat-selection fade-in">
          <div className="section-header">
            <div className="section-icon">🚶</div>
            <h3>이동할 서식지를 선택하세요</h3>
          </div>
          <div className="habitat-grid">
            {habitats.map(habitat => (
              <div 
                key={habitat.id}
                className={`habitat-card ${habitat.className} ${selectedLocation === habitat.id ? 'selected' : ''}`}
                onClick={() => onLocationSelect(habitat.id)}
              >
                <div className="habitat-icon">{habitat.icon}</div>
                <h4>{habitat.name}</h4>
                <div className="habitat-info">
                  <span className="player-count">
                    현재 플레이어: {players.filter(p => p.location === habitat.id).length}명
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    if (selectedAction === 'attack') {
      const targetablePlayers = players.filter(p => p.id !== '1' && p.location === selectedLocation);
      
      return (
        <div className="player-selection fade-in">
          <div className="section-header">
            <div className="section-icon">⚔️</div>
            <h3>공격할 플레이어를 선택하세요</h3>
          </div>
          
          {targetablePlayers.length > 0 ? (
            <div className="player-grid">
              {targetablePlayers.map(player => (
                <div 
                  key={player.id}
                  className={`player-card ${targetPlayer && targetPlayer.id === player.id ? 'selected' : ''}`}
                  onClick={() => onTargetSelect(player)}
                >
                  <div className="player-avatar">{player.name.charAt(0).toUpperCase()}</div>
                  <div className="player-info">
                    <h4>{player.name}</h4>
                    <p className="player-animal">동물: {player.animal || '???'}</p>
                  </div>
                  <div className="action-indicator">
                    {targetPlayer && targetPlayer.id === player.id && <span className="attack-icon">⚔️</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p className="no-players-message">이 서식지에는 다른 플레이어가 없습니다.</p>
            </div>
          )}
        </div>
      );
    }
    
    if (selectedAction === 'peek') {
      const peekablePlayers = players.filter(p => p.id !== '1');
      
      return (
        <div className="player-selection fade-in">
          <div className="section-header">
            <div className="section-icon">👁️</div>
            <h3>엿볼 플레이어를 선택하세요</h3>
          </div>
          
          {peekablePlayers.length > 0 ? (
            <div className="player-grid">
              {peekablePlayers.map(player => (
                <div 
                  key={player.id}
                  className={`player-card ${targetPlayer && targetPlayer.id === player.id ? 'selected' : ''}`}
                  onClick={() => onTargetSelect(player)}
                >
                  <div className="player-avatar">{player.name.charAt(0).toUpperCase()}</div>
                  <div className="player-info">
                    <h4>{player.name}</h4>
                    {targetPlayer && targetPlayer.id === player.id && targetPlayer.peekedAnimal ? (
                      <p className="player-animal revealed">동물: {targetPlayer.peekedAnimal}</p>
                    ) : (
                      <p className="player-animal hidden">동물: ???</p>
                    )}
                  </div>
                  <div className="action-indicator">
                    {targetPlayer && targetPlayer.id === player.id && <span className="peek-icon">👁️</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <p className="no-players-message">엿볼 수 있는 플레이어가 없습니다.</p>
            </div>
          )}
        </div>
      );
    }
    
    return null;
  }, [selectedAction, habitats, selectedLocation, players, targetPlayer, onLocationSelect, onTargetSelect]);
  
  return (
    <div className="game-board-container">
      <div className="game-board-header">
        <h2>게임 보드</h2>
        <div className="round-indicator">
          <div className="round-icon">🔄</div>
          <span>라운드: {currentRound}/4</span>
        </div>
      </div>
      
      <div className="game-board-content">
        {actionUI}
      </div>
      
      <div className="game-board-footer">
        <div className="location-info">
          {selectedLocation && (
            <div className={`current-location ${habitats.find(h => h.id === selectedLocation)?.className}`}>
              <span className="location-label">현재 위치:</span>
              <span className="location-value">
                {habitats.find(h => h.id === selectedLocation)?.icon} {selectedLocation}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default GameBoard;
