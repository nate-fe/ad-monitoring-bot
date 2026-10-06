# 광고 스크립트 생성기 — 정리 문서

다른 프로젝트(광고 스크립트 개발 플랫폼 등)에 이 기능을 옮길 때 필요한 내용을 한 곳에 모은 문서입니다. 화면 구성, 설정 항목, 생성 규칙, 검증 규칙, 실행 검사, 옮길 때 필요한 모듈까지 다룹니다.

## 1. 무엇을 하는 도구인가

Biz팀 요청(광고 업체, 사이즈, uid, 애즈 코드)을 받아 **애즈에 바로 라이브할 수 있는 광고 스크립트 한 벌**을 만들어 줍니다. 요청마다 비슷한 코드를 손으로 복사·수정하던 작업을 폼 입력으로 바꾸는 것이 목적입니다.

- 쓰는 사람: 광고 스크립트 개발자(주), Biz팀(태그 붙여넣기·실행 검사 결과 확인)
- 저장하지 않음: 상품 목록, 이력, 설정 공유 기능 없음. 한 번에 스크립트 하나를 만드는 도구입니다.
- 출력: 다른 파일에 의존하지 않는 IIFE 한 벌. 주석 없음.

## 2. 화면

| 영역 | 내용 |
| --- | --- |
| 상단 | 제목, "처음부터 다시" (입력값 전체 초기화, 확인 후) |
| 왼쪽 | ① 광고 업체 태그로 채우기 ② 광고 태그 ③ 광고 종류 ④ 고급 설정(접힘, 옵션 포함) |
| 오른쪽 | 검증 경고, 실행 검사 결과 한 줄, 코드 |

**왼쪽 폼은 최대한 고르게 만듭니다.** Biz팀이 다루기 쉽게 자주 쓰는 값은 칩으로 보여 주고, 목록에 없을 때만 "직접 입력"을 엽니다. 칩 값은 `src/ads`의 2025~2026 스크립트에서 많이 쓰인 순서로 골랐습니다(`src/make/choices.ts`). 태그로 채운 값이 목록에 없으면 자동으로 "직접 입력"으로 보입니다. URL, slot, layout-key, 태그 속성, 초기화 코드, 원본 HTML처럼 요청마다 다른 값만 직접 입력합니다.

"예시에서 시작"(기존 코드 패턴 7종을 고르는 선택창)은 넣지 않습니다. 패턴 이름이 개발자 기준이라 Biz팀이 고르기 어렵고, 고르는 순간 입력값을 덮어씁니다.

광고 위치는 방식을 고르지 않고 **광고 태그**로 정합니다. 광고 태그를 고르면 그 태그에 맞는 선택자의 요소에, 고르지 않으면 `document.currentScript`의 부모 요소에 넣습니다.

## 3. 설정 항목

### 광고 업체 태그로 채우기 (선택)

요청서의 예시 태그를 붙여넣으면 종류와 값이 자동으로 채워집니다. 태그는 `DOMParser`로 분석만 하고 실행하지 않습니다.

| 붙여넣은 것 | 인식 결과 |
| --- | --- |
| `<iframe src=… width height scrolling …>` | iframe · URL, 크기, scrolling, referrerpolicy, 그 외 속성은 "추가 속성"으로 |
| `<ins class="adsbygoogle" …>` (+ script) | 애드센스 · client, slot, 형식(고정·반응형·인아티클·인피드), layout-key |
| 외부 script + `ins`/`div` | 외부 script · 스크립트 URL, 태그 class·속성, 인라인 코드는 초기화 코드로 |
| `document.write`가 있는 태그, script만 있는 태그 | 원본 태그 (격리 실행) |
| URL 한 줄 | iframe URL |

메신저에서 붙은 `[https://…](https://…)` 형태의 링크 흔적은 지우고 원래 URL만 남깁니다.

### 광고 태그 (선택)

광고 태그는 `news@view2_middle3`처럼 `섹션@지면_포지션` 형태의 값입니다. 스크립트 대시보드의 "광고 태그"와 같은 값입니다. **서비스 → 광고 태그** 순서로 고르면, 그 태그에서 쓰던 광고 위치 선택자가 생성 코드에 들어갑니다(`src/make/adTags.ts`).

