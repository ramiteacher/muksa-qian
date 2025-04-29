import React, { useState, useContext, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GameContext from '../contexts/GameContext';
import SocketContext from '../contexts/SocketContext';
import { database } from '../firebase';
import { ref, onValue } from 'firebase/database';
import GameBoard from './GameBoard';
import PlayerInfo from './PlayerInfo';
import GameChat from './GameChat';
import GameControls from './GameControls';
import '../styles/GameRoom.css';
import GameSocketService from '../services/GameSocketService'; // GameSocketService import 추가

// 게임 단계 상수
const GAME_PHASES = {
  ANIMAL_SELECTION: 'animal_selection',
  PEEKING: 'peeking',
  PRE_MOVE_GATHERING: 'pre_move_gathering',
  MOVEMENT: 'movement',
  DISCUSSION: 'discussion'
};

// 각 단계별 제한 시간 (초)
const PHASE_TIMES = {
  [GAME_PHASES.ANIMAL_SELECTION]: 30,
  [GAME_PHASES.PEEKING]: 30,
  [GAME_PHASES.PRE_MOVE_GATHERING]: 60,
  [GAME_PHASES.MOVEMENT]: 30,
  [GAME_PHASES.DISCUSSION]: 120
};

// 로딩 컴포넌트를 별도로 분리하고 memo로 최적화
const LoadingScreen = memo(() => (
  <div className="game-room-loading">
    <div className="loading-spinner"></div>
    <p>게임 정보를 불러오는 중...</p>
  </div>
));

// 게임 대기 화면 컴포넌트를 분리하여 최적화
const WaitingScreen = memo(({ 
  players, 
  isHost, 
  onStartGame, 
  onLeaveGame, 
  messages, 
  onSendMessage 
}) => (
  <div className="game-waiting">
    <div className="player-list card">
      <h2>참가자 목록</h2>
      <ul>
        {players.map(player => (
          <li key={player.id} className={player.isHost ? 'host' : ''}>
            {player.name} {player.isHost && '(방장)'} 
            {player.isReady && <span className="ready-badge">준비완료</span>}
          </li>
        ))}
      </ul>
    </div>
    
    <div className="game-actions card">
      {isHost ? (
        <button 
          className="primary start-button"
          onClick={onStartGame}
          disabled={players.length < 3}
        >
          게임 시작
        </button>
      ) : (
        <button className="primary ready-button">
          준비하기
        </button>
      )}
      <button className="secondary" onClick={onLeaveGame}>
        나가기
      </button>
    </div>
    
    <div className="game-chat-container card">
      <h2>채팅</h2>
      <GameChat 
        messages={messages}
        onSendMessage={onSendMessage}
      />
    </div>
  </div>
));

// 게임 플레이 화면 컴포넌트를 분리하여 최적화
const PlayingScreen = memo(({ 
  currentRound,
  currentPhase,
  phaseTimeLeft,
  selectedLocation,
  onLocationSelect,
  players,
  selectedAction,
  targetPlayer,
  onTargetSelect,
  playerInfo,
  onActionSelect,
  onSubmitTurn,
  gameStatus,
  onLeaveGame,
  messages,
  onSendMessage,
  peekCount,
  maxPeekCount
}) => (
  <div className="game-playing">
    {/* 게임 보드를 상단에 배치 */}
    <div className="game-board-container">
      <GameBoard 
        currentRound={currentRound}
        currentPhase={currentPhase}
        selectedLocation={selectedLocation}
        onLocationSelect={onLocationSelect}
        players={players}
        selectedAction={selectedAction}
        targetPlayer={targetPlayer}
        onTargetSelect={onTargetSelect}
      />
    </div>
    
    {/* 타이머와 플레이어 정보 */}
    <div className="game-info-container">
      <div className={`phase-timer ${currentPhase ? currentPhase.replace('_', '-') : ''}`}>
        <h3>{getPhaseDisplayName(currentPhase)}</h3>
        <div className="timer-bar">
          <div 
            className={`timer-progress ${phaseTimeLeft < 10 ? 'warning' : ''}`}
            style={{ width: `${(phaseTimeLeft / PHASE_TIMES[currentPhase]) * 100}%` }}
          ></div>
        </div>
        <p className="time-left">{formatTime(phaseTimeLeft)}</p>
        <p className="phase-description">
          {currentPhase === GAME_PHASES.ANIMAL_SELECTION && '30초 동안 자신의 동물을 확인하세요.'}
          {currentPhase === GAME_PHASES.PEEKING && '다른 플레이어의 동물을 엿볼 수 있습니다.'}
          {currentPhase === GAME_PHASES.PRE_MOVE_GATHERING && '모든 플레이어와 채팅할 수 있습니다.'}
          {currentPhase === GAME_PHASES.MOVEMENT && '원하는 지역으로 이동하세요.'}
          {currentPhase === GAME_PHASES.DISCUSSION && '같은 지역에 있는 플레이어와 대화하고 공격할 수 있습니다.'}
        </p>
      </div>
      
      {/* 플레이어 정보 컴포넌트 - key 제거하여 불필요한 리렌더링 방지 */}
      <div className="player-info-container">
        <PlayerInfo 
          player={playerInfo}
          currentRound={currentRound}
        />
      </div>
    </div>
    
    {/* 게임 컨트롤과 채팅을 하단에 나란히 배치 */}
    <div className="game-controls-chat-container">
      <div className="game-controls-wrapper">
        <GameControls 
          currentRound={currentRound}
          currentPhase={currentPhase}
          selectedLocation={selectedLocation}
          selectedAction={selectedAction}
          targetPlayer={targetPlayer}
          onActionSelect={onActionSelect}
          onSubmitTurn={onSubmitTurn}
          gameStatus={gameStatus}
          onLeaveGame={onLeaveGame}
          peekCount={peekCount}
          maxPeekCount={maxPeekCount}
        />
      </div>
      
      <div className="game-chat-wrapper">
        <GameChat 
          messages={messages}
          onSendMessage={onSendMessage}
        />
      </div>
    </div>
  </div>
));

// 단계 이름을 한글로 표시하는 함수
const getPhaseDisplayName = (phase) => {
  switch(phase) {
    case GAME_PHASES.ANIMAL_SELECTION:
      return '동물 선택 단계';
    case GAME_PHASES.PEEKING:
      return '엿보기 단계';
    case GAME_PHASES.PRE_MOVE_GATHERING:
      return '이동 전 모임 단계';
    case GAME_PHASES.MOVEMENT:
      return '이동 단계';
    case GAME_PHASES.DISCUSSION:
      return '토론 단계';
    default:
      return '게임 진행 중';
  }
};

// 시간을 mm:ss 형식으로 포맷팅하는 함수
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const GameRoom = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { gameState, setGameState } = useContext(GameContext);
  const { socket } = useContext(SocketContext);
  
  // GameSocketService 인스턴스 생성
  const [socketService, setSocketService] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [players, setPlayers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [targetPlayer, setTargetPlayer] = useState(null);
  const [peekCount, setPeekCount] = useState(0); // 엿보기 사용 횟수
  const [maxPeekCount, setMaxPeekCount] = useState(1); // 최대 엿보기 횟수 (기본값 1)
  const [leftHabitat, setLeftHabitat] = useState(false); // 서식지를 떠났는지 여부
  
  // 메모이제이션된 플레이어 정보
  const playerInfo = useMemo(() => {
    return {
      name: gameState.playerName,
      animal: gameState.animal,
      location: selectedLocation,
      habitat: gameState.habitat || '숲', // 기본 서식지
      tier: gameState.tier || 'Tier 5' // 기본 계층
    };
  }, [gameState.playerName, gameState.animal, gameState.habitat, gameState.tier, selectedLocation]);

  // 시스템 메시지 추가 함수 최적화
  const addSystemMessage = useCallback((content) => {
    const systemMessage = {
      id: Date.now().toString(),
      sender: 'System',
      content,
      timestamp: new Date().toISOString(),
      isSystem: true
    };
    
    setMessages(prev => [...prev, systemMessage]);
  }, []);
  
  // 게임 단계 변경 함수
  const changeGamePhase = useCallback((newPhase) => {
    console.log('게임 단계 변경:', newPhase);
    
    // 타이머 초기화 플래그 리셋 - 새 단계에서 타이머가 항상 초기화되도록 함
    timerInitializedRef.current = false;
    
    // 상태 업데이트를 배치로 처리하여 리렌더링 최소화
    setCurrentPhase(newPhase);
    setPhaseTimeLeft(PHASE_TIMES[newPhase]);
    
    // 단계별 초기화 및 메시지
    switch(newPhase) {
      case GAME_PHASES.ANIMAL_SELECTION:
        addSystemMessage('동물 선택 단계가 시작되었습니다. 30초 동안 자신의 동물을 확인하세요.');
        if (gameState.animal === '까마귀') {
          addSystemMessage('당신은 까마귀입니다. 누가 우승할지 예측하세요.');
        } else if (gameState.animal === '카멜레온') {
          addSystemMessage('당신은 카멜레온입니다. 어떤 동물로 변장할지 선택하세요.');
        }
        break;
      case GAME_PHASES.PEEKING:
        addSystemMessage('엿보기 단계가 시작되었습니다. 다른 플레이어의 동물을 확인할 수 있습니다.');
        // 특수 동물 능력 설정
        if (['까마귀', '악어새', '쥐'].includes(gameState.animal)) {
          setMaxPeekCount(2);
          addSystemMessage(`당신은 ${gameState.animal}입니다. 2번 엿볼 수 있습니다.`);
        } else {
          setMaxPeekCount(1);
        }
        break;
      case GAME_PHASES.PRE_MOVE_GATHERING:
        addSystemMessage('이동 전 모임 단계가 시작되었습니다. 모든 플레이어와 채팅할 수 있습니다.');
        break;
      case GAME_PHASES.MOVEMENT:
        addSystemMessage('이동 단계가 시작되었습니다. 원하는 지역으로 이동하세요.');
        break;
      case GAME_PHASES.DISCUSSION:
        addSystemMessage('토론 단계가 시작되었습니다. 같은 지역에 있는 플레이어와 대화하고 공격할 수 있습니다.');
        break;
      default:
        break;
    }
  }, [addSystemMessage, gameState.animal]);
  
  // 타이머 ref 선언 - 컴포넌트 최상위 레벨에서 선언
  const timerRef = useRef(null);
  const timerInitializedRef = useRef(false);
  
  // 타이머 효과 - 의존성 배열 최적화 및 타이머 중복 방지
  useEffect(() => {
    // 게임이 시작되지 않았거나 현재 단계가 없으면 타이머를 실행하지 않음
    if (!currentPhase || !gameStarted) {
      console.log('타이머 조건 불충족: 게임 시작 =', gameStarted, '현재 단계 =', currentPhase);
      return;
    }
    
    console.log('타이머 설정: 단계 =', currentPhase, '시간 =', PHASE_TIMES[currentPhase]);
    
    // 이전 타이머가 있으면 정리
    if (timerRef.current) {
      console.log('이전 타이머 정리');
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // 항상 새 단계에서 타이머 시간 초기화
    console.log('타이머 초기화');
    setPhaseTimeLeft(PHASE_TIMES[currentPhase]);
    
    // 새 타이머 설정 (단일 인스턴스만 생성)
    const timerId = setInterval(() => {
      setPhaseTimeLeft(prev => {
        const newTime = prev - 1;
        
        if (newTime <= 0) {
          console.log('타이머 종료, 다음 단계로 진행');
          clearInterval(timerId);
          
          // 다음 단계로 자동 진행
          switch(currentPhase) {
            case GAME_PHASES.ANIMAL_SELECTION:
              changeGamePhase(GAME_PHASES.PEEKING);
              return PHASE_TIMES[GAME_PHASES.PEEKING];
            case GAME_PHASES.PEEKING:
              changeGamePhase(GAME_PHASES.PRE_MOVE_GATHERING);
              return PHASE_TIMES[GAME_PHASES.PRE_MOVE_GATHERING];
            case GAME_PHASES.PRE_MOVE_GATHERING:
              changeGamePhase(GAME_PHASES.MOVEMENT);
              return PHASE_TIMES[GAME_PHASES.MOVEMENT];
            case GAME_PHASES.MOVEMENT:
              changeGamePhase(GAME_PHASES.DISCUSSION);
              return PHASE_TIMES[GAME_PHASES.DISCUSSION];
            case GAME_PHASES.DISCUSSION:
              // 다음 라운드로 진행 또는 게임 종료
              if (currentRound < 4) {
                setCurrentRound(prev => prev + 1);
                changeGamePhase(GAME_PHASES.MOVEMENT);
                return PHASE_TIMES[GAME_PHASES.MOVEMENT];
              } else {
                // 게임 종료
                addSystemMessage('게임이 종료되었습니다!');
                // 승자 결정 (실제로는 서버에서 처리)
                const winner = players[Math.floor(Math.random() * players.length)];
                addSystemMessage(`${winner.name}(${winner.animal})이(가) 승리했습니다!`);
                setGameState(prev => ({
                  ...prev,
                  gameStatus: 'finished'
                }));
                return 0;
              }
            default:
              return 0;
          }
        }
        return newTime;
      });
    }, 1000);
    
    // 타이머 ID 저장
    timerRef.current = timerId;
    
    // 컴포넌트 언마운트 또는 의존성 변경 시 타이머 정리
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  // 의존성 배열에 필요한 모든 의존성 포함
  }, [currentPhase, gameStarted, currentRound, changeGamePhase, addSystemMessage, players]);
  
  // 게임 시작 핸들러 최적화
  const handleStartGame = useCallback(() => {
    // 각 플레이어에게 랜덤 동물 할당 (실제로는 서버에서 처리)
    const animals = ['사자', '악어', '독수리', '하이에나', '뱀', '카멜레온', '까마귀', '악어새', '사슴', '수달', '청둥오리', '토끼', '쥐'];
    const habitats = ['강', '하늘', '들', '숲'];
    const tiers = ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4', 'Tier 5'];
    
    const updatedPlayers = players.map(player => {
      const animal = animals[Math.floor(Math.random() * animals.length)];
      const habitat = habitats[Math.floor(Math.random() * habitats.length)];
      const tier = tiers[Math.floor(Math.random() * tiers.length)];
      
      return {
        ...player,
        animal,
        habitat,
        tier
      };
    });
    
    // 모든 상태 업데이트를 한 번에 처리하여 리렌더링 최소화
    const myPlayer = updatedPlayers.find(p => p.id === '1');
    
    // 실제 구현에서는 소켓을 통해 게임 시작 요청을 보냅니다
    setGameStarted(true);
    setCurrentRound(1);
    setPlayers(updatedPlayers);
    
    // 게임 상태 업데이트
    setGameState(prev => ({
      ...prev,
      players: updatedPlayers,
      currentRound: 1,
      gameStatus: 'playing',
      animal: myPlayer.animal,
      habitat: myPlayer.habitat,
      tier: myPlayer.tier
    }));
    
    // 시스템 메시지 추가
    addSystemMessage('게임이 시작되었습니다!');
    addSystemMessage(`당신의 동물은 ${myPlayer.animal}입니다.`);
    addSystemMessage(`당신의 서식지는 ${myPlayer.habitat}입니다.`);
    addSystemMessage(`당신의 계층은 ${myPlayer.tier}입니다.`);
    
    // 첫 번째 단계 시작
    changeGamePhase(GAME_PHASES.ANIMAL_SELECTION);
    
  }, [addSystemMessage, players, setGameState, changeGamePhase]);
  
  // 위치 선택 핸들러 최적화
  const handleLocationSelect = useCallback((location) => {
    // 이동 제한 규칙 적용
    if (leftHabitat && location !== playerInfo.habitat) {
      addSystemMessage(`서식지를 한 번 떠난 후에는 반드시 서식지(${playerInfo.habitat})로만 이동해야 합니다.`);
      return;
    }
    
    // 이전 위치와 같은 위치를 선택한 경우 무시
    if (selectedLocation === location) {
      return;
    }
    
    setSelectedLocation(location);
    
    // 서식지를 떠났는지 체크 및 상태 업데이트
    if (location !== playerInfo.habitat && !leftHabitat) {
      setLeftHabitat(true);
      addSystemMessage(`서식지(${playerInfo.habitat})를 떠났습니다. 이후에는 반드시 서식지로만 이동할 수 있습니다.`);
    }
    
    // 서식지로 돌아온 경우 특별 메시지
    if (location === playerInfo.habitat && leftHabitat) {
      addSystemMessage(`서식지(${playerInfo.habitat})로 돌아왔습니다.`);
    } else {
      addSystemMessage(`${location}(으)로 이동했습니다.`);
    }
    
    // 이동 정보를 게임 상태에 반영
    setGameState(prev => ({
      ...prev,
      location: location
    }));
  }, [addSystemMessage, leftHabitat, playerInfo.habitat, selectedLocation, setGameState]);
  
  // 액션 선택 핸들러 최적화
  const handleActionSelect = useCallback((action) => {
    // 현재 게임 단계에 따른 액션 제한
    if (action === 'peek' && currentPhase !== GAME_PHASES.PEEKING) {
      addSystemMessage('엿보기는 엿보기 단계에서만 가능합니다.');
      return;
    }
    
    if (action === 'peek' && peekCount >= maxPeekCount) {
      addSystemMessage(`엿보기를 이미 ${maxPeekCount}번 사용했습니다.`);
      return;
    }
    
    if (action === 'move' && currentPhase !== GAME_PHASES.MOVEMENT) {
      addSystemMessage('이동은 이동 단계에서만 가능합니다.');
      return;
    }
    
    if (action === 'attack' && currentPhase !== GAME_PHASES.DISCUSSION) {
      addSystemMessage('공격은 토론 단계에서만 가능합니다.');
      return;
    }
    
    // 상태 업데이트를 함수형으로 처리하여 최신 상태 보장
    setSelectedAction(prevAction => {
      // 같은 액션을 다시 선택한 경우 상태 변경 없음
      if (prevAction === action) return prevAction;
      
      // 이동 액션인 경우 위치 선택 초기화
      if (action === 'move') {
        setSelectedLocation(null);
      }
      
      // 공격이나 엿보기 액션인 경우 타겟 플레이어 초기화
      if (action === 'attack' || action === 'peek') {
        setTargetPlayer(null);
      }
      
      return action;
    });
  }, [addSystemMessage, currentPhase, peekCount, maxPeekCount]);
  
  // 타겟 선택 핸들러 최적화
  const handleTargetSelect = useCallback((player) => {
    if (!player) return; // null 체크 추가
    
    setTargetPlayer(prevTarget => {
      // 같은 타겟을 다시 선택한 경우 상태 변경 없음
      if (prevTarget && prevTarget.id === player.id) return prevTarget;
      
      // 엿보기 액션인 경우 엿보기 카운트 증가
      if (selectedAction === 'peek') {
        setPeekCount(prev => prev + 1);
        
        // 엿본 플레이어의 동물 정보 표시
        addSystemMessage(`${player.name}의 동물은 ${player.animal}입니다.`);
        addSystemMessage(`${player.name}의 서식지는 ${player.habitat}입니다.`);
      }
      
      return player;
    });
  }, [selectedAction, addSystemMessage]);
  
  // 턴 제출 핸들러 최적화
  const handleSubmitTurn = useCallback(() => {
    // 액션 유효성 검사
    if (!selectedAction) {
      addSystemMessage('액션을 선택해주세요.');
      return;
    }
    
    // 액션별 추가 검증
    if (selectedAction === 'move' && !selectedLocation) {
      addSystemMessage('이동할 위치를 선택해주세요.');
      return;
    }
    
    if ((selectedAction === 'attack' || selectedAction === 'peek') && !targetPlayer) {
      addSystemMessage('대상 플레이어를 선택해주세요.');
      return;
    }
    
    // 액션 처리 (실제로는 서버에 전송)
    switch(selectedAction) {
      case 'move':
        addSystemMessage(`${selectedLocation}(으)로 이동했습니다.`);
        break;
      case 'attack':
        // 공격 성공 여부 랜덤 결정 (실제로는 서버에서 처리)
        const isSuccess = Math.random() > 0.3;
        
        if (isSuccess) {
          addSystemMessage(`${targetPlayer.name}을(를) 공격했습니다!`);
          // 특수 동물 능력 처리 (예: 사슴)
          if (targetPlayer.animal === '사슴') {
            addSystemMessage(`${targetPlayer.name}은(는) 사슴입니다! 공격이 실패하고 당신이 피해를 입었습니다.`);
          } else {
            addSystemMessage(`${targetPlayer.name}에게 피해를 입혔습니다.`);
          }
        } else {
          addSystemMessage(`${targetPlayer.name}을(를) 공격했지만 실패했습니다.`);
        }
        break;
      case 'peek':
        // 이미 handleTargetSelect에서 처리됨
        break;
      default:
        break;
    }
    
    // 액션 초기화
    setSelectedAction(null);
    setTargetPlayer(null);
  }, [selectedAction, selectedLocation, targetPlayer, addSystemMessage]);
  
  // 게임 나가기 핸들러
  const handleLeaveGame = useCallback(() => {
    // 실제 구현에서는 소켓을 통해 게임 나가기 요청을 보냅니다
    navigate('/lobby');
  }, [navigate]);
  
  // 메시지 전송 핸들러를 최적화
  const handleSendMessage = useCallback((content, messageObj) => {
    // 이미 완성된 메시지 객체가 있는 경우 (소켓 이벤트로부터 전달된 경우)
    if (messageObj) {
      setMessages(prev => {
        // 중복 방지
        if (prev.some(msg => msg.id === messageObj.id)) {
          return prev;
        }
        return [...prev, messageObj];
      });
      return;
    }

    // 새 메시지 생성
    const newMessage = {
      id: Date.now().toString(),
      sender: gameState.playerName,
      content,
      timestamp: new Date().toISOString()
    };
    
    // 메시지 목록에 추가
    setMessages(prev => [...prev, newMessage]);

    // 소켓 서비스를 통해 메시지 전송 (있는 경우)
    if (socketService && gameId) {
      try {
        const sent = socketService.sendMessage(gameId, content);
        if (!sent) {
          // 전송 실패 알림
          const errorMsg = {
            id: Date.now().toString() + '-error',
            sender: 'System',
            content: '메시지 전송 실패: 서버 연결이 끊어졌습니다.',
            timestamp: new Date().toISOString(),
            isSystem: true
          };
          setMessages(prev => [...prev, errorMsg]);
        }
      } catch (error) {
        console.error('메시지 전송 중 오류:', error);
      }
    }
  }, [gameState.playerName, socketService, gameId]);
  
  // 컴포넌트 마운트 시 게임 정보 로드
  useEffect(() => {
    const playersRef = ref(database, `rooms/${gameId}/players`);
  
    const unsubscribe = onValue(playersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const playerList = Object.entries(data).map(([id, player]) => ({
          id,
          ...player
        }));
        setPlayers(playerList);
      } else {
        setPlayers([]); // 아무도 없으면 빈 배열
      }
      setIsLoading(false);
    });
  
    return () => unsubscribe(); // 컴포넌트 언마운트시 리스너 해제
  }, [gameId]);
  
  // useEffect 부분 수정 - 소켓 서비스 초기화 로직 개선
  useEffect(() => {
    if (socket) {
      // 소켓 서비스 초기화
      const gameSocketServiceInstance = new GameSocketService(socket);
      setSocketService(gameSocketServiceInstance);
      
      console.log('[GameRoom] 소켓 서비스가 초기화되었습니다. 소켓 ID:', socket.id);
      
      // 재연결 이벤트 리스너 추가
      socket.on('reconnect', () => {
        console.log('[GameRoom] 소켓이 재연결되었습니다. 게임 방에 다시 참가합니다.');
        if (gameId && gameState.playerName) {
          gameSocketServiceInstance.joinGame(gameId, gameState.playerName, (gameData) => {
            console.log('[GameRoom] 게임 재참가 완료:', gameData);
          });
        }
      });
      
      // 컴포넌트 언마운트 시 소켓 서비스 정리
      return () => {
        console.log('[GameRoom] 소켓 이벤트 리스너를 제거합니다.');
        socket.off('reconnect');
        if (gameSocketServiceInstance) {
          gameSocketServiceInstance.removeAllHandlers();
        }
      };
    }
  }, [socket, gameId, gameState.playerName]);
  
  // 게임 방 입장 시 join_game 호출 - 로직 개선
  useEffect(() => {
    // 소켓 서비스와 게임 ID가 있을 때만 실행
    if (socketService && gameId && gameState.playerName) {
      console.log('[GameRoom] 게임 참가 요청:', gameId, gameState.playerName);
      
      // join_game 이벤트 발생 전에 이벤트 리스너 등록
      // 게임 업데이트 이벤트 리스너 등록
      socketService.registerHandler('game_updated', (gameData) => {
        console.log('[GameRoom] 게임 업데이트 수신:', gameData);
        
        // 게임 상태 업데이트
        if (gameData.started !== undefined) {
          setGameStarted(gameData.started);
        }
        
        if (gameData.currentRound) {
          setCurrentRound(gameData.currentRound);
        }
        
        if (gameData.currentPhase) {
          changeGamePhase(gameData.currentPhase);
        }
        
        if (gameData.players) {
          setPlayers(gameData.players);
        }
        
        // 게임 시작 메시지
        if (gameData.started && !gameStarted) {
          addSystemMessage('게임이 시작되었습니다!');
        }
      });
      
      // player_game_info 이벤트 리스너 등록
      socketService.registerHandler('player_game_info', (playerData) => {
        console.log('[GameRoom] 플레이어 정보 수신:', playerData);
        
        // 플레이어 정보 업데이트
        setGameState(prev => ({
          ...prev,
          animal: playerData.animal || prev.animal,
          habitat: playerData.habitat || prev.habitat,
          tier: playerData.tier || prev.tier
        }));
        
        // 플레이어 정보 메시지
        addSystemMessage(`당신의 동물은 ${playerData.animal || gameState.animal}입니다.`);
        addSystemMessage(`당신의 서식지는 ${playerData.habitat || gameState.habitat}입니다.`);
      });
      
      // game_message 이벤트 리스너 등록 (채팅 메시지)
      socketService.registerHandler('game_message', (messageData) => {
        console.log('[GameRoom] 채팅 메시지 수신:', messageData);
        
        // 채팅 메시지 추가 - 중복 처리 방지
        const newMessage = {
          id: messageData.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
          sender: messageData.sender,
          content: messageData.content,
          timestamp: messageData.timestamp || new Date().toISOString(),
          isSystem: messageData.isSystem || false
        };
        
        // 중복 메시지 방지를 위해 ID 체크
        setMessages(prev => {
          if (prev.some(msg => msg.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      });

      // newMessage 이벤트 리스너도 등록 (서버 구현에 따라 다를 수 있음)
      socketService.registerHandler('newMessage', (messageData) => {
        console.log('[GameRoom] 새 메시지 수신(newMessage):', messageData);
        
        // 채팅 메시지 추가 - 중복 처리 방지
        const newMessage = {
          id: messageData.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
          sender: messageData.sender,
          content: messageData.content,
          timestamp: messageData.timestamp || new Date().toISOString(),
          isSystem: messageData.isSystem || false
        };
        
        // 중복 메시지 방지를 위해 ID 체크
        setMessages(prev => {
          if (prev.some(msg => msg.id === newMessage.id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      });
      
      // game_action_result 이벤트 리스너 등록 (액션 결과)
      socketService.registerHandler('game_action_result', (actionResult) => {
        console.log('[GameRoom] 액션 결과 수신:', actionResult);
        
        // 액션 결과에 따른 메시지
        if (actionResult.type === 'move') {
          addSystemMessage(`${actionResult.playerName || '당신'}이(가) ${actionResult.location}(으)로 이동했습니다.`);
          
          // 자신의 이동이면 위치 업데이트
          if (!actionResult.playerName || actionResult.playerName === gameState.playerName) {
            setSelectedLocation(actionResult.location);
          }
        } else if (actionResult.type === 'attack') {
          if (actionResult.success) {
            addSystemMessage(`${actionResult.playerName || '당신'}이(가) ${actionResult.targetName}을(를) 공격했습니다!`);
          } else {
            addSystemMessage(`${actionResult.playerName || '당신'}의 ${actionResult.targetName}에 대한 공격이 실패했습니다.`);
          }
        } else if (actionResult.type === 'peek') {
          // 엿보기 결과 메시지
          if (actionResult.animalInfo) {
            addSystemMessage(`${actionResult.targetName}의 동물은 ${actionResult.animalInfo.animal}입니다.`);
            addSystemMessage(`${actionResult.targetName}의 서식지는 ${actionResult.animalInfo.habitat}입니다.`);
          }
        }
      });
      
      // game_over 이벤트 리스너 등록
      socketService.registerHandler('game_over', (gameResult) => {
        console.log('[GameRoom] 게임 종료:', gameResult);
        
        // 게임 종료 메시지
        addSystemMessage('게임이 종료되었습니다!');
        
        if (gameResult.winner) {
          addSystemMessage(`${gameResult.winner.name}(${gameResult.winner.animal})이(가) 승리했습니다!`);
        }
        
        // 게임 상태 업데이트
        setGameState(prev => ({
          ...prev,
          gameStatus: 'finished'
        }));
      });

      // 플레이어 참가 및 퇴장 이벤트 리스너 등록
      socketService.registerHandler('playerJoined', (player) => {
        console.log('[GameRoom] 플레이어 참가:', player);
        addSystemMessage(`${player.name}님이 게임에 참가했습니다.`);
        setPlayers(prev => [...prev.filter(p => p.id !== player.id), player]);
      });

      socketService.registerHandler('playerLeft', (data) => {
        console.log('[GameRoom] 플레이어 퇴장:', data);
        addSystemMessage(`${data.name || '플레이어'}님이 게임에서 나갔습니다.`);
        setPlayers(prev => prev.filter(p => p.id !== data.id));
      });
      
      // 이벤트 리스너를 모두 등록한 후 join_game 이벤트 발생
      socketService.joinGame(gameId, gameState.playerName, (gameData) => {
        console.log('[GameRoom] 게임 참가 완료:', gameData);
        addSystemMessage(`${gameState.playerName}님이 게임에 참가했습니다.`);
        
        // 게임 데이터 설정
        if (gameData.started) {
          setGameStarted(true);
          setCurrentRound(gameData.currentRound || 1);
          setCurrentPhase(gameData.currentPhase || GAME_PHASES.ANIMAL_SELECTION);
          
          // 게임 정보 업데이트
          if (gameData.players) {
            setPlayers(gameData.players);
            
            // 자신의 플레이어 정보 찾기
            const myPlayer = gameData.players.find(p => p.id === socket.id || p.name === gameState.playerName);
            if (myPlayer) {
              setGameState(prev => ({
                ...prev,
                animal: myPlayer.animal || prev.animal,
                habitat: myPlayer.habitat || prev.habitat,
                tier: myPlayer.tier || prev.tier,
                location: myPlayer.location || prev.location
              }));
              
              setSelectedLocation(myPlayer.location || null);
            }
          }
        }
      });
      
      // 컴포넌트 언마운트 시 이벤트 리스너 정리
      return () => {
        console.log('[GameRoom] 게임방 이벤트 리스너 정리');
        
        if (socketService) {
          // 게임 관련 이벤트 리스너 제거
          socketService.removeHandler('game_updated');
          socketService.removeHandler('player_game_info');
          socketService.removeHandler('game_message');
          socketService.removeHandler('newMessage');
          socketService.removeHandler('game_action_result');
          socketService.removeHandler('game_over');
          socketService.removeHandler('playerJoined');
          socketService.removeHandler('playerLeft');
          
          // 게임 방 나가기
          socketService.leaveGame();
        }
      };
    }
  }, [socketService, gameId, gameState.playerName, socket, addSystemMessage, gameStarted, changeGamePhase, setGameState]);
  
  // 로딩 중이면 로딩 화면 표시
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <div className="game-room">
      <h1 className="game-room-title">게임 방: {gameId}</h1>
      
      {!gameStarted ? (
        <WaitingScreen 
          players={players}
          isHost={true} // 실제로는 플레이어 ID로 확인
          onStartGame={handleStartGame}
          onLeaveGame={handleLeaveGame}
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      ) : (
        <PlayingScreen 
          currentRound={currentRound}
          currentPhase={currentPhase}
          phaseTimeLeft={phaseTimeLeft}
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
          players={players}
          selectedAction={selectedAction}
          targetPlayer={targetPlayer}
          onTargetSelect={handleTargetSelect}
          playerInfo={playerInfo}
          onActionSelect={handleActionSelect}
          onSubmitTurn={handleSubmitTurn}
          gameStatus={gameState.gameStatus}
          onLeaveGame={handleLeaveGame}
          messages={messages}
          onSendMessage={handleSendMessage}
          peekCount={peekCount}
          maxPeekCount={maxPeekCount}
        />
      )}
    </div>
  );
};

export default GameRoom;
