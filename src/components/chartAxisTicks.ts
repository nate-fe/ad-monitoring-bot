/** 기울인 날짜 라벨 하나가 겹치지 않고 들어가는 최소 가로 간격(px) */
const TICK_LABEL_MIN_GAP_PX = 44
/** 라벨이 겹칠 때 솎아 내는 기본 간격 — 5칸(일)에 하나 */
const TICK_STRIDE_STEP = 5

/**
 * 눈금 라벨을 몇 칸에 하나씩 보여줄지 정한다.
 * 다 넣어도 여유가 있으면 1(전부), 촘촘하면 5의 배수(5·10·15…)로 솎아 낸다.
 */
export function pickTickStride(count: number, plotWidth: number): number {
  if (count <= 1) return 1
  const maxLabels = Math.max(2, Math.floor(plotWidth / TICK_LABEL_MIN_GAP_PX))
  if (count <= maxLabels) return 1
  const needed = Math.ceil(count / maxLabels)
  return Math.max(TICK_STRIDE_STEP, Math.ceil(needed / TICK_STRIDE_STEP) * TICK_STRIDE_STEP)
}

/** 가장 최근 칸은 항상 남기고 거기서부터 stride 간격으로만 라벨을 표시 */
export function isLabeledTickIndex(index: number, count: number, stride: number): boolean {
  if (stride <= 1) return true
  return (count - 1 - index) % stride === 0
}
