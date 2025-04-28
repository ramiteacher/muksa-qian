import React, { memo } from 'react';
import '../styles/GameControls.css';

// 게임 단계 상수
const GAME_PHASES = {
  ANIMAL_SELECTION: 'animal_selection',
  PEEKING: 'peeking',
  PRE_MOVE_GATHERING: 'pre_move_gathering',
  MOVEMENT: 'movement',
  DISCUSSION: 'discussion'
};

const GameControls = memo(({
  currentRound,
  currentPhase,
  selectedLocation,
  selectedAction,
  targetPlayer,
  onActionSelect,
  onLocationSelect,
  onTargetSelect,
  onSubmitTurn,
  gameStatus,
  onLeaveGame,
  peekCount = 0,
  maxPeekCount = 1,
  players = [],
  locations = ['강', '하늘', '들', '숲'],
  playerInfo = {}
}) => {
  // 액션 버튼 활성화 여부 확인
  const canSubmitTurn = () => {
    if (gameStatus === 'finished') return false;
    
    // 동물 선택 단계나 엿보기 단계, 이동 전 모임 단계에서는 항상 제출 가능
    if (currentPhase === GAME_PHASES.ANIMAL_SELECTION || 
        currentPhase === GAME_PHASES.PRE_MOVE_GATHERING) {
      return true;
    }
    
    // 엿보기 단계에서는 엿보기 액션이 선택되고 타겟이 선택되었거나, 엿보기 완료 버튼을 누를 수 있음
    if (currentPhase === GAME_PHASES.PEEKING) {
      if (selectedAction === 'peek' && targetPlayer) {
        return true;
      }
      return !selectedAction; // 엿보기 액션이 선택되지 않은 경우 완료 버튼 활성화
    }
    
    // 이동 액션인 경우 위치가 선택되어야 함
    if (selectedAction === 'move' && !selectedLocation) return false;
    
    // 공격 액션인 경우 타겟이 선택되어야 함
    if (selectedAction === 'attack' && !targetPlayer) return false;
    
    // 액션이 선택되어야 함
    return !!selectedAction;
  };

  // 현재 단계에 따른 버튼 텍스트 결정
  const getSubmitButtonText = () => {
    switch(currentPhase) {
      case GAME_PHASES.ANIMAL_SELECTION:
        return '동물 확인 완료';
      case GAME_PHASES.PEEKING:
        return selectedAction === 'peek' && targetPlayer ? '엿보기 실행' : '엿보기 완료';
      case GAME_PHASES.PRE_MOVE_GATHERING:
        return '모임 종료';
      case GAME_PHASES.MOVEMENT:
        return '이동 실행';
      case GAME_PHASES.DISCUSSION:
        return selectedAction === 'attack' ? '공격 실행' : '턴 종료';
      default:
        return '턴 제출하기';
    }
  };
  
  // 현재 단계에 따른 도움말 메시지
  const getPhaseHelpMessage = () => {
    switch(currentPhase) {
      case GAME_PHASES.ANIMAL_SELECTION:
        return '자신의 동물을 확인하고 준비되면 버튼을 클릭하세요.';
      case GAME_PHASES.PEEKING:
        return '다른 플레이어의 동물을 엿볼 수 있습니다. 이 단계가 지나면 엿보기를 할 수 없습니다.';
      case GAME_PHASES.PRE_MOVE_GATHERING:
        return '첫 이동 전에 모든 플레이어와 채팅할 수 있습니다.';
      case GAME_PHASES.MOVEMENT:
        return '원하는 지역으로 이동하세요. 서식지를 한 번 떠난 후에는 반드시 서식지로만 이동해야 합니다.';
      case GAME_PHASES.DISCUSSION:
        return '같은 지역에 있는 플레이어와 대화하고 공격할 수 있습니다.';
      default:
        return '';
    }
  };
  
  // 현재 선택된 액션에 따른 추가 옵션 렌더링
  const renderActionOptions = () => {
    if (!selectedAction) return null;
    
    switch(selectedAction) {
      case 'move':
        return (
          <div className="selection-options">
            <h4>이동할 지역 선택</h4>
            <div className="options-list">
              {locations.map((location, index) => {
                // 서식지를 떠난 후에는 서식지로만 이동 가능한 규칙 적용
                const isDisabled = playerInfo.leftHabitat && location !== playerInfo.habitat;
                
                return (
                  <div 
                    key={index}
                    className={`option-item ${selectedLocation === location ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                    onClick={() => !isDisabled && onLocationSelect(location)}
                  >
                    {location}
                    {isDisabled && <small>(서식지로만 이동 가능)</small>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      
      case 'peek':
        return (
          <div className="selection-options">
            <h4>엿볼 플레이어 선택</h4>
            <div className="options-list">
              {players
                .filter(player => player.id !== '1') // 자신 제외
                .map((player, index) => (
                  <div 
                    key={index}
                    className={`option-item ${targetPlayer === player.name ? 'selected' : ''}`}
                    onClick={() => onTargetSelect(player)}
                  >
                    {player.name}
                  </div>
                ))}
            </div>
          </div>
        );
      
      case 'attack':
        return (
          <div className="selection-options">
            <h4>공격할 플레이어 선택</h4>
            <div className="options-list">
              {players
                .filter(player => player.id !== '1' && player.location === playerInfo.location) // 자신 제외, 같은 위치에 있는 플레이어만
                .map((player, index) => (
                  <div 
                    key={index}
                    className={`option-item ${targetPlayer === player.name ? 'selected' : ''}`}
                    onClick={() => onTargetSelect(player)}
                  >
                    {player.name}
                  </div>
                ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="action-selection-container">
      <h3 className="action-selection-header">행동을 선택해주세요.</h3>
      
      {/* 현재 단계 도움말 */}
      <div className="phase-help">
        <p>{getPhaseHelpMessage()}</p>
      </div>
      
      <div className="round-info">
        <p>라운드: {currentRound}/4</p>
        {currentPhase && (
          <p className="current-phase">
            현재 단계: {
              currentPhase === GAME_PHASES.ANIMAL_SELECTION ? '동물 선택' :
              currentPhase === GAME_PHASES.PEEKING ? '엿보기' :
              currentPhase === GAME_PHASES.PRE_MOVE_GATHERING ? '이동 전 모임' :
              currentPhase === GAME_PHASES.MOVEMENT ? '이동' :
              currentPhase === GAME_PHASES.DISCUSSION ? '토론' : '알 수 없음'
            }
          </p>
        )}
      </div>
      
      {/* 행동 선택 옵션 */}
      <div className="action-options">
        <div 
          className={`action-option ${selectedAction === 'move' ? 'selected' : ''}`}
          onClick={() => currentPhase === GAME_PHASES.MOVEMENT && onActionSelect('move')}
        >
          <h4>이동</h4>
          <p>다른 지역으로 이동합니다.</p>
          {currentPhase !== GAME_PHASES.MOVEMENT && (
            <small>이동은 이동 단계에서만 가능합니다</small>
          )}
        </div>
        
        <div 
          className={`action-option ${selectedAction === 'attack' ? 'selected' : ''}`}
          onClick={() => currentPhase === GAME_PHASES.DISCUSSION && onActionSelect('attack')}
        >
          <h4>공격</h4>
          <p>다른 동물을 공격합니다.</p>
          {currentPhase !== GAME_PHASES.DISCUSSION && (
            <small>공격은 토론 단계에서만 가능합니다</small>
          )}
        </div>
        
        <div 
          className={`action-option ${selectedAction === 'peek' ? 'selected' : ''}`}
          onClick={() => currentPhase === GAME_PHASES.PEEKING && peekCount < maxPeekCount && onActionSelect('peek')}
        >
          <h4>엿보기</h4>
          <p>다른 플레이어의 동물을 확인합니다.</p>
          <span className="action-count">({maxPeekCount - peekCount}/{maxPeekCount})</span>
          {currentPhase !== GAME_PHASES.PEEKING ? (
            <small>엿보기는 엿보기 단계에서만 가능합니다</small>
          ) : peekCount >= maxPeekCount ? (
            <small>엿보기를 모두 사용했습니다</small>
          ) : null}
        </div>
      </div>
      
      {/* 선택된 액션에 따른 추가 옵션 */}
      {renderActionOptions()}
      
      {/* 제출 버튼 */}
      <button 
        className="submit-button"
        onClick={onSubmitTurn}
        disabled={!canSubmitTurn()}
      >
        {getSubmitButtonText()}
      </button>
    </div>
  );
});

export default GameControls;
