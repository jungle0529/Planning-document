# Handoff: Unit Tour — 85" 세로형 터치 사이니지 VR 유닛 투어

## Overview
아파트 견본주택/모델하우스용 **인터랙티브 VR 유닛 투어** 키오스크입니다.
85인치 세로형 터치 TV(포트레이트)에 전체화면으로 띄워, 방문객이 직접 손으로 화면을 돌려
유닛 내부 15개 공간을 360° 파노라마로 둘러보고, 타입 변경 / 평면 / 입체평면 / DP / 자동투어를 조작합니다.

## About the Design Files
이 번들의 파일들은 **HTML로 만든 디자인 레퍼런스(프로토타입)** 입니다. 그대로 배포할 프로덕션 코드가 아닙니다.
목표는 이 HTML 디자인을 **대상 코드베이스의 기존 환경(React / Vue / Next / Electron 키오스크 등)에서 그 패턴과 라이브러리로 재현**하는 것입니다.
아직 코드베이스가 없다면, 키오스크 상시구동에 적합한 스택을 선택해 구현하십시오(권장: React + Vite, 브라우저 키오스크 모드 또는 Electron).

단, `pano-view.js`(WebGL 파노라마 뷰어)는 프레임워크 비종속 순수 웹컴포넌트이므로 **그대로 재사용 가능**합니다.
파노라마 JPG와 도면 이미지는 실제 프로젝트 에셋이므로 그대로 사용하십시오.

## Fidelity
**High-fidelity (hifi).** 색상·타이포·간격·인터랙션이 최종안 기준으로 확정되어 있습니다. 픽셀 단위로 재현하십시오.
모든 수치는 **1085.3 × 1904.3 px 고정 캔버스 기준**이며, 실제 화면에는 비율 유지 스케일로 맞춰집니다.

---

## Canvas & Scaling
- 디자인 캔버스: **1085.3 × 1904.3 px** (세로형, 약 9:16)
- 대상 하드웨어: 85" 터치 TV, 세로 설치
- 스케일 방식: 뷰포트를 채우는 컨테이너(`100% × 100dvh`, 배경 `#0a0a0a`) 안에서
  `scale = min(containerW / 1085.3, containerH / 1904.3)` 를 계산해
  `transform: translate(-50%, -50%) scale(s)` 로 중앙 정렬 (`transform-origin: 50% 50%`).
  `ResizeObserver`로 리사이즈 시 재계산.
- 캔버스 배경(파노라마 로딩 전): `#e8e6e2`
- `overscroll-behavior: none`, `-webkit-tap-highlight-color: transparent`, `user-scalable=no` 필수(키오스크 오작동 방지)

## Screens / Views
단일 화면 위에 **레이어 오버레이** 방식. 별도 라우팅 없음.

### 1) Tour (기본)
- 전체 화면 `<pano-view>` WebGL 파노라마 (`position:absolute; inset:0`)
- 캔버스 보정: `filter: contrast(1.1) saturate(1.06) brightness(.97)`
  (원본 파노라마가 가구 없는 백색 준공 상태라 면 경계가 잘 안 보임 — 보정 필수)
- 위에 상단 컨트롤 / 우측 기능 스택 / 하단 미니맵이 떠 있음

### 2) Plan (평면)
- `z-index: 12`, `inset: 0`, 배경 `#1a1a19`, `padding: 150px 170px`, flex center
- `assets/plan-84c.png` 를 `object-fit: contain` 으로 표시
- 열려 있는 동안 미니맵 숨김

### 3) Iso (입체 평면)
- Plan과 동일 스펙, 이미지만 `assets/iso-84.jpg`

### 4) DP 오버레이
- Tour 위 `z-index: 11`, `pointer-events: none`
- `background: linear-gradient(160deg, rgba(176,139,94,.18) 0%, rgba(176,139,94,.04) 55%, rgba(10,10,10,0) 100%)`
- (실제 구현 시 DP 시안 파노라마 세트로 교체하는 것을 권장 — 현재는 톤 오버레이로 대체 표현)

