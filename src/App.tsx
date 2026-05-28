import { useState } from 'react'
import { EditorForm } from './components/EditorForm'
import { ViewerPage } from './components/Viewer/ViewerPage'
import styles from './App.module.css'

// 임시 탭 — 작업 6에서 "뷰어 메인 + 등록 우측 슬라이드"로 전환 예정.
type Tab = 'viewer' | 'editor'

function App() {
  const [tab, setTab] = useState<Tab>('viewer')

  return (
    <div className={styles.app}>
      <nav className={styles.tabBar}>
        <button
          className={`${styles.tabBtn} ${tab === 'viewer' ? styles.tabBtnActive : ''}`}
          onClick={() => setTab('viewer')}
        >
          팀 스케줄
        </button>
        <button
          className={`${styles.tabBtn} ${tab === 'editor' ? styles.tabBtnActive : ''}`}
          onClick={() => setTab('editor')}
        >
          스케줄 등록
        </button>
      </nav>

      {tab === 'viewer' ? <ViewerPage /> : <EditorForm />}
    </div>
  )
}

export default App
