import { useMemo, useState } from 'react'
import { type AdConfig, type ParentArea, KIND_DEFAULTS, needsSize } from '../config'
import {
  AREA_HEIGHT_CHOICES,
  AREA_MARGIN_CHOICES,
  AREA_WIDTH_CHOICES,
  FOLD_CHOICES,
  IFRAME_TITLE_CHOICES,
  LABEL_TEXT_CHOICES,
  MARGIN_BOTTOM_CHOICES,
  PARENT_HEIGHT_CHOICES,
  PARENT_IFRAME_NAME_CHOICES,
  REFERRER_CHOICES,
  SIZE_CHOICES,
  UNFILLED_HIDE_CHOICES,
} from '../choices'
import { AD_TAG_SERVICES, findAdTag } from '../adTags'
import { parseTag } from '../lib/parseTag'
import { Check, Choice, Field, Segmented, SizeInput, TextArea, TextInput } from './fields'

type Set = (patch: Partial<AdConfig>) => void

/** 붙여넣을 때마다 분석해서 종류와 종류별 값을 채운다. 크기는 태그에서 찾았을 때만 바꾼다 */
function SourceField({ c, set }: { c: AdConfig; set: Set }) {
  const parsed = useMemo(() => parseTag(c.source), [c.source])

  const change = (source: string) => {
    const next = parseTag(source)
    set({ ...KIND_DEFAULTS, ...(next?.patch ?? {}), source })
  }

  return (
    <section className="mkSection">
      <h2 className="mkSectionTitle">
        <span className="mkStep">1</span>광고 업체 태그
      </h2>
      <Field label="업체가 준 태그 또는 광고 URL">
        <TextArea
          value={c.source}
          onChange={change}
          rows={6}
          placeholder={'<iframe src="…" width="300" height="250"></iframe>\n<script src="…"></script>'}
        />
      </Field>
      {!c.source.trim() ? null : parsed ? (
        <p className="mkParseResult isOk">
          인식 결과: <b>{parsed.summary}</b>
        </p>
      ) : (
        <p className="mkParseResult isFail">태그를 인식하지 못했습니다. 업체가 준 HTML 태그나 광고 URL을 그대로 붙여넣으세요.</p>
      )}
    </section>
  )
}

function SizeChoice({ c, set, label = '광고 크기 (가로×세로)' }: { c: AdConfig; set: Set; label?: string }) {
  return (
    <Field label={label} group wide>
      <Choice
        label={label}
        value={`${c.width}x${c.height}`}
        options={SIZE_CHOICES}
        onChange={(v) => {
          const [width = '', height = ''] = v.split('x')
          set({ width, height })
        }}
        renderCustom={() => <SizeInput width={c.width} height={c.height} onChange={(width, height) => set({ width, height })} />}
      />
    </Field>
  )
}

/** 반응형 애드센스는 크기를 쓰지 않아 크기 단계를 보이지 않는다 */
function hasSizeStep(c: AdConfig): boolean {
  return needsSize(c) || c.kind === 'script'
}

function SizeField({ c, set }: { c: AdConfig; set: Set }) {
  if (c.kind === 'script') {
    return (
      <div className="mkGrid">
        <Field label="광고 크기 (가로×세로, 선택)" group wide>
          <Choice
            label="크기"
            value={c.width || c.height ? `${c.width}x${c.height}` : ''}
            options={[{ value: '', label: '지정 안 함' }, ...SIZE_CHOICES]}
            onChange={(v) => {
              const [width = '', height = ''] = v ? v.split('x') : []
              set({ width, height })
            }}
            renderCustom={() => <SizeInput width={c.width} height={c.height} onChange={(width, height) => set({ width, height })} />}
          />
        </Field>
      </div>
    )
  }
  return (
    <div className="mkGrid">
      <SizeChoice c={c} set={set} />
    </div>
  )
}