### 5) 조작 안내 (Help)
- `z-index: 40`, 전면 `rgba(10,10,10,.9)`, 화면 아무 곳이나 터치하면 닫힘
- 3개 항목(둘러보기 / 확대·축소 / 공간 이동), 각 항목 = 96px 아이콘 + 텍스트, 항목 간 `gap: 64px`, 아이콘-텍스트 `gap: 34px`
- 제목 40px/500 `#fff`, 설명 26px/300 `rgba(255,255,255,.5)`, 하단 안내문 26px/300 `rgba(255,255,255,.45)`

---

## Components (정확 수치)

### 상단 컨트롤 바
컨테이너: `position:absolute; left:0; right:0; top:84px; z-index:25`, column flex, `align-items:center`, `gap:20px`
행: row flex, `align-items:center`, `gap:26px` → `[← 버튼] [타입·공간 캡슐] [→ 버튼]`

**이전/다음 원형 버튼** (2개)
- 112 × 112px, `border-radius:50%`
- 배경 `rgba(14,14,13,.82)`, 테두리 `1px solid rgba(255,255,255,.18)`
- 그림자 `0 16px 48px rgba(0,0,0,.5)`
- 글리프 `←` / `→`, 42px / weight 300, `#fff`
- active: 배경 `rgba(255,255,255,.24)`

**타입·공간 캡슐**
- `padding:10px`, `gap:8px`, `border-radius:999px`
- 배경 `rgba(14,14,13,.82)`, 테두리 `1px solid rgba(255,255,255,.18)`, 그림자 `0 16px 48px rgba(0,0,0,.55)`
- 내부 구분선: `1px × 56px`, `rgba(255,255,255,.18)`, `margin: 0 4px`
- 각 버튼: `padding:22px 30px`, `border-radius:999px`, `gap:16px`
  - 라벨("타입"/"공간") 26px / 400 / `rgba(255,255,255,.6)`
  - 값("84A"/"거실") 42px / 500 / `letter-spacing:-.01em` / `#fff`
  - 캐럿 `▾`: 36×36 원형, 배경 `rgba(255,255,255,.16)`, 20px
  - 기본 배경 `rgba(255,255,255,.07)`, **열림 상태 배경 = accent**

**힌트 칩**
- "여기서 타입 · 공간을 바꿀 수 있어요", `padding:12px 26px`, `border-radius:999px`
- 배경 `rgba(14,14,13,.62)`, 25px / 400 / `#fff`, `pointer-events:none`

### 우측 기능 스택 (세로)
- `position:absolute; right:30px; top:700px; z-index:22`
- column flex, `gap:10px`, `padding:10px`, `border-radius:999px`
- 배경 `rgba(14,14,13,.72)`, 테두리 `1px solid rgba(255,255,255,.16)`, 그림자 `0 18px 50px rgba(0,0,0,.5)`
- 버튼 5개, 각 **108 × 108px** 원형 (터치 타깃 충분)
  1. 평면 — 사각 분할 아이콘 (42px)
  2. 아이소 — 큐브 아이콘 (42px)
  3. DP — 소파 아이콘 (44px)
  4. 자동투어 — 재생 아이콘 (42px)
  5. **?** — 조작 안내 (38px / 400), 위에 구분선 `1px, rgba(255,255,255,.14), margin:2px 18px`
- **비활성**: 배경 `rgba(255,255,255,.05)`, 테두리 `rgba(255,255,255,.16)`, 아이콘색 `rgba(255,255,255,.72)`
- **활성**: 배경 = accent, 테두리 = accent, 아이콘색 `#fff`
- `?` 버튼만 항상 배경 transparent, 색 `rgba(255,255,255,.7)`

### 하단 미니맵 (Tour에서만 표시)
- `position:absolute; left:50%; bottom:40px; margin-left:-310px; width:620px; z-index:20`
- 이미지 `assets/minimap-plan-alpha.png` — **흰 배경을 알파로 제거한 도면**, `opacity:.42`
- 현재 위치 핀: 26×26 원, 배경 = accent, 테두리 `4px solid #fff`, 그림자 `0 2px 10px rgba(0,0,0,.5)`
  - 위치 = 공간별 `pin: [x%, y%]` (아래 표), `margin:-13px 0 0 -13px` 로 중심 보정

