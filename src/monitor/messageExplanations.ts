/**
 * 콘솔 메시지를 기획자도 알아볼 수 있는 말로 풀어 주는 사전.
 *
 * 리포트에 실제로 쌓인 메시지를 기준으로 만들었고, 규칙은 위에서부터 순서대로 검사하므로
 * **구체적인 문구를 항상 위에** 둔다(예: `status of 403` 이 `Failed to load resource` 보다 위).
 * 매칭되는 규칙이 없으면 배지를 달지 않는다 — 모르는 메시지를 '무시 가능'으로 보이게 하면 안 된다.
 *
 * 단계를 나누는 기준(새 규칙을 추가할 때도 이 순서로 판단한다):
 *
 * 1. **조치 필요** — 그 줄만 보고 "요청·스크립트가 실제로 실패했다"가 확정되고,
 *    실패한 대상이 광고를 띄우는 데 필요한 것일 때. (403·5xx, DNS 실패, 문법 오류, 차단된 리소스 등)
 * 2. **확인만** — 지금은 광고가 나오지만 조건이 바뀌면 깨질 수 있거나, 속도·스크롤 같은 품질만
 *    떨어질 때. 브라우저가 대신 처리해 주는 것, 그리고 **실패한 대상이 광고 표시가 아니라
 *    입찰·통계·추적용**이라 노출과 무관한 것도 여기다.
 * 3. **무시 가능** — 광고사·브라우저가 남긴 기록이거나 검사용 브라우저에서만 나는 것.
 *    우리 코드로 없앨 수 없고 없앨 필요도 없다.
 *
 * 「실패했을 수도 있다」는 조치 필요가 아니다. Mixed Content 가 대표적인데, 브라우저가 https 로
 * 바꿔 다시 요청하므로 그 줄만으로는 실패가 아니다(확인만). 승격한 요청이 실패하면 같은 주소로
 * `Failed to load resource` 줄이 따로 남고, 조치 필요는 그쪽이 맡는다.
 */

export type MessageExplainLevel = 'action' | 'watch' | 'noise'

export type MessageExplanation = {
  key: string
  level: MessageExplainLevel
  /** 배지를 눌렀을 때 맨 위에 뜨는 짧은 이름 */
  title: string
  /** 이 메시지가 무슨 뜻인지 — 개발 용어 없이 */
  meaning: string
  /** 광고 노출에 미치는 영향과 다음 행동 */
  action: string
}

export const MESSAGE_EXPLAIN_LEVEL_LABEL: Record<MessageExplainLevel, string> = {
  action: '조치 필요',
  watch: '확인만',
  noise: '무시 가능',
}

export const MESSAGE_EXPLAIN_LEVEL_HINT: Record<MessageExplainLevel, string> = {
  action: '광고가 안 나오거나 곧 안 나올 수 있습니다. 담당자·매체사 확인이 필요합니다.',
  watch: '지금 노출에는 지장이 없지만 알아 두어야 하는 안내입니다.',
  noise:
    '광고를 만든 회사의 프로그램이 스스로 남긴 기록입니다. 광고는 정상적으로 나오고 있고, 우리 쪽 코드로는 없앨 수 없습니다.',
}

type ExplainRule = MessageExplanation & { patterns: string[] }

