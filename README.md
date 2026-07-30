# Ready To Destroy

- ZIP 파일: Ready_To_Destroy_수정.zip
- 배포 URL: https://github.com/roleflobot/game.git
- 장르: 탑다운 슈팅 / 회피 아케이드

## 🎮 게임명

Ready To Destroy

## 🕹️ 조작법

- 이름 입력 후 <code style="color:#0969da">Enter</code> 또는 <code style="color:#0969da">전투 시작</code> 버튼: 게임 시작
- 방향키 또는 <code style="color:#0969da">W</code> / <code style="color:#0969da">A</code> / <code style="color:#0969da">S</code> / <code style="color:#0969da">D</code>: 상하좌우 및 대각선 이동
- <code style="color:#0969da">Space</code>: 레이저건 발사
- 공격 모듈 보유 상태에서 <code style="color:#0969da">X</code> 또는 <code style="color:#0969da">M</code>을 누른 상태로 <code style="color:#0969da">Space</code>: 공격강화 활성화
- BOLT 활성 중 <code style="color:#0969da">X</code> 또는 <code style="color:#0969da">M</code>을 누른 상태로 <code style="color:#0969da">Space</code> 길게 누르기: 자동 연사
- PAUSE 버튼(화면 우상단): 일시정지 / 재개
- 게임오버 후 새 이름 입력 및 <code style="color:#0969da">Enter</code>: 재출격

## 📖 게임 설명

우주 함선을 조종하며 위에서 돌격해 오는 적을 파괴하는 탑다운 슈팅 게임입니다.<br>
적을 레이저건으로 격추할 때마다 50점을 획득하며, 아이템을 모으면 다방향 사격·속사·실드를 사용할 수 있습니다.<br>
아이템을 장시간 획득하지 못하면 드롭률이 점진적으로 상승하며, 20킬 또는 60초 공백에는 다음 드롭 기회가 보장됩니다.<br>
적과 충돌할 때마다 목숨을 하나 잃고, 세 개의 목숨을 모두 잃으면 함선 폭발 후 게임이 종료됩니다.<br>
게임오버 후에는 내 점수와 로컬 TOP 10 순위를 확인하고 새로운 이름으로 다시 도전할 수 있습니다.<br>
전투 중에는 바흐의 `English Suite No. 2 in A minor, BWV 807 — I. Prélude`가 유리 질감의 신스·옥타브 쉬머·스테레오 에코를 입힌 우주풍 MIDI BGM으로 반복 재생됩니다.

## 💡 이 게임의 자랑거리 (선택)

서로 다른 움직임과 내구도를 가진 적 3종과 격추되지 않은 적의 역공 시스템을 구현했습니다.<br>
TRIDENT와 BOLT 충전을 모아뒀다가 X 또는 M을 누른 상태로 Space를 누르면 6방향 자동 연사 같은 강력한 집중 공격이 가능합니다.<br>
플레이어는 시간이 지날수록 더욱 빠르고 빈번하게 몰려오는 적을 격추해야 합니다.<br>
많은 총알이 동시에 발사되어도 부드럽게 실행되도록 캔버스 배치 렌더링으로 최적화했습니다.<br>
한글·영문·숫자·특수기호 이름 입력과 브라우저에 저장되는 TOP 10 점수 순위도 지원합니다.

## 🎵 BGM

바흐의 작품 자체는 공개 도메인이며, 게임에 포함된 MIDI 편집본은 Reccmo의 파일을 바탕으로 합니다.
MIDI 자산은 CC BY-NC-SA 3.0 조건을 따르며 자세한 출처와 라이선스는 `assets/BGM_SOURCE.md`에 기록했습니다.
게임 효과음 없이 음악만 들으려면 `bgm-preview.html`을 열고 PLAY를 누르면 됩니다.

---

### ✅ 제출 전 확인

- [x] 새로고침한 뒤 이름을 입력하면 게임이 시작된다
- [x] 조작법이 게임 화면에 보인다
- [x] 점수와 종료 조건이 있다
- [x] 한 판이 끝나고 다시 시작할 수 있다
- [x] 다시 시작을 빠르게 두 번 눌러도 정상이다
