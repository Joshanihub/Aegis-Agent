"use client"

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { AnalysisDepth } from '@/lib/types'
import { createRoom } from '@/lib/api'
import { useAegisStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import TraceLine from '@/components/ui/TraceLine'
import SegmentedControl from '@/components/ui/SegmentedControl'
import SliderTrack from '@/components/ui/SliderTrack'

const riskMarks = [0, 20, 40, 60, 80, 100] as const

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { ease: [0.16, 1, 0.3, 1], duration: 0.6 },
  },
}

export default function TaskInputForm() {
  const router = useRouter()
  const { reset, setRoomIdentifiers } = useAegisStore()

  const [companyName, setCompanyName] = useState('')
  const [dealContext, setDealContext] = useState('')
  const [riskTolerance, setRiskTolerance] = useState(60)
  const [analysisDepth, setAnalysisDepth] = useState<AnalysisDepth>('STANDARD')
  const [preferredModel, setPreferredModel] = useState('gpt-4o')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validation = useMemo(() => {
    const trimmedCompany = companyName.trim()
    const trimmedContext = dealContext.trim()

    const companyValid = trimmedCompany.length >= 2
    const contextValid = trimmedContext.length >= 10
    const riskValid = Number.isInteger(riskTolerance) && riskTolerance >= 0 && riskTolerance <= 100
    const depthValid = analysisDepth === 'SURFACE' || analysisDepth === 'STANDARD' || analysisDepth === 'DEEP'

    return {
      trimmedCompany,
      trimmedContext,
      companyValid,
      contextValid,
      riskValid,
      depthValid,
      isValid: companyValid && contextValid && riskValid && depthValid,
    }
  }, [analysisDepth, companyName, dealContext, riskTolerance])

  async function onSubmit() {
    setError(null)
    if (!validation.isValid) {
      setError('Please fix validation errors before initializing.')
      return
    }

    setSubmitting(true)
    try {
      reset()
      const res = await createRoom({
        company_name: validation.trimmedCompany,
        deal_context: validation.trimmedContext,
        risk_tolerance: riskTolerance,
        analysis_depth: analysisDepth,
        preferred_model: preferredModel,
      })

      setRoomIdentifiers(res.room_id, res.task_id)
      router.push(`/war-room/${encodeURIComponent(res.task_id)}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initialize room.')
      setSubmitting(false)
    }
  }

  return (
    <motion.form
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault()
        void onSubmit()
      }}
    >
      <motion.div variants={staggerItem}>
        <label htmlFor="company_name" className="font-mono text-[12px] uppercase tracking-[0.1em] text-on-surface-variant block mb-2">
          TARGET COMPANY
        </label>
        <div className="relative">
          <motion.input
            id="company_name"
            name="company_name"
            autoComplete="off"
            inputMode="text"
            required
            className="w-full bg-surface-container border border-border-subtle rounded-md py-3 px-4 text-body-md text-on-surface focus:outline-none"
            whileFocus={{ borderColor: 'var(--accent-luminous)' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            placeholder="e.g. Stripe, Anthropic..."
            value={companyName}
            disabled={submitting}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          {submitting && <div className="absolute inset-0 bg-surface/50 rounded-md" />}
        </div>
        {!validation.companyValid && companyName.trim().length > 0 && (
          <p className="mt-2 text-sm text-crimson-reject">Company name must be at least 2 characters.</p>
        )}
      </motion.div>

      <motion.div variants={staggerItem}>
        <label htmlFor="deal_context" className="font-mono text-[12px] uppercase tracking-[0.1em] text-on-surface-variant block mb-2">
          DEAL CONTEXT
        </label>
        <div className="relative">
          <motion.textarea
            id="deal_context"
            name="deal_context"
            rows={4}
            required
            className="w-full bg-surface-container border border-border-subtle rounded-md py-3 px-4 text-body-md text-on-surface focus:outline-none resize-none"
            whileFocus={{ borderColor: 'var(--accent-luminous)' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            placeholder="Describe the deal or investment thesis..."
            value={dealContext}
            disabled={submitting}
            onChange={(e) => setDealContext(e.target.value)}
          />
          {submitting && <div className="absolute inset-0 bg-surface/50 rounded-md" />}
        </div>
        {!validation.contextValid && dealContext.trim().length > 0 && (
          <p className="mt-2 text-sm text-crimson-reject">Deal context must be at least 10 characters.</p>
        )}
      </motion.div>

      <motion.div variants={staggerItem}>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="risk_tolerance" className="font-mono text-[12px] uppercase tracking-[0.1em] text-on-surface-variant">
            RISK TOLERANCE
          </label>
          <span className="font-mono text-sm text-accent-luminous bg-accent-luminous/10 px-2 py-0.5 rounded-DEFAULT">
            {riskTolerance}
          </span>
        </div>
        <div className="relative">
          <SliderTrack 
            id="risk_tolerance"
            name="risk_tolerance"
            min={0}
            max={100}
            value={riskTolerance}
            onChange={setRiskTolerance}
          />
          {submitting && <div className="absolute inset-0 bg-surface/50 rounded-full" />}
        </div>
        <div className="flex justify-between mt-2">
          {riskMarks.map((m) => (
            <span key={m} className="text-[10px] font-mono text-on-surface-variant/50">
              {m}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div variants={staggerItem}>
        <div className="flex items-center justify-between mb-2">
          <label className="font-mono text-[12px] uppercase tracking-[0.1em] text-on-surface-variant">
            ANALYSIS DEPTH
          </label>
        </div>

        <div className="relative">
          <SegmentedControl 
            name="analysis_depth"
            options={[
              { label: 'SURFACE', value: 'SURFACE' },
              { label: 'STANDARD', value: 'STANDARD' },
              { label: 'DEEP', value: 'DEEP' }
            ]}
            value={analysisDepth}
            onChange={(v) => setAnalysisDepth(v as AnalysisDepth)}
          />
          {submitting && <div className="absolute inset-0 bg-surface/50 z-10" />}
        </div>
      </motion.div>

      <motion.div variants={staggerItem}>
        <label htmlFor="preferred_model" className="font-mono text-[12px] uppercase tracking-[0.1em] text-on-surface-variant block mb-2">
          MODEL ROUTING
        </label>
        <div className="relative">
          <select
            id="preferred_model"
            name="preferred_model"
            value={preferredModel}
            onChange={(e) => setPreferredModel(e.target.value)}
            disabled={submitting}
            className="w-full bg-surface-container border border-border-subtle rounded-md py-3 px-4 text-body-md text-on-surface focus:outline-none focus:border-accent-luminous transition-colors appearance-none"
          >
            <option value="auto">Auto-Route (Task Based)</option>
            <optgroup label="AI/ML API (OpenAI / Anthropic / Google)">
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</option>
              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            </optgroup>
            <optgroup label="Featherless AI (Open Source)">
              <option value="mistralai/Mistral-7B-Instruct-v0.2">Mistral 7B Instruct</option>
              <option value="meta-llama/Meta-Llama-3-8B-Instruct">Llama 3 8B</option>
              <option value="meta-llama/Meta-Llama-3-70B-Instruct">Llama 3 70B</option>
              <option value="Qwen/Qwen2-72B-Instruct">Qwen2 72B</option>
            </optgroup>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          {submitting && <div className="absolute inset-0 bg-surface/50 rounded-md" />}
        </div>
      </motion.div>

      {error && (
        <motion.div variants={staggerItem} className="rounded-md border border-crimson-reject/50 bg-crimson-reject/10 p-4">
          <p className="text-sm text-crimson-reject">{error}</p>
        </motion.div>
      )}

      <motion.div variants={staggerItem} className="pt-4">
        <motion.button
          type="submit"
          disabled={submitting || !validation.isValid}
          className="relative w-full bg-primary text-on-primary font-mono text-[12px] uppercase tracking-[0.1em] font-semibold py-4 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-glow-primary hover:shadow-glow-hover"
          whileHover={(!submitting && validation.isValid) ? { backgroundColor: 'var(--accent-luminous)' } : {}}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {submitting ? (
            <div className="flex items-center gap-3">
              <span className="relative w-16 h-4 flex items-center justify-center">
                <TraceLine />
              </span>
              <span>ASSEMBLING AGENTS...</span>
            </div>
          ) : (
            <span>INITIALIZE COMMITTEE ROOM</span>
          )}
        </motion.button>
      </motion.div>
    </motion.form>
  )
}
