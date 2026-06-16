import { render, screen } from '@testing-library/react'
import StatusBadge from '../StatusBadge'

describe('StatusBadge', () => {
  it('renders correctly with given status', () => {
    render(<StatusBadge status="processing" variant="indigo" />)
    expect(screen.getByText(/processing/i)).toBeInTheDocument()
  })
})