- 서비스: 지정 안 함(스크립트 자리) / 뉴스 / 판 / 메인 / 스포츠·연예 / 직접 입력
- 광고 태그: 고른 서비스의 광고 태그 목록. 예: 뉴스 → `news@view_middle3`, `news@view2_middle3`
- 화면(select 항목과 안내 문구)에는 선택자를 보여 주지 않습니다. 예: `news@view_middle3` → 코드에 `document.getElementById('ad_innerView')`. 선택자를 쓰는 곳은 "직접 입력"뿐입니다.
- 지면마다 "기사뷰 중간광고 상단" 같은 이름을 붙이지 않고 광고 태그를 그대로 씁니다. 영역 이름은 팀 안에서도 정해진 게 없어 오히려 헷갈립니다.

| 고른 것 | 생성 코드 |
| --- | --- |
| 지정 안 함, 또는 스크립트 자리를 쓰는 태그 | `document.currentScript`의 부모. 없거나 `<head>`면 중단 |
| `#id`를 쓰는 태그 (직접 입력 포함) | `document.getElementById('id')` |
| 그 밖의 선택자 (직접 입력) | `document.querySelector(…)` |

태그별 선택자는 `src/ads`의 광고 태그 폴더마다 광고를 넣는 요소를 세어 가장 많이 쓴 것으로 정했습니다. backup·테스트 폴더는 뺐습니다. 선택자가 하나로 모이지 않는 태그(앵커 광고, 크리테오 PC 지면 등)는 목록에 넣지 않았고, 이런 태그는 "직접 입력"을 씁니다. 새 광고 태그가 생기거나 지면의 마크업이 바뀌면 `adTags.ts`를 고쳐야 합니다.

**상위 프레임 높이 맞춤도 광고 태그에 묶습니다.** 상위 문서의 어떤 요소 높이를 바꿀지는 광고 태그마다 정해져 있어서, Biz팀이 고르게 하지 않고 태그를 고르면 자동으로 켜지게 했습니다. 최근(2025~2026) 스크립트 대부분이 같은 요소를 바꾸는 태그만 넣었습니다.

| 광고 태그 | 높이를 맞추는 요소 |
| --- | --- |
| `mob@news_Middle1`, `mob@pann_Middle1` | parent의 `#ifr_main_banner`와 그 안 iframe, parent.parent의 `#ifr_ad_shopbox` |
| `news@bt_Position3` | parent의 `#ifr_ad_bottom`과 그 안 iframe, parent.parent의 `#ifr_main_banner` |

다른 태그로 바꾸면 자동으로 켰던 설정은 꺼집니다. 직접 켠 설정은 그대로 둡니다. 근거가 약한 태그(`best@nview_Bottom`의 `#ad_big2` 29개 중 9개, `mob@pannback_Top3`의 `#ad_big` 6개 중 2개 등)는 자동으로 켜지 않고, 필요하면 고급 설정에서 직접 켭니다.

선택자가 있는 태그를 골랐는데 실행할 때 요소가 없으면 `console.warn('[AD] … 없음')`을 남기고 멈춥니다. 스크립트 부모로 넘어가지 않습니다. 넘어가면 광고가 엉뚱한 자리에 들어가 레이아웃이 깨질 수 있기 때문입니다. 태그로 채우기는 이 칸을 채우지 않습니다(업체 태그의 id는 광고 자리를 가리키는 값이 아님).

`src/ads`의 기존 코드는 고정 id로 위치를 찾는 것이 절반 가까이(508개 중 238개)라 광고 종류보다 먼저(②) 고르게 둡니다. 어느 광고 태그에 넣을지가 요청서에서 가장 먼저 정해지는 값이기도 합니다.

### 광고 종류 (필수)

| 종류 | 입력 항목 |
| --- | --- |
| iframe | URL, 크기(W×H 칩: 300×250, 320×100, 320×200, 250×250, 728×90, 970×120, 160×600) |
| 애드센스 | client(기본값 네이트 `ca-pub-8710503230568572`), slot, 형식, 인피드면 layout-key, 반응형이면 full-width-responsive, 고정 크기면 W×H |
| 외부 script | 스크립트 URL, 광고 태그(ins/div)·class, 태그 속성(`key=value` 여러 줄, `{w}` `{h}` 치환), 초기화 코드·시점(로드 후/바로), 크기(선택) |
| 원본 태그 | 광고 업체 원본 HTML, 크기(W×H) |

