import { render, screen } from '@testing-library/react'
import GlassPanel from '../GlassPanel'

describe('GlassPanel', () => {
  it('renders children correctly', () => {
    render(
      <GlassPanel>
        <div>Test Content</div>
      </GlassPanel>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})
