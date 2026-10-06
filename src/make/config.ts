import { NATE_ADSENSE_CLIENT } from './choices'

export type AdKind = 'iframe' | 'adsense' | 'script' | 'raw'
export type AdsenseFormat = 'fixed' | 'responsive' | 'inarticle' | 'infeed'
export type HideMode = 'css' | 'observe'
export type LabelPos = 'tl' | 'tr' | 'bl' | 'br'
/** frameElement 로 높이를 바꿀 iframe. none 이면 상위 문서 요소(parentAreas)만 바꾼다 */
export type ParentFrameTarget = 'none' | 'parent' | 'window'

/** 높이를 함께 바꿀 상위 문서의 요소. depth 1 = parent.document, 2 = parent.parent.document */
export interface ParentArea {
  depth: 1 | 2
  selector: string
}

export interface AdConfig {
  kind: AdKind
  width: string
  height: string

  iframeUrl: string
  iframeScrolling: string
  iframeReferrerPolicy: string
  iframeTitle: string
  iframeFrameborder: boolean
  iframeExtraAttrs: string

  adClient: string
  adSlot: string
  adFormat: AdsenseFormat
  adLayoutKey: string
  adFullWidthResponsive: boolean
  hideMode: HideMode
  foldSelector: string
  unfilledHideSelector: string
  filledMarginBottom: string
  preFold: boolean

  scriptUrl: string
  scriptTagName: 'ins' | 'div'
  scriptTagClass: string
  scriptTagAttrs: string
  scriptTagStyle: string
  scriptInit: string
  scriptInitTiming: 'onload' | 'immediate'

  rawHtml: string

  label: boolean
  labelText: string
  labelPos: LabelPos
  lazy: boolean
  hideEmpty: boolean
  parentFit: boolean
  parentAreas: ParentArea[]
  parentIframeName: string
  parentTarget: ParentFrameTarget
  parentHeight: string

  /** 비우면 document.currentScript 의 부모에 넣는다 */
  areaSelector: string
  boxClass: string
  areaWidth: string
  areaMargin: string
  areaHeight: string
  tryCatch: boolean
  scriptOnce: boolean
  extraCss: string
}

export const DEFAULT_CONFIG: AdConfig = {
  kind: 'iframe',
  width: '300',
  height: '250',

  iframeUrl: '',
  iframeScrolling: 'no',
  iframeReferrerPolicy: '',
  iframeTitle: '',
  iframeFrameborder: true,
  iframeExtraAttrs: '',

  adClient: NATE_ADSENSE_CLIENT,
  adSlot: '',
  adFormat: 'fixed',
  adLayoutKey: '',
  adFullWidthResponsive: false,
  hideMode: 'css',
  foldSelector: '',
  unfilledHideSelector: '',
  filledMarginBottom: '',
  preFold: false,

  scriptUrl: '',
  scriptTagName: 'ins',
  scriptTagClass: '',
  scriptTagAttrs: '',
  scriptTagStyle: '',
  scriptInit: '',
  scriptInitTiming: 'onload',

  rawHtml: '',

  label: false,
  labelText: 'AD',
  labelPos: 'tl',
  lazy: false,
  hideEmpty: false,
  parentFit: false,
  parentAreas: [],
  parentIframeName: '',
  parentTarget: 'parent',
  parentHeight: '',

  areaSelector: '',
  boxClass: '',
  areaWidth: '',
  areaMargin: '',
  areaHeight: '',
  tryCatch: true,
  scriptOnce: true,
  extraCss: '',
}

export const KIND_LABELS: Record<AdKind, string> = {
  iframe: 'iframe',
  adsense: '애드센스',
  script: '외부 script',
  raw: '원본 태그',
}

/** 광고 종류를 고를 때 아래에 보여 주는 설명 */
export const KIND_DESCRIPTIONS: Record<AdKind, string> = {
  iframe: '업체가 준 광고 URL을 iframe으로 넣습니다. ',
  adsense: '구글 애드센스 광고(ins 태그)를 넣습니다. client·slot만 있으면 됩니다.',
  script: '업체 스크립트(SDK)를 불러온 뒤 광고 태그를 그리게 합니다.',
  raw: 'document.write 등 업체가 준 태그를 고치지 않고 iframe 안에서 그대로 실행합니다.',
}

export const FORMAT_LABELS: Record<AdsenseFormat, string> = {
  fixed: '고정',
  responsive: '반응형',
  inarticle: '인아티클',
  infeed: '인피드',
}

/** 크기(W×H)를 반드시 써야 하는 광고인지 */
export function needsSize(c: AdConfig): boolean {
  if (c.kind === 'iframe' || c.kind === 'raw') return true
  if (c.kind === 'adsense') return c.adFormat === 'fixed'
  return false
}

/** 코드에 _adWidth/_adHeight 를 선언하는지 (외부 script 는 입력했거나 {w}{h}를 쓸 때만) */
export function usesSize(c: AdConfig): boolean {
  if (needsSize(c)) return true
  if (c.kind === 'script') {
    return /\{[wh]\}/.test(c.scriptTagAttrs) || (c.width.trim() !== '' && c.height.trim() !== '')
  }
  return false
}