### 옵션 (칩 4개, 고급 설정 안)

옵션은 고급 설정 맨 위에 둡니다. 켠 옵션의 세부 설정은 칩 바로 아래에 열립니다. 고급 설정이 접혀 있어도 제목 옆에 "옵션 N개 켜짐"이 보입니다.

| 옵션 | 기본 | 켜면 열리는 설정 |
| --- | --- | --- |
| AD 라벨 | 끔 | 문구(AD·광고·직접), 위치(좌상단·우상단·좌하단·우하단) |
| 지연 로드 | 끔 | 없음. 영역이 화면 200px 안에 들어오면 그림 (`IntersectionObserver`) |
| 광고 없으면 숨김 | 끔 | 애드센스에서만. 숨기는 방식(빈 광고만 CSS로 / 영역까지 상태 감시로). 상태 감시면 숨길 영역, 응답 전에 접어 둘 영역, 광고 있을 때 아래 여백 |
| 상위 프레임 높이 맞춤 | 끔 (일부 광고 태그는 자동으로 켜짐) | 높이를 바꿀 상위 문서 요소 목록(단계: parent / parent.parent, 선택자 — 여러 개), frameElement로 바꿀 iframe(바꾸지 않음 / 광고를 감싼 iframe = `window.frameElement` / 그 바깥 iframe = `parent.frameElement`)과 iframe name, 높이(광고 높이에 맞춤·직접) |

### 고급 설정

개발자용 값만 둡니다.

- **`_adArea` 스타일**: 너비, 여백(margin), 높이 — 지정한 것만 코드에 들어감. 광고 div class
- **iframe 속성**: scrolling, referrerpolicy, title, frameborder, 추가 속성
- **외부 script**: 태그 스타일
- **코드**: try/catch, 외부 script 1회만 로드
- **추가 CSS**: 입력하면 `<style>` 하나로 삽입

## 4. 코드 생성 규칙

항상 아래 순서를 따르고, 해당 없는 단계는 건너뜁니다. 순서를 고정해 두면 어떤 조합이든 코드 모양이 같아 검수가 쉽습니다.

1. `(function () {` → try/catch가 켜져 있으면 `try {`
2. 크기를 쓰는 광고면 `var _adWidth`, `var _adHeight`
3. 위치: 광고 위치 선택자가 있으면 그 요소(`#id`면 `getElementById`), 없으면 중단. 선택자가 없으면 `document.currentScript` → `parentNode`, 없거나 `<head>`면 중단
4. 지연 로드면 이후 단계를 `_render` 함수로 감쌈 (`currentScript`는 그 밖에서 미리 잡음)
5. `_adArea` 스타일 (입력한 것만)
6. 광고를 담을 div 생성 → `textAlign = 'center'` → `_adArea.appendChild`
7. 추가 CSS와 "CSS로 숨김" 규칙을 `<style>` 하나로 삽입
8. AD 라벨이 켜져 있으면 `position:relative` 홀더 생성
9. 광고 요소 생성 후 삽입 (애드센스 `ins`는 push 전에 DOM에 있어야 함)
10. AD 라벨
11. 광고 없을 때 처리 (`MutationObserver`로 `data-ad-status` 한 번만 확인)
12. 외부 스크립트 로드 → 초기화 (애드센스 push는 로드를 기다리지 않음)
13. 상위 프레임 높이 맞춤: 상위 문서 요소마다 `_fit(parent 또는 parent.parent, 선택자)`로 따로 시도(한 단계가 다른 도메인이어도 나머지는 맞춤), 그다음 frameElement
14. `} catch (e) { console.warn('[AD]', e); }` → `})();`

**문자열 처리**: 입력값은 작은따옴표 문자열로 넣고 `\`, `'`, 줄바꿈을 이스케이프합니다. `</script`는 `<\/script`로 바꿔 HTML 안에 인라인으로 들어가도 깨지지 않게 합니다.

**크기**: `width`/`height` 속성과 인라인 스타일을 모두 넣습니다. 속성만 넣으면 서비스 CSS(`iframe{height:auto}` 등)에 밀립니다.

### 출력 예시 — iframe

