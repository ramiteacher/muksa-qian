// 테스트 및 디버깅 스크립트
// 게임 기능 테스트를 위한 유틸리티 함수들

/**
 * 게임 기능 테스트 유틸리티
 * 
 * 이 파일은 먹이사슬 웹게임의 주요 기능을 테스트하기 위한 유틸리티 함수들을 제공합니다.
 * 개발 및 디버깅 과정에서 사용할 수 있습니다.
 */

// 테스트 플레이어 생성
const createTestPlayers = (count) => {
  const players = [];
  for (let i = 0; i < count; i++) {
    players.push({
      id: `player-${i}`,
      name: `테스트 플레이어 ${i + 1}`,
      isReady: i % 2 === 0, // 짝수 번호 플레이어는 준비 상태
      isHost: i === 0 // 첫 번째 플레이어가 방장
    });
  }
  return players;
};

// 테스트 게임 상태 생성
const createTestGameState = (playerCount = 6) => {
  const players = createTestPlayers(playerCount);
  const animals = ['사자', '악어', '독수리', '하이에나', '뱀', '카멜레온', '까마귀', '악어새', '사슴', '수달', '청둥오리', '토끼', '쥐'];
  
  // 동물 할당
  players.forEach((player, index) => {
    player.animal = animals[index % animals.length];
    player.location = getHabitatForAnimal(player.animal);
  });
  
  return {
    id: 'test-game-1',
    name: '테스트 게임',
    players,
    status: 'playing',
    currentRound: 1,
    messages: [
      {
        id: '1',
        sender: 'System',
        content: '게임이 시작되었습니다!',
        timestamp: new Date().toISOString(),
        isSystem: true
      }
    ]
  };
};

// 동물별 서식지 반환
const getHabitatForAnimal = (animal) => {
  const habitats = {
    '사자': '들',
    '악어': '강',
    '독수리': '하늘',
    '하이에나': '들',
    '뱀': '숲',
    '카멜레온': '숲',
    '까마귀': '하늘',
    '악어새': '강',
    '사슴': '들',
    '수달': '강',
    '청둥오리': '하늘',
    '토끼': '숲',
    '쥐': '숲'
  };
  
  return habitats[animal] || '들';
};

// 포식 관계 확인
const canAttack = (predator, prey) => {
  const predatorTier = getAnimalTier(predator);
  const preyTier = getAnimalTier(prey);
  
  // 상위 계층만 하위 계층을 공격할 수 있음
  return predatorTier < preyTier;
};

// 동물 계층 반환
const getAnimalTier = (animal) => {
  const tiers = {
    '사자': 1,
    '악어': 2,
    '독수리': 2,
    '하이에나': 3,
    '뱀': 4,
    '카멜레온': 4,
    '까마귀': 4,
    '악어새': 4,
    '사슴': 5,
    '수달': 5,
    '청둥오리': 5,
    '토끼': 5,
    '쥐': 5
  };
  
  return tiers[animal] || 5;
};

// 테스트 행동 생성
const createTestAction = (playerId, location, action, targetId) => {
  return {
    playerId,
    location,
    action,
    targetId
  };
};

// 테스트 라운드 결과 시뮬레이션
const simulateRoundResults = (gameState, actions) => {
  const results = {
    attacks: [],
    peeks: [],
    starvations: [],
    survivors: []
  };
  
  // 공격 처리
  actions.forEach(action => {
    if (action.action === 'attack' && action.targetId) {
      const attacker = gameState.players.find(p => p.id === action.playerId);
      const target = gameState.players.find(p => p.id === action.targetId);
      
      if (attacker && target && canAttack(attacker.animal, target.animal)) {
        // 뱀의 특수 능력 처리
        if (target.animal === '뱀') {
          results.attacks.push({
            attackerId: action.playerId,
            targetId: action.targetId,
            result: 'counterAttack',
            message: `${attacker.name}(${attacker.animal})이(가) ${target.name}(${target.animal})을(를) 공격했지만, 뱀의 특수 능력으로 인해 ${attacker.name}이(가) 죽었습니다.`
          });
        } else {
          results.attacks.push({
            attackerId: action.playerId,
            targetId: action.targetId,
            result: 'success',
            message: `${attacker.name}(${attacker.animal})이(가) ${target.name}(${target.animal})을(를) 잡아먹었습니다.`
          });
        }
      }
    }
  });
  
  // 생존자 처리
  gameState.players.forEach(player => {
    const isAttacked = results.attacks.some(attack => 
      (attack.targetId === player.id && attack.result === 'success') || 
      (attack.attackerId === player.id && attack.result === 'counterAttack')
    );
    
    if (!isAttacked) {
      results.survivors.push(player.id);
    }
  });
  
  return results;
};