### 타입 드롭다운
- `left:56px; right:56px; top:268px; z-index:30`, `padding:26px`, `border-radius:32px`
- 배경 `rgba(14,14,13,.96)`, 테두리 `1px solid rgba(255,255,255,.16)`, 그림자 `0 24px 60px rgba(0,0,0,.65)`
- 헤더 "타입 선택" 24px / 400 / `letter-spacing:.1em` / `rgba(255,255,255,.5)` / `margin-bottom:16px`
- 그리드 `repeat(4, 1fr)`, `gap:10px`
- 카드: `padding:20px 18px`, `border-radius:18px`, 이름 30px/500, 서브 20px/300
  - 미선택: 배경 `rgba(255,255,255,.05)`, 테두리 `rgba(255,255,255,.14)`, 서브 `rgba(255,255,255,.4)`
  - 선택: 배경/테두리 = accent, 서브 `rgba(255,255,255,.75)`

### 공간 드롭다운
- 컨테이너 스펙은 타입 드롭다운과 동일
- 헤더: 좌 "공간 이동", 우 "15곳" (22px / 300 / `rgba(255,255,255,.4)`)
- 그리드 `repeat(3, 1fr)`, `gap:10px`
- 카드: 높이 88px, `padding:0 18px`, `border-radius:18px`, `gap:10px`
  - 도트 11×11 원 (선택 `#fff` / 미선택 `rgba(255,255,255,.3)`)
  - 이름 25px / 400, `white-space:nowrap; overflow:hidden; text-overflow:ellipsis`

---

## Interactions & Behavior

### 파노라마 뷰어 (`pano-view.js`)
프레임워크 비종속 WebGL 커스텀 엘리먼트. 등장방형(equirectangular) 텍스처를 프래그먼트 셰이더로 직접 리프로젝션.

| API | 설명 |
| --- | --- |
| `setSrc(url, crossfade = true)` | 파노라마 교체. crossfade면 두 번째 텍스처 슬롯에 올려 `mix` 0→1로 프레임당 0.055씩 디졸브 |
| `setView(yaw, pitch)` | 시점 즉시 지정 (라디안) |
| `spinTo(yaw, dur = 900)` | 최단 경로 회전, easeOutCubic |
| `rotateBy(delta)` | 상대 회전 |
| `fov` (get/set) | 세로 화각(라디안), clamp **0.55 ~ 1.7** |
| `pitch` | clamp **-1.15 ~ 1.15** rad |
| 이벤트 | `loaded`, `viewchange({yaw,pitch})`, `interact`, `release` |

제스처
- 1포인터 드래그 = 회전. 감도 `k = (fov / clientHeight) * 1.35`
- 관성: 드래그 종료 후 yaw 감쇠 `0.94`, pitch 감쇠 `0.9` (프레임당)
- 2포인터 핀치 = 줌 (`fov *= prevDist / dist`)
- 휠 = 줌 (`fov += deltaY * 0.0012`), `preventDefault`
- `touch-action: none`, `setPointerCapture` 사용
- DPR 캡 2.0, `ResizeObserver`로 캔버스 백버퍼 리사이즈

### 공간 이동 `go(n, fade = true)`
1. 인덱스 순환: `(n + 15) % 15`
2. `setSrc(pano/{i}.jpg, fade)`
3. `setView(room.yaw ?? 0.5, 0.12)` — **초기 시선 필수**. yaw 0은 대부분 백색 벽 정면이라 빈 화면처럼 보임
4. `fov = 1.55`
5. 인접 공간(±1) 파노라마 **프리페치**
6. 열려 있던 드롭다운 닫기

### 자동투어
- 토글 ON: `setInterval(() => go(i + 1), 6000)`
- 토글 OFF 및 언마운트 시 `clearInterval`

### 키보드
- `ArrowRight` → 다음 공간, `ArrowLeft` → 이전 공간 (window 레벨 리스너)