```js
(function () {
  try {
    var _adWidth = 300;
    var _adHeight = 250;

    var _script = document.currentScript;
    var _adArea = _script && _script.parentNode;
    if (!_adArea || _adArea === document.head) return;

    var _box = document.createElement('div');
    _box.style.textAlign = 'center';
    _adArea.appendChild(_box);

    var _iframe = document.createElement('iframe');
    _iframe.src = 'https://ad.3dpop.kr/web_ad/?company_uid=abcd&position=center&isCloseBtn=N';
    _iframe.width = _adWidth;
    _iframe.height = _adHeight;
    _iframe.setAttribute('frameborder', '0');
    _iframe.setAttribute('scrolling', 'no');
    _iframe.style.cssText = 'border:0;vertical-align:top;max-width:100%';
    _iframe.style.width = _adWidth + 'px';
    _iframe.style.height = _adHeight + 'px';
    _box.appendChild(_iframe);
  } catch (e) {
    console.warn('[AD]', e);
  }
})();
```

### 출력 예시 — 애드센스 인피드 + 접기

```js
var _fold = _ins.closest('.feed-item.ad');
if (_fold) {
  _fold.style.overflow = 'hidden';
  _fold.style.height = '0px';
  _fold.style.minHeight = '0px';
}
new MutationObserver(function (_m, _ob) {
  var _status = _ins.getAttribute('data-ad-status');
  if (!_status) return;
  _ob.disconnect();
  if (_status === 'unfilled') {
    var _hide = _ins.closest('.adloader');
    if (_hide) _hide.style.display = 'none';
  } else if (_fold) {
    _fold.style.overflow = '';
    _fold.style.height = '';
    _fold.style.minHeight = '';
    _fold.style.marginBottom = '8px';
  }
}).observe(_ins, { attributes: true, attributeFilter: ['data-ad-status'] });
```

응답 전에 `display:none`을 거는 방식은 제공하지 않습니다. 너비가 0이 되면 fluid 광고가 `availableWidth=0` 오류로 렌더링에 실패합니다.

## 5. 검증 규칙

오류가 있으면 복사 버튼을 막고, 주의·안내는 막지 않습니다.

| 등급 | 조건 |
| --- | --- |
| 오류 | 크기 미입력(크기를 쓰는 광고), iframe URL 미입력, 애드센스 client 형식(`ca-pub-숫자`)·slot 미입력, 인피드인데 layout-key 없음, 원본 태그 비어 있음, 선택자(광고 위치·접을 요소·숨길 요소·상위 문서 요소) 문법 오류 |
| 주의 | `http://` URL(혼합 콘텐츠), 초기화 코드에 `document.write`, 상위 프레임 옵션인데 바꿀 대상이 없음, 또는 요소·name 둘 다 없이 frameElement를 바꿈, 형식이 이상한 URL |
| 안내 | `//`로 시작하는 URL, 상위 문서가 다른 도메인이면 높이 맞춤이 건너뛰어짐 |

## 6. 실행 검사

생성된 코드를 보이지 않는 가상 페이지의 인라인 `<script>`로 넣어 **광고 있음 / 광고 없음 두 번 실제로 실행**하고, 결과만 검증 경고 아래에 한 줄로 보여 줍니다. 가상 페이지 화면은 보여 주지 않습니다. 광고 서버를 부르지 않아 실제 광고 모습은 볼 수 없으므로, 화면을 띄워 봐야 얻는 정보가 적기 때문입니다.

- 실행 시점: 입력이 0.6초 멈추면 자동 실행. 검증 오류가 있으면 실행하지 않습니다.
- 잡는 것: 실행 중 예외(`Uncaught …`, try/catch가 잡은 `[AD]` 경고), `availableWidth=0` 같은 애드센스 오류, 광고 영역에 아무것도 넣지 못한 경우(위치를 못 찾았거나 중간에 멈춤), 5초 안에 끝나지 않은 경우.
- 한쪽 응답에서만 난 오류는 "광고 없음일 때: …"처럼 표시합니다.
- 실행 오류는 복사를 막지 않습니다. 업체 SDK가 없어서 나는 오류도 섞일 수 있기 때문입니다.

가상 페이지는 다음처럼 만듭니다.

