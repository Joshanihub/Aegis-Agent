// Next.js type stubs
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// Allow React JSX typing in strict TS mode (once react types are installed)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: unknown
    }
  }
}

export {}
