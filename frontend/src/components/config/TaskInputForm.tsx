"use client"

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { AnalysisDepth } from '@/lib/types'
import { createRoom, uploadFile } from '@/lib/api'
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
  const [riskTolerance, setRiskTolerance] = useState(useAegisStore.getState().defaultRiskTolerance)
  const [persona, setPersona] = useState('Standard Analyst')
  const [analysisDepth, setAnalysisDepth] = useState<AnalysisDepth>(useAegisStore.getState().defaultAnalysisDepth)
  const [defaultAimlModel, setDefaultAimlModel] = useState(useAegisStore.getState().defaultAimlModel || 'gpt-4o')
  const [defaultFeatherlessModel, setDefaultFeatherlessModel] = useState(useAegisStore.getState().defaultFeatherlessModel || 'meta-llama/Llama-3.3-70B-Instruct')

  const [uploadedFiles, setUploadedFiles] = useState<{file_id: string, filename: string}[]>([])
  const [uploading, setUploading] = useState(false)

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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    
    setUploading(true)
    setError(null)
    try {
      const file = e.target.files[0]
      const result = await uploadFile(file)
      setUploadedFiles(prev => [...prev, result])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document.')
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

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
        persona: persona,
        preferred_aiml_model: defaultAimlModel,
        preferred_featherless_model: defaultFeatherlessModel,
        document_ids: uploadedFiles.map(f => f.file_id)
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
        <label className="font-mono text-[12px] uppercase tracking-[0.1em] text-on-surface-variant block mb-2">
          SUPPORTING DOCUMENTS
        </label>
        <div className="relative border border-dashed border-border-subtle rounded-md p-6 bg-surface-container/50 hover:border-accent-luminous/50 hover:bg-surface-container transition-colors">
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            onChange={handleFileUpload}
            disabled={submitting || uploading}
            accept=".pdf,.txt,.md,.csv,.doc,.docx"
          />
          <div className="flex flex-col items-center justify-center text-center gap-2 pointer-events-none">
            {uploading ? (
              <span className="font-mono text-sm text-accent-luminous">UPLOADING...</span>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-on-surface-variant/50">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="font-body text-sm text-on-surface-variant">Click or drag files to attach</p>
                <p className="font-mono text-[10px] text-text-muted">PDF, TXT, CSV</p>
              </>
            )}
          </div>
        </div>
        
        {uploadedFiles.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {uploadedFiles.map(f => (
              <div key={f.file_id} className="flex items-center justify-between bg-surface-container py-2 px-3 rounded-md border border-border-subtle/50">
                <div className="flex items-center gap-2 overflow-hidden">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-agent shrink-0">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="font-mono text-xs text-on-surface truncate">{f.filename}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setUploadedFiles(prev => prev.filter(x => x.file_id !== f.file_id))}
                  className="text-text-muted hover:text-crimson-reject transition-colors"
                  disabled={submitting}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
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
        <label htmlFor="persona" className="font-mono text-[12px] uppercase tracking-[0.1em] text-on-surface-variant block mb-2">
          FINALIZER PERSONA
        </label>
        <div className="relative">
          <select
            id="persona"
            name="persona"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            disabled={submitting || uploading}
            className="w-full bg-surface-container border border-border-subtle rounded-md py-3 px-4 text-body-md text-on-surface focus:outline-none focus:border-accent-luminous transition-colors appearance-none"
          >
            <option value="Standard Analyst">Standard Analyst</option>
            <option value="Conservative Risk Officer">Conservative Risk Officer</option>
            <option value="Aggressive Growth Investor">Aggressive Growth Investor</option>
            <option value="ESG Focused">ESG Focused</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          {(submitting || uploading) && <div className="absolute inset-0 bg-surface/50 rounded-md" />}
        </div>
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="preferred_aiml_model" className="font-mono text-[12px] uppercase tracking-[0.1em] text-on-surface-variant block mb-2">
            REASONING ENGINE (AI/ML)
          </label>
          <div className="relative">
            <select
              id="preferred_aiml_model"
              name="preferred_aiml_model"
              value={defaultAimlModel}
              onChange={(e) => setDefaultAimlModel(e.target.value)}
              disabled={submitting}
              className="w-full bg-surface-container border border-border-subtle rounded-md py-3 px-4 text-body-md text-on-surface focus:outline-none focus:border-accent-luminous transition-colors appearance-none"
            >
              <option value="gpt-4o">GPT-4o (Default)</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="o1-preview">o1 Preview</option>
              <option value="o3-mini">o3 Mini</option>
              <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              <option value="claude-3-opus-20240229">Claude 3 Opus</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            {submitting && <div className="absolute inset-0 bg-surface/50 rounded-md" />}
          </div>
        </div>

        <div>
          <label htmlFor="preferred_featherless_model" className="font-mono text-[12px] uppercase tracking-[0.1em] text-on-surface-variant block mb-2">
            DATA ENGINE (FEATHERLESS)
          </label>
          <div className="relative">
            <select
              id="preferred_featherless_model"
              name="preferred_featherless_model"
              value={defaultFeatherlessModel}
              onChange={(e) => setDefaultFeatherlessModel(e.target.value)}
              disabled={submitting}
              className="w-full bg-surface-container border border-border-subtle rounded-md py-3 px-4 text-body-md text-on-surface focus:outline-none focus:border-accent-luminous transition-colors appearance-none"
            >
              <option value="meta-llama/Llama-3.3-70B-Instruct">Llama 3.3 (70B)</option>
              <option value="meta-llama/Llama-3.1-405B-Instruct">Llama 3.1 (405B)</option>
              <option value="Qwen/Qwen2.5-72B-Instruct">Qwen2.5 (72B)</option>
              <option value="deepseek-ai/DeepSeek-V3">DeepSeek-V3</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            {submitting && <div className="absolute inset-0 bg-surface/50 rounded-md" />}
          </div>
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
