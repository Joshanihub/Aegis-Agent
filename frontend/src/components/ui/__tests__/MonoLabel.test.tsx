import { render, screen } from '@testing-library/react'
import MonoLabel from '../MonoLabel'

describe('MonoLabel', () => {
  it('renders correctly', () => {
    render(<MonoLabel>Hello Mono</MonoLabel>)
    expect(screen.getByText('Hello Mono')).toBeInTheDocument()
    expect(screen.getByText('Hello Mono')).toHaveClass('font-mono')
  })
})
