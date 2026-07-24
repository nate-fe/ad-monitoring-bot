// 지면(광고 영역) 레이아웃 정의
// ------------------------------------------------------------------
// 뉴스/판 지면을 네모 박스로 간략히 표현하기 위한 매핑 데이터.
//
// 구조: LAYOUT_GROUPS(지면 타이틀: 뉴스/판 …) → 그 안에 기기별(모바일/PC) 레이아웃.
// 배치 방식: absolute 좌표가 아니라 "흐름(flow) + margin-top" 방식.
//   - 각 슬롯은 컬럼(main=본문 / side=우측 사이드)에 위에서부터 순서대로 쌓인다.
//   - y 는 컬럼 최상단 기준 절대 위치(실제 top = y × 2 px). 앞 박스와 겹치면 바로 아래로 밀린다.
//   - height(px)로 박스 높이, width(%, 기본 100)로 컬럼 대비 너비를 정한다.
//   → 내용에 따라 스테이지 높이가 자동으로 늘어나므로 잘리지 않는다.
//
// ▶ 위치 조절: 슬롯의 y(절대 위치)·height(높이)·column(컬럼) 값만 바꾸면 된다.
// ▶ 연결 광고: adTags 배열 수정(광고태그/슬롯코드, 대소문자 무시).

import type { AdScriptEntry } from './adsCatalog'

/** 박스 색 구분: main=본문, right=우측 배너, sticky=고정/앵커 영역. */
export type SlotKind = 'main' | 'right' | 'sticky'

/**
 * 박스가 놓이는 컬럼.
 * left=좌여백, top=2단 전체 폭(col1+col2 위), main=2단 첫째, side=2단 둘째, right=우여백.
 */
export type SlotColumn = 'left' | 'top' | 'main' | 'side' | 'right'

export type DeviceKind = 'mobile' | 'pc'

export interface AdSlot {
  id: string
  label: string
  /** 보조 설명(선택). */
  note?: string
  /** 놓일 컬럼(기본 main). left/right=여백, main/side=2단. */
  column?: SlotColumn
  /** 위쪽 여백(px). 특정 박스만 살짝 아래로 내릴 때 사용(예: 좌여백배너). */
  offsetTop?: number
  /** 컬럼 대비 너비(%, 기본 100). */
  width?: number
  /** 이 영역에 해당하는 광고태그(adTag) 또는 슬롯코드. 대소문자 무시. */
  adTags: string[]
  kind?: SlotKind
}

export interface AdLayout {
  id: string
  /** 기기(모바일/PC). 선택 버튼 라벨·스테이지 폭에 사용. */
  device: DeviceKind
  slots: AdSlot[]
}

/** 하나의 지면 타이틀(예: 뉴스) 아래 기기별 레이아웃 묶음. */
export interface LayoutGroup {
  id: string
  title: string
  layouts: AdLayout[]
}

const DEVICE_LABEL: Record<DeviceKind, string> = {
  mobile: '모바일',
  pc: 'PC',
}

export function deviceLabel(device: DeviceKind): string {
  return DEVICE_LABEL[device]
}

// ── 모바일 뉴스 뷰 (단일 컬럼) ─────────────────────────────────
const NEWS_VIEW_MOBILE: AdLayout = {
  id: 'news-view-mobile',
  device: 'mobile',
  slots: [
    { id: 'topbar', label: '상단 배너', kind: 'main', adTags: ['news@snb_Top2'] },
    { id: 'view-mid1', label: '기사 중간1', kind: 'main', adTags: ['news@view_middle3', 'google@house_x13'] },
    { id: 'view-mid2', label: '기사 중간2', kind: 'main', adTags: ['news@view2_middle3'] },
    { id: 'content-bottom', label: '컨텐츠 하단', kind: 'main', adTags: ['news@view_Top3', 'news@view'] },
    { id: 'reply-bottom', label: '베플 하단', kind: 'main', adTags: ['news@rpbt_Bottom1', 'news_rtb@rpbt_Bottom1'] },
    { id: 'band1', label: '서브(랭킹 상단)', kind: 'main', adTags: ['mnews@band_x13'] },
    { id: 'sub1', label: '서브(공감많은 뉴스 하단)', kind: 'main', adTags: ['best@nview_Bottom'] },
    { id: 'sub2', label: '서브(댓글많은 뉴스 하단)', kind: 'main', adTags: ['news@rplist_Bottom3'] },
    { id: 'band2', label: '서브(톡커들의 선택 하단)', kind: 'main', adTags: ['msub@event_x13'] },
    { id: 'shopbox', label: '쇼핑박스', kind: 'main', adTags: ['news@rt_Middle1', 'rtb@news_Middle1', 'mob@news_Middle1'] },
    { id: 'bottom', label: '최하단', kind: 'main', adTags: ['news@bt_Position3'] },
    { id: 'anchor', label: '앵커(하단 고정)', kind: 'sticky', adTags: ['news@anch_Bottom2'] },
  ],
}