- 실제 광고 서버는 호출하지 않습니다. 문서마다 CSP로 외부 요청을 막고, iframe `src`는 자리 표시 `srcdoc`으로, 외부 스크립트는 `type="text/x-sim"`으로 바꿔 받아오지 않고 `onload`만 흉내 냅니다. 그래서 CORS 문제가 생기지 않습니다.
- `adsbygoogle`은 가짜 구현으로 대체해 push마다 `ins` 하나를 처리하고 `data-ad-status`를 설정합니다. `ins` 너비가 0이면 실제와 같은 `availableWidth=0` 오류를 냅니다.
- 지연 로드는 탭이 백그라운드여도 검사되도록 광고 영역이 바로 화면에 들어온 것으로 처리합니다.
- 상위 프레임 옵션을 켜면 **최상위 페이지(parent.parent) → `iframe[name]` → 상위 문서(parent) → iframe → 광고 문서** 구조로 만들고, 높이를 바꿀 상위 요소를 각 단계 문서에 만들어 둡니다.
- 접기·숨김 선택자를 쓰면 `.feed-item.ad > .adloader` 구조가 있는 피드 페이지에서, 그 밖에는 기사 본문 페이지에서 실행합니다.

## 7. 파일 구조와 옮길 때 필요한 것

현재 구현은 Vite + React + TypeScript입니다.

| 경로 | 역할 | 의존성 |
| --- | --- | --- |
| `src/config.ts` | 설정 타입, 기본값, 종류 설명 | 없음 |
| `src/choices.ts` | 폼에서 고르는 값 목록 | 없음 |
| `src/adTags.ts` | 서비스·광고 태그 → 광고 위치 선택자 | 없음 |
| `src/lib/generate.ts` | `generate(config): string` | 없음 (순수 함수) |
| `src/lib/validate.ts` | `validate(config): Warning[]` | `document.querySelector` (선택자 문법 확인) |
| `src/lib/parseTag.ts` | `parseTag(text): Parsed \| null` | `DOMParser` |
| `src/lib/sim.ts`, `src/lib/simStub.ts` | 실행 검사용 가상 문서 조립, 응답 스텁 | 브라우저 |
| `src/components/*` | 폼, 코드, 실행 검사 | React |
| `src/styles.css` | 전체 스타일 (CSS 변수, 라이트·다크) | 없음 |
| `ad-script-generator.html` | React 이전의 단일 HTML 버전 | 없음 |

**다른 프로젝트에 옮길 때**: `config.ts` + `generate.ts`만 가져가면 코드 생성이 됩니다. React나 외부 라이브러리에 의존하지 않습니다. 검증과 태그 분석은 브라우저 API만 쓰고, 실행 검사는 보이지 않는 iframe을 쓰므로 화면 어디에 붙여도 됩니다.

## 8. 의도적으로 넣지 않은 것

| 뺀 기능 | 이유 |
| --- | --- |
| 상품 목록, 생성 이력, 설정 저장·공유 | 데이터를 쌓는 것이 목적이 아님 |
| 코드 주석 | 라이브되는 코드에는 불필요 |
| 중복 실행 방지 | 스크립트마다 자기 부모에만 광고를 넣어 중복이 거의 없음 |
| 위치 방식 선택 UI(ID·선택자·스크립트 부모 중 고르기) | 입력칸 하나로 처리. 선택자를 입력하면 그 요소, 비우면 스크립트 부모 |
| 실제 광고 서버 호출, 가상 페이지 화면 미리보기 | 외부 호출이 막히는 환경이 있고, 실제 노출은 라이브 후 확인이 현실적 |
| 코드 압축 | 짧고, 읽을 수 있어야 검수가 쉬움 |

## 9. 남은 결정 사항

- **복사 형식**: 애즈 플랫폼이 순수 JS를 받는지, `<script>` 태그까지 받는지에 따라 복사 형식 토글이 필요합니다.
- **`!important` 대응**: 서비스 CSS가 `!important`로 iframe 크기를 강제하는 영역이 있으면, 인라인 스타일도 밀립니다. 그런 영역이 있으면 `setProperty(..., 'important')` 방식이 필요합니다.
- **광고 종류 추가**: 지금 4종으로 커버되지 않는 형태가 나오면, 종류를 늘릴지 옵션으로 흡수할지 판단이 필요합니다.