### 토글 규칙
- 평면/아이소는 상호 배타 — 같은 버튼 재탭 시 tour 복귀
- 타입/공간 드롭다운은 상호 배타
- DP는 tour일 때만 시각적으로 적용
- 미니맵은 tour일 때만 표시

## State Management
```js
{
  i: 2,              // 현재 공간 인덱스 (기본 = 거실)
  type: "84A",       // 선택 타입
  typeOpen: false,
  spaceOpen: false,
  view: "tour",      // "tour" | "plan" | "iso"
  dp: false,
  auto: false,
  guide: false
}
```
파노라마 시점(yaw/pitch/fov)은 React state가 아니라 **뷰어 인스턴스 내부**에 둡니다(매 프레임 갱신이라 리렌더 유발 금지).
뷰어 인스턴스는 마운트 후 ref로 잡습니다(프로토타입은 `document.querySelector`로 60ms 폴링 — 실제 구현에선 ref 사용).

데이터 페칭 없음. ROOMS / TYPES는 정적 배열이며, 실서비스에서는 단지·타입별 API로 대체하십시오.

## Design Tokens

**Color**
| 토큰 | 값 | 용도 |
| --- | --- | --- |
| accent (default) | `#b08b5e` | 선택 상태, 핀, 안내 아이콘 |
| accent 대안 | `#3f6f5f` / `#16357a` / `#8c5a4a` | 단지 브랜드별 교체 |
| 페이지 배경 | `#0a0a0a` | 캔버스 외곽 레터박스 |
| 캔버스 배경 | `#e8e6e2` | 파노라마 로딩 전 |
| 오버레이 배경 | `#1a1a19` | 평면 / 아이소 |
| 패널 | `rgba(14,14,13,.82)` / `.72` / `.62` / `.96` | 상단·우측·힌트·드롭다운 |
| 보더 | `rgba(255,255,255,.18)` / `.16` / `.14` | |
| 비활성 표면 | `rgba(255,255,255,.05)` / `.07` | |
| 텍스트 | `#fff` / `rgba(255,255,255,.72)` / `.6` / `.5` / `.4` | |

**Typography** — Noto Sans KR (300/400/500/700), 보조 Barlow Condensed (300/500)
| 역할 | 크기 / 굵기 |
| --- | --- |
| 컨트롤 값 (84A, 거실) | 42px / 500, `-.01em` |
| 안내 제목 | 40px / 500 |
| 타입 카드 이름 | 30px / 500 |
| 힌트 칩, 공간 카드, 안내 설명 | 25–26px / 400·300 |
| 라벨, 섹션 헤더 | 24–26px / 400 (헤더 `letter-spacing:.1em`) |
| 서브 텍스트 | 20–22px / 300 |
> 최소 24px 이상 — 85" 대형 화면 원거리 가독성 기준.

**Radius** — 원형 `50%` (112 / 108 / 36 / 26 / 11px), 캡슐 `999px`, 패널 `32px`, 카드 `18px`
**Shadow** — `0 16px 48px rgba(0,0,0,.5)` / `0 18px 50px rgba(0,0,0,.5)` / `0 24px 60px rgba(0,0,0,.65)` / `0 2px 10px rgba(0,0,0,.5)`
**Spacing** — 4 · 8 · 10 · 16 · 20 · 26 · 30 · 40 · 56 · 84 px

## Assets
| 파일 | 내용 |
| --- | --- |
| `pano/0.jpg` ~ `pano/14.jpg` | 공간별 360° 등장방형 파노라마, **4096 × 2048** (가구 없는 준공 상태) |
| `pano/t0.jpg` ~ `pano/t14.jpg` | 썸네일 (현 디자인 미사용, 공간 선택 UI 확장 시 사용) |
| `assets/plan-84c.png` | 84C 평면도 (평면 오버레이) |
| `assets/iso-84.jpg` | 84 입체 평면 |
| `assets/minimap-plan-alpha.png` | 미니맵용 도면 — 원본 흰 배경을 밝기 기준으로 알파 제거한 PNG |
| `assets/minimap-plan.png` | 위 파일의 원본(흰 배경 포함) |

