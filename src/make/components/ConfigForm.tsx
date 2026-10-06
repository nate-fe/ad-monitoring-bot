import { useState } from 'react'
import { type AdConfig, type AdKind, type AdsenseFormat, type ParentArea, FORMAT_LABELS, KIND_DESCRIPTIONS, KIND_LABELS, needsSize } from '../config'
import {
  ADSENSE_CLIENT_CHOICES,
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

const KIND_OPTIONS = (Object.keys(KIND_LABELS) as AdKind[]).map((k) => ({ value: k, label: KIND_LABELS[k] }))
const FORMAT_OPTIONS = (Object.keys(FORMAT_LABELS) as AdsenseFormat[]).map((k) => ({ value: k, label: FORMAT_LABELS[k] }))

function TagFill({ set }: { set: Set }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const fill = () => {
    const parsed = parseTag(text)
    if (!parsed) {
      setResult({ ok: false, message: '태그를 인식하지 못했습니다. 아래에서 종류를 고르고 값을 넣으세요.' })
      return
    }
    set(parsed.patch)
    setResult({ ok: true, message: `${parsed.summary} — 아래 값을 채웠습니다.` })
  }

  return (
    <section className="mkSection">
      <h2 className="mkSectionTitle">
        <span className="mkStep">1</span>광고 업체 태그로 채우기 <span className="mkOptional">선택</span>
      </h2>
      <TextArea
        value={text}
        onChange={setText}
        rows={4}
        placeholder={'요청서의 예시 태그나 URL을 붙여넣으세요.\n<iframe src="…" width="300" height="250"></iframe>'}
      />
      <div className="mkRow">
        <button type="button" className="mkBtn" onClick={fill} disabled={!text.trim()}>
          태그로 채우기
        </button>
        <span className="mkHint">분석만 하고 실행하지 않습니다. 태그가 없으면 건너뛰고 아래에서 고르세요.</span>
      </div>
      {result ? <p className={`mkParseResult ${result.ok ? 'isOk' : 'isFail'}`}>{result.message}</p> : null}
    </section>
  )
}

function SizeChoice({ c, set, label = '크기' }: { c: AdConfig; set: Set; label?: string }) {
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

function KindFields({ c, set }: { c: AdConfig; set: Set }) {
  if (c.kind === 'iframe') {
    return (
      <div className="mkGrid">
        <Field label="광고 URL" wide>
          <TextInput mono value={c.iframeUrl} onChange={(iframeUrl) => set({ iframeUrl })} placeholder="https://" />
        </Field>
        <SizeChoice c={c} set={set} />
      </div>
    )
  }
  if (c.kind === 'adsense') {
    return (
      <div className="mkGrid">
        <Field label="client" group wide>
          <Choice
            label="client"
            mono
            value={c.adClient}
            options={ADSENSE_CLIENT_CHOICES}
            onChange={(adClient) => set({ adClient })}
            placeholder="ca-pub-0000000000000000"
          />
        </Field>
        <Field label="slot (애즈 코드)">
          <TextInput mono value={c.adSlot} onChange={(adSlot) => set({ adSlot })} placeholder="1234567890" />
        </Field>
        <Field label="형식" group wide>
          <Segmented label="애드센스 형식" value={c.adFormat} options={FORMAT_OPTIONS} onChange={(adFormat) => set({ adFormat })} />
        </Field>
        {c.adFormat === 'infeed' ? (
          <Field label="layout-key" hint="애드센스 관리 화면의 인피드 코드에 있습니다.">
            <TextInput mono value={c.adLayoutKey} onChange={(adLayoutKey) => set({ adLayoutKey })} placeholder="-6t+ed+2i-1n-4w" />
          </Field>
        ) : null}
        {c.adFormat === 'responsive' ? (
          <Field label="화면 너비 꽉 채우기" group>
            <Check checked={c.adFullWidthResponsive} onChange={(adFullWidthResponsive) => set({ adFullWidthResponsive })}>
              full-width-responsive
            </Check>
          </Field>
        ) : null}
        {needsSize(c) ? <SizeChoice c={c} set={set} /> : null}
      </div>
    )
  }
  if (c.kind === 'script') {
    return (
      <div className="mkGrid">
        <Field label="스크립트 URL" wide>
          <TextInput mono value={c.scriptUrl} onChange={(scriptUrl) => set({ scriptUrl })} placeholder="https://" />
        </Field>
        <Field label="광고 태그" group>
          <Segmented
            label="광고 태그 종류"
            value={c.scriptTagName}
            onChange={(scriptTagName) => set({ scriptTagName })}
            options={[
              { value: 'ins', label: '<ins>' },
              { value: 'div', label: '<div>' },
            ]}
          />
        </Field>
        <Field label="광고 태그 class">
          <TextInput mono value={c.scriptTagClass} onChange={(scriptTagClass) => set({ scriptTagClass })} />
        </Field>
        <Field label="태그 속성" hint="key=value 한 줄에 하나. {w} {h}는 크기로 바뀝니다." wide>
          <TextArea value={c.scriptTagAttrs} onChange={(scriptTagAttrs) => set({ scriptTagAttrs })} placeholder="data-unit-id=12345" />
        </Field>
        <Field label="초기화 코드" wide>
          <TextArea value={c.scriptInit} onChange={(scriptInit) => set({ scriptInit })} rows={3} placeholder="(window.ads = window.ads || []).push({});" />
        </Field>
        <Field label="초기화 시점" group>
          <Segmented
            label="초기화 시점"
            value={c.scriptInitTiming}
            onChange={(scriptInitTiming) => set({ scriptInitTiming })}
            options={[
              { value: 'onload', label: '스크립트 로드 후' },
              { value: 'immediate', label: '바로' },
            ]}
          />
        </Field>
        <Field label="크기 (선택)" group wide hint="태그 속성의 {w} {h}에 들어갑니다. 쓰지 않으면 비워 두세요.">
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
      <Field label="광고 업체 원본 HTML" wide>
        <TextArea value={c.rawHtml} onChange={(rawHtml) => set({ rawHtml })} rows={5} />
      </Field>
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
    <div className="mkField mkFieldWide" role="group" aria-label="광고 태그">
      <div className="mkAreaPick">
        <select className="mkInput" aria-label="서비스" value={pick.service} onChange={(e) => chooseService(e.target.value)}>
          <option value="">지정 안 함 (스크립트 자리)</option>
          {AD_TAG_SERVICES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
          <option value={CUSTOM}>직접 입력</option>
        </select>
        {service ? (
          <select className="mkInput mkMono" aria-label="광고 태그" value={pick.tag} onChange={(e) => chooseTag(e.target.value)}>
            <option value="" disabled>
              광고 태그를 고르세요
            </option>
            {service.tags.map((x) => (
              <option key={x.tag} value={x.tag}>
                {x.tag}
              </option>
            ))}
          </select>
        ) : null}
        {pick.service === CUSTOM ? (
          <TextInput mono value={c.areaSelector} onChange={(areaSelector) => set({ areaSelector })} placeholder="#ad_area 또는 .ad_area" />
        ) : null}
      </div>
      <span className="mkHint">
        {pick.service === CUSTOM
          ? c.areaSelector.trim()
            ? `${c.areaSelector.trim()} 요소 안에 넣습니다. 페이지에 요소가 없으면 광고를 넣지 않고 멈춥니다.`
            : '광고를 넣을 요소의 선택자를 입력하세요. 비우면 스크립트를 넣은 자리에 넣습니다.'
          : service && !adTag
            ? '광고 태그를 고르세요. 고른 태그에 맞는 위치가 코드에 들어갑니다.'
            : adTag
              ? `${adTag.tag} 자리에 광고를 넣습니다.${adTag.selector ? ' 페이지에 그 자리가 없으면 광고를 넣지 않고 멈춥니다.' : ''}${adTag.parentAreas ? ' 광고를 감싼 영역의 높이도 광고 높이에 맞춥니다.' : ''}`
              : '스크립트를 넣은 자리에 광고를 넣습니다.'}
      </span>
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
            <option value={1}>상위 문서 (parent)</option>
            <option value={2}>그 위 문서 (parent.parent)</option>
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
      <h3 className="mkGroupTitle">옵션</h3>
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
      <p className="mkHint">켠 옵션의 세부 설정이 아래에 열립니다.</p>

      {c.label ? (
        <div className="mkOptionPanel">
          <h3 className="mkGroupTitle">AD 라벨</h3>
          <div className="mkGrid">
            <Field label="문구" group>
              <Choice label="라벨 문구" value={c.labelText} options={LABEL_TEXT_CHOICES} onChange={(labelText) => set({ labelText })} />
            </Field>
            <Field label="위치" group>
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
            <Field
              label="숨기는 방식"
              group
              wide
              hint={
                c.hideMode === 'css'
                  ? '빈 광고(ins)만 CSS로 숨깁니다. 감싼 영역의 여백은 남습니다.'
                  : '응답을 지켜보다가 광고가 없으면 지정한 영역까지 숨기고, 있으면 펼칩니다.'
              }
            >
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
                <Field label="응답 전에 접어 둘 영역" group wide hint="광고가 오기 전 빈 자리가 보이지 않게 높이 0으로 접어 둡니다.">
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

      {c.parentFit ? (
        <div className="mkOptionPanel">
          <h3 className="mkGroupTitle">상위 프레임 높이 맞춤</h3>
          <div className="mkGrid">
            <Field
              label="높이를 바꿀 상위 문서 요소"
              group
              wide
              hint="광고 태그를 고르면 그 태그에 맞게 자동으로 채워집니다. 요소마다 따로 시도해서, 한 단계가 다른 도메인이어도 나머지는 맞춥니다."
            >
              <ParentAreasEditor areas={c.parentAreas} onChange={(parentAreas) => set({ parentAreas })} />
            </Field>
            <Field label="frameElement로 높이를 바꿀 iframe" group wide>
              <Segmented
                label="frameElement로 높이를 바꿀 iframe"
                value={c.parentTarget}
                onChange={(parentTarget) => set({ parentTarget })}
                options={[
                  { value: 'none', label: '바꾸지 않음' },
                  { value: 'window', label: '광고를 감싼 iframe' },
                  { value: 'parent', label: '그 바깥 iframe' },
                ]}
              />
            </Field>
            {c.parentTarget !== 'none' ? (
              <Field label="iframe name" group wide hint="이 이름일 때만 높이를 바꿉니다.">
                <Choice
                  label="iframe name"
                  mono
                  value={c.parentIframeName}
                  options={PARENT_IFRAME_NAME_CHOICES}
                  onChange={(parentIframeName) => set({ parentIframeName })}
                  placeholder="ad_mid"
                />
              </Field>
            ) : null}
            <Field label="높이" group wide>
              <Choice
                label="높이"
                value={c.parentHeight}
                options={PARENT_HEIGHT_CHOICES}
                onChange={(parentHeight) => set({ parentHeight: parentHeight.replace(/[^\d]/g, '') })}
                placeholder="px 숫자 (예: 200)"
              />
            </Field>
          </div>
        </div>
      ) : null}
    </>
  )
}

function Advanced({ c, set }: { c: AdConfig; set: Set }) {
  // 접혀 있어도 켜 둔 옵션이 있는지 알 수 있게 제목 옆에 개수를 보여 준다
  const onCount = [c.label, c.lazy, c.hideEmpty && c.kind === 'adsense', c.parentFit].filter(Boolean).length
  return (
    <details className="mkSection mkAdvanced">
      <summary className="mkSectionTitle">
        <span className="mkStep">4</span>고급 설정 {onCount ? <span className="mkOptional">옵션 {onCount}개 켜짐</span> : null}
      </summary>

      <OptionChips c={c} set={set} />

      <h3 className="mkGroupTitle">광고 위치 요소(_adArea) 스타일</h3>
      <div className="mkGrid">
        <Field label="너비" group>
          <Choice label="너비" value={c.areaWidth} options={AREA_WIDTH_CHOICES} onChange={(areaWidth) => set({ areaWidth })} placeholder="320" />
        </Field>
        <Field label="여백 margin" group>
          <Choice label="여백" value={c.areaMargin} options={AREA_MARGIN_CHOICES} onChange={(areaMargin) => set({ areaMargin })} placeholder="0 auto" />
        </Field>
        <Field label="높이" group>
          <Choice label="높이" value={c.areaHeight} options={AREA_HEIGHT_CHOICES} onChange={(areaHeight) => set({ areaHeight })} placeholder="250" />
        </Field>
        <Field label="광고 div class">
          <TextInput mono value={c.boxClass} onChange={(boxClass) => set({ boxClass })} />
        </Field>
      </div>
      <p className="mkHint">지정한 것만 코드에 들어갑니다. 숫자만 쓰면 px로 붙습니다.</p>

      {c.kind === 'iframe' ? (
        <>
          <h3 className="mkGroupTitle">iframe 속성</h3>
          <div className="mkGrid">
            <Field label="scrolling" group>
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
            <Field label="frameborder" group>
              <Check checked={c.iframeFrameborder} onChange={(iframeFrameborder) => set({ iframeFrameborder })}>
                frameborder="0" 넣기
              </Check>
            </Field>
            <Field label="referrerpolicy" group wide>
              <Choice
                label="referrerpolicy"
                mono
                value={c.iframeReferrerPolicy}
                options={REFERRER_CHOICES}
                onChange={(iframeReferrerPolicy) => set({ iframeReferrerPolicy })}
              />
            </Field>
            <Field label="title" group>
              <Choice label="title" value={c.iframeTitle} options={IFRAME_TITLE_CHOICES} onChange={(iframeTitle) => set({ iframeTitle })} />
            </Field>
            <Field label="추가 속성" hint="key=value 한 줄에 하나" wide>
              <TextArea value={c.iframeExtraAttrs} onChange={(iframeExtraAttrs) => set({ iframeExtraAttrs })} placeholder="marginwidth=0" />
            </Field>
          </div>
        </>
      ) : null}

      {c.kind === 'script' ? (
        <>
          <h3 className="mkGroupTitle">외부 script</h3>
          <Field label="광고 태그 스타일" wide>
            <TextInput mono value={c.scriptTagStyle} onChange={(scriptTagStyle) => set({ scriptTagStyle })} placeholder="display:block;width:100%" />
          </Field>
        </>
      ) : null}

      <h3 className="mkGroupTitle">코드</h3>
      <div className="mkChecks">
        <Check checked={c.tryCatch} onChange={(tryCatch) => set({ tryCatch })}>
          try/catch로 감싸기
        </Check>
        <Check checked={c.scriptOnce} onChange={(scriptOnce) => set({ scriptOnce })}>
          외부 script 1회만 로드
        </Check>
      </div>

      <h3 className="mkGroupTitle">추가 CSS</h3>
      <TextArea value={c.extraCss} onChange={(extraCss) => set({ extraCss })} rows={3} placeholder=".my-ad{margin:0 auto;}" />
    </details>
  )
}

export function ConfigForm({ config, onChange }: { config: AdConfig; onChange: Set }) {
  return (
    <div className="mkForm">
      <TagFill set={onChange} />
      <section className="mkSection">
        <h2 className="mkSectionTitle">
          <span className="mkStep">2</span>광고 태그
        </h2>
        <AdTagField c={config} set={onChange} />
      </section>
      <section className="mkSection">
        <h2 className="mkSectionTitle">
          <span className="mkStep">3</span>광고 종류
        </h2>
        <Segmented label="광고 종류" value={config.kind} options={KIND_OPTIONS} onChange={(kind) => onChange({ kind })} />
        <p className="mkHint">{KIND_DESCRIPTIONS[config.kind]}</p>
        <KindFields c={config} set={onChange} />
      </section>
      <Advanced c={config} set={onChange} />
    </div>
  )
}
