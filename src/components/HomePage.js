import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import GameContext from '../contexts/GameContext';
import '../styles/HomePage.css';

const HomePage = () => {
  const [playerName, setPlayerName] = useState('');
  const { gameState, setGameState } = useContext(GameContext);
  const navigate = useNavigate();

  const handleNameChange = (e) => {
    setPlayerName(e.target.value);
  };

  const handleJoinLobby = (e) => {
    e.preventDefault();
    if (playerName.trim()) {
      setGameState({
        ...gameState,
        playerName: playerName.trim()
      });
      navigate('/lobby');
    }
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <div className="logo-container">
          <div className="logo-icon"></div>
          <h1 className="game-title">먹이사슬 게임</h1>
        </div>
      </div>
      
      <div className="home-content">
        <div className="game-intro card slide-in-up">
          <div className="game-logo">
            <div className="food-chain-pyramid">
              <div className="tier tier-1">
                <div className="animal lion">사자</div>
              </div>
              <div className="tier tier-2">
                <div className="animal crocodile">악어</div>
                <div className="animal eagle">독수리</div>
              </div>
              <div className="tier tier-3">
                <div className="animal hyena">하이에나</div>
              </div>
              <div className="tier tier-4">
                <div className="animal snake">뱀</div>
                <div className="animal chameleon">카멜레온</div>
                <div className="animal crow">까마귀</div>
                <div className="animal plover">악어새</div>
              </div>
              <div className="tier tier-5">
                <div className="animal deer">사슴</div>
                <div className="animal otter">수달</div>
                <div className="animal duck">청둥오리</div>
                <div className="animal rabbit">토끼</div>
                <div className="animal mouse">쥐</div>
              </div>
            </div>
            <div className="game-tagline">
              <h2>생존을 위한 전략적 숨바꼭질</h2>
              <p>먹거나 먹히거나, 당신의 선택이 생존을 결정합니다</p>
            </div>
          </div>
        </div>

        <div className="home-main-content">
          <div className="login-form card slide-in-up">
            <h2>게임 참가하기</h2>
            <form onSubmit={handleJoinLobby}>
              <div className="form-group">
                <label htmlFor="playerName">닉네임</label>
                <input
                  type="text"
                  id="playerName"
                  value={playerName}
                  onChange={handleNameChange}
                  placeholder="닉네임을 입력하세요"
                  required
                />
              </div>
              <button type="submit" className="primary join-button">
                로비 입장하기
              </button>
            </form>
          </div>

          <div className="game-rules card slide-in-up">
            <h2>게임 규칙</h2>
            <div className="rules-content">
              <div className="rules-intro">
                <p>
                  <strong>먹이사슬 게임</strong>은 동물 계층 구조를 기반으로 한 전략 게임입니다.
                  각 플레이어는 특정 동물 역할을 맡아 자신의 승리 조건을 달성하기 위해 경쟁합니다.
                </p>
              </div>
              
              <div className="rules-section">
                <h3>게임 진행 순서</h3>
                <ol className="rules-list">
                  <li><span className="rule-number">1</span> <span className="rule-text">동물 선택: 30초 간 자신이 어떤 동물인지 표시됩니다. 이 시간 동안 <span className="animal-highlight">까마귀</span>는 어떤 사람이 우승할 지를 예측하고, <span className="animal-highlight">카멜레온</span>은 어떤 동물로 변장할지를 선택해야 합니다.</span></li>
                  <li><span className="rule-number">2</span> <span className="rule-text">엿보기: 모든 동물이 가능하며 이동 전 모임 전에만 가능합니다. 이 시간이 지나면 엿보기를 할 수 없습니다. 1회에 한해 원하는 사람이 어떤 동물인지 확인할 수 있습니다.</span></li>
                  <li><span className="rule-number">3</span> <span className="rule-text">이동 전 모임: 첫 이동 전에 한하여 원하는 지역으로 이동하기 전에 다 같이 모여 채팅을 할 수 있습니다.</span></li>
                  <li><span className="rule-number">4</span> <span className="rule-text">이동: 30초 간 원하는 지역으로 이동할 수 있습니다. 단, 한 번 자신의 거처지를 벗어난 경우 그 다음에는 반드시 자신의 거처지로만 이동해야 합니다.</span></li>
                  <li><span className="rule-number">5</span> <span className="rule-text">투표: 원하는 지역으로 이동한 다음 각 지역에 어떤 사람들이 있는지 표시됩니다. 자신의 지역에 있는 사람들끼리만 채팅할 수 있습니다. 자신의 지역에 있는 사람을 끌어 낼 시도를 할 수 있습니다.</span></li>
                  <li><span className="rule-number">6</span> <span className="rule-text">(이동 - 투표) 총 1개의 라운드로 보고 4개의 라운드가 지난 후 승리 조건과 패배 조건에 따라 우승자, 패배자가 결정됩니다.</span></li>
                </ol>
              </div>
              
              <div className="rules-section">
                <h3>가능한 행동</h3>
                <ul className="actions-list">
                  <li><span className="action-icon change"></span> <span className="action-name">변장:</span> <span className="action-desc">카멜레온에 한해 가능하며 동물 선택 시간에만 가능합니다. 어떤 동물로 변장할지 선택하여 다른 사람이 엿보기 시 그 동물로 보이게 됩니다.</span></li>
                  <li><span className="action-icon predict"></span> <span className="action-name">예측:</span> <span className="action-desc">까마귀에 한해 가능하며 동물 선택 시간에만 가능합니다. 어떤 동물이 우승할지 선택하여 그 동물이 우승 시 자신도 우승하게 됩니다.</span></li>
                  <li><span className="action-icon kill"></span> <span className="action-name">끌:</span> <span className="action-desc">뱀을 제외한 모든 동물이 가능하며 투표 시간에 가능합니다. 끌을 지역에 있는 사람만 죽일 수 있다. 자신보다 높은 서열의 동물인 경우 죽일 수 없고 살해당한다. 뱀이 공격받은 경우 공격한 사람이 역으로 죽게 된다. 누가 누구를 끌 시도했는지는 지역에 있는 사람만 알 수 있고 살해됐다는 메시지가 뜬다. 끌의 성공했을 경우 모든 지역에 누가 죽었는지가 표시된다, 실패 시 해당 지역에만 표시된다.</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="animal-table-container card slide-in-up">
          <h2>동물 정보</h2>
          <div className="table-responsive">
            <table className="rules-table">
              <thead>
                <tr>
                  <th>동물</th>
                  <th>서식지</th>
                  <th>승리조건</th>
                  <th>패배조건</th>
                  <th>주 거주지역</th>
                  <th>하늘진입가능여부</th>
                  <th>비고</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="animal-name animal-tier-1">사자</td>
                  <td>1순위</td>
                  <td></td>
                  <td>사망</td>
                  <td>들</td>
                  <td>X</td>
                  <td>한 라운드만 굶어도 사망</td>
                </tr>
                <tr>
                  <td className="animal-name animal-tier-2">악어</td>
                  <td>2순위</td>
                  <td>생존</td>
                  <td>사망</td>
                  <td>강</td>
                  <td>X</td>
                  <td>두 라운드 굶을 시 사망</td>
                </tr>
                <tr>
                  <td className="animal-name animal-tier-3">독수리</td>
                  <td>3순위</td>
                  <td></td>
                  <td></td>
                  <td>하늘</td>
                  <td>O</td>
                  <td>세 라운드 굶을 시 사망</td>
                </tr>
                <tr>
                  <td className="animal-name animal-tier-4">하이에나</td>
                  <td>4순위</td>
                  <td>사자의 사망</td>
                  <td>사자의 생존</td>
                  <td>들</td>
                  <td>X</td>
                  <td></td>
                </tr>
                <tr>
                  <td className="animal-name animal-tier-5">뱀</td>
                  <td></td>
                  <td>사자의 생존</td>
                  <td>사자의 사망</td>
                  <td>숲</td>
                  <td>X</td>
                  <td></td>
                </tr>
                <tr>
                  <td className="animal-name animal-tier-5">악어새</td>
                  <td></td>
                  <td>악어의 생존</td>
                  <td>악어의 사망</td>
                  <td>강</td>
                  <td>O</td>
                  <td>엿보기 때 2명을 엿볼 수 있음</td>
                </tr>
                <tr>
                  <td className="animal-name animal-tier-5">까마귀</td>
                  <td></td>
                  <td>지목한 인물의 승리</td>
                  <td>지목한 인물의 패배</td>
                  <td>하늘</td>
                  <td>O</td>
                  <td></td>
                </tr>
                <tr>
                  <td className="animal-name animal-tier-5">카멜레온</td>
                  <td></td>
                  <td>생존</td>
                  <td>사망</td>
                  <td>숲</td>
                  <td>X</td>
                  <td>다른 동물로 위장할 수 있음</td>
                </tr>
                <tr>
                  <td className="animal-name animal-tier-5">뱀</td>
                  <td>피식자</td>
                  <td>9명 이상 사망</td>
                  <td>5명 이상 생존</td>
                  <td>숲</td>
                  <td>X</td>
                  <td>자신을 공격한 동물이 역으로 사망</td>
                </tr>
                <tr>
                  <td className="animal-name animal-tier-5">토끼</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td>숲</td>
                  <td>X</td>
                  <td></td>
                </tr>
                <tr>
                  <td className="animal-name animal-tier-5">사슴</td>
                  <td></td>
                  <td>생존</td>
                  <td>사망</td>
                  <td>들</td>
                  <td>X</td>
                  <td></td>
                </tr>
                <tr>
                  <td className="animal-name animal-tier-5">수달</td>
                  <td></td>
                  <td>생존</td>
                  <td>사망</td>
                  <td>강</td>
                  <td>X</td>
                  <td>이 중 생존한 모든 동물이 한 군데에 모일 시 죽지 않음</td>
                </tr>
                <tr>
                  <td className="animal-name animal-tier-5">청둥오리</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td>하늘</td>
                  <td>O</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="home-footer">
        <p>© 2025 먹이사슬 게임 | 더 지니어스: 룰 브레이커 기반</p>
      </div>
    </div>
  );
};

export default HomePage;