/** 서비스 → 광고 태그를 고르면 그 태그에서 쓰던 광고 위치 선택자가 코드에 들어간다 (화면에는 선택자를 보이지 않음) */
function initialPick(selector: string): { service: string; tag: string } {
  if (!selector.trim()) return { service: '', tag: '' }
  for (const service of AD_TAG_SERVICES) {
    const hit = service.tags.find((x) => x.selector === selector.trim())
    if (hit) return { service: service.id, tag: hit.tag }
  }
  return { service: CUSTOM, tag: '' }
}

const CUSTOM = 'custom'

function AdTagField({ c, set }: { c: AdConfig; set: Set }) {
  const [pick, setPick] = useState(() => initialPick(c.areaSelector))
  const service = AD_TAG_SERVICES.find((s) => s.id === pick.service)
  const adTag = findAdTag(pick.service, pick.tag)

  // 앞서 고른 태그가 켜 둔 상위 프레임 높이 맞춤은, 다른 태그로 바꾸면 끈다 (직접 켠 설정은 건드리지 않음)
  const autoParentOff = adTag?.parentAreas ? { parentFit: false, parentAreas: [] } : {}

  const chooseService = (id: string) => {
    setPick({ service: id, tag: '' })
    // 서비스만 바꾸면 위치는 비워 두고(스크립트 자리) 광고 태그를 고르게 한다. 직접 입력은 지금 값을 이어서 고친다
    if (id !== CUSTOM) set({ areaSelector: '', ...autoParentOff })
    else set(autoParentOff)
  }
  const chooseTag = (tag: string) => {
    setPick((p) => ({ ...p, tag }))
    const next = findAdTag(pick.service, tag)
    set({
      areaSelector: next?.selector ?? '',
      ...(next?.parentAreas
        ? { parentFit: true, parentAreas: next.parentAreas, parentTarget: 'none' as const, parentIframeName: '', parentHeight: '' }
        : autoParentOff),
    })
  }

  return (
    <div className="mkGrid">
      <Field label="서비스">
        <select className="mkInput" value={pick.service} onChange={(e) => chooseService(e.target.value)}>
          <option value="">지정 안 함 (스크립트 자리)</option>
          {AD_TAG_SERVICES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
          <option value={CUSTOM}>직접 입력</option>
        </select>
      </Field>
      {service ? (
        <Field label="광고 태그">
          <select className="mkInput mkMono" value={pick.tag} onChange={(e) => chooseTag(e.target.value)}>
            <option value="" disabled>
              광고 태그를 고르세요
            </option>
            {service.tags.map((x) => (
              <option key={x.tag} value={x.tag}>
                {x.tag}
              </option>
            ))}
          </select>
        </Field>
      ) : null}
      {pick.service === CUSTOM ? (
        <Field label="광고를 넣을 요소 (선택자)">
          <TextInput mono value={c.areaSelector} onChange={(areaSelector) => set({ areaSelector })} placeholder="#ad_area 또는 .ad_area" />
        </Field>
      ) : null}
    </div>
  )
}

/** 상위 문서 요소 목록: [단계] [선택자] [삭제] 한 줄씩 */
function ParentAreasEditor({ areas, onChange }: { areas: ParentArea[]; onChange: (areas: ParentArea[]) => void }) {
  const update = (i: number, patch: Partial<ParentArea>) => onChange(areas.map((a, j) => (j === i ? { ...a, ...patch } : a)))
  return (
    <div className="mkParentAreas">
      {areas.map((a, i) => (
        <div className="mkParentArea" key={i}>
          <select
            className="mkInput"
            aria-label="문서 단계"
            value={a.depth}
            onChange={(e) => update(i, { depth: Number(e.target.value) === 2 ? 2 : 1 })}
          >
            <option value={1}>한 단계 위</option>
            <option value={2}>두 단계 위</option>
          </select>
          <TextInput mono value={a.selector} onChange={(selector) => update(i, { selector })} placeholder="#ifr_main_banner" />
          <button type="button" className="mkBtn" aria-label="이 요소 빼기" onClick={() => onChange(areas.filter((_, j) => j !== i))}>
            빼기
          </button>
        </div>
      ))}
      <button type="button" className="mkBtn" onClick={() => onChange([...areas, { depth: 1, selector: '' }])}>
        요소 추가
      </button>
    </div>
  )
}

type FitMode = 'window' | 'parent' | 'areas'

/** 맞출 대상을 하나 고르면 그 대상에 필요한 칸만 보인다 */
function ParentFitPanel({ c, set }: { c: AdConfig; set: Set }) {
  const mode: FitMode = c.parentTarget === 'none' ? 'areas' : c.parentTarget
  const chooseMode = (next: FitMode) =>
    set(
      next === 'areas'
        ? { parentTarget: 'none', parentIframeName: '', parentAreas: c.parentAreas.length ? c.parentAreas : [{ depth: 1, selector: '' }] }
        : { parentTarget: next, parentAreas: [] },
    )
  return (
    <div className="mkOptionPanel">
      <h3 className="mkGroupTitle">상위 프레임 높이 맞춤</h3>
      <div className="mkGrid">
        <Field label="맞출 대상" group wide>
          <Segmented
            label="맞출 대상"
            value={mode}
            onChange={chooseMode}
            options={[
              { value: 'window', label: '광고를 감싼 iframe' },
              { value: 'parent', label: '그 바깥 iframe' },
              { value: 'areas', label: '지정한 요소' },
            ]}
          />
        </Field>
        {mode === 'areas' ? (
          <Field label="높이를 맞출 요소" group wide>
            <ParentAreasEditor areas={c.parentAreas} onChange={(parentAreas) => set({ parentAreas })} />
          </Field>
        ) : (
          <Field label="iframe name (선택)" group wide>
            <Choice
              label="iframe name"
              mono
              value={c.parentIframeName}
              options={PARENT_IFRAME_NAME_CHOICES}
              onChange={(parentIframeName) => set({ parentIframeName })}
              placeholder="ad_mid"
            />
          </Field>
        )}
        <Field label="맞출 높이" group wide>
          <Choice
            label="맞출 높이"
            value={c.parentHeight}
            options={PARENT_HEIGHT_CHOICES}
            onChange={(parentHeight) => set({ parentHeight: parentHeight.replace(/[^\d]/g, '') })}
            placeholder="px 숫자 (예: 200)"
          />
        </Field>
      </div>
    </div>
  )
}

function OptionChips({ c, set }: { c: AdConfig; set: Set }) {
  const chips: { key: 'label' | 'lazy' | 'hideEmpty' | 'parentFit'; label: string; title: string; disabled?: boolean }[] = [
    { key: 'label', label: 'AD 라벨', title: '광고 모서리에 AD 라벨을 붙입니다.' },
    { key: 'lazy', label: '지연 로드', title: '광고 자리가 화면 200px 안에 들어오면 그때 그립니다.' },
    {
      key: 'hideEmpty',
      label: '광고 없으면 숨김',
      title: c.kind === 'adsense' ? '애드센스가 광고를 주지 않으면(unfilled) 숨깁니다.' : '애드센스에서만 쓸 수 있습니다.',
      disabled: c.kind !== 'adsense',
    },
    { key: 'parentFit', label: '상위 프레임 높이 맞춤', title: '광고를 감싼 iframe의 높이를 광고 높이로 맞춥니다.' },
  ]
  const hideOn = c.hideEmpty && c.kind === 'adsense'
  return (
    <>
      <h3 className="mkGroupTitle">추가 기능</h3>
      <div className="mkChips">
        {chips.map((chip) => {
          const on = c[chip.key] && !chip.disabled
          return (
            <button
              key={chip.key}
              type="button"
              className={`mkChip${on ? ' isOn' : ''}`}
              aria-pressed={on}
              disabled={chip.disabled}
              title={chip.title}
              onClick={() => set({ [chip.key]: !c[chip.key] })}
            >
              {chip.label}
            </button>
          )
        })}
      </div>

      {c.label ? (
        <div className="mkOptionPanel">
          <h3 className="mkGroupTitle">AD 라벨</h3>
          <div className="mkGrid">
            <Field label="라벨 문구" group>
              <Choice label="라벨 문구" value={c.labelText} options={LABEL_TEXT_CHOICES} onChange={(labelText) => set({ labelText })} />
            </Field>
            <Field label="라벨 위치" group>
              <Segmented
                label="라벨 위치"
                value={c.labelPos}
                onChange={(labelPos) => set({ labelPos })}
                options={[
                  { value: 'tl', label: '좌상단' },
                  { value: 'tr', label: '우상단' },
                  { value: 'bl', label: '좌하단' },
                  { value: 'br', label: '우하단' },
                ]}
              />
            </Field>
          </div>
        </div>
      ) : null}

      {hideOn ? (
        <div className="mkOptionPanel">
          <h3 className="mkGroupTitle">광고 없으면 숨김</h3>
          <div className="mkGrid">
            <Field label="숨기는 방식" group wide>
              <Segmented
                label="숨기는 방식"
                value={c.hideMode}
                onChange={(hideMode) => set({ hideMode })}
                options={[
                  { value: 'css', label: '빈 광고만 숨김 (CSS)' },
                  { value: 'observe', label: '영역까지 숨김 (상태 감시)' },
                ]}
              />
            </Field>
            {c.hideMode === 'observe' ? (
              <>
                <Field label="광고 없을 때 숨길 영역" group wide>
                  <Choice
                    label="광고 없을 때 숨길 영역"
                    mono
                    value={c.unfilledHideSelector}
                    options={UNFILLED_HIDE_CHOICES}
                    onChange={(unfilledHideSelector) => set({ unfilledHideSelector })}
                  />
                </Field>
                <Field label="광고가 오기 전 접어 둘 영역" group wide>
                  <Choice
                    label="응답 전에 접어 둘 영역"
                    mono
                    value={c.preFold ? c.foldSelector : ''}
                    options={FOLD_CHOICES}
                    onChange={(foldSelector) => set({ foldSelector, preFold: foldSelector.trim() !== '' })}
                  />
                </Field>
                <Field label="광고 있을 때 아래 여백" group wide>
                  <Choice
                    label="광고 있을 때 아래 여백"
                    value={c.filledMarginBottom}
                    options={MARGIN_BOTTOM_CHOICES}
                    onChange={(filledMarginBottom) => set({ filledMarginBottom })}
                    placeholder="8px"
                  />
                </Field>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {c.parentFit ? <ParentFitPanel c={c} set={set} /> : null}
    </>
  )
}

function Advanced({ c, set, step }: { c: AdConfig; set: Set; step: number }) {
  // 접혀 있어도 켜 둔 옵션이 있는지 알 수 있게 제목 옆에 개수를 보여 준다
  const onCount = [c.label, c.lazy, c.hideEmpty && c.kind === 'adsense', c.parentFit].filter(Boolean).length
  return (
    <details className="mkSection mkAdvanced">
      <summary className="mkSectionTitle">
        <span className="mkStep">{step}</span>고급 설정 {onCount ? <span className="mkOptional">옵션 {onCount}개 켜짐</span> : null}
      </summary>

      <OptionChips c={c} set={set} />

      <h3 className="mkGroupTitle">광고 영역 스타일</h3>
      <div className="mkGrid">
        <Field label="광고 영역 너비" group>
          <Choice label="광고 영역 너비" value={c.areaWidth} options={AREA_WIDTH_CHOICES} onChange={(areaWidth) => set({ areaWidth })} placeholder="320" />
        </Field>
        <Field label="광고 영역 바깥 여백 (margin)" group>
          <Choice label="광고 영역 바깥 여백" value={c.areaMargin} options={AREA_MARGIN_CHOICES} onChange={(areaMargin) => set({ areaMargin })} placeholder="0 auto" />
        </Field>
        <Field label="광고 영역 높이" group>
          <Choice label="광고 영역 높이" value={c.areaHeight} options={AREA_HEIGHT_CHOICES} onChange={(areaHeight) => set({ areaHeight })} placeholder="250" />
        </Field>
        <Field label="광고를 감싼 div의 class">
          <TextInput mono value={c.boxClass} onChange={(boxClass) => set({ boxClass })} />
        </Field>
      </div>

      {c.kind === 'iframe' ? (
        <>
          <h3 className="mkGroupTitle">iframe 속성</h3>
          <div className="mkGrid">
            <Field label="스크롤바 (scrolling)" group>
              <Segmented
                label="scrolling"
                value={c.iframeScrolling}
                onChange={(iframeScrolling) => set({ iframeScrolling })}
                options={[
                  { value: 'no', label: 'no' },
                  { value: 'auto', label: 'auto' },
                  { value: 'yes', label: 'yes' },
                  { value: '', label: '넣지 않음' },
                ]}
              />
            </Field>
            <Field label="테두리 (frameborder)" group>
              <Check checked={c.iframeFrameborder} onChange={(iframeFrameborder) => set({ iframeFrameborder })}>
                frameborder="0" 넣기
              </Check>
            </Field>
            <Field label="리퍼러 정책 (referrerpolicy)" group wide>
              <Choice
                label="referrerpolicy"
                mono
                value={c.iframeReferrerPolicy}
                options={REFERRER_CHOICES}
                onChange={(iframeReferrerPolicy) => set({ iframeReferrerPolicy })}
              />
            </Field>
            <Field label="iframe 제목 (title)" group>
              <Choice label="title" value={c.iframeTitle} options={IFRAME_TITLE_CHOICES} onChange={(iframeTitle) => set({ iframeTitle })} />
            </Field>
            <Field label="추가 속성 (한 줄에 key=value 하나)" wide>
              <TextArea value={c.iframeExtraAttrs} onChange={(iframeExtraAttrs) => set({ iframeExtraAttrs })} placeholder="marginwidth=0" />
            </Field>
          </div>
        </>
      ) : null}

      {c.kind === 'script' ? (
        <>
          <h3 className="mkGroupTitle">외부 script</h3>
          <Field label="광고 태그 스타일 (CSS)" wide>
            <TextInput mono value={c.scriptTagStyle} onChange={(scriptTagStyle) => set({ scriptTagStyle })} placeholder="display:block;width:100%" />
          </Field>
        </>
      ) : null}

      <h3 className="mkGroupTitle">코드 옵션</h3>
      <div className="mkChecks">
        <Check checked={c.tryCatch} onChange={(tryCatch) => set({ tryCatch })}>
          try/catch로 감싸기
        </Check>
        <Check checked={c.scriptOnce} onChange={(scriptOnce) => set({ scriptOnce })}>
          외부 script 1회만 로드
        </Check>
      </div>

      <h3 className="mkGroupTitle">추가 CSS</h3>
      <Field label="광고와 함께 넣을 CSS">
        <TextArea value={c.extraCss} onChange={(extraCss) => set({ extraCss })} rows={3} placeholder=".my-ad{margin:0 auto;}" />
      </Field>
    </details>
  )
}

export function ConfigForm({ config, onChange }: { config: AdConfig; onChange: Set }) {
  const sizeStep = hasSizeStep(config)
  const tagStep = sizeStep ? 3 : 2
  return (
    <div className="mkForm">
      <SourceField c={config} set={onChange} />
      {sizeStep ? (
        <section className="mkSection">
          <h2 className="mkSectionTitle">
            <span className="mkStep">2</span>크기
          </h2>
          <SizeField c={config} set={onChange} />
        </section>
      ) : null}
      <section className="mkSection">
        <h2 className="mkSectionTitle">
          <span className="mkStep">{tagStep}</span>광고 위치 <span className="mkOptional">선택</span>
        </h2>
        <AdTagField c={config} set={onChange} />
      </section>
      <Advanced c={config} set={onChange} step={tagStep + 1} />
    </div>
  )
}
