import type { ScriptIssueTop10Row } from '../monitor/types'

export const SCRIPT_ISSUE_TOP10_HELP_TEXT =
  '페이지 오류와 페이지 스크립트 콘솔의 오류·경고만 사용합니다(source 필드가 devtools인 헤드리스 네트워크 로그는 제외). 동일 출처는 쿼리 없이 origin+pathname으로 묶어 집계합니다. 특정 자동 HTTPS 경고 문구는 경고에서 제외합니다.'

type ScriptIssueTop10Props = {
  rows: ScriptIssueTop10Row[]
}

export function ScriptIssueTop10({ rows }: ScriptIssueTop10Props) {
  if (!rows.length) {
    return (
      <p className="muted scriptIssueTopEmpty">sourceUrl이 있는 오류·경고가 없어 집계할 수 없습니다.</p>
    )
  }

  return (
    <div className="adIssueTableWrap scriptIssueTopWrap">
      <table className="adIssueTable scriptIssueTopTable">
        <caption className="srOnly">스크립트 출처별 오류 및 경고 건수 상위 10</caption>
        <colgroup>
          <col className="scriptIssueTopColRank" />
          <col className="scriptIssueTopColUrl" />
          <col className="scriptIssueTopColNum" />
          <col className="scriptIssueTopColNum" />
          <col className="scriptIssueTopColNum scriptIssueTopColTotal" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" className="scriptIssueTopThRank">
              #
            </th>
            <th scope="col" className="scriptIssueTopThUrl">
              스크립트 출처 (sourceUrl)
            </th>
            <th scope="col" className="scriptIssueTopThNum">
              오류
            </th>
            <th scope="col" className="scriptIssueTopThNum">
              경고
            </th>
            <th scope="col" className="scriptIssueTopThNum">
              합계
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.sourceUrl}>
              <td className="scriptIssueTopTdRank">{i + 1}</td>
              <th scope="row" className="scriptIssueTopUrlCell">
                <a
                  href={r.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="scriptIssueTopUrlLink"
                >
                  {r.sourceUrl}
                </a>
              </th>
              <td className="scriptIssueTopTdNum">{r.errors}</td>
              <td className="scriptIssueTopTdNum">{r.warnings}</td>
              <td className="scriptIssueTopTdNum scriptIssueTopTdTotal">{r.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