미니맵 알파 처리 방식(재생성 시 참고): 픽셀 밝기 `lum = .299R + .587G + .114B`,
`alpha = clamp((250 - lum) / 60, 0, 1) ^ 0.55`, RGB는 `#121211` 로 고정.

> ⚠️ 평면 오버레이는 84C 도면, 미니맵은 별도 샘플 도면입니다. 실서비스에서는 **선택 타입과 동일한 도면**으로 통일해야 합니다.

## Known Gaps (구현 시 정리 필요)
1. **타입 전환이 아직 파노라마와 연결되지 않음** — 현재 타입 선택은 라벨만 바뀝니다. 타입별 파노라마/도면 세트를 매핑해야 합니다.
2. **DP는 톤 오버레이로 임시 표현** — 실제로는 DP 적용 파노라마 세트를 별도로 로드하는 구조가 맞습니다.
3. **초기 시선(yaw)이 거실만 지정됨** — 나머지 14개 공간도 창·주방 등 특징이 보이는 각도로 지정 권장.
4. **공간별 핀 좌표는 육안 배치** — 실제 도면 좌표계로 재계산 권장.
5. 무인 상시구동을 고려해 **N분 무조작 시 초기 상태 복귀(어트랙트 모드)** 추가 권장.
6. WebGL 컨텍스트 손실(`webglcontextlost`) 복구 핸들러 미구현.

## Files
| 파일 | 설명 |
| --- | --- |
| `Unit Tour.dc.html` | 디자인 레퍼런스 원본(마크업 + 로직). 상단이 템플릿, 하단 `<script data-dc-script>` 가 컴포넌트 로직 |
| `Unit Tour (standalone).html` | 모든 에셋이 인라인된 단일 파일. 브라우저에서 바로 열어 동작 확인 가능 |
| `pano-view.js` | WebGL 파노라마 뷰어 웹컴포넌트 — **그대로 재사용 권장** |
| `assets/`, `pano/` | 이미지 에셋 전체 |

## Room List
| # | 공간명 | 그룹 | 미니맵 핀 (x%, y%) | 파노라마 | 썸네일 |
| --- | --- | --- | --- | --- | --- |
| 0 | 현관 | 진입 | 34, 20 | pano/0.jpg | pano/t0.jpg |
| 1 | 현관 · 복도 | 진입 | 40, 30 | pano/1.jpg | pano/t1.jpg |
| 2 | 거실 (기본 시작) | 거실 · 주방 | 39, 44 | pano/2.jpg | pano/t2.jpg |
| 3 | 거실 창가 | 거실 · 주방 | 33, 58 | pano/3.jpg | pano/t3.jpg |
| 4 | 주방 · 다이닝 | 거실 · 주방 | 53, 42 | pano/4.jpg | pano/t4.jpg |
| 5 | 주방 조리대 | 거실 · 주방 | 52, 26 | pano/5.jpg | pano/t5.jpg |
| 6 | 안방 | 안방 | 24, 73 | pano/6.jpg | pano/t6.jpg |
| 7 | 안방 드레스룸 | 안방 | 17, 63 | pano/7.jpg | pano/t7.jpg |
| 8 | 파우더룸 | 안방 | 16, 45 | pano/8.jpg | pano/t8.jpg |
| 9 | 부부욕실 | 안방 | 16, 38 | pano/9.jpg | pano/t9.jpg |
| 10 | 침실 1 | 침실 | 77, 28 | pano/10.jpg | pano/t10.jpg |
| 11 | 침실 2 | 침실 | 77, 70 | pano/11.jpg | pano/t11.jpg |
| 12 | 침실 3 | 침실 | 19, 24 | pano/12.jpg | pano/t12.jpg |
| 13 | 침실 4 | 침실 | 77, 60 | pano/13.jpg | pano/t13.jpg |
| 14 | 공용욕실 | 욕실 | 77, 51 | pano/14.jpg | pano/t14.jpg |

## Type List
59A(미건립) · 59B(건립) · 59C(미건립) · 59D(미건립) · **84A(건립)** · 84B(미건립) · 84C(미건립)
