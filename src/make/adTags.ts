/**
 * 광고 태그(섹션@지면_포지션, 대시보드의 "광고 태그"와 같은 값) → 광고를 넣을 요소 선택자.
 * src/ads 의 광고 태그 폴더별로, 스크립트가 광고를 넣는 요소를 세어 가장 많이 쓴 것을 골랐다 (2026-10-06 기준).
 * backup·테스트 폴더는 뺐다. 선택자가 뚜렷하게 하나로 모이지 않는 태그(앵커, 크리테오 PC 지면 등)는 넣지 않았다.
 * selector 가 '' 이면 스크립트 자리(document.currentScript 의 부모)에 넣는 태그다.
 *
 * parentAreas 가 있는 태그는 고르면 "상위 프레임 높이 맞춤"이 자동으로 켜지고 이 요소들의 높이를 광고 높이로 맞춘다.
 * 이 태그의 최근(2025~2026) 스크립트 대부분이 같은 요소들을 바꾸는 경우에만 넣었다.
 */

import type { ParentArea } from './config'

export interface AdTagArea {
  /** 광고 태그. select 값이자 화면에 보이는 이름 */
  tag: string
  selector: string
  /** src/ads 에서 이 태그 파일 수와, 그중 이 선택자를 쓴 수. 화면에는 보이지 않고 목록을 고칠 때 근거로 남겨 둔다 */
  evidence: { files: number; matched: number }
  /** 목록을 고칠 때 참고할 메모. 화면에는 보이지 않는다 */
  note?: string
  /** 함께 높이를 맞출 상위 문서 요소 (있으면 상위 프레임 높이 맞춤 자동 켜짐) */
  parentAreas?: ParentArea[]
}

export interface AdTagService {
  id: string
  label: string
  tags: AdTagArea[]
}

function t(tag: string, selector: string, files: number, matched: number, note?: string): AdTagArea {
  return { tag, selector, evidence: { files, matched }, note }
}

/** 상위 문서(parent)의 요소와 그 안 iframe, 그 위 문서(parent.parent)의 요소 */
function frameChain(parentSelector: string, topSelector: string): ParentArea[] {
  return [
    { depth: 1, selector: parentSelector },
    { depth: 1, selector: `${parentSelector} iframe` },
    { depth: 2, selector: topSelector },
  ]
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)

