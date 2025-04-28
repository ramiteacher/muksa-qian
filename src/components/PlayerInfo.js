import React, { useMemo } from 'react';
import '../styles/PlayerInfo.css';

// 동물 계층 정보를 컴포넌트 외부로 이동하여 리렌더링 방지
const tierMap = {
  '사자': { tier: 'Tier 5', tierClass: 'tier-5' },
  '악어': { tier: 'Tier 4', tierClass: 'tier-4' },
  '독수리': { tier: 'Tier 3', tierClass: 'tier-3' },
  '하이에나': { tier: 'Tier 4', tierClass: 'tier-4' },
  '뱀': { tier: 'Tier 5', tierClass: 'tier-5' },
  '카멜레온': { tier: 'Tier 5', tierClass: 'tier-5' },
  '까마귀': { tier: 'Tier 5', tierClass: 'tier-5' },
  '악어새': { tier: 'Tier 5', tierClass: 'tier-5' },
  '사슴': { tier: 'Tier 5', tierClass: 'tier-5' },
  '수달': { tier: 'Tier 5', tierClass: 'tier-5' },
  '청둥오리': { tier: 'Tier 5', tierClass: 'tier-5' },
  '토끼': { tier: 'Tier 5', tierClass: 'tier-5' },
  '쥐': { tier: 'Tier 5', tierClass: 'tier-5' }
};

// 동물 서식지 정보
const habitatMap = {
  '사자': { habitat: '들', habitatClass: 'habitat-field' },
  '악어': { habitat: '강', habitatClass: 'habitat-river' },
  '독수리': { habitat: '하늘', habitatClass: 'habitat-sky' },
  '하이에나': { habitat: '들', habitatClass: 'habitat-field' },
  '뱀': { habitat: '숲', habitatClass: 'habitat-forest' },
  '카멜레온': { habitat: '숲', habitatClass: 'habitat-forest' },
  '까마귀': { habitat: '하늘', habitatClass: 'habitat-sky' },
  '악어새': { habitat: '강', habitatClass: 'habitat-river' },
  '사슴': { habitat: '숲', habitatClass: 'habitat-forest' },
  '수달': { habitat: '강', habitatClass: 'habitat-river' },
  '청둥오리': { habitat: '강', habitatClass: 'habitat-river' },
  '토끼': { habitat: '들', habitatClass: 'habitat-field' },
  '쥐': { habitat: '숲', habitatClass: 'habitat-forest' }
};

// 동물 먹이 정보
const preyMap = {
  '사자': '사슴, 수달, 청둥오리, 토끼 중 살아남은 동물',
  '악어': '수달, 청둥오리, 토끼, 쥐 중 살아남은 동물',
  '독수리': '청둥오리, 토끼, 쥐 중 살아남은 동물',
  '하이에나': '토끼, 쥐 중 살아남은 동물',
  '뱀': '쥐',
  '카멜레온': '없음',
  '까마귀': '없음',
  '악어새': '없음',
  '사슴': '없음',
  '수달': '없음',
  '청둥오리': '없음',
  '토끼': '없음',
  '쥐': '없음'
};

// 동물 승리 조건
const winConditionMap = {
  '사자': '한 라운드만 굶어도 사망',
  '악어': '두 라운드 굶을 시 사망',
  '독수리': '세 라운드 굶을 시 사망',
  '하이에나': '사자의 사망',
  '뱀': '사자의 생존',
  '카멜레온': '다른 동물로 위장할 수 있음',
  '까마귀': '지목한 인물의 승리',
  '악어새': '엿보기 때 2명을 엿볼 수 있음',
  '사슴': '자신을 공격한 동물이 역으로 사망',
  '수달': '이 중 생존한 모든 동물이 한 군데에 모일 시 죽지 않음',
  '청둥오리': '생존',
  '토끼': '생존',
  '쥐': '생존'
};

// 동물 데이터 계산 함수 - 컴포넌트 외부로 이동
const getAnimalData = (animal) => {
  if (!animal) return null;
  
  return {
    tier: tierMap[animal]?.tier || '알 수 없음',
    tierClass: tierMap[animal]?.tierClass || '',
    habitat: habitatMap[animal]?.habitat || '알 수 없음',
    habitatClass: habitatMap[animal]?.habitatClass || '',
    prey: preyMap[animal] || '알 수 없음',
    winCondition: winConditionMap[animal] || '알 수 없음'
  };
};

// 동물 정보 섹션 컴포넌트 분리
const AnimalInfoSection = React.memo(({ animalData, animal, location }) => {
  if (!animal || !animalData) return null;
  
  return (
    <>
      <div className="animal-info-section">
        <div className="animal-header">
          <div className={`animal-icon ${animalData.tierClass}`}></div>
          <h4 className="animal-name">{animal}</h4>
        </div>
        
        <div className="info-row">
          <span className="info-label">계층:</span>
          <span className={`info-value tier ${animalData.tierClass}`}>{animalData.tier}</span>
        </div>
        
        <div className="info-row">
          <span className="info-label">서식지:</span>
          <span className={`info-value habitat ${animalData.habitatClass}`}>{animalData.habitat}</span>
        </div>
        
        <div className="info-row">
          <span className="info-label">현재 지역:</span>
          <span className="info-value location-badge">{location || '없음'}</span>
        </div>
      </div>
      
      <div className="divider"></div>
      
      <div className="strategy-info-section">
        <h4 className="section-title">전략 정보</h4>
        
        <div className="info-row">
          <span className="info-label">승리 조건:</span>
          <span className="info-value">{animalData.winCondition}</span>
        </div>
        
        <div className="info-row">
          <span className="info-label">먹이:</span>
          <span className="info-value">{animalData.prey}</span>
        </div>
      </div>
    </>
  );
});

// React.memo로 감싸서 불필요한 리렌더링 방지
const PlayerInfo = React.memo(({ player, currentRound }) => {
  // useMemo를 사용하여 동물 데이터 메모이제이션
  const animalData = useMemo(() => {
    return player.animal ? getAnimalData(player.animal) : null;
  }, [player.animal]);
  
  return (
    <div className="player-info-card">
      <div className="player-info-header">
        <h3>내 정보</h3>
      </div>
      
      <div className="player-info-content">
        <div className="info-row">
          <span className="info-label">이름:</span>
          <span className="info-value">{player.name}</span>
        </div>
        
        <div className="info-row">
          <span className="info-label">현재 라운드:</span>
          <span className="info-value">{currentRound}/4</span>
        </div>
        
        <AnimalInfoSection 
          animalData={animalData} 
          animal={player.animal} 
          location={player.location} 
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수로 리렌더링 최적화 - 깊은 비교 추가
  return (
    prevProps.player.name === nextProps.player.name &&
    prevProps.player.animal === nextProps.player.animal &&
    prevProps.player.location === nextProps.player.location &&
    prevProps.currentRound === nextProps.currentRound &&
    JSON.stringify(prevProps.player) === JSON.stringify(nextProps.player)
  );
});

export default PlayerInfo;
