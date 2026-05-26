import { ADVERTISERS, DESIGNERS, TEAMS, REQUESTERS } from './data/team'

// 껍데기 화면 — team.ts 데이터 연결 확인용.
// 실제 폼은 §만드는 순서 3번부터.
function App() {
  return (
    <main
      style={{
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem',
        lineHeight: 1.6,
        maxWidth: 720,
        margin: '0 auto',
      }}
    >
      <h1>design-team-hub</h1>
      <p style={{ color: '#666' }}>
        껍데기 화면. <code>src/data/team.ts</code> 명단이 잘 읽히는지 확인용.
      </p>

      <h2>광고주 ({ADVERTISERS.length})</h2>
      <ul>
        {ADVERTISERS.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>

      <h2>디자이너 ({DESIGNERS.length})</h2>
      <ul>
        {DESIGNERS.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>

      <h2>팀별 요청자</h2>
      {TEAMS.map((team) => (
        <section key={team}>
          <h3>
            {team} ({REQUESTERS[team].length})
          </h3>
          <ul>
            {REQUESTERS[team].map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  )
}

export default App
