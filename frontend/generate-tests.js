import fs from 'fs'
import path from 'path'

const componentDirs = [
  'ui',
  'war-room',
  'verdict',
  'config'
]

const baseDir = path.join(process.cwd(), 'src/components')

for (const dir of componentDirs) {
  const dirPath = path.join(baseDir, dir)
  const testDirPath = path.join(dirPath, '__tests__')
  
  if (!fs.existsSync(testDirPath)) {
    fs.mkdirSync(testDirPath, { recursive: true })
  }

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.tsx'))

  for (const file of files) {
    const componentName = file.replace('.tsx', '')
    const testFilePath = path.join(testDirPath, `${componentName}.test.tsx`)
    
    if (fs.existsSync(testFilePath)) continue; // skip existing

    let testContent = `import { render } from '@testing-library/react'
import ${componentName} from '../${componentName}'

// Note: This is an auto-generated basic render test.
// Due to time constraints, complex props are mocked minimally.
// For full compliance, these tests should be expanded.

describe('${componentName}', () => {
  it('renders without crashing', () => {
`
    // Add mock props based on component
    let propsStr = ''
    if (componentName === 'AgentCard') {
      propsStr = `{ agent: { agent_id: 'planner', name: 'Planner', role: 'test', status: 'idle', last_action: '', api_used: '', confidence: 100, updated_at: '' }, isActive: true }`
    } else if (componentName === 'AgentGrid') {
      propsStr = `{ agents: [] }`
    } else if (componentName === 'TerminalStream') {
      propsStr = `{ messages: [] }`
    } else if (componentName === 'SessionHeader') {
      propsStr = `{ taskId: '123', roomStatus: 'connected', wsError: null }`
    } else if (componentName === 'LockedSidebar') {
      propsStr = `{ currentRisk: 50 }`
    } else if (componentName === 'MessageBlock') {
      propsStr = `{ m: { owner: 'planner', task: 't', context: 'c', action: 'a', output: { data: {}, confidence: 100, reasoning: 'r', api_used: '' }, status: 'ok', next_handoff: null, metadata: {} }, isBlurred: false }`
    } else if (componentName === 'WarRoomInner') {
      propsStr = `{ taskId: '123' }`
    } else if (componentName === 'DossierCard') {
      propsStr = `{ verdict: { risk_score: 50, verdict: 'approve', summary: 'test', vulnerabilities: [], reasoning_chain: [] } }`
    } else if (componentName === 'ReasoningChain') {
      propsStr = `{ chain: [] }`
    } else if (componentName === 'RiskRing') {
      propsStr = `{ score: 50 }`
    } else if (componentName === 'VerdictBadge') {
      propsStr = `{ verdict: 'approve' }`
    } else if (componentName === 'VulnerabilityList') {
      propsStr = `{ vulnerabilities: [] }`
    } else if (componentName === 'SegmentedControl') {
      propsStr = `{ options: [], value: '', onChange: jest.fn(), name: 'test' }`
    }

    if (propsStr) {
      testContent += `    render(<${componentName} {...${propsStr}} />)\n`
    } else {
      testContent += `    render(<${componentName} />)\n`
    }

    testContent += `  })
})
`
    fs.writeFileSync(testFilePath, testContent)
    console.log(`Generated test for ${componentName}`)
  }
}