const RULES: ExplainRule[] = [
  {
    key: 'mixed-content-blocked',
    level: 'action',
    title: '보안 연결이 아니라 브라우저가 차단함',
    meaning:
      '광고 태그가 옛날 방식(http)으로 부른 파일을 브라우저가 아예 막았습니다. 스크립트·프레임처럼 위험한 종류는 https로 바꿔 주지 않고 바로 차단합니다.',
    action: '그 소재는 확실히 안 나옵니다. 광고사에 https 주소로 바꿔 달라고 요청하세요.',
    patterns: ['must be served over https', 'this request has been blocked'],
  },
  {
    key: 'mixed-content-upgraded',
    level: 'watch',
    title: '옛날(http) 주소를 브라우저가 https로 바꿔 줌',
    meaning:
      '광고 태그에 http:// 주소가 남아 있지만, 브라우저가 알아서 https로 바꿔 다시 요청합니다. 그래서 이 줄만으로는 광고가 안 나온다는 뜻이 아닙니다.',
    action:
      '바꿔 요청한 것마저 실패하면 같은 주소로 「조치 필요」 줄(파일을 불러오지 못함·인증서 오류 등)이 따로 뜹니다. 그게 없으면 광고는 나온 것입니다. 다만 광고사가 https를 지원하지 않으면 언제든 깨질 수 있으니, 소재의 http:// 정리는 요청해 두는 편이 좋습니다.',
    patterns: ['mixed content'],
  },
  {
    key: 'http-403',
    level: 'action',
    title: '광고 서버가 요청을 거절함 (403)',
    meaning: '광고 서버가 "이 사이트에는 안 준다"고 응답했습니다.',
    action: '허용 도메인 미등록, 만료된 키, 계약 종료 등이 원인입니다. 해당 URL을 들고 광고사에 문의하세요.',
    patterns: ['status of 403'],
  },
  {
    key: 'http-400',
    level: 'action',
    title: '요청을 잘못된 형식으로 보냄 (400)',
    meaning: '광고를 부를 때 넘기는 값에 오타가 있거나 빠진 항목이 있습니다.',
    action: '광고 태그의 설정값(코드·영역 이름 등)이 맞는지 확인하세요.',
    patterns: ['status of 400'],
  },
  {
    key: 'http-5xx',
    level: 'action',
    title: '광고 서버 쪽 장애 (500번대)',
    meaning: '요청은 제대로 갔는데 광고 서버가 오류를 냈습니다.',
    action: '우리 쪽에서 고칠 수 없습니다. 한두 번은 일시적 장애지만 반복되면 광고사에 문의하세요.',
    patterns: ['status of 500', 'status of 502', 'status of 503', 'status of 504'],
  },
  {
    key: 'dns-not-resolved',
    level: 'action',
    title: '그 주소의 서버가 없음',
    meaning: '주소를 찾을 수 없습니다. 없어진 광고사이거나 주소에 오타가 있습니다.',
    action: '이미 죽은 태그일 가능성이 큽니다. 해당 광고를 계속 쓸지 확인하고 아니면 제거하세요.',
    patterns: ['err_name_not_resolved'],
  },
  {
    key: 'cert-invalid',
    level: 'action',
    title: '보안 인증서가 맞지 않음',
    meaning: '그 주소의 보안 인증서가 해당 도메인 것이 아닙니다.',
    action: '브라우저가 아예 차단하므로 광고가 안 나옵니다. 광고사에 인증서 확인을 요청하세요.',
    patterns: ['err_cert_'],
  },
  {
    key: 'blocked-not-same-origin',
    level: 'action',
    title: '다른 사이트 파일이라 브라우저가 막음',
    meaning:
      '광고 소재 이미지처럼 다른 사이트에 있는 파일을, 그 사이트가 외부 사용을 허용하지 않아 브라우저가 막았습니다.',
    action: '막힌 파일이 광고 소재면 그 자리가 빈 채로 보입니다. 출처 URL을 열어 어떤 소재인지 확인하고 광고사에 알리세요.',
    patterns: ['err_blocked_by_response'],
  },
  {
    key: 'network-unstable',
    level: 'action',
    title: '광고 서버 응답이 느리거나 끊김',
    meaning: '연결이 시간 초과되거나 중간에 끊겼습니다.',
    action: '한두 번은 일시적 문제입니다. 매일 같은 광고에서 반복되면 광고사 서버가 불안정한 것이니 문의 근거로 쓰세요.',
    patterns: ['err_timed_out', 'err_connection_reset', 'err_connection_closed', 'err_empty_response', 'err_failed'],
  },
  {
    key: 'url-not-allowed',
    level: 'watch',
    title: '허용 목록에 없는 주소를 불러 막힘',
    meaning:
      '광고 스크립트가 등록되지 않은 주소를 부르려다 막혔습니다. 여기서 막히는 것은 광고를 그리는 파일이 아니라 입찰·통계용 주소라서, 광고는 그대로 나옵니다.',
    action:
      '광고사가 알리지 않은 주소를 부르고 있다는 뜻이니, 허용 목록에 추가할 주소인지 한 번 확인해 두세요.',
    patterns: ['허용된 url이 아닙니다'],
  },
  {
    key: 'cors-blocked',
    level: 'watch',
    title: '광고사 서버가 데이터 읽기를 막음',
    meaning:
      '광고사 서버가 "네이트에서는 이 데이터를 못 읽는다"고 응답했습니다. 여기서 막히는 것은 소재가 아니라 집계·연동용 데이터라서, 광고는 그대로 나옵니다.',
    action: '광고사 서버 설정이라 우리가 못 고칩니다. 집계가 틀어져 보이면 그때 해당 도메인 허용을 요청하세요.',
    patterns: ['blocked by cors policy', 'access-control-allow-origin'],
  },
  {
    key: 'syntax-error',
    level: 'action',
    title: '스크립트 오타로 파일 전체가 안 돌아감',
    meaning: '광고 스크립트에 문법 오류가 있어서 그 파일이 통째로 실행되지 않습니다.',
    action: '소재 문구의 따옴표를 안 닫은 경우가 대부분입니다. 해당 광고는 100% 안 나오니 최우선으로 수정하세요.',
    patterns: ['unexpected identifier', 'unexpected string', 'unexpected token', 'unexpected end of input', 'syntaxerror'],
  },
  {
    key: 'not-defined',
    level: 'action',
    title: '있어야 할 기능이 없음',
    meaning: '스크립트가 부르려는 함수가 없습니다. 파일이 안 불러와졌거나 로딩 순서가 꼬였습니다.',
    action: '그 자리에서 실행이 멈추므로 광고 영역이 빈 채로 남습니다. 화면 캡쳐로 실제 노출을 확인하세요.',
    patterns: ['is not defined', 'is not a function'],
  },
  {
    key: 'undefined-property',
    level: 'action',
    title: '아직 없는 화면 요소를 건드림',
    meaning: '광고를 그릴 자리가 아직 만들어지기 전에 스크립트가 그 자리를 건드렸습니다.',
    action: '여기서 스크립트가 멈춰 뒤쪽 광고까지 영향을 줄 수 있습니다. 화면 캡쳐로 실제 노출을 확인하세요.',
    patterns: ['cannot read properties of', 'cannot read property'],
  },
  {
    key: 'csp-report-only',
    level: 'watch',
    title: '보안 정책 위반 — 기록만 함',
    meaning: '"report-only" 모드라 실제로 막지는 않고 기록만 합니다. 정책을 정식 적용하면 차단될 대상을 미리 알려 주는 것입니다.',
    action: '지금 노출에는 지장 없습니다. 보안 정책을 강화하기 전에 이 목록을 검토하세요.',
    patterns: ['report-only content security policy'],
  },
  {
    key: 'csp-blocked',
    level: 'action',
    title: '보안 정책에 막힘',
    meaning: '사이트 보안 정책이 허용하지 않는 주소라 실제로 차단됐습니다.',
    action: '해당 광고가 안 나옵니다. 정책에 주소를 추가할지, 광고를 뺄지 결정이 필요합니다.',
    patterns: ['content security policy'],
  },
  {
    key: 'deprecated-show-ads',
    level: 'watch',
    title: '구식 광고 라이브러리 (show_ads.js)',
    meaning:
      '구글이 더 이상 권장하지 않는 예전 광고 스크립트(show_ads.js)를 쓰고 있습니다. 라이브러리(파일) 자체를 새 것(adsbygoogle.js)으로 바꿔야 하는 안내입니다.',
    action: '지금은 정상 동작합니다. 태그 파일을 최신 방식으로 교체하는 일정을 잡아 두세요. API 한두 줄을 고치는 문제가 아닙니다.',
    patterns: ['deprecated show_ads.js', 'show_ads.js script'],
  },
  {
    key: 'deprecated-shared-id',
    level: 'watch',
    title: '구식 광고 라이브러리 (SharedId)',
    meaning:
      '사용자 식별용 SharedId 라이브러리가 더 이상 권장되지 않는다는 안내입니다. 특정 API가 아니라 그 라이브러리·연동 방식을 통째로 바꾸라는 뜻입니다.',
    action:
      '지금은 정상 동작합니다. GAM·Prebid 설정에서 SharedId 대신 권장 옵션(예: Prebid UserId)으로 교체 일정을 잡으세요.',
    patterns: ['sharedid library has been deprecated', 'sharedid library', 'deploy of the sharedid'],
  },
  {
    key: 'deprecated-library',
    level: 'watch',
    title: '구식 광고 라이브러리 사용 안내',
    meaning:
      '광고사가 배포한 스크립트·라이브러리 파일이 옛날 버전이라, 새 라이브러리로 갈아타라는 안내입니다. 코드 한 줄이 아니라 불러오는 파일/패키지를 바꾸는 쪽입니다.',
    action: '지금은 정상 동작합니다. 해당 라이브러리 교체 일정을 잡아 두세요.',
    patterns: ['library has been deprecated', 'library is deprecated', 'script has been deprecated'],
  },
  {
    key: 'deprecated-api',
    level: 'watch',
    title: '구식 API·메서드 사용 안내',
    meaning:
      '라이브러리는 그대로인데, 그 안의 예전 함수·설정 이름을 쓰고 있다는 안내입니다. 예: PubAdsService.set → setConfig, encryptedSignalProviders → secureSignalProviders.',
    action:
      '지금은 정상 동작합니다. 광고 태그에서 안내된 새 API 이름으로 바꾸면 해소됩니다. 라이브러리 파일 전체를 바꿀 필요는 보통 없습니다.',
    patterns: [
      'pubadsservice.set is deprecated',
      'encryptedsignalproviders',
      'using deprecated googletag',
      'is deprecated, use',
      'is deprecated. please use',
      'has been deprecated, use',
      'please use googletag.',
    ],
  },
  {
    key: 'deprecated-generic',
    level: 'watch',
    title: '구식 기능 사용 안내 (분류 미확정)',
    meaning:
      '광고사·브라우저가 "deprecated(구식)"이라고만 알려 준 안내입니다. 라이브러리 교체인지 API 교체인지 문구만으로는 단정하기 어렵습니다.',
    action: '지금은 정상 동작합니다. 출처 URL과 안내 문구를 보고 라이브러리인지 API인지 확인한 뒤 교체 일정을 잡으세요.',
    patterns: ['deprecated', 'is deprecated'],
  },
  {
    key: 'audio-autoplay',
    level: 'watch',
    title: '클릭 전에는 소리를 켤 수 없음',
    meaning: '사용자가 화면을 누르기 전에는 소리를 재생하지 못하게 하는 브라우저 규칙입니다.',
    action: '소리 있는 영상 광고에서 정상적으로 나오는 메시지입니다. 영상 자체는 무음으로 재생됩니다.',
    patterns: ['audiocontext was not allowed to start'],
  },
  {
    key: 'document-write',
    level: 'watch',
    title: '구식 문법·방식으로 화면에 끼워 넣음 (document.write)',
    meaning:
      '광고 태그가 페이지를 그리는 도중에 내용을 직접 써 넣는 옛날 JavaScript 방식을 씁니다. 라이브러리 이름이 바뀐 게 아니라, 쓰는 문법(API)이 구식인 경우입니다. 이러면 그 광고가 다 올 때까지 화면 그리기가 멈춥니다.',
    action: '화면이 늦게 뜨는 원인이 됩니다. 당장 장애는 아니지만 광고사에 document.write 없는 최신 방식으로 교체를 요청할 근거가 됩니다.',
    patterns: ['document.write'],
  },
  {
    key: 'long-task',
    level: 'watch',
    title: '스크립트 하나가 화면을 오래 붙잡음',
    meaning: '광고 스크립트가 한 번에 오래 실행돼서 그동안 화면이 멈칫합니다. 뒤에 붙는 시간(ms)이 멈춘 길이입니다.',
    action:
      '50ms를 넘으면 사용자가 버벅임을 느낍니다. 수백 ms가 반복되면 「메인 스레드·광고 스크립트」 지표와 함께 광고사에 전달하세요.',
    patterns: ["'settimeout' handler took", "'requestanimationframe' handler took", 'handler took', 'forced reflow'],
  },
  {
    key: 'non-passive-listener',
    level: 'watch',
    title: '스크롤을 붙잡는 방식으로 터치를 감지함',
    meaning: '광고 스크립트가 손가락 터치를 감시하는 방식 때문에 스크롤이 매끄럽지 않을 수 있습니다.',
    action: '노출에는 지장이 없고 스크롤 감만 떨어집니다. 광고사 스크립트 개선 요청 항목입니다.',
    patterns: ['non-passive event listener'],
  },
  {
    key: 'violation-generic',
    level: 'watch',
    title: '브라우저가 알려 주는 성능 주의',
    meaning: '오류가 아니라, 브라우저가 "이렇게 하면 화면이 느려진다"고 알려 주는 성능 안내입니다.',
    action: '노출 자체에는 지장이 없습니다. 페이지가 느리다는 얘기가 나올 때 참고 자료로 쓰세요.',
    patterns: ['[violation]'],
  },
  {
    key: 'unsafe-header',
    level: 'noise',
    title: '광고사가 자기 통계값을 못 읽음',
    meaning:
      '광고 스크립트가 통계용 정보를 읽으려다 브라우저 보안 규칙에 막힌 것입니다. 광고사가 통계를 못 얻을 뿐 광고는 정상입니다.',
    action: '광고사 통계에만 영향이 있고 노출과는 무관합니다. 우리 쪽에서 없앨 방법도 없습니다.',
    patterns: ['refused to get unsafe header'],
  },
  {
    key: 'postmessage-blank',
    level: 'noise',
    title: '광고 창이 뜨기 전에 신호를 보냄',
    meaning: '광고 자리가 다 만들어지기 전에 광고사 스크립트가 먼저 말을 건 것입니다.',
    action: '광고사가 알아서 다시 시도하므로 광고는 잠시 뒤 정상적으로 뜹니다. 화면 캡쳐에 광고가 보이면 넘어가도 됩니다.',
    patterns: ["failed to execute 'postmessage'", 'invalid target origin'],
  },
  {
    key: 'sdk-not-initialized',
    level: 'noise',
    title: '광고 라이브러리 준비 중',
    meaning: '광고를 그리는 프로그램이 아직 준비 중이라고 스스로 남긴 안내입니다.',
    action: '준비가 끝나면 광고가 나옵니다. 이 메시지만 있고 광고도 안 보인다면 그때 광고사에 문의하세요.',
    patterns: ['adgb - not initialized', 'not initialized'],
  },
  {
    key: 'no-adapters',
    level: 'noise',
    title: '검사용 브라우저에만 나오는 메시지',
    meaning: '이 모니터링은 화면 없이 도는 브라우저로 검사하는데, 거기에는 그래픽 처리 장치가 없어서 뜨는 메시지입니다.',
    action: '실제 사용자 휴대폰·PC에서는 나지 않습니다. 사이트 문제가 아니라 검사 도구 때문에 생기는 줄이니 넘어가세요.',
    patterns: ['no available adapters', 'gl driver message', 'gpu stall'],
  },
  {
    key: 'video-codec',
    level: 'noise',
    title: '영상 포맷 표기가 애매함',
    meaning: '영상 광고가 자기 파일 형식을 브라우저에 애매하게 알려 줬다는 안내입니다.',
    action: '브라우저가 알아서 판단해 재생하므로 영상은 정상적으로 나옵니다.',
    patterns: ['video codec string'],
  },
  {
    key: 'fraud-detection',
    level: 'noise',
    title: '부정클릭 탐지 기능이 켜짐',
    meaning: '가짜 클릭을 걸러내는 광고사 기능이 켜졌다고 남긴 기록입니다.',
    action: '오류가 아니라 기능이 잘 돌고 있다는 표시입니다.',
    patterns: ['enablefrauddetection', 'protected media'],
  },
  {
    key: 'vendor-debug-log',
    level: 'noise',
    title: '광고사가 남긴 진행 기록',
    meaning: '광고사 스크립트가 "여기까지 잘 진행됐다"고 스스로 남긴 기록입니다. 오류가 아닙니다.',
    action: '광고 영역 수만큼 반복해서 찍히기 때문에 건수가 커 보일 뿐입니다. 건수가 늘어도 볼 것 없습니다.',
    patterns: [
      '컨텐츠가 정상적으로 제공됩니다',
      '정리 완료',
      'setpolicyinfo',
      'page info injected',
      'ad loaded, has ad',
      'sud: true',
    ],
  },
  {
    key: 'http-load-failed',
    level: 'action',
    title: '파일을 불러오지 못함',
    meaning: '광고에 필요한 파일을 받아오지 못했습니다.',
    action: '해당 소재가 안 나올 수 있습니다. 출처 URL을 확인해 어느 광고사인지 보고 문의하세요.',
    patterns: ['failed to load resource'],
  },
]

