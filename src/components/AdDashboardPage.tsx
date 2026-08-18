import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  adScriptCatalog,
  CANONICAL_COMPANIES,
  CODE_SEARCH_MIN_LENGTH,
  groupCatalog,
  isCanonicalCompany,
  loadAllScriptSources,
  loadScriptSource,
  MISC_GROUP,
  snippetsForEntry,
  type AdScriptEntry,
  type CodeSnippet,
  type GroupKey,
} from '../adsCatalog'
import {
  AD_LAYOUTS,
  deviceLabel,
  entriesForSlot,
  LAYOUT_GROUPS,
  type AdLayout,
  type AdSlot,
} from '../adLayouts'

const ALL_TAB = '전체'
const OTHER_TAB = '그 외'

/** 표시용 파일명: .js 확장자는 떼고 보여준다. */
function displayFileName(name: string): string {
  return name.replace(/\.js$/i, '')
}
// 광고태그별 보기에서 개별 탭으로 노출할 상위 태그 수(나머지는 '기타').
const TAG_TAB_LIMIT = 24

type ViewMode = 'list' | 'layout'

type ScriptSourceState =
  | { entryId: string; status: 'loading' }
  | { entryId: string; status: 'loaded'; text: string }
  | { entryId: string; status: 'error'; message: string }

const GROUP_OPTIONS: { id: GroupKey; label: string }[] = [
  { id: 'company', label: '업체별' },
  { id: 'adTag', label: '광고태그별' },
  { id: 'date', label: '날짜별' },
]

function matchesQuery(entry: AdScriptEntry, q: string): boolean {
  if (!q) return true
  const haystack = [
    entry.company,
    entry.adTag,
    entry.fileName,
    entry.work,
    entry.date,
    entry.fullPath,
  ]
    .join(' ')
    .toLowerCase()
  const lowered = q.toLowerCase()
  if (haystack.includes(lowered)) return true
  return lowered
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term))
}

const MAX_HIGHLIGHTS = 80

