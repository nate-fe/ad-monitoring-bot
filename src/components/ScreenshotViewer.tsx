import { useState } from 'react'
import type { MonitorScreenshot } from '../monitor/types'

type ScreenshotViewerProps = {
  screenshot?: MonitorScreenshot | null
  /** 캡쳐가 없을 때 보여 줄 안내(보존 기간이 지난 기록 등) */
  emptyHint?: string
  title?: string
  /**
   * details: 접힌 상태로 두고 펼칠 때만 이미지를 부른다(실행 기록 목록용).
   * panel: 처음부터 펼쳐진 카드. details 안에서는 flex 가 먹지 않아(::details-content),
   *        옆 블록과 높이를 맞춰야 하는 자리에서는 이쪽을 쓴다.
   */
  variant?: 'details' | 'panel'
}

function formatTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

/** 해당 실행 시각의 페이지를 맨 위에서 맨 아래까지 이어 붙여 보여 준다. */
export function ScreenshotViewer({
  screenshot,
  emptyHint,
  title = '이 시각 화면 전체 캡쳐',
  variant = 'details',
}: ScreenshotViewerProps) {
  const [opened, setOpened] = useState(false)

  if (!screenshot || !screenshot.files?.length) {
    if (!emptyHint) return null
    return <p className="muted screenshotEmpty">{emptyHint}</p>
  }

  const base = import.meta.env.BASE_URL
  const urls = screenshot.files.map((file) => `${base}${file}`)
  const countLabel =
    screenshot.files.length > 1 ? <span className="screenshotSummaryMeta"> {screenshot.files.length}장</span> : null

  /** 지면이 너무 길어 잘린 경우에만 알린다 */
  const meta = screenshot.truncated ? (
    <div className="screenshotMeta">지면이 매우 길어 아래쪽 일부는 담기지 않았습니다.</div>
  ) : null

  const body = (
    <div className="screenshotScroll">
      <div className="screenshotStack" style={{ maxWidth: screenshot.width || undefined }}>
        {urls.map((url, idx) => (
          <img
            key={url}
            src={url}
            className="screenshotImage"
            loading="lazy"
            alt={
              urls.length > 1
                ? `${formatTime(screenshot.capturedAt)} 화면 캡쳐 ${idx + 1}/${urls.length}`
                : `${formatTime(screenshot.capturedAt)} 화면 캡쳐`
            }
          />
        ))}
      </div>
    </div>
  )

  if (variant === 'panel') {
    return (
      <div className="screenshotBlock screenshotPanel">
        {/* 옆에 나란히 놓이는 '광고·영역별 오류 / 경고' 제목과 같은 스타일을 쓴다 */}
        <h2 className="adIssueSectionTitle">
          {title}
          {countLabel}
        </h2>
        {meta}
        {body}
      </div>
    )
  }

  return (
    <details className="screenshotBlock" onToggle={(e) => setOpened(e.currentTarget.open)}>
      <summary className="screenshotSummary">
        {title}
        {countLabel}
      </summary>
      {meta}
      {/* 실행 기록에서는 펼친 항목의 이미지만 부른다 */}
      {opened ? body : null}
    </details>
  )
}