// 테스트 승자 결정
const determineTestWinners = (gameState, deadPlayers) => {
  const winners = [];
  const survivors = gameState.players.filter(p => !deadPlayers.includes(p.id));
  
  survivors.forEach(player => {
    // 간단한 승리 조건 체크 (실제 게임에서는 더 복잡함)
    switch (player.animal) {
      case '사자':
      case '악어':
      case '독수리':
      case '카멜레온':
      case '사슴':
      case '수달':
      case '청둥오리':
      case '토끼':
        // 생존이 승리 조건
        winners.push(player);
        break;
        
      case '하이에나':
        // 사자의 죽음이 승리 조건
        const lion = gameState.players.find(p => p.animal === '사자');
        if (lion && deadPlayers.includes(lion.id)) {
          winners.push(player);
        }
        break;
        
      case '뱀':
        // 9마리 이상 죽음이 승리 조건
        if (deadPlayers.length >= 9) {
          winners.push(player);
        }
        break;
        
      case '쥐':
        // 사자의 생존이 승리 조건
        const lion2 = gameState.players.find(p => p.animal === '사자');
        if (lion2 && !deadPlayers.includes(lion2.id)) {
          winners.push(player);
        }
        break;
        
      case '악어새':
        // 악어의 생존이 승리 조건
        const crocodile = gameState.players.find(p => p.animal === '악어');
        if (crocodile && !deadPlayers.includes(crocodile.id)) {
          winners.push(player);
        }
        break;
        
      case '까마귀':
        // 예측한 동물의 승리가 승리 조건 (테스트에서는 랜덤)
        if (Math.random() > 0.5) {
          winners.push(player);
        }
        break;
    }
  });
  
  return winners;
};

// 테스트 실행 함수
const runGameTest = () => {
  console.log('먹이사슬 게임 테스트 시작...');
  
  // 테스트 게임 상태 생성
  const gameState = createTestGameState(8);
  console.log('테스트 게임 상태:', gameState);
  
  // 테스트 행동 생성
  const actions = [
    createTestAction('player-0', '들', 'attack', 'player-4'),
    createTestAction('player-1', '강', 'attack', 'player-7'),
    createTestAction('player-2', '하늘', 'peek', 'player-6'),
    createTestAction('player-3', '들', 'move', null),
    createTestAction('player-5', '숲', 'attack', 'player-0'), // 뱀의 반격 테스트
  ];
  
  // 라운드 결과 시뮬레이션
  const roundResults = simulateRoundResults(gameState, actions);
  console.log('라운드 결과:', roundResults);
  
  // 죽은 플레이어 목록 생성
  const deadPlayers = gameState.players
    .filter(p => !roundResults.survivors.includes(p.id))
    .map(p => p.id);
  
  // 승자 결정
  const winners = determineTestWinners(gameState, deadPlayers);
  console.log('승자:', winners);
  
  console.log('먹이사슬 게임 테스트 완료!');
  return {
    gameState,
    actions,
    roundResults,
    deadPlayers,
    winners
  };
};

// 브라우저 환경에서 테스트할 수 있도록 전역 객체에 추가
if (typeof window !== 'undefined') {
  window.GameTest = {
    createTestPlayers,
    createTestGameState,
    canAttack,
    getAnimalTier,
    createTestAction,
    simulateRoundResults,
    determineTestWinners,
    runGameTest
  };
}

// Node.js 환경에서 테스트할 수 있도록 모듈 내보내기
if (typeof module !== 'undefined') {
  module.exports = {
    createTestPlayers,
    createTestGameState,
    canAttack,
    getAnimalTier,
    createTestAction,
    simulateRoundResults,
    determineTestWinners,
    runGameTest
  };
}