/** 매칭되는 설명이 없으면 null — 모르는 메시지에 함부로 '무시 가능'을 붙이지 않는다. */
export function explainMessage(text: string | undefined): MessageExplanation | null {
  if (!text) return null
  const lower = text.toLowerCase()
  for (const rule of RULES) {
    if (rule.patterns.some((p) => lower.includes(p))) {
      return {
        key: rule.key,
        level: rule.level,
        title: rule.title,
        meaning: rule.meaning,
        action: rule.action,
      }
    }
  }
  return null
}

export type MessageExplainSummaryRow = {
  level: MessageExplainLevel
  label: string
  count: number
}

/** 메시지 묶음을 조치 필요 / 확인만 / 무시 가능 3단계로 세어 준다. 설명이 없는 건 '미분류'로 따로 센다. */
export function summarizeExplainLevels(
  texts: (string | undefined)[],
): { rows: MessageExplainSummaryRow[]; unknownCount: number } {
  const counts: Record<MessageExplainLevel, number> = { action: 0, watch: 0, noise: 0 }
  let unknownCount = 0

  for (const t of texts) {
    const found = explainMessage(t)
    if (!found) {
      unknownCount += 1
      continue
    }
    counts[found.level] += 1
  }

  const order: MessageExplainLevel[] = ['action', 'watch', 'noise']
  const rows = order
    .map((level) => ({ level, label: MESSAGE_EXPLAIN_LEVEL_LABEL[level], count: counts[level] }))
    .filter((r) => r.count > 0)

  return { rows, unknownCount }
}