// ── PC 뉴스 뷰 (좌여백 + 2단[col1:col2 ≈ 2:1] + 우여백) ─────────
// col1/col2 의 adTags 는 추후 채워주세요(현재 빈 배열 = 매칭 0).
const NEWS_VIEW_PC: AdLayout = {
  id: 'news-view-pc',
  device: 'pc',
  slots: [
    // 좌여백배너 ('올려 내려 하단'보다 조금 아래)
    { id: 'left-blank', label: '좌여백배너', column: 'left', offsetTop: 120, kind: 'right', adTags: ['news@blank_left'] },
    // 본문 + 우측 사이드 상단을 가로지르는 배너
    { id: 'topbar', label: '최상단배너', column: 'top', kind: 'right', adTags: ['news@bbar_TopLeft', 'newsback@bbar_TopLeft', 'google@house_x06'] },
    // 2단 첫째 컬럼(col1)
    { id: 'view-mid1', label: '기사 중간', column: 'main', kind: 'main', adTags: ['news@mid_rec_Middle3'] },
    { id: 'up-down-bottom', label: '올려 내려 하단', column: 'main', kind: 'main', adTags: ['news@cont_x19'] },
    { id: 'reply-bottom', label: '댓글 하단', column: 'main', kind: 'main', adTags: ['news@bar_x12'] },
    { id: 'bottom', label: '최하단', column: 'main', kind: 'main', adTags: ['news@nrbtm_Bottom2', 'wider@newsback_Middle1'] },
    // 2단 둘째 컬럼(col2)
    { id: 'right-top', label: '우상단배너', column: 'side', kind: 'right', adTags: ['news@sub2_rec_Middle2', 'cri@srec2_Middle2', 'google@house_x07'] },
    { id: 'right-sa', label: '우Sa배너', column: 'side', kind: 'right', adTags: ['news@band_x12'] },
    { id: 'rec-news', label: '추천뉴스', column: 'side', kind: 'main', adTags: ['news@sbox_Frame2'] },
    { id: 'right-mid', label: '우중앙배너', column: 'side', kind: 'right', adTags: ['news@btrec2_Middle2'] },
    { id: 'shopbox', label: '쇼핑박스', column: 'side', kind: 'main', adTags: ['ent@shopbx_Frame1'] },
    { id: 'sidebar', label: '사이드바', column: 'side', kind: 'main', adTags: ['imp@btcont_x17'] },
    { id: 'bottom-banner', label: '최하단배너', column: 'side', kind: 'right', adTags: ['news@right2_Bottom'] },
    // 우여백배너
    { id: 'right-blank', label: '우여백배너', column: 'right', kind: 'right', adTags: ['mob@nrblank_x24', 'news@r_blank_x24'] },
  ],
}

// ── 모바일 판(게시글) 뷰 (단일 컬럼) ───────────────────────────
const PANN_VIEW_MOBILE: AdLayout = {
  id: 'pann-view-mobile',
  device: 'mobile',
  slots: [
    { id: 'topbar', label: '최상단 배너', kind: 'main', adTags: ['pann@snb_Top2'] },
    { id: 'reply-bottom', label: '댓글 하단', kind: 'main', adTags: ['pann@spsbt_Top3', 'mob@pannback_Top3'] },
    { id: 'popular-talk-bottom', label: '인기 톡 채널 하단', kind: 'main', adTags: ['pann@rpbt_Bottom1', 'mpbtbig'] },
    { id: 'honor-top', label: '명예의 전당 상단', kind: 'main', adTags: ['best@pview_Bottom'] },
    { id: 'new-best-top', label: '새로운 베플 상단', kind: 'main', adTags: ['pann@sync_x27'] },
    { id: 'new-best-bottom', label: '새로운 베플 하단', kind: 'main', adTags: ['pann@photo_bottom2'] },
    { id: 'best-news-top', label: '공감많은 뉴스 상단', kind: 'main', adTags: ['mpann@band4_x13'] },
    { id: 'best-news-bottom', label: '공감많은 뉴스 하단', kind: 'main', adTags: ['msub@event_x13'] },
    { id: 'shopbox', label: '쇼핑박스', kind: 'main', adTags: ['pann@rt_Middle1', 'rtb@pann_Middle1', 'mob@pann_Middle1'] },
    { id: 'bottom', label: '최하단', kind: 'main', adTags: ['pann@bt_Position3'] },
    { id: 'anchor', label: '앵커(하단 고정)', kind: 'sticky', adTags: ['pann@anch_Bottom2'] },
  ],
}