export const AD_TAG_SERVICES: AdTagService[] = [
  {
    id: 'news',
    label: '뉴스',
    tags: [
      t('news@view_middle3', '#ad_innerView', 15, 13),
      t('news@view2_middle3', '#ad_innerView2', 18, 17),
      t('google@house_x13', '#ad_innerView', 4, 4),
      t('google@house_x14', '#ad_innerView2', 2, 2),
      t('news@view_Top3', '#main_banner', 7, 4, '#ad_big을 쓴 파일도 3개'),
      t('best@nview_Bottom', '#main_banner', 30, 18, '#ad_big2를 쓴 파일도 3개'),
      {
        ...t('mob@news_Middle1', '#ifr_main_banner', 29, 11, '나머지는 대부분 위치를 찾지 않는 원본 태그'),
        // 2025~2026 15개 중 13개가 parent.parent 의 #ifr_ad_shopbox 를, 9개가 parent 의 #ifr_main_banner 도 바꾼다
        parentAreas: frameChain('#ifr_main_banner', '#ifr_ad_shopbox'),
      },
      {
        ...t('news@bt_Position3', '#ifr_main_banner', 13, 6),
        // 2025-11 이후 구조 (2026-01 콘텐츠하단배너 기준). 그 전에는 parent.parent 의 #ifr_ad_bottom 만 바꿨다
        parentAreas: frameChain('#ifr_ad_bottom', '#ifr_main_banner'),
      },
      t('news_rtb@rpbt_Bottom1', '#main_banner', 3, 3),
      t('wider@nlist_Top3', '#main_banner', 6, 5),
      t('hotissue@list_Top2', '#main_banner', 2, 2),
      t('issuepk@list_Top2', '#main_banner', 2, 2),
      t('news@rplist_Bottom3', '', 1, 1),
      t('cbc@vmidrec_Middle3', '#ad_innerView', 3, 3),
      t('cbc@lspr2_x24', '', 4, 4),
      t('mcbc@listsp1_Top1', '', 4, 4),
      t('mcbc@listrec_Position3', '', 3, 3),
      t('news@mid_rec_Middle3', '#ad_innerView', 7, 7),
      t('olympic@mid_rec_Middle3', '#ad_innerView', 3, 3),
      t('vote@mid_rec_Middle3', '#ad_innerView', 3, 3),
      t('olympic@view_middle3', '#ad_innerView', 1, 1),
      t('vote@view_middle3', '#ad_innerView', 1, 1),
    ],
  },
  {
    id: 'pann',
    label: '판',
    tags: [
      {
        ...t('mob@pann_Middle1', '#ifr_main_banner', 28, 9, '나머지는 대부분 위치를 찾지 않는 원본 태그'),
        // 2025~2026 13개 모두 parent.parent 의 #ifr_ad_shopbox 를, 10개가 parent 의 #ifr_main_banner 도 바꾼다
        parentAreas: frameChain('#ifr_main_banner', '#ifr_ad_shopbox'),
      },
      t('pann@bt_Position3', '', 7, 3, '#ifr_ad_bottom을 쓴 파일도 2개'),
      t('pann@rpbt_Bottom1', '#main_banner', 3, 3),
      t('pann@photo_bottom2', '', 6, 2),
      t('pann@sync_x27', '', 4, 4),
      t('pann@bbar_TopLeft', '#adWrap', 3, 2),
      t('pann@shopbx_Frame1', '#shopitemMall', 2, 2),
      t('psub@shopbx_Frame1', '#shopitemMall', 3, 3),
      // 작업 폴더 이름은 뉴스·판·메인이 섞여 있지만, newsback/pannback 이름 규칙상 판 지면으로 본다
      t('mob@pannback_Top3', '#main_banner', 11, 8, '#ad_big을 쓴 파일도 2개'),
    ],
  },
  {
    id: 'main',
    label: '메인',
    tags: [
      t('main@nb_Top3', '', 8, 2, '나머지는 대부분 위치를 찾지 않는 원본 태그'),
      t('appmain@nb_Top3', '', 13, 7),
      t('cri@mainmid_Top3', '#top_main_banner', 11, 10),
      t('main@nbbt_Top3', '#top_main_banner', 13, 10),
      t('appmain@nbbt_Top3', '#top_main_banner', 9, 7),
      ...range(0, 5).map((n) => t(`issue@fd${n}_item`, '#top_main_banner', 1, 1)),
      ...range(0, 5).map((n) => t(`appissue@fd${n}_item`, '#top_main_banner', 1, 1)),
      ...range(1, 10).map((n) => t(`appmain@fd${n}_x23`, '', n === 1 ? 3 : 2, n === 1 ? 3 : 2)),
      ...range(1, 3).map((n) => t(`main@rktab${n}_Middle2`, '', 1, 1)),
      ...range(1, 3).map((n) => t(`appmain@rktab${n}_Middle2`, '', 1, 1)),
      t('main@bf_Top1', '', 1, 1),
      t('appmain@bf_Top1', '', 1, 1),
      t('sub@bf_Top1', '', 1, 1),
      t('main@rt_Middle1', '', 5, 5),
      t('main@shop_Top3', '', 1, 1),
      t('main@shopbox_Bottom2', '', 2, 2),
      t('main@shopbx_Frame1', '#shopitemMall', 3, 3),
      t('ranking@up_Middle3', '', 2, 2),
      t('www.nate.com@main2_Right1', '#adContainer', 6, 5),
    ],
  },
  {
    id: 'sports-ent',
    label: '스포츠·연예',
    tags: [
      t('sports@shopbx_Frame1', '#shopitemMall', 3, 3),
      t('ent@shopbx_Frame1', '#shopitemMall', 3, 3),
      t('enter@view_Top1', '', 3, 3),
    ],
  },
]

export function findAdTag(serviceId: string, tag: string): AdTagArea | undefined {
  return AD_TAG_SERVICES.find((s) => s.id === serviceId)?.tags.find((x) => x.tag === tag)
}