function HighlightedText({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (q.length < CODE_SEARCH_MIN_LENGTH) return text
  const lower = text.toLowerCase()
  const needle = q.toLowerCase()
  if (!lower.includes(needle)) return text

  const parts: ReactNode[] = []
  let i = 0
  let marks = 0
  let key = 0
  while (i < text.length) {
    const found = lower.indexOf(needle, i)
    if (found < 0 || marks >= MAX_HIGHLIGHTS) {
      parts.push(text.slice(i))
      break
    }
    if (found > i) parts.push(text.slice(i, found))
    parts.push(
      <mark className="adCodeMark" key={key}>
        {text.slice(found, found + needle.length)}
      </mark>,
    )
    key += 1
    marks += 1
    i = found + needle.length
  }
  return <>{parts}</>
}

function isDashboardEntry(entry: AdScriptEntry): boolean {
  return entry.ext === 'js' && !entry.isAttachedBackup
}

function ScriptDetailModal({
  entry,
  onClose,
  highlightQuery = '',
}: {
  entry: AdScriptEntry
  onClose: () => void
  highlightQuery?: string
}) {
  const [sourceState, setSourceState] = useState<ScriptSourceState>(() => ({
    entryId: entry.id,
    status: 'loading',
  }))
  const [copied, setCopied] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    loadScriptSource(entry.id)
      .then((text) => {
        if (alive) setSourceState({ entryId: entry.id, status: 'loaded', text })
      })
      .catch((err: unknown) => {
        if (alive) {
          setSourceState({
            entryId: entry.id,
            status: 'error',
            message: err instanceof Error ? err.message : String(err),
          })
        }
      })
    return () => {
      alive = false
    }
  }, [entry.id])

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleCopy = async () => {
    const currentSource = currentSourceState.status === 'loaded' ? currentSourceState.text : null
    if (currentSource == null) return
    try {
      await navigator.clipboard.writeText(currentSource)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const currentSourceState =
    sourceState.entryId === entry.id ? sourceState : ({ entryId: entry.id, status: 'loading' } as const)

  useEffect(() => {
    if (currentSourceState.status !== 'loaded') return
    const mark = bodyRef.current?.querySelector('mark')
    mark?.scrollIntoView({ block: 'center' })
  }, [currentSourceState, highlightQuery])

  return (
    <div className="adModalBackdrop" role="presentation" onClick={onClose}>
      <div
        className="adModal"
        role="dialog"
        aria-modal="true"
        aria-label={`${entry.fileName} 스크립트`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="adModalHead">
          <div className="adModalTitleWrap">
            <h3 className="adModalTitle">{displayFileName(entry.fileName)}</h3>
            <p className="adModalPath">{entry.fullPath}</p>
            <div className="adChipRow">
              <span className="adChip adChipCompany">{entry.company}</span>
              <span className="adChip adChipTag">{entry.adTag}</span>
              {entry.date ? <span className="adChip">{entry.date}</span> : null}
              {entry.isAux ? <span className="adChip adChipAux">보조/백업</span> : null}
            </div>
          </div>
          <div className="adModalActions">
            <button type="button" className="btnGhost" onClick={handleCopy} disabled={currentSourceState.status !== 'loaded'}>
              {copied ? '복사됨 ✓' : '코드 복사'}
            </button>
            <button ref={closeRef} type="button" className="btnGhost" onClick={onClose}>
              닫기 ✕
            </button>
          </div>
        </header>
        <div className="adModalBody" ref={bodyRef}>
          {currentSourceState.status === 'error' ? (
            <p className="adModalStatus adModalError">불러오기 실패: {currentSourceState.message}</p>
          ) : currentSourceState.status === 'loading' ? (
            <p className="adModalStatus">스크립트를 불러오는 중…</p>
          ) : (
            <pre className="adCode">
              <code>
                <HighlightedText text={currentSourceState.text} query={highlightQuery} />
              </code>
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

// 백업 파일 목록 팝업. 메인 카드의 백업 아이콘 클릭 시 표시.
function BackupPopup({
  entry,
  onOpen,
  onClose,
}: {
  entry: AdScriptEntry
  onOpen: (entry: AdScriptEntry) => void
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="adModalBackdrop" role="presentation" onClick={onClose}>
      <div
        className="adBackupPopup"
        role="dialog"
        aria-modal="true"
        aria-label={`${entry.fileName} 백업 목록`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="adBackupPopupHead">
          <div>
            <h3 className="adBackupPopupTitle">백업 {entry.backups.length}개</h3>
            <p className="adBackupPopupSub" title={entry.fileName}>
              {displayFileName(entry.fileName)}
            </p>
          </div>
          <button type="button" className="btnGhost" onClick={onClose}>
            닫기 ✕
          </button>
        </header>
        <ul className="adBackupList">
          {entry.backups.map((b) => (
            <li className="adBackupItem" key={b.id}>
              <div className="adBackupItemInfo">
                <span className="adBackupItemName" title={b.fullPath}>
                  {displayFileName(b.fileName)}
                </span>
                {b.date ? <span className="adBackupItemDate">{b.date}</span> : null}
              </div>
              <button
                type="button"
                className="btnGhost"
                onClick={() => {
                  onClose()
                  onOpen(b)
                }}
              >
                코드 보기
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function isNavigableTag(tag: string): boolean {
  return tag !== MISC_GROUP && tag !== '미분류'
}

function AdCard({
  entry,
  onOpen,
  onOpenAdTag,
  showCompany = true,
  showTag = true,
  snippets,
  highlightQuery = '',
}: {
  entry: AdScriptEntry
  onOpen: (entry: AdScriptEntry) => void
  onOpenAdTag?: (tag: string) => void
  showCompany?: boolean
  showTag?: boolean
  snippets?: CodeSnippet[]
  highlightQuery?: string
}) {
  const [showBackups, setShowBackups] = useState(false)
  const backupCount = entry.backups.length
  const tagClickable = !!onOpenAdTag && isNavigableTag(entry.adTag)

  return (
    <article className={`adCard${entry.isAux ? ' isAux' : ''}`}>
      {backupCount > 0 ? (
        <button
          type="button"
          className="adBackupIcon"
          title={`백업 ${backupCount}개 보기`}
          aria-label={`백업 ${backupCount}개 보기`}
          onClick={() => setShowBackups(true)}
        >
          <span className="adBackupIconGlyph" aria-hidden="true">
            ⧉
          </span>
          <span className="adBackupIconCount">{backupCount}</span>
        </button>
      ) : null}
      <div className="adCardMeta">
        {entry.date ? <span className="adDate">{entry.date}</span> : null}
        {entry.isAux ? <span className="adChip adChipAux">보조</span> : null}
      </div>
      <p className="adCardFile" title={entry.fileName}>
        {displayFileName(entry.fileName)}
      </p>
      <p className="adCardWork" title={entry.work}>
        {entry.work}
      </p>
      {snippets && snippets.length > 0 ? (
        <div className="adCardSnippet">
          {snippets.map((snip) => (
            <div className="adCardSnippetLine" key={`${snip.backupFileName ?? 'main'}:${snip.lineNumber}`}>
              <span className="adCardSnippetLn">{snip.lineNumber}</span>
              <span className="adCardSnippetText" title={snip.text}>
                {snip.backupFileName ? <span className="adSnippetBackup">백업 </span> : null}
                <HighlightedText text={snip.text} query={highlightQuery} />
              </span>
            </div>
          ))}
        </div>
      ) : null}
      {showCompany || showTag ? (
        <div className="adChipRow">
          {showCompany ? <span className="adChip adChipCompany">{entry.company}</span> : null}
          {showTag ? (
            tagClickable ? (
              <button
                type="button"
                className="adChip adChipTag adChipTagBtn"
                title={`「${entry.adTag}」 업체별 보기`}
                onClick={() => onOpenAdTag?.(entry.adTag)}
              >
                {entry.adTag}
              </button>
            ) : (
              <span className="adChip adChipTag">{entry.adTag}</span>
            )
          ) : null}
        </div>
      ) : null}
      <button type="button" className="adDetailBtn" onClick={() => onOpen(entry)}>
        자세히 보기
      </button>
      {showBackups ? (
        <BackupPopup entry={entry} onOpen={onOpen} onClose={() => setShowBackups(false)} />
      ) : null}
    </article>
  )
}

// 지면(광고 영역) 보기 — 네모 박스로 광고 영역을 표현하고, 클릭하면 해당 영역의 광고를 보여준다.
function AdLayoutView({ onOpen }: { onOpen: (entry: AdScriptEntry) => void }) {
  const [layout, setLayout] = useState<AdLayout>(AD_LAYOUTS[0])
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null)
  const layoutCatalog = useMemo(() => adScriptCatalog.filter(isDashboardEntry), [])

  // 슬롯별 매칭 광고 수 미리 계산(박스에 개수 뱃지 표시).
  const slotCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const slot of layout.slots) {
      map.set(slot.id, entriesForSlot(layoutCatalog, slot).length)
    }
    return map
  }, [layout, layoutCatalog])

  const activeSlot = layout.slots.find((s) => s.id === activeSlotId) ?? null
  const activeEntries = useMemo(
    () => (activeSlot ? entriesForSlot(layoutCatalog, activeSlot) : []),
    [activeSlot, layoutCatalog],
  )

  const activeLayoutGroup = LAYOUT_GROUPS.find((g) => g.layouts.some((l) => l.id === layout.id))
  const DEVICE_ORDER = ['mobile', 'pc'] as const

  const selectLayout = (nextLayout: AdLayout) => {
    setLayout(nextLayout)
    setActiveSlotId(null)
  }

  // 스테이지 라벨: "뉴스 · PC" 형태.
  const layoutTitle = activeLayoutGroup?.title ?? ''
  const stageLabel = `${layoutTitle} · ${deviceLabel(layout.device)}`

  const topSlots = layout.slots.filter((s) => (s.column ?? 'main') === 'top')
  const COLUMN_ORDER = ['left', 'main', 'side', 'right'] as const
  const columnSlots = COLUMN_ORDER.map((col) => ({
    col,
    slots: layout.slots.filter((s) => (s.column ?? 'main') === col),
  })).filter((c) => c.slots.length > 0)
  const stageGridTemplate = columnSlots
    .map(({ col }) => (col === 'main' ? '2fr' : col === 'side' ? '1fr' : '0.6fr'))
    .join(' ')
  const mainColumnIndex = columnSlots.findIndex(({ col }) => col === 'main')
  const sideColumnIndex = columnSlots.findIndex(({ col }) => col === 'side')
  const topGridColumn =
    mainColumnIndex >= 0 && sideColumnIndex >= mainColumnIndex
      ? `${mainColumnIndex + 1} / ${sideColumnIndex + 2}`
      : '1 / -1'

  const renderSlot = (slot: AdSlot) => {
    const count = slotCounts.get(slot.id) ?? 0
    const isActive = slot.id === activeSlotId
    return (
      <button
        key={slot.id}
        type="button"
        className={`adSlot adSlot-${slot.kind ?? 'main'}${isActive ? ' isActive' : ''}${
          count === 0 ? ' isEmpty' : ''
        }`}
        style={{ width: `${slot.width ?? 100}%`, marginTop: slot.offsetTop }}
        onClick={() => setActiveSlotId(slot.id)}
        title={slot.note ? `${slot.label} · ${slot.note}` : slot.label}
      >
        <span className="adSlotLabel">{slot.label}</span>
        <span className="adSlotCount">{count}</span>
      </button>
    )
  }

  return (
    <div className="adLayoutView">
      <div className="adLayoutSelect">
        <div className="adLayoutSwitch" role="group" aria-label="지면 선택">
          {LAYOUT_GROUPS.map((group) => {
            const isGroupActive = group.id === activeLayoutGroup?.id
            const nextLayout = group.layouts.find((l) => l.device === layout.device) ?? group.layouts[0] ?? layout
            return (
              <button
                key={group.id}
                type="button"
                className={`adLayoutSwitchBtn${isGroupActive ? ' isActive' : ''}`}
                aria-pressed={isGroupActive}
                onClick={() => selectLayout(nextLayout)}
              >
                {group.title}
              </button>
            )
          })}
        </div>
        <div className="adLayoutSwitch" role="group" aria-label="기기 선택">
          {DEVICE_ORDER.map((device) => {
            const nextLayout = activeLayoutGroup?.layouts.find((l) => l.device === device)
            const isDeviceActive = layout.device === device
            return (
              <button
                key={device}
                type="button"
                className={`adLayoutSwitchBtn${isDeviceActive ? ' isActive' : ''}`}
                aria-pressed={isDeviceActive}
                disabled={!nextLayout}
                onClick={() => {
                  if (nextLayout) selectLayout(nextLayout)
                }}
              >
                {deviceLabel(device)}
              </button>
            )
          })}
        </div>
      </div>

      <div className="adLayoutSplit">
        <div className={`adStage adStage-${layout.device}`}>
          <span className="adStageLabel">{stageLabel}</span>
          {topSlots.length > 0 ? (
            <div className="adStageTopCols" style={{ gridTemplateColumns: stageGridTemplate }}>
              <div className="adStageCol adStageCol-top" style={{ gridColumn: topGridColumn }}>
                {topSlots.map(renderSlot)}
              </div>
            </div>
          ) : null}
          <div className="adStageCols">
            {columnSlots.map(({ col, slots }) => (
              <div className={`adStageCol adStageCol-${col}`} key={col}>
                {slots.map(renderSlot)}
              </div>
            ))}
          </div>
        </div>

        <div className="adSlotPanel">
          {!activeSlot ? (
            <p className="adEmpty">박스를 선택하면 그 영역의 광고가 표시됩니다.</p>
          ) : (
            <>
              <header className="adSlotPanelHead">
                <h3 className="adSlotPanelTitle">
                  {activeSlot.label}
                  {activeSlot.note ? <span className="adSlotPanelNote"> · {activeSlot.note}</span> : null}
                </h3>
                <div className="adChipRow">
                  {activeSlot.adTags.map((t) => (
                    <span className="adChip adChipTag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </header>
              {activeEntries.length === 0 ? (
                <p className="adEmpty">
                  이 영역에 매칭된 광고가 없습니다.
                </p>
              ) : (
                <div className="adCardGrid">
                  {activeEntries.map((entry) => (
                    <AdCard
                      key={entry.id}
                      entry={entry}
                      onOpen={onOpen}
                      showCompany={false}
                      showTag={false}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function AdDashboardPage({
  onOpenAdTag,
  initialQuery = '',
  autoFocusSearch = false,
}: {
  onOpenAdTag?: (tag: string) => void
  initialQuery?: string
  autoFocusSearch?: boolean
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [groupBy, setGroupBy] = useState<GroupKey>('company')
  const [query, setQuery] = useState(initialQuery)
  const [hideAux, setHideAux] = useState(false)
  const [selectedTab, setSelectedTab] = useState<string>(ALL_TAB)
  const [selected, setSelected] = useState<AdScriptEntry | null>(null)
  const [sourceMap, setSourceMap] = useState<Record<string, string> | null>(null)
  const [sourceStatus, setSourceStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const searchInputRef = useRef<HTMLInputElement>(null)
  // 자동 포커스 여부는 이 화면에 처음 들어온 시점의 값으로 고정한다.
  // (뒤로가기는 popstate·hashchange가 함께 떠서 이후에 값이 다시 바뀔 수 있다.)
  const shouldAutoFocusRef = useRef(autoFocusSearch)

  const trimmedQuery = query.trim()
  const wantsCodeSearch = trimmedQuery.length >= CODE_SEARCH_MIN_LENGTH
  const codeSearchPending = wantsCodeSearch && sourceStatus !== 'ready' && sourceStatus !== 'error'

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  // 대시보드에 들어오면 곧바로 검색어를 칠 수 있게 검색창에 포커스한다.
  // 터치 기기에서는 가상 키보드가 목록을 가려서 건너뛴다.
  useEffect(() => {
    if (!shouldAutoFocusRef.current) return
    const input = searchInputRef.current
    if (!input) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    // 광고태그 상세에서 돌아왔을 때의 스크롤 복원을 방해하지 않도록.
    input.focus({ preventScroll: true })
    const end = input.value.length
    input.setSelectionRange(end, end)
  }, [])

  useEffect(() => {
    if (!wantsCodeSearch || sourceMap) return
    let alive = true
    setSourceStatus('loading')
    loadAllScriptSources()
      .then((map) => {
        if (!alive) return
        setSourceMap(map)
        setSourceStatus('ready')
      })
      .catch(() => {
        if (!alive) return
        setSourceStatus('error')
      })
    return () => {
      alive = false
    }
  }, [wantsCodeSearch, sourceMap])

  const snippetsById = useMemo(() => {
    const map = new Map<string, CodeSnippet[]>()
    if (!sourceMap || !wantsCodeSearch) return map
    for (const entry of adScriptCatalog) {
      if (!isDashboardEntry(entry)) continue
      const snippets = snippetsForEntry(entry, sourceMap, trimmedQuery, 3, !hideAux)
      if (snippets.length > 0) map.set(entry.id, snippets)
    }
    return map
  }, [sourceMap, wantsCodeSearch, trimmedQuery, hideAux])

  const filtered = useMemo(
    () =>
      adScriptCatalog.filter((entry) => {
        if (!isDashboardEntry(entry)) return false
        if (hideAux && entry.isAux) return false
        if (!trimmedQuery) return true
        return matchesQuery(entry, trimmedQuery) || snippetsById.has(entry.id)
      }),
    [hideAux, trimmedQuery, snippetsById],
  )

  const groups = useMemo(() => groupCatalog(filtered, groupBy), [filtered, groupBy])

  // 각 항목의 탭 분류 키(업체별=업체, 광고태그별=광고태그).
  const keyOf = (entry: AdScriptEntry) => (groupBy === 'company' ? entry.company : entry.adTag)

  // 탭 목록. 업체별은 정규 업체 순서, 광고태그별은 파일 수 상위 태그 + 나머지는 '기타'.
  // primary = 개별 탭이 있는 키 집합, 그 외는 '기타'로 묶인다.
  const tabInfo = useMemo(() => {
    // '기타'(참고/미리보기 클러스터)는 항상 독립 탭으로, '그 외' 캐치올과 구분한다.
    if (groupBy === 'company') {
      const present = new Set(filtered.map((e) => e.company))
      const canonical = CANONICAL_COMPANIES.filter((c) => present.has(c))
      const hasMisc = present.has(MISC_GROUP)
      const hasOther = [...present].some((c) => !isCanonicalCompany(c) && c !== MISC_GROUP)
      const primary = new Set([...canonical, ...(hasMisc ? [MISC_GROUP] : [])])
      return {
        tabs: [ALL_TAB, ...canonical, ...(hasMisc ? [MISC_GROUP] : []), ...(hasOther ? [OTHER_TAB] : [])],
        primary,
      }
    }
    if (groupBy === 'adTag') {
      const counts = new Map<string, number>()
      for (const e of filtered) counts.set(e.adTag, (counts.get(e.adTag) ?? 0) + 1)
      const hasMisc = counts.has(MISC_GROUP)
      const ranked = [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
        .map(([k]) => k)
        .filter((k) => k !== MISC_GROUP)
      const top = ranked.slice(0, TAG_TAB_LIMIT)
      const hasOther = ranked.length > top.length
      const primary = new Set([...top, ...(hasMisc ? [MISC_GROUP] : [])])
      return {
        tabs: [ALL_TAB, ...top, ...(hasMisc ? [MISC_GROUP] : []), ...(hasOther ? [OTHER_TAB] : [])],
        primary,
      }
    }
    return { tabs: [] as string[], primary: new Set<string>() }
  }, [groupBy, filtered])

  const tabs = tabInfo.tabs
  // 선택된 탭이 현재 목록에 없으면(분류 기준 변경 등) '전체'로 취급.
  const activeTab = tabs.includes(selectedTab) ? selectedTab : ALL_TAB

  const visibleGroups = useMemo(() => {
    if (tabs.length <= 1 || activeTab === ALL_TAB) return groups
    if (activeTab === OTHER_TAB) return groups.filter((g) => !tabInfo.primary.has(g.key))
    return groups.filter((g) => g.key === activeTab)
  }, [groups, tabs.length, activeTab, tabInfo])

  return (
    <section className="adDashboard">
      <div className="adModeToggle" role="group" aria-label="보기 모드">
        <button
          type="button"
          className={`adModeBtn${viewMode === 'list' ? ' isActive' : ''}`}
          aria-pressed={viewMode === 'list'}
          onClick={() => setViewMode('list')}
        >
          목록
        </button>
        <button
          type="button"
          className={`adModeBtn${viewMode === 'layout' ? ' isActive' : ''}`}
          aria-pressed={viewMode === 'layout'}
          onClick={() => setViewMode('layout')}
        >
          뷰 페이지 지면 보기
        </button>
      </div>

      {viewMode === 'layout' ? (
        <AdLayoutView onOpen={setSelected} />
      ) : (
      <>
      <div className="adControls">
        <div className="adSegmented" role="group" aria-label="분류 기준">
          {GROUP_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`adSegBtn${groupBy === opt.id ? ' isActive' : ''}`}
              aria-pressed={groupBy === opt.id}
              onClick={() => setGroupBy(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <input
          ref={searchInputRef}
          type="search"
          className="adSearch"
          placeholder="업체·파일명 또는 코드 단어·문장 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="광고 스크립트 검색"
        />
        <label className="adCheck">
          <input type="checkbox" checked={hideAux} onChange={(e) => setHideAux(e.target.checked)} />
          백업·테스트 숨기기
        </label>
      </div>
      {wantsCodeSearch ? (
        <p className="adSearchHint">
          {codeSearchPending
            ? '코드에서 검색하는 중… 파일명 일치는 바로 표시됩니다.'
            : sourceStatus === 'error'
              ? '코드 검색을 불러오지 못했습니다. 파일명·업체 검색만 적용됩니다.'
              : `코드 일치 ${snippetsById.size}개 · 전체 결과 ${filtered.length}개`}
        </p>
      ) : (
        <p className="adSearchHint">파일명뿐 아니라 스크립트 안의 단어나 코드 문장도 찾습니다.</p>
      )}

      {tabs.length > 1 ? (
        <div className="adTabs" role="tablist" aria-label={groupBy === 'company' ? '업체 탭' : '광고태그 탭'}>
          {tabs.map((tab) => {
            const count =
              tab === ALL_TAB
                ? filtered.length
                : tab === OTHER_TAB
                  ? filtered.filter((e) => !tabInfo.primary.has(keyOf(e))).length
                  : filtered.filter((e) => keyOf(e) === tab).length
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={`adTab${activeTab === tab ? ' isActive' : ''}`}
                onClick={() => setSelectedTab(tab)}
              >
                {tab}
                <span className="adTabCount">{count}</span>
              </button>
            )
          })}
        </div>
      ) : null}

      {visibleGroups.length === 0 ? (
        <p className="adEmpty">
          {wantsCodeSearch && codeSearchPending
            ? '코드에서 검색하는 중…'
            : '검색 결과가 없습니다.'}
        </p>
      ) : (
        <div className="adGroups">
          {visibleGroups.map((group) => (
            <section className="adGroup" key={group.key}>
              <header className="adGroupHead">
                {groupBy === 'adTag' && onOpenAdTag && isNavigableTag(group.key) ? (
                  <h2 className='adGroupTitle'>
                    {group.key}
                  </h2>
                ) : (
                  <h2 className="adGroupTitle">{group.key}</h2>
                )}
                <span className="adGroupCount">{group.entries.length}</span>
              </header>
              <div className="adCardGrid">
                {group.entries.map((entry) => (
                  <AdCard
                    key={entry.id}
                    entry={entry}
                    onOpen={setSelected}
                    onOpenAdTag={onOpenAdTag}
                    showCompany={groupBy !== 'company'}
                    showTag={groupBy !== 'adTag'}
                    snippets={snippetsById.get(entry.id)}
                    highlightQuery={trimmedQuery}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      </>
      )}

      {selected ? (
        <ScriptDetailModal
          entry={selected}
          onClose={() => setSelected(null)}
          highlightQuery={trimmedQuery}
        />
      ) : null}
    </section>
  )
}

// 광고태그 상세 페이지 — 특정 광고태그의 스크립트를 업체별로 분류해 보여준다.
export function AdTagDetailPage({
  tag,
  onOpenAdTag,
}: {
  tag: string
  onOpenAdTag?: (tag: string) => void
}) {
  const [selected, setSelected] = useState<AdScriptEntry | null>(null)

  const entries = useMemo(
    () =>
      adScriptCatalog.filter(
        (e) => isDashboardEntry(e) && e.adTag.toLowerCase() === tag.toLowerCase(),
      ),
    [tag],
  )
  const groups = useMemo(() => groupCatalog(entries, 'company'), [entries])
  const companies = useMemo(() => new Set(entries.map((e) => e.company)).size, [entries])

  return (
    <section className="adDashboard">
      <p className="adStats">
        광고태그 <strong>{tag}</strong> · 스크립트 <strong>{entries.length}</strong>개 · 업체{' '}
        <strong>{companies}</strong>
      </p>

      {groups.length === 0 ? (
        <p className="adEmpty">이 광고태그에 해당하는 스크립트가 없습니다.</p>
      ) : (
        <div className="adGroups">
          {groups.map((group) => (
            <section className="adGroup" key={group.key}>
              <header className="adGroupHead">
                <h2 className="adGroupTitle">{group.key}</h2>
                <span className="adGroupCount">{group.entries.length}</span>
              </header>
              <div className="adCardGrid">
                {group.entries.map((entry) => (
                  <AdCard
                    key={entry.id}
                    entry={entry}
                    onOpen={setSelected}
                    onOpenAdTag={onOpenAdTag}
                    showCompany={false}
                    showTag={false}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {selected ? <ScriptDetailModal entry={selected} onClose={() => setSelected(null)} /> : null}
    </section>
  )
}