// ── PC 판(게시글) 뷰 (좌여백 + 2단[col1:col2 ≈ 2:1] + 우여백) ────
const PANN_VIEW_PC: AdLayout = {
  id: 'pann-view-pc',
  device: 'pc',
  slots: [
    // 본문 + 우측 사이드 상단을 가로지르는 배너
    { id: 'topbar', label: '최상단배너', column: 'top', kind: 'right', adTags: ['pann@bbar_TopLeft', 'pannback@bbar_TopLeft', 'google@house_x06'] },
    // 2단 첫째 컬럼(col1)
    { id: 'content-bottom', label: '본문 하단', column: 'main', kind: 'main', adTags: ['skt@pband_x11'] },
    { id: 'reply-bottom', label: '댓글 하단', column: 'main', kind: 'main', adTags: ['pann@rpbt_Bottom1'] },
    { id: 'bottom', label: '최하단', column: 'main', kind: 'main', adTags: ['pann@prbtm_Bottom2', 'wider@back_Middle1', 'cri@pannback_Middle1'] },
    // 2단 둘째 컬럼(col2)
    { id: 'right-sa', label: '우Sa배너', column: 'side', kind: 'right', adTags: ['pann@event_x12'] },
    { id: 'right-mid', label: '우중앙배너', column: 'side', kind: 'right', adTags: ['pann@rectangle_Middle2', 'wider@pannback_Middle2'] },
    { id: 'pick-bottom', label: '톡커들의 선택 하단', column: 'side', kind: 'right', adTags: ['pann@band_x12'] },
    { id: 'recommend-shopping', label: '쇼핑 추천', column: 'side', kind: 'right', adTags: ['pann@sbox_Frame2'] },
    { id: 'shopbox', label: '쇼핑박스', column: 'side', kind: 'main', adTags: ['psub@shopbx_Frame1', 'pann@rt_Middle1'] },
    { id: 'bottom-banner', label: '최하단배너', column: 'side', kind: 'right', adTags: ['pann@r_btrec_x03'] },
    // 우여백배너
    { id: 'right-blank', label: '우여백배너', column: 'right', kind: 'right', adTags: ['mob@prblank_x24', 'pann@r_blank_x24'] },
  ],
}

// ── 지면 타이틀 그룹 (여기에 메인 등을 계속 추가하세요) ────────────
export const LAYOUT_GROUPS: LayoutGroup[] = [
  {
    id: 'news',
    title: '뉴스',
    layouts: [NEWS_VIEW_MOBILE, NEWS_VIEW_PC],
  },
  {
    id: 'pann',
    title: '판',
    layouts: [PANN_VIEW_MOBILE, PANN_VIEW_PC],
  },
]

/** 모든 레이아웃의 평탄화 목록(기본 선택 등에 사용). */
export const AD_LAYOUTS: AdLayout[] = LAYOUT_GROUPS.flatMap((g) => g.layouts)

/**
 * 슬롯 태그가 광고태그와 매칭되는지(대소문자 무시).
 * 광고태그는 포지션까지 포함되므로(news@view_Top3), 슬롯 태그(news@view)와는
 * 정확히 같거나 "슬롯태그_" 로 시작하면 같은 슬롯으로 본다.
 */
function slotMatchesTag(slotTag: string, adTag: string): boolean {
  const s = slotTag.toLowerCase()
  const t = adTag.toLowerCase()
  return t === s || t.startsWith(`${s}_`)
}

/** 슬롯에 매핑된 광고태그에 해당하는 카탈로그 항목을 찾는다(백업으로 묶인 파일은 제외). */
export function entriesForSlot(entries: AdScriptEntry[], slot: AdSlot): AdScriptEntry[] {
  return entries.filter(
    (e) => !e.isAttachedBackup && slot.adTags.some((st) => slotMatchesTag(st, e.adTag)),
  )
}
