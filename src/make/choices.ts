/**
 * 폼에서 고를 수 있게 보여 주는 값들.
 * src/ads 의 2025~2026 스크립트에서 자주 쓰인 값을 많이 쓴 순서로 골랐다 (2026-10 기준).
 * 목록에 없는 값은 각 칸의 "직접 입력"으로 넣는다.
 */

export interface ChoiceOption {
  value: string
  label: string
}

export const NATE_ADSENSE_CLIENT = 'ca-pub-8710503230568572'

export const SIZE_CHOICES: ChoiceOption[] = [
  { value: '300x250', label: '300×250' },
  { value: '320x100', label: '320×100' },
  { value: '320x200', label: '320×200' },
  { value: '250x250', label: '250×250' },
  { value: '728x90', label: '728×90' },
  { value: '970x120', label: '970×120' },
  { value: '160x600', label: '160×600' },
]

export const ADSENSE_CLIENT_CHOICES: ChoiceOption[] = [{ value: NATE_ADSENSE_CLIENT, label: `네이트 (${NATE_ADSENSE_CLIENT})` }]

export const FOLD_CHOICES: ChoiceOption[] = [
  { value: '', label: '접지 않음' },
  { value: '.feed-item.ad', label: '.feed-item.ad' },
  { value: '.adloader', label: '.adloader' },
  { value: '#ad_big', label: '#ad_big' },
]

export const UNFILLED_HIDE_CHOICES: ChoiceOption[] = [
  { value: '', label: '광고 div만' },
  { value: '.adloader', label: '.adloader' },
  { value: '.feed-item.ad', label: '.feed-item.ad' },
  { value: '#ad_big', label: '#ad_big' },
]

export const MARGIN_BOTTOM_CHOICES: ChoiceOption[] = [
  { value: '', label: '없음' },
  { value: '8px', label: '8px' },
  { value: '12px', label: '12px' },
  { value: '16px', label: '16px' },
]

export const PARENT_IFRAME_NAME_CHOICES: ChoiceOption[] = [
  { value: '', label: '이름 확인 안 함' },
  { value: 'ad_mid', label: 'ad_mid' },
  { value: 'ad_small', label: 'ad_small' },
]

export const PARENT_HEIGHT_CHOICES: ChoiceOption[] = [{ value: '', label: '광고 높이에 맞춤' }]

export const AREA_WIDTH_CHOICES: ChoiceOption[] = [
  { value: '', label: '지정 안 함' },
  { value: '100%', label: '100%' },
]

export const AREA_MARGIN_CHOICES: ChoiceOption[] = [
  { value: '', label: '지정 안 함' },
  { value: '0 auto', label: '0 auto' },
  { value: '10px auto', label: '10px auto' },
]

export const AREA_HEIGHT_CHOICES: ChoiceOption[] = [
  { value: '', label: '지정 안 함' },
  { value: 'auto', label: 'auto' },
]

export const LABEL_TEXT_CHOICES: ChoiceOption[] = [
  { value: 'AD', label: 'AD' },
  { value: '광고', label: '광고' },
]

export const REFERRER_CHOICES: ChoiceOption[] = [
  { value: '', label: '지정 안 함' },
  { value: 'no-referrer-when-downgrade', label: 'no-referrer-when-downgrade' },
  { value: 'unsafe-url', label: 'unsafe-url' },
]

export const IFRAME_TITLE_CHOICES: ChoiceOption[] = [
  { value: '', label: '없음' },
  { value: '광고', label: '광고' },
]
