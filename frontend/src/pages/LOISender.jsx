import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useBlocker } from 'react-router-dom'
import CountUp from 'react-countup'
import {
  Upload, FileSpreadsheet, CheckCircle, AlertCircle, ChevronRight,
  ChevronLeft, Mail, Play, Pause, RefreshCw, Trash2,
  Clock, Zap, Shield, FileText, Save, FolderOpen,
  TriangleAlert, CircleCheck, Loader, Send, FlaskConical, Settings2,
  Sparkles,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import { db } from '../lib/firebase'
import {
  collection, doc, setDoc, getDocs, updateDoc,
  serverTimestamp, orderBy, query,
} from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'

// ─── Constants ───────────────────────────────────────────────────────────────

const CANONICAL_FIELDS = [
  { key: 'agent_email',    label: 'Agent Email',      required: true  },
  { key: 'agent_name',     label: 'Agent Name',       required: false },
  { key: 'agent_phone',    label: 'Agent Phone',      required: false },
  { key: 'address',        label: 'Property Address', required: false },
  { key: 'city',           label: 'City',             required: false },
  { key: 'state',          label: 'State',            required: false },
  { key: 'zip',            label: 'Zip Code',         required: false },
  { key: 'asking_price',   label: 'Asking Price',     required: false },
  { key: 'cash_offer',     label: 'Cash Offer',       required: false },
  { key: 'cash_to_seller', label: 'Cash to Seller',   required: false },
  { key: 'cash_to_agent',  label: 'Cash to Agent',    required: false },
  { key: 'loan_type',      label: 'Loan Type',        required: false },
  { key: 'interest_rate',  label: 'Interest Rate',    required: false },
  { key: 'loan_balance',   label: 'Loan Balance',     required: false },
  { key: 'percent_equity', label: 'Percent Equity',   required: false },
  { key: 'equity',         label: 'Equity',           required: false },
  { key: 'apn',            label: 'APN',              required: false },
  { key: 'beds',           label: 'Beds',             required: false },
  { key: 'baths',          label: 'Baths',            required: false },
  { key: 'sqft',           label: 'Sq Ft',            required: false },
  { key: 'notes',          label: 'Notes',            required: false },
]

const FIELD_ALIASES = {
  agent_email:    ['email', 'agentemail', 'emailaddress', 'mail'],
  agent_name:     ['agentname', 'name', 'agent', 'listingagent', 'realtorname'],
  agent_phone:    ['agentphone', 'phone', 'phonenumber', 'cell', 'mobile'],
  address:        ['address', 'propaddress', 'propertyaddress', 'streetaddress', 'street'],
  city:           ['city'],
  state:          ['state', 'st'],
  zip:            ['zip', 'zipcode', 'postalcode', 'postal'],
  asking_price:   ['askingprice', 'asking', 'listprice', 'listingprice', 'price'],
  cash_offer:     ['cashoffer', 'offer', 'ourprice', 'offerprice'],
  cash_to_seller: ['cashtoseller', 'cashseller', 'sellercash', 'seller'],
  cash_to_agent:  ['cashtoagent', 'agentfee', 'commission', 'agentcash'],
  loan_type:      ['loantype', 'loan', 'loanprogram'],
  interest_rate:  ['interestrate', 'rate', 'intrate', 'ir'],
  loan_balance:   ['loanbalance', 'balance', 'mortgagebalance', 'mortgage', 'loanbal'],
  percent_equity: ['percentequity', 'equitypct', 'equity%', 'equitypercent'],
  equity:         ['equity', 'totalequity'],
  apn:            ['apn', 'assessorsparcel', 'parcel', 'parcelnumber', 'assessorparcel'],
  beds:           ['beds', 'bedrooms', 'br', 'bed'],
  baths:          ['baths', 'bathrooms', 'ba', 'bath'],
  sqft:           ['sqft', 'squarefeet', 'sf', 'squarefootage', 'livingarea'],
  notes:          ['notes', 'note', 'comments', 'remarks', 'memo'],
}

const DEFAULT_TEMPLATE = {
  subject: 'Letter of Intent — {{address}}, {{city}} {{state}}',
  intro: 'Dear {{agent_name}},\n\nPlease find attached our Letter of Intent for the property located at {{address}}, {{city}}, {{state}} {{zip}}. We are serious buyers and ready to move quickly. We look forward to discussing this with you.',
  body: `Dear {{agent_name}},

I am writing to express our serious interest in acquiring the property located at {{address}}, {{city}}, {{state}} {{zip}}.

PROPERTY INFORMATION:
• Address: {{address}}, {{city}}, {{state}} {{zip}}
• APN: {{apn}}
• Bedrooms / Bathrooms: {{beds}} Beds / {{baths}} Baths
• Square Footage: {{sqft}} sq ft

OFFER TERMS:
• Asking Price: {{asking_price}}
• Our Offer: {{cash_offer}}
• Cash to Seller: {{cash_to_seller}}
• Cash to Agent: {{cash_to_agent}}
• Existing Loan Balance: {{loan_balance}}
• Loan Type: {{loan_type}}
• Interest Rate: {{interest_rate}}%

This Letter of Intent is non-binding and subject to a formal purchase agreement. We are prepared to move forward quickly upon acceptance.

Please do not hesitate to contact us to discuss this offer further. We look forward to working with you.

Respectfully,
[Your Name]
[Your Phone]
[Your Email]`,
}

const STEP_LABELS = ['Upload', 'Map Fields', 'Template', 'Preview', 'Send']

// ─── Utilities ────────────────────────────────────────────────────────────────

function normalize(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function autoDetectMapping(columns) {
  const mapping = {}
  const confidence = {}
  for (const { key } of CANONICAL_FIELDS) {
    const aliases = FIELD_ALIASES[key] || [key]
    for (const col of columns) {
      const n = normalize(col)
      for (const alias of aliases) {
        if (!mapping[key]) {
          if (n === alias) {
            mapping[key] = col; confidence[key] = 'exact'; break
          } else if (n.includes(alias) || alias.includes(n)) {
            mapping[key] = col; confidence[key] = 'fuzzy'
          }
        }
      }
    }
  }
  return { mapping, confidence }
}

function substituteFields(template, lead) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (key === 'today_date') return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    return lead[key] || `{{${key}}}`
  })
}

async function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' })
        resolve(jsonData)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

function generateLOIPdf(lead, template) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 22
  const maxW = pageW - margin * 2
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  doc.setFillColor(14, 90, 136)
  doc.rect(0, 0, pageW, 6, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(14, 90, 136)
  doc.text('LETTER OF INTENT', margin, 22)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  doc.text('Non-Binding — To Purchase Real Property', margin, 29)
  doc.text(`Date: ${today}`, pageW - margin, 29, { align: 'right' })

  doc.setDrawColor(14, 90, 136)
  doc.setLineWidth(0.5)
  doc.line(margin, 33, pageW - margin, 33)

  let y = 42
  if (lead.address) {
    doc.setFillColor(245, 247, 250)
    doc.setDrawColor(210, 218, 228)
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, y, maxW, 20, 2, 2, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(80, 80, 80)
    doc.text('PROPERTY', margin + 4, y + 6)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(20, 20, 20)
    const propLine = [lead.address, lead.city, lead.state, lead.zip].filter(Boolean).join(', ')
    doc.text(propLine, margin + 4, y + 13)

    if (lead.apn) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text(`APN: ${lead.apn}`, pageW - margin - 4, y + 13, { align: 'right' })
    }
    y += 28
  }

  const offerFields = [
    ['Asking Price',   lead.asking_price],
    ['Our Offer',      lead.cash_offer],
    ['Cash to Seller', lead.cash_to_seller],
    ['Cash to Agent',  lead.cash_to_agent],
    ['Loan Balance',   lead.loan_balance],
    ['Loan Type',      lead.loan_type],
    ['Interest Rate',  lead.interest_rate ? `${lead.interest_rate}%` : null],
    ['Equity',         lead.equity],
    ['Beds / Baths',   (lead.beds || lead.baths) ? `${lead.beds || '—'} Beds / ${lead.baths || '—'} Baths` : null],
    ['Sq Ft',          lead.sqft],
  ].filter(([, v]) => v)

  if (offerFields.length) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(14, 90, 136)
    doc.text('OFFER TERMS', margin, y)
    y += 5

    offerFields.forEach(([label, value], i) => {
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252)
        doc.rect(margin, y - 3.5, maxW, 7, 'F')
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(80, 80, 80)
      doc.text(label, margin + 3, y + 0.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(20, 20, 20)
      doc.text(String(value), pageW - margin - 3, y + 0.5, { align: 'right' })
      y += 7
    })
    y += 6
  }

  doc.setDrawColor(220, 226, 234)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageW - margin, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(35, 35, 35)

  const bodyText = substituteFields(template.body, lead)
  const lines = doc.splitTextToSize(bodyText, maxW)

  for (const line of lines) {
    if (y > pageH - 22) {
      doc.addPage()
      doc.setFillColor(14, 90, 136)
      doc.rect(0, 0, pageW, 3, 'F')
      y = 14
    }
    doc.text(line, margin, y)
    y += 5.5
  }

  doc.setFillColor(14, 90, 136)
  doc.rect(0, pageH - 8, pageW, 8, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(255, 255, 255)
  doc.text('This is a non-binding Letter of Intent subject to a formal purchase agreement.', margin, pageH - 3.5)
  doc.text('Generated by Dispo Dojo', pageW - margin, pageH - 3.5, { align: 'right' })

  return doc.output('datauristring').split(',')[1]
}

async function sendViaGmail(accessToken, { to, subject, body, pdfBase64, fileName }) {
  const boundary = `dispodojo_${Date.now()}`
  const subjectEncoded = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`

  const mimeParts = [
    `To: ${to}`,
    `Subject: ${subjectEncoded}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    btoa(unescape(encodeURIComponent(body))),
    ``,
    `--${boundary}`,
    `Content-Type: application/pdf; name="${fileName}"`,
    `Content-Transfer-Encoding: base64`,
    `Content-Disposition: attachment; filename="${fileName}"`,
    ``,
    ...(pdfBase64.match(/.{1,76}/g) || [pdfBase64]),
    ``,
    `--${boundary}--`,
  ].join('\r\n')

  const bytes = new TextEncoder().encode(mimeParts)
  let binary = ''
  bytes.forEach(b => { binary += String.fromCharCode(b) })
  const encoded = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encoded }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Gmail API error')
  }
  return res.json()
}

function isInSendWindow() {
  const now = new Date()
  const estHour = parseInt(
    now.toLocaleString('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false })
  )
  return estHour >= 8 && estHour < 23
}

function randomDelay() {
  return (Math.floor(Math.random() * 41) + 15) * 1000
}

// ─── Page animations ──────────────────────────────────────────────────────────

const pageVariants = {
  hidden:  { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:    { opacity: 0, y: -14, filter: 'blur(4px)', transition: { duration: 0.25 } },
}

// ─── Glass panel helper ───────────────────────────────────────────────────────

function Glass({ children, className = '', style = {} }) {
  return (
    <div
      className={`rounded-2xl border ${className}`}
      style={{
        background: 'rgba(11,15,20,0.45)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        borderColor: 'rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  return (
    <div className="flex items-center mb-8">
      {STEP_LABELS.map((label, i) => {
        const num = i + 1
        const done   = num < current
        const active = num === current
        return (
          <React.Fragment key={num}>
            <div className="flex flex-col items-center gap-2 shrink-0">
              {/* Orb */}
              <div className="relative flex items-center justify-center">
                <motion.div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold relative z-10"
                  style={{
                    background: done
                      ? 'rgba(16,185,129,0.15)'
                      : active
                        ? 'rgba(0,198,255,0.12)'
                        : 'rgba(255,255,255,0.04)',
                    border: done
                      ? '1px solid rgba(16,185,129,0.5)'
                      : active
                        ? '2px solid rgba(0,198,255,0.9)'
                        : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: active
                      ? '0 0 20px rgba(0,198,255,0.5), 0 0 40px rgba(0,198,255,0.2), inset 0 1px 0 rgba(255,255,255,0.15)'
                      : done
                        ? '0 0 12px rgba(16,185,129,0.25)'
                        : 'none',
                  }}
                  animate={active ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                  transition={active ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } : {}}
                >
                  {done ? (
                    <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </motion.div>
                  ) : (
                    <span className={active ? 'text-[#00C6FF]' : 'text-white/25'}>{num}</span>
                  )}
                </motion.div>
                {/* Pulse ring for active step */}
                {active && (
                  <motion.div
                    className="absolute inset-0 rounded-full border border-[#00C6FF]/40"
                    animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-widest uppercase whitespace-nowrap
                ${active ? 'text-[#00C6FF]' : done ? 'text-emerald-400/60' : 'text-white/20'}`}>
                {label}
              </span>
            </div>

            {/* Connector beam */}
            {i < STEP_LABELS.length - 1 && (
              <div className="flex-1 relative h-px mx-2 mb-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: 'linear-gradient(90deg, rgba(16,185,129,0.7), rgba(16,185,129,0.4))' }}
                  animate={{ width: num < current ? '100%' : '0%' }}
                  transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
                {/* Shimmer on active connector */}
                {num === current - 1 && (
                  <motion.div
                    className="absolute inset-y-0 rounded-full"
                    style={{ width: '30%', background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.6), transparent)' }}
                    animate={{ left: ['-30%', '130%'] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5 }}
                  />
                )}
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Step 1: Upload ───────────────────────────────────────────────────────────

function UploadStep({ onComplete, savedDraft, onRestoreDraft, onClearDraft }) {
  const [dragging, setDragging]           = useState(false)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState(null)
  const [detectedCols, setDetectedCols]   = useState([])
  const [parsed, setParsed]               = useState(null)  // {data, name}
  const fileRef = useRef()

  async function handleFile(file) {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setError('Please upload a .csv, .xlsx, or .xls file.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await parseFile(file)
      if (!data.length) throw new Error('File is empty or has no data rows.')
      const cols = Object.keys(data[0] || {})
      setDetectedCols(cols)
      setParsed({ data, name: file.name })
      setLoading(false)
      // Auto-advance after cascade animation
      setTimeout(() => onComplete(data, file.name), cols.length * 40 + 600)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit">
      <h2 className="font-heading text-2xl text-white mb-1">Upload Your Lead List</h2>
      <p className="text-white/40 text-sm mb-6">CSV or Excel — columns detected automatically and matched to LOI fields.</p>

      {/* Resume draft banner */}
      {savedDraft && !parsed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-2xl p-4 flex items-center justify-between gap-4"
          style={{
            background: 'rgba(246,196,69,0.06)',
            border: '1px solid rgba(246,196,69,0.2)',
            boxShadow: '0 0 20px rgba(246,196,69,0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(246,196,69,0.12)', border: '1px solid rgba(246,196,69,0.2)' }}>
              <RefreshCw className="w-4 h-4 text-[#F6C445]" />
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">Resume where you left off</p>
              <p className="text-white/35 text-xs mt-0.5">
                {savedDraft.fileName && <span>{savedDraft.fileName} · </span>}
                {savedDraft.leads?.length > 0 && <span>{savedDraft.leads.length.toLocaleString()} leads · </span>}
                Step {savedDraft.step} of 5 — {STEP_LABELS[(savedDraft.step || 2) - 1]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onRestoreDraft(savedDraft)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200"
              style={{ background: 'rgba(246,196,69,0.15)', border: '1px solid rgba(246,196,69,0.3)', color: '#F6C445' }}
            >
              <RefreshCw className="w-3 h-3" />Resume
            </motion.button>
            <button onClick={onClearDraft} className="px-3 py-2 text-white/25 hover:text-white/50 text-xs transition-colors">
              Start fresh
            </button>
          </div>
        </motion.div>
      )}

      {/* Drop zone */}
      {!parsed && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          onClick={() => fileRef.current?.click()}
          className="relative cursor-pointer rounded-2xl p-14 flex flex-col items-center gap-4 transition-all duration-300 overflow-hidden"
          style={{
            border: dragging ? '2px solid rgba(0,198,255,0.7)' : '2px dashed rgba(255,255,255,0.1)',
            background: dragging ? 'rgba(0,198,255,0.04)' : 'transparent',
            transform: dragging ? 'scale(1.01)' : 'scale(1)',
          }}
        >
          {/* Animated corner accents when dragging */}
          {dragging && ['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
            <motion.div key={i} className={`absolute w-5 h-5 ${pos}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                borderTop: i < 2 ? '2px solid #00C6FF' : 'none',
                borderBottom: i >= 2 ? '2px solid #00C6FF' : 'none',
                borderLeft: i % 2 === 0 ? '2px solid #00C6FF' : 'none',
                borderRight: i % 2 === 1 ? '2px solid #00C6FF' : 'none',
              }}
            />
          ))}

          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300`}
            style={{
              background: dragging ? 'rgba(0,198,255,0.15)' : 'rgba(255,255,255,0.05)',
              border: dragging ? '1px solid rgba(0,198,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
            }}>
            {loading ? (
              <Loader className="w-7 h-7 text-[#00C6FF] animate-spin" />
            ) : (
              <Upload className={`w-7 h-7 transition-colors ${dragging ? 'text-[#00C6FF]' : 'text-white/35'}`} />
            )}
          </div>
          <div className="text-center">
            <p className="font-heading text-white/70 text-base mb-1">
              {loading ? 'Reading your file…' : dragging ? 'Drop it here' : 'Drag & drop your lead list'}
            </p>
            <p className="text-white/25 text-sm">or click to browse — .csv, .xlsx, .xls</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
            onChange={e => handleFile(e.target.files[0])} />
        </div>
      )}

      {/* Column cascade success state */}
      {parsed && detectedCols.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl p-5"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <p className="text-emerald-400 text-sm font-medium">{parsed.name} — {detectedCols.length} columns detected</p>
            <Loader className="w-3.5 h-3.5 text-emerald-400/50 animate-spin ml-auto" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {detectedCols.map((col, i) => (
              <motion.span key={col}
                initial={{ opacity: 0, y: 8, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 20 }}
                className="text-xs px-2.5 py-1 rounded-lg font-mono"
                style={{ background: 'rgba(0,198,255,0.08)', border: '1px solid rgba(0,198,255,0.2)', color: 'rgba(0,198,255,0.8)' }}
              >
                {col}
              </motion.span>
            ))}
          </div>
          <p className="text-white/25 text-xs mt-3">Advancing to column mapping…</p>
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-red-400 text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </motion.div>
      )}

      {/* Feature cards */}
      {!parsed && (
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { icon: FileSpreadsheet, label: 'CSV & Excel supported', sub: '.csv · .xlsx · .xls', color: '#00C6FF' },
            { icon: Zap,             label: 'Auto column detection',  sub: 'Fuzzy-matched to LOI fields', color: '#F6C445' },
            { icon: Shield,          label: 'Stays in your browser',  sub: 'Data never leaves your device', color: '#7F00FF' },
          ].map(({ icon: Icon, label, sub, color }) => (
            <Glass key={label} className="p-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2.5"
                style={{ background: `${color}15`, border: `1px solid ${color}20` }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <p className="text-white/65 text-xs font-medium mb-0.5">{label}</p>
              <p className="text-white/25 text-xs">{sub}</p>
            </Glass>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ─── Step 2: Map Columns ──────────────────────────────────────────────────────

function MapStep({ rawData, columns, onComplete, onBack }) {
  const [initialAuto] = useState(() => autoDetectMapping(columns))
  const [mapping, setMapping] = useState(initialAuto.mapping)
  const confidence = initialAuto.confidence
  const [error, setError] = useState(null)
  const [defaults, setDefaults] = useState({})

  const detectedCount = Object.keys(mapping).length
  const emailMapped   = !!mapping.agent_email

  const CONF_STYLES = {
    exact: { dot: 'bg-emerald-400', label: 'Exact match',  bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)' },
    fuzzy: { dot: 'bg-[#F6C445]',   label: 'Fuzzy match',  bg: 'rgba(246,196,69,0.06)',  border: 'rgba(246,196,69,0.2)'  },
  }

  function handleNext() {
    if (!emailMapped) {
      setError('Agent Email must be mapped to proceed — it\'s used as the recipient address.')
      return
    }
    setError(null)
    const mappedLeads = rawData.map((row, idx) => {
      const lead = { _idx: idx, _status: 'pending', _error: null, _sentAt: null }
      for (const [canonical, col] of Object.entries(mapping)) {
        lead[canonical] = String(row[col] || '')
      }
      // Apply default values for unmapped fields
      for (const [key, val] of Object.entries(defaults)) {
        if (!mapping[key] && val.trim()) {
          lead[key] = val.trim()
        }
      }
      return lead
    })
    onComplete(mapping, mappedLeads)
  }

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-heading text-2xl text-white">Map Your Columns</h2>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(0,198,255,0.08)', border: '1px solid rgba(0,198,255,0.2)' }}>
          <CheckCircle className="w-3.5 h-3.5 text-[#00C6FF]" />
          <span className="text-[#00C6FF] text-xs font-medium">{detectedCount} auto-detected</span>
        </div>
      </div>
      <p className="text-white/40 text-sm mb-5">
        {rawData.length.toLocaleString()} rows · Match your columns to LOI fields.
        <span className="text-[#F6C445]"> Agent Email is required.</span>
      </p>

      <div className="flex gap-3 mb-4">
        {[
          { dot: 'bg-emerald-400', label: 'Exact match' },
          { dot: 'bg-[#F6C445]', label: 'Fuzzy match' },
          { dot: 'bg-white/20', label: 'Unmapped' },
        ].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-white/30 text-xs">
            <div className={`w-2 h-2 rounded-full ${dot}`} />
            {label}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto pr-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
        {CANONICAL_FIELDS.map(({ key, label, required }) => {
          const conf = confidence[key]
          const cs   = conf ? CONF_STYLES[conf] : null
          return (
            <div key={key}
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-200"
              style={{
                background: cs ? cs.bg : mapping[key] ? 'rgba(255,255,255,0.03)' : 'transparent',
                border: `1px solid ${cs ? cs.border : mapping[key] ? 'rgba(255,255,255,0.06)' : required && !mapping[key] ? 'rgba(246,196,69,0.3)' : 'rgba(255,255,255,0.04)'}`,
              }}
            >
              {/* Confidence dot */}
              <div className={`w-2 h-2 rounded-full shrink-0 ${cs?.dot || 'bg-white/15'}`} />

              <div className="w-36 shrink-0">
                <span className="text-white/55 text-xs font-medium">{label}</span>
                {required && <span className="text-[#F6C445] text-[10px] ml-1">*</span>}
              </div>

              <select
                value={mapping[key] || ''}
                onChange={e => {
                  const val = e.target.value
                  setMapping(prev => {
                    const next = { ...prev }
                    if (val) next[key] = val
                    else delete next[key]
                    return next
                  })
                }}
                className="flex-1 rounded-lg px-3 py-1.5 text-white/75 text-xs focus:outline-none transition-colors"
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <option value="">— not mapped —</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>

              {mapping[key] && (
                <div className="text-white/25 text-xs shrink-0 max-w-[90px] truncate font-mono">
                  {String(rawData[0]?.[mapping[key]] || '').slice(0, 18)}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Default values for unmapped fields */}
      {(() => {
        const unmapped = CANONICAL_FIELDS.filter(f => !f.required && !mapping[f.key])
        return unmapped.length > 0 && (
          <div className="mt-4 rounded-xl px-4 py-4"
            style={{ background: 'rgba(246,196,69,0.04)', border: '1px solid rgba(246,196,69,0.15)' }}>
            <div className="flex items-center gap-2 mb-3">
              <TriangleAlert className="w-3.5 h-3.5 text-[#F6C445]" />
              <span className="text-[#F6C445] text-xs font-medium">Missing columns — enter default values to apply to all leads</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {unmapped.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-white/40 text-xs w-28 shrink-0">{label}</span>
                  <input
                    type="text"
                    placeholder="—"
                    value={defaults[key] || ''}
                    onChange={e => setDefaults(prev => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 rounded-lg px-3 py-1.5 text-white/75 text-xs placeholder:text-white/15 focus:outline-none transition-colors"
                    style={{
                      background: 'rgba(0,0,0,0.35)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl px-4 py-3 text-red-400 text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <button onClick={onBack} className="flex items-center gap-2 text-white/35 hover:text-white/65 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" />Back
        </button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          style={{
            background: 'rgba(14,90,136,0.6)',
            border: '1px solid rgba(0,198,255,0.4)',
            color: '#00C6FF',
            boxShadow: '0 0 20px rgba(0,198,255,0.1)',
          }}
        >
          Continue <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Step 3: Template Builder ─────────────────────────────────────────────────

function TemplateStep({ leads, onComplete, onBack, user }) {
  const [template, setTemplate]         = useState(DEFAULT_TEMPLATE)
  const [activeField, setActiveField]   = useState('body')
  const [savedTemplates, setSavedTemplates] = useState([])
  const [templateName, setTemplateName] = useState('')
  const [saving, setSaving]             = useState(false)
  const [showSaved, setShowSaved]       = useState(false)
  const [rightPanel, setRightPanel]     = useState('fields') // 'fields' | 'preview'
  const subjectRef = useRef()
  const introRef   = useRef()
  const bodyRef    = useRef()
  const refs = { subject: subjectRef, intro: introRef, body: bodyRef }

  const sampleLead = leads[0] || {}

  useEffect(() => {
    if (!user?.firebaseUid) return
    getDocs(query(collection(db, 'loi_templates', user.firebaseUid, 'templates'), orderBy('createdAt', 'desc')))
      .then(snap => setSavedTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
  }, [user?.firebaseUid])

  function insertField(fieldKey) {
    const ta = refs[activeField]?.current
    if (!ta) return
    const start = ta.selectionStart
    const end   = ta.selectionEnd
    const newVal = ta.value.slice(0, start) + `{{${fieldKey}}}` + ta.value.slice(end)
    setTemplate(prev => ({ ...prev, [activeField]: newVal }))
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = start + `{{${fieldKey}}}`.length
      ta.focus()
    }, 0)
  }

  async function saveTemplate() {
    if (!templateName.trim() || !user?.firebaseUid) return
    setSaving(true)
    try {
      const ref = doc(collection(db, 'loi_templates', user.firebaseUid, 'templates'))
      await setDoc(ref, { name: templateName.trim(), ...template, createdAt: serverTimestamp() })
      setSavedTemplates(prev => [{ id: ref.id, name: templateName.trim(), ...template }, ...prev])
      setTemplateName('')
    } finally {
      setSaving(false)
    }
  }

  function deleteTemplate(id) {
    setSavedTemplates(prev => prev.filter(t => t.id !== id))
  }

  function liveHighlight(text) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const val = key === 'today_date'
        ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : sampleLead[key]
      if (val) return `<span style="color:#00C6FF;font-weight:500">${val}</span>`
      return `<span style="color:rgba(246,196,69,0.7);font-style:italic">${match}</span>`
    })
  }

  const inputClass = `w-full rounded-xl px-4 py-3 text-white/80 text-sm font-mono leading-relaxed
    resize-none focus:outline-none transition-colors placeholder:text-white/15`
  const inputStyle = {
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(8px)',
  }
  const inputFocusStyle = { ...inputStyle, borderColor: 'rgba(0,198,255,0.35)' }

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-heading text-2xl text-white">Build Your LOI Template</h2>
        <button onClick={() => setShowSaved(!showSaved)}
          className="flex items-center gap-2 text-xs transition-colors"
          style={{ color: showSaved ? '#F6C445' : 'rgba(246,196,69,0.5)' }}>
          <FolderOpen className="w-3.5 h-3.5" />Saved Templates
        </button>
      </div>
      <p className="text-white/35 text-sm mb-5">
        Click a merge field to insert at cursor. Use <code className="px-1.5 py-0.5 rounded text-[#00C6FF] text-xs"
          style={{ background: 'rgba(0,198,255,0.1)', border: '1px solid rgba(0,198,255,0.2)' }}>{'{{field}}'}</code> anywhere.
      </p>

      <AnimatePresence>
        {showSaved && savedTemplates.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-4 rounded-xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {savedTemplates.map(t => (
              <div key={t.id} className="flex items-center justify-between px-4 py-2.5 border-b last:border-0 transition-colors hover:bg-white/3"
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <span className="text-white/65 text-sm">{t.name}</span>
                <div className="flex gap-3">
                  <button onClick={() => { setTemplate({ subject: t.subject, intro: t.intro, body: t.body }); setShowSaved(false) }}
                    className="text-xs text-[#00C6FF]/60 hover:text-[#00C6FF] transition-colors">Load</button>
                  <button onClick={() => deleteTemplate(t.id)} className="text-red-400/40 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-4">
        {/* Editor */}
        <div className="col-span-2 flex flex-col gap-3">
          <div>
            <label className="block text-white/30 text-[10px] uppercase tracking-widest mb-1.5 font-medium">
              Email Subject {activeField === 'subject' && <span className="text-[#00C6FF] normal-case tracking-normal ml-1">← editing</span>}
            </label>
            <input
              ref={refs.subject}
              value={template.subject}
              onChange={e => setTemplate(p => ({ ...p, subject: e.target.value }))}
              onFocus={() => setActiveField('subject')}
              placeholder="LOI for {{address}}, {{city}} {{state}}"
              className={inputClass.replace('resize-none', '')}
              style={activeField === 'subject' ? inputFocusStyle : inputStyle}
            />
          </div>
          <div>
            <label className="block text-white/30 text-[10px] uppercase tracking-widest mb-1.5 font-medium">
              Email Body {activeField === 'intro' && <span className="text-[#00C6FF] normal-case tracking-normal ml-1">← editing</span>}
            </label>
            <textarea
              ref={refs.intro}
              rows={4}
              value={template.intro}
              onChange={e => setTemplate(p => ({ ...p, intro: e.target.value }))}
              onFocus={() => setActiveField('intro')}
              placeholder="Short intro message shown in the email body..."
              className={inputClass}
              style={activeField === 'intro' ? inputFocusStyle : inputStyle}
            />
          </div>
          <div>
            <label className="block text-white/30 text-[10px] uppercase tracking-widest mb-1.5 font-medium">
              LOI Document Body {activeField === 'body' && <span className="text-[#00C6FF] normal-case tracking-normal ml-1">← editing</span>}
            </label>
            <textarea
              ref={refs.body}
              rows={13}
              value={template.body}
              onChange={e => setTemplate(p => ({ ...p, body: e.target.value }))}
              onFocus={() => setActiveField('body')}
              placeholder="Full LOI text — becomes the PDF attachment..."
              className={inputClass}
              style={activeField === 'body' ? inputFocusStyle : inputStyle}
            />
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-3">
          {/* Panel switcher */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {[['fields', 'Merge Fields'], ['preview', 'Live Preview']].map(([key, lbl]) => (
              <button key={key} onClick={() => setRightPanel(key)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                style={{
                  background: rightPanel === key ? (key === 'preview' ? 'rgba(246,196,69,0.1)' : 'rgba(0,198,255,0.1)') : 'transparent',
                  border: rightPanel === key ? (key === 'preview' ? '1px solid rgba(246,196,69,0.25)' : '1px solid rgba(0,198,255,0.25)') : '1px solid transparent',
                  color: rightPanel === key ? (key === 'preview' ? '#F6C445' : '#00C6FF') : 'rgba(255,255,255,0.3)',
                }}
              >{lbl}</button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {rightPanel === 'fields' && (
              <motion.div key="fields" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-2xl p-4 flex-1"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-2 font-medium">
                  Click to insert into <span style={{ color: '#00C6FF' }}>{activeField}</span>
                </p>
                <div className="flex flex-col gap-1 max-h-[340px] overflow-y-auto pr-0.5"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}>
                  {CANONICAL_FIELDS.map(({ key, label }) => (
                    <motion.button key={key} onClick={() => insertField(key)}
                      whileTap={{ scale: 0.97 }}
                      className="text-left px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-150"
                      style={{
                        background: 'rgba(0,198,255,0.04)',
                        border: '1px solid rgba(0,198,255,0.1)',
                        color: 'rgba(0,198,255,0.65)',
                      }}
                    >
                      {`{{${key}}}`}
                      <span className="font-sans not-italic text-[10px] ml-1" style={{ color: 'rgba(255,255,255,0.2)' }}>— {label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Save template */}
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <input value={templateName} onChange={e => setTemplateName(e.target.value)}
                    placeholder="Save as template..."
                    className="w-full rounded-lg px-3 py-2 text-white/65 text-xs focus:outline-none mb-2 placeholder:text-white/15"
                    style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.07)' }} />
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={saveTemplate} disabled={!templateName.trim() || saving}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
                    style={{ background: 'rgba(246,196,69,0.1)', border: '1px solid rgba(246,196,69,0.2)', color: '#F6C445' }}>
                    <Save className="w-3 h-3" />{saving ? 'Saving…' : 'Save Template'}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {rightPanel === 'preview' && (
              <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-2xl overflow-hidden flex-1"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="px-3 py-2.5 flex items-center gap-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(246,196,69,0.04)' }}>
                  <Sparkles className="w-3 h-3 text-[#F6C445]" />
                  <span className="text-[#F6C445]/70 text-[10px] uppercase tracking-widest font-medium">Live Preview · Lead 1</span>
                </div>
                <div className="p-3 max-h-[380px] overflow-y-auto"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}>
                  <p className="text-white/25 text-[9px] uppercase tracking-wider mb-1">Subject</p>
                  <p className="text-white/65 text-xs mb-3 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: liveHighlight(template.subject) }} />
                  <p className="text-white/25 text-[9px] uppercase tracking-wider mb-1">Email Body</p>
                  <p className="text-white/50 text-[11px] leading-relaxed whitespace-pre-wrap mb-3"
                    dangerouslySetInnerHTML={{ __html: liveHighlight(template.intro) }} />
                  <p className="text-white/25 text-[9px] uppercase tracking-wider mb-1">LOI Document</p>
                  <p className="text-white/40 text-[10px] leading-relaxed whitespace-pre-wrap font-mono"
                    dangerouslySetInnerHTML={{ __html: liveHighlight(template.body) }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <button onClick={onBack} className="flex items-center gap-2 text-white/35 hover:text-white/65 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" />Back
        </button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onComplete(template)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          style={{
            background: 'rgba(14,90,136,0.6)',
            border: '1px solid rgba(0,198,255,0.4)',
            color: '#00C6FF',
            boxShadow: '0 0 20px rgba(0,198,255,0.1)',
          }}>
          Preview LOIs <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Step 4: Preview ──────────────────────────────────────────────────────────

function PreviewStep({ leads, template, onComplete, onBack }) {
  const [previewIdx, setPreviewIdx] = useState(0)
  const previewLead = leads[previewIdx] || {}

  function highlight(text) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const val = key === 'today_date'
        ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : previewLead[key]
      if (val) return `<span style="color:#00C6FF;font-weight:500">${val}</span>`
      return `<span style="color:rgba(246,196,69,0.75);font-style:italic">${match}</span>`
    })
  }

  const subjectText  = substituteFields(template.subject, previewLead)
  const introText    = substituteFields(template.intro,   previewLead)

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-heading text-2xl text-white">Preview Your LOIs</h2>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.94 }}
            onClick={() => setPreviewIdx(i => Math.max(0, i - 1))} disabled={previewIdx === 0}
            className="p-1.5 rounded-lg transition-all disabled:opacity-20"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ChevronLeft className="w-4 h-4 text-white/50" />
          </motion.button>
          <span className="text-white/35 text-sm">Lead {previewIdx + 1} of {Math.min(5, leads.length)}</span>
          <motion.button whileTap={{ scale: 0.94 }}
            onClick={() => setPreviewIdx(i => Math.min(Math.min(4, leads.length - 1), i + 1))}
            disabled={previewIdx >= Math.min(4, leads.length - 1)}
            className="p-1.5 rounded-lg transition-all disabled:opacity-20"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ChevronRight className="w-4 h-4 text-white/50" />
          </motion.button>
        </div>
      </div>
      <p className="text-white/35 text-sm mb-5">
        First 5 leads. <span style={{ color: '#00C6FF' }}>Cyan</span> = substituted · <span style={{ color: 'rgba(246,196,69,0.8)' }}>Gold</span> = unmapped field.
      </p>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Gmail-style email card */}
        <AnimatePresence mode="wait">
          <motion.div key={previewIdx + '-email'}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#f8f9fa', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            {/* Gmail chrome */}
            <div style={{ background: '#fff', borderBottom: '1px solid #e0e0e0' }} className="px-4 py-3 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                style={{ background: 'linear-gradient(135deg, #0E5A88, #00C6FF)' }}>
                DD
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p style={{ color: '#202124', fontSize: 13, fontWeight: 600 }}>Dispo Dojo</p>
                  <p style={{ color: '#5f6368', fontSize: 11 }}>just now</p>
                </div>
                <p style={{ color: '#5f6368', fontSize: 11 }}>to {previewLead.agent_email || '(no email mapped)'}</p>
              </div>
            </div>
            <div className="px-5 py-4">
              <h3 style={{ color: '#202124', fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{subjectText || '(subject)'}</h3>
              <p style={{ color: '#3c4043', fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}
                dangerouslySetInnerHTML={{ __html: highlight(template.intro) }} />
              <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg"
                style={{ background: '#f1f3f4', border: '1px solid #e0e0e0', width: 'fit-content' }}>
                <FileText style={{ width: 14, height: 14, color: '#0E5A88' }} />
                <span style={{ color: '#3c4043', fontSize: 11 }}>
                  LOI_{(previewLead.address || 'property').replace(/\s+/g, '_')}.pdf
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Realistic PDF card */}
        <AnimatePresence mode="wait">
          <motion.div key={previewIdx + '-pdf'}
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            className="relative">
            {/* Paper shadow layers */}
            <div className="absolute inset-0 rounded" style={{
              background: '#e8e8e8',
              transform: 'rotate(1.5deg) translate(4px, 4px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }} />
            <div className="absolute inset-0 rounded" style={{
              background: '#f0f0f0',
              transform: 'rotate(0.7deg) translate(2px, 2px)',
            }} />
            <div className="relative rounded overflow-hidden"
              style={{
                background: '#fff',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                transform: 'rotate(-0.3deg)',
                maxHeight: 340,
                overflow: 'hidden',
              }}>
              {/* PDF header stripe */}
              <div style={{ height: 4, background: '#0E5A88' }} />
              <div className="px-5 py-4">
                <h2 style={{ color: '#0E5A88', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 2 }}>
                  LETTER OF INTENT
                </h2>
                <p style={{ color: '#888', fontSize: 8, marginBottom: 12 }}>Non-Binding — To Purchase Real Property</p>
                {previewLead.address && (
                  <div style={{ background: '#f5f7fa', border: '1px solid #dde2ea', borderRadius: 4, padding: '8px 10px', marginBottom: 10 }}>
                    <p style={{ color: '#888', fontSize: 7, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 2 }}>PROPERTY</p>
                    <p style={{ color: '#111', fontSize: 10, fontWeight: 600 }}>
                      {[previewLead.address, previewLead.city, previewLead.state, previewLead.zip].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                <div style={{ overflowY: 'hidden', maxHeight: 180 }}>
                  <p style={{ color: '#444', fontSize: 9, lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'serif' }}
                    dangerouslySetInnerHTML={{ __html: substituteFields(template.body, previewLead).slice(0, 400) + '…' }} />
                </div>
                {/* Fade out at bottom */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(transparent, white)' }} />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Field data chips */}
      <Glass className="overflow-hidden mb-6">
        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-medium">Lead {previewIdx + 1} Data</p>
        </div>
        <div className="grid grid-cols-4 p-3 gap-1.5">
          {CANONICAL_FIELDS.filter(f => previewLead[f.key]).map(({ key, label }) => (
            <div key={key} className="rounded-lg px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-white/25 text-[9px] uppercase tracking-wider mb-0.5">{label}</p>
              <p className="text-white/60 text-xs truncate">{previewLead[key]}</p>
            </div>
          ))}
        </div>
      </Glass>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-white/35 hover:text-white/65 text-sm transition-colors">
          <ChevronLeft className="w-4 h-4" />Back
        </button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onComplete}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #E53935, #B3261E)',
            boxShadow: '0 4px 20px rgba(229,57,53,0.35)',
          }}>
          Looks Good — Set Up Sending <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}

// ─── Radar Visualization ──────────────────────────────────────────────────────

function RadarViz({ pulses, sending, sentCount }) {
  return (
    <div className="relative flex items-center justify-center mb-5" style={{ height: 90 }}>
      {/* Static concentric rings */}
      {[25, 40, 55].map(r => (
        <div key={r} className="absolute rounded-full" style={{
          width: r * 2, height: r * 2,
          border: '1px solid rgba(255,255,255,0.04)',
        }} />
      ))}
      {/* Sweep line when sending */}
      {sending && (
        <motion.div
          className="absolute h-px origin-left"
          style={{
            width: 55, left: '50%', top: '50%',
            background: 'linear-gradient(90deg, rgba(0,198,255,0.8), transparent)',
            transformOrigin: '0 50%',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {/* Center dot */}
      <div className="relative z-10 w-2.5 h-2.5 rounded-full" style={{
        background: sending ? '#00C6FF' : 'rgba(255,255,255,0.3)',
        boxShadow: sending ? '0 0 10px #00C6FF, 0 0 20px rgba(0,198,255,0.5)' : 'none',
        transition: 'all 0.3s',
      }} />
      {/* Pulse rings on each sent email */}
      {pulses.map(id => (
        <motion.div key={id}
          className="absolute rounded-full pointer-events-none"
          style={{ border: '2px solid rgba(0,198,255,0.6)' }}
          initial={{ width: 10, height: 10, opacity: 0.9 }}
          animate={{ width: 130, height: 130, opacity: 0 }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
        />
      ))}
      {/* Sent count label */}
      {sentCount > 0 && (
        <div className="absolute bottom-0 text-center">
          <span className="text-[#00C6FF]/60 text-[10px] font-mono">{sentCount} sent</span>
        </div>
      )}
    </div>
  )
}

// ─── Step 5: Send ─────────────────────────────────────────────────────────────

function SendStep({ leads, setLeads, template, campaignId, user, onBack }) {
  const [gmailToken,    setGmailToken]    = useState(null)
  const [gmailEmail,    setGmailEmail]    = useState(null)
  const [sending,       setSending]       = useState(false)
  const [paused,        setPaused]        = useState(false)
  const [filterStatus,  setFilterStatus]  = useState('all')
  const [windowWarning, setWindowWarning] = useState(false)
  const [capWarning,    setCapWarning]    = useState(false)
  // Test email
  const [testEmail,   setTestEmail]   = useState('')
  const [testSending, setTestSending] = useState(false)
  const [testResult,  setTestResult]  = useState(null)
  const [testError,   setTestError]   = useState('')
  // Advanced
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [stopOnError,  setStopOnError]  = useState(false)
  const [sendLimit,    setSendLimit]    = useState('')
  // Visual effects
  const [radarPulses,      setRadarPulses]      = useState([])
  const [campaignComplete, setCampaignComplete] = useState(false)
  const pausedRef = useRef(false)

  // ── Navigation guards ────────────────────────────────────────────────────
  useEffect(() => {
    if (!sending) return
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [sending])

  const blocker = useBlocker(sending)
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const ok = window.confirm(
        'Your LOI campaign is still sending.\n\nLeaving will pause it — resume from Campaign History.\n\nLeave anyway?'
      )
      if (ok) {
        pausedRef.current = true
        setSending(false)
        setPaused(true)
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker])

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'

  const sentLeads    = leads.filter(l => l._status === 'sent')
  const failedLeads  = leads.filter(l => l._status === 'failed')
  const pendingLeads = leads.filter(l => l._status === 'pending')
  const dailyCap     = gmailEmail?.endsWith('@gmail.com') ? 100 : 1000
  const todaySent    = sentLeads.filter(l => l._sentAt && new Date(l._sentAt).toDateString() === new Date().toDateString()).length
  const progress     = leads.length > 0 ? (sentLeads.length / leads.length) * 100 : 0

  function connectGmail() {
    if (!window.google) {
      alert('Google Identity Services not loaded. Please refresh and try again.')
      return
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email',
      callback: async (response) => {
        if (response.error) return
        setGmailToken(response.access_token)
        const info = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
          headers: { Authorization: `Bearer ${response.access_token}` },
        }).then(r => r.json())
        setGmailEmail(info.email)
      },
    })
    client.requestAccessToken()
  }

  async function sendTestEmail() {
    if (!testEmail.trim() || !gmailToken) return
    setTestSending(true)
    setTestResult(null)
    try {
      const sampleLead = leads[0] || {}
      const pdfBase64  = generateLOIPdf(sampleLead, template)
      await sendViaGmail(gmailToken, {
        to: testEmail.trim(),
        subject: `[TEST] ${substituteFields(template.subject, sampleLead)}`,
        body: `--- THIS IS A TEST EMAIL ---\n\n${substituteFields(template.intro, sampleLead)}`,
        pdfBase64,
        fileName: `TEST_LOI_${(sampleLead.address || 'sample').replace(/[^a-z0-9]/gi, '_')}.pdf`,
      })
      setTestResult('ok')
    } catch (err) {
      setTestResult('fail')
      setTestError(err.message)
    } finally {
      setTestSending(false)
    }
  }

  async function runSendLoop(currentLeads, startIdx) {
    const limit = sendLimit ? parseInt(sendLimit) : Infinity
    let sessionSent = 0

    for (let i = startIdx; i < currentLeads.length; i++) {
      if (pausedRef.current) break
      if (sessionSent >= limit) {
        setPaused(true); setSending(false); pausedRef.current = true; break
      }

      const lead = currentLeads[i]
      if (lead._status !== 'pending') continue

      if (!isInSendWindow()) {
        setWindowWarning(true); setSending(false); setPaused(true); pausedRef.current = true; break
      }

      const todayCount = currentLeads.filter(l =>
        l._status === 'sent' && l._sentAt && new Date(l._sentAt).toDateString() === new Date().toDateString()
      ).length
      if (todayCount >= dailyCap) {
        setCapWarning(true); setSending(false); setPaused(true); pausedRef.current = true; break
      }

      try {
        const pdfBase64 = generateLOIPdf(lead, template)
        await sendViaGmail(gmailToken, {
          to: lead.agent_email,
          subject: substituteFields(template.subject, lead),
          body: substituteFields(template.intro, lead),
          pdfBase64,
          fileName: `LOI_${(lead.address || `lead_${lead._idx}`).replace(/[^a-z0-9]/gi, '_')}.pdf`,
        })
        const updated = { ...lead, _status: 'sent', _sentAt: new Date().toISOString() }
        currentLeads = currentLeads.map((l, idx) => idx === i ? updated : l)
        setLeads([...currentLeads])
        sessionSent++
        // Radar pulse
        const pulseId = Date.now()
        setRadarPulses(prev => [...prev, pulseId])
        setTimeout(() => setRadarPulses(prev => prev.filter(p => p !== pulseId)), 2200)
      } catch (err) {
        const updated = { ...lead, _status: 'failed', _error: err.message }
        currentLeads = currentLeads.map((l, idx) => idx === i ? updated : l)
        setLeads([...currentLeads])
        if (stopOnError) {
          setSending(false); setPaused(true); pausedRef.current = true; break
        }
      }

      if (campaignId && user?.firebaseUid) {
        updateDoc(doc(db, 'loi_campaigns', user.firebaseUid, 'campaigns', campaignId), {
          leads: currentLeads,
          sentCount: currentLeads.filter(l => l._status === 'sent').length,
          status: 'sending',
        }).catch(() => {})
      }

      if (i < currentLeads.length - 1 && !pausedRef.current) {
        await new Promise(resolve => setTimeout(resolve, randomDelay()))
      }
    }

    const allDone = currentLeads.every(l => l._status !== 'pending')
    if (allDone && !pausedRef.current) {
      setSending(false)
      setCampaignComplete(true)
      if (campaignId && user?.firebaseUid) {
        updateDoc(doc(db, 'loi_campaigns', user.firebaseUid, 'campaigns', campaignId), { status: 'complete' }).catch(() => {})
      }
    }
  }

  function startSending() {
    pausedRef.current = false
    setPaused(false)
    setSending(true)
    setWindowWarning(false)
    setCapWarning(false)
    const startIdx = leads.findIndex(l => l._status === 'pending')
    runSendLoop([...leads], startIdx)
  }

  function pauseSending() {
    pausedRef.current = true
    setPaused(true)
    setSending(false)
  }

  const filteredLeads = filterStatus === 'all' ? leads : leads.filter(l => l._status === filterStatus)

  return (
    <>
      {/* Fixed sending banner */}
      {sending && createPortal(
        <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-4 px-6 py-2.5"
          style={{ background: '#E53935', boxShadow: '0 4px 24px rgba(229,57,53,0.6)' }}>
          <div className="flex items-center gap-2.5">
            <Loader className="w-3.5 h-3.5 text-white animate-spin shrink-0" />
            <span className="text-white text-sm font-semibold">
              LOI Campaign Sending — {sentLeads.length} of {leads.length} sent
            </span>
            <span className="text-white/65 text-xs">· Keep this tab open. Closing will pause the campaign.</span>
          </div>
          <button onClick={pauseSending}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-white text-xs font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Pause className="w-3 h-3" />Pause
          </button>
        </div>,
        document.body
      )}

      {/* Campaign complete celebration */}
      {campaignComplete && createPortal(
        <motion.div
          className="fixed inset-0 z-[99999] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setCampaignComplete(false)}
        >
          {/* Lightning rays */}
          {[...Array(12)].map((_, i) => (
            <motion.div key={i}
              className="absolute pointer-events-none"
              style={{
                width: 2, height: 180, left: '50%', top: '50%',
                background: 'linear-gradient(transparent, rgba(0,198,255,0.8), transparent)',
                transformOrigin: '50% 0',
                transform: `rotate(${i * 30}deg) translateX(-50%)`,
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: [0, 1, 0], opacity: [0, 0.7, 0] }}
              transition={{ duration: 0.7, delay: i * 0.04, repeat: 3, repeatDelay: 1.5 }}
            />
          ))}
          <motion.div
            className="text-center relative z-10 px-8"
            initial={{ scale: 0.4, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.1 }}
          >
            <motion.div
              className="text-7xl mb-4"
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >⚡</motion.div>
            <h1 className="font-heading text-white mb-2" style={{ fontSize: 48, letterSpacing: '-0.02em' }}>
              Campaign Complete
            </h1>
            <p className="text-[#F6C445] text-2xl font-heading mb-2">
              {sentLeads.length.toLocaleString()} LOIs sent
            </p>
            {failedLeads.length > 0 && (
              <p className="text-red-400/70 text-sm mb-4">{failedLeads.length} failed</p>
            )}
            <p className="text-white/25 text-sm mt-6">Click anywhere to dismiss</p>
          </motion.div>
          {/* Expanding rings */}
          {[0, 0.3, 0.6, 0.9].map((delay, i) => (
            <motion.div key={i}
              className="absolute rounded-full pointer-events-none"
              style={{ border: '1px solid rgba(0,198,255,0.3)' }}
              initial={{ width: 50, height: 50, opacity: 0.8 }}
              animate={{ width: 800, height: 800, opacity: 0 }}
              transition={{ duration: 2.5, delay, ease: 'easeOut', repeat: Infinity, repeatDelay: 1 }}
            />
          ))}
        </motion.div>,
        document.body
      )}

      <motion.div variants={pageVariants} initial="hidden" animate="visible" exit="exit">
        <h2 className="font-heading text-2xl text-white mb-1">Send Your LOIs</h2>
        <p className="text-white/35 text-sm mb-5">
          {leads.length.toLocaleString()} LOIs queued · Random 15–55s delays · 8am–11pm EST window
        </p>

        {/* Gmail connect */}
        <Glass className={`flex items-center justify-between px-5 py-4 mb-4 transition-all duration-300 ${gmailToken ? '' : ''}`}
          style={{
            background: gmailToken ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)',
            border: gmailToken ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.08)',
          }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: gmailToken ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${gmailToken ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}>
              <Mail className={`w-4 h-4 ${gmailToken ? 'text-emerald-400' : 'text-white/35'}`} />
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium">
                {gmailToken ? `Connected: ${gmailEmail}` : 'Connect Your Gmail'}
              </p>
              <p className="text-white/30 text-xs">
                {gmailToken
                  ? `Cap: ${dailyCap.toLocaleString()} · ${todaySent} sent today · ${pendingLeads.length} pending`
                  : 'Required to send LOIs from your account'}
              </p>
            </div>
          </div>
          {gmailToken ? (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
              <CheckCircle className="w-3.5 h-3.5" />Authorized
            </div>
          ) : (
            <motion.button whileTap={{ scale: 0.96 }} onClick={connectGmail}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200"
              style={{
                background: 'rgba(14,90,136,0.7)',
                border: '1px solid rgba(0,198,255,0.35)',
                color: '#00C6FF',
              }}>
              <Mail className="w-3.5 h-3.5" />Connect Gmail
            </motion.button>
          )}
        </Glass>

        {/* Test email */}
        {gmailToken && (
          <Glass className="px-5 py-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="w-3.5 h-3.5" style={{ color: '#7F00FF' }} />
              <span className="text-white/50 text-xs uppercase tracking-widest font-medium">Send a Test First</span>
              <span className="text-white/20 text-xs">(uses your first lead's data)</span>
            </div>
            <div className="flex gap-2">
              <input value={testEmail} onChange={e => setTestEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 rounded-xl px-4 py-2.5 text-white/70 text-sm focus:outline-none transition-colors placeholder:text-white/15"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }} />
              <motion.button whileTap={{ scale: 0.96 }} onClick={sendTestEmail} disabled={!testEmail.trim() || testSending}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-40 whitespace-nowrap"
                style={{ background: 'rgba(127,0,255,0.12)', border: '1px solid rgba(127,0,255,0.3)', color: '#7F00FF' }}>
                {testSending ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <FlaskConical className="w-3.5 h-3.5" />}
                {testSending ? 'Sending…' : 'Send Test'}
              </motion.button>
            </div>
            {testResult === 'ok' && (
              <div className="flex items-center gap-2 mt-2 text-emerald-400 text-xs">
                <CircleCheck className="w-3.5 h-3.5" />Test sent — check inbox and confirm PDF before blasting.
              </div>
            )}
            {testResult === 'fail' && (
              <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />Failed: {testError}
              </div>
            )}
          </Glass>
        )}

        {/* Radar + send controls row */}
        <div className="grid grid-cols-[1fr_auto] gap-4 items-start mb-4">
          <div>
            {/* Send controls */}
            <div className="flex items-center gap-3 mb-3">
              {!sending && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={startSending}
                  disabled={!gmailToken || pendingLeads.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #E53935, #B3261E)',
                    boxShadow: '0 4px 20px rgba(229,57,53,0.35)',
                  }}>
                  <Play className="w-4 h-4" />{paused ? 'Resume Sending' : 'Start Sending'}
                </motion.button>
              )}
              {sending && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={pauseSending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: 'rgba(246,196,69,0.1)', border: '1px solid rgba(246,196,69,0.3)', color: '#F6C445' }}>
                  <Pause className="w-4 h-4" />Pause
                </motion.button>
              )}
              <button onClick={() => setShowAdvanced(!showAdvanced)} disabled={sending}
                className="flex items-center gap-2 text-white/30 hover:text-white/55 text-sm transition-colors disabled:opacity-20">
                <Settings2 className="w-3.5 h-3.5" />Advanced
              </button>
              <button onClick={onBack} disabled={sending}
                className="flex items-center gap-2 text-white/20 hover:text-white/45 text-sm transition-colors disabled:opacity-20 ml-auto">
                <ChevronLeft className="w-4 h-4" />Back
              </button>
            </div>

            {/* Advanced options */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="rounded-2xl px-5 py-4 mb-3 overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-white/30 text-[10px] uppercase tracking-widest mb-4 font-medium">Advanced Options</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/45 text-xs mb-1.5">Send limit this session</label>
                      <input type="number" min="1" value={sendLimit} onChange={e => setSendLimit(e.target.value)}
                        placeholder="Unlimited"
                        className="w-full rounded-lg px-3 py-2 text-white/65 text-sm focus:outline-none transition-colors placeholder:text-white/15"
                        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }} />
                      <p className="text-white/20 text-xs mt-1">e.g. 50 today, resume tomorrow</p>
                    </div>
                    <div className="flex items-start gap-3 pt-1">
                      <button onClick={() => setStopOnError(!stopOnError)}
                        className="w-10 h-5 rounded-full relative transition-colors shrink-0 mt-0.5"
                        style={{ background: stopOnError ? '#E53935' : 'rgba(255,255,255,0.1)' }}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200
                          ${stopOnError ? 'left-5' : 'left-0.5'}`} />
                      </button>
                      <div>
                        <p className="text-white/55 text-sm">Stop on first error</p>
                        <p className="text-white/20 text-xs mt-0.5">Off = skip failed and continue.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Warnings */}
            {windowWarning && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-[#F6C445] text-sm mb-3"
                style={{ background: 'rgba(246,196,69,0.08)', border: '1px solid rgba(246,196,69,0.25)' }}>
                <Clock className="w-4 h-4 shrink-0" />Outside send window (8am–11pm EST). Resume tomorrow morning.
              </div>
            )}
            {capWarning && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-[#F6C445] text-sm mb-3"
                style={{ background: 'rgba(246,196,69,0.08)', border: '1px solid rgba(246,196,69,0.25)' }}>
                <TriangleAlert className="w-4 h-4 shrink-0" />Daily cap of {dailyCap.toLocaleString()} reached. Resume tomorrow.
              </div>
            )}
            {sending && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-emerald-400 text-sm mb-3"
                style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <Loader className="w-4 h-4 shrink-0 animate-spin" />Sending… Keep this tab open. 15–55s between emails.
              </div>
            )}
          </div>

          {/* Radar */}
          <div className="w-32 shrink-0 pt-1">
            <RadarViz pulses={radarPulses} sending={sending} sentCount={sentLeads.length} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Pending',  value: pendingLeads.length,  color: 'rgba(255,255,255,0.45)', glow: 'none' },
            { label: 'Sent',     value: sentLeads.length,     color: '#34d399',                 glow: '0 0 20px rgba(52,211,153,0.15)' },
            { label: 'Failed',   value: failedLeads.length,   color: '#f87171',                 glow: failedLeads.length > 0 ? '0 0 20px rgba(248,113,113,0.15)' : 'none' },
            { label: 'Total',    value: leads.length,         color: '#00C6FF',                 glow: '0 0 20px rgba(0,198,255,0.1)' },
          ].map(({ label, value, color, glow }) => (
            <Glass key={label} className="p-4 text-center" style={{ boxShadow: glow }}>
              <p className="text-3xl font-bold font-heading" style={{ color }}>
                <CountUp end={value} duration={0.5} preserveValue />
              </p>
              <p className="text-white/30 text-xs mt-1">{label}</p>
            </Glass>
          ))}
        </div>

        {/* Energy beam progress bar */}
        {leads.length > 0 && (
          <div className="mb-5">
            <div className="flex justify-between text-xs text-white/25 mb-1.5">
              <span>Campaign Progress</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  background: 'linear-gradient(90deg, #0E5A88, #00C6FF)',
                  boxShadow: '0 0 12px rgba(0,198,255,0.5)',
                }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                {/* Shimmer */}
                {sending && (
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                      width: '60%',
                    }}
                    animate={{ x: ['-100%', '250%'] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.4 }}
                  />
                )}
              </motion.div>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-3">
          {['all', 'pending', 'sent', 'failed'].map(status => (
            <button key={status} onClick={() => setFilterStatus(status)}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-all capitalize"
              style={{
                background:  filterStatus === status ? 'rgba(0,198,255,0.12)' : 'transparent',
                border:      filterStatus === status ? '1px solid rgba(0,198,255,0.3)' : '1px solid transparent',
                color:       filterStatus === status ? '#00C6FF' : 'rgba(255,255,255,0.3)',
              }}>
              {status} {status !== 'all' && `(${leads.filter(l => l._status === status).length})`}
            </button>
          ))}
        </div>

        {/* Send log */}
        <Glass>
          <div className="grid grid-cols-[1fr_1.2fr_80px_90px] gap-0 px-4 py-2.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {['Property', 'Email', 'Status', 'Time'].map(h => (
              <p key={h} className="text-white/20 text-[10px] uppercase tracking-widest font-medium">{h}</p>
            ))}
          </div>
          <div className="max-h-[300px] overflow-y-auto"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}>
            {filteredLeads.length === 0 && (
              <div className="px-4 py-8 text-center text-white/20 text-sm">No leads in this view.</div>
            )}
            {filteredLeads.map((lead) => (
              <motion.div key={lead._idx}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: lead._status === 'sent' ? 1 : 0.7 }}
                className="grid grid-cols-[1fr_1.2fr_80px_90px] gap-0 px-4 py-3 transition-colors hover:bg-white/2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <p className="text-white/55 text-xs truncate pr-2">{lead.address || `Lead #${lead._idx + 1}`}</p>
                <p className="text-white/35 text-xs truncate pr-2">{lead.agent_email}</p>
                <div>
                  {lead._status === 'pending' && <span className="text-white/25 text-xs">Pending</span>}
                  {lead._status === 'sent' && (
                    <motion.span
                      initial={{ scale: 1.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-emerald-400 text-xs flex items-center gap-1">
                      <CircleCheck className="w-3 h-3" />Sent
                    </motion.span>
                  )}
                  {lead._status === 'failed' && (
                    <span className="text-red-400 text-xs flex items-center gap-1 cursor-help" title={lead._error}>
                      <AlertCircle className="w-3 h-3" />Failed
                    </span>
                  )}
                </div>
                <p className="text-white/20 text-xs">
                  {lead._sentAt ? new Date(lead._sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </p>
              </motion.div>
            ))}
          </div>
        </Glass>
      </motion.div>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LOISender() {
  const { user } = useAuth()
  const [step,      setStep]      = useState(1)
  const [rawData,   setRawData]   = useState([])
  const [columns,   setColumns]   = useState([])
  const [fileName,  setFileName]  = useState('')
  const [columnMap, setColumnMap] = useState({})
  const [leads,     setLeads]     = useState([])
  const [template,  setTemplate]  = useState(DEFAULT_TEMPLATE)
  const [campaignId,    setCampaignId]    = useState(null)
  const [pastCampaigns, setPastCampaigns] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // ── Draft persistence ────────────────────────────────────────────────────
  const [savedDraft, setSavedDraft] = useState(() => {
    try {
      const d = localStorage.getItem('loi_sender_draft')
      return d ? JSON.parse(d) : null
    } catch { return null }
  })

  useEffect(() => {
    if (step <= 1) return
    try {
      localStorage.setItem('loi_sender_draft', JSON.stringify({
        step, fileName, rawData, columns, columnMap, leads, template,
      }))
    } catch { /* quota exceeded */ }
  }, [step, fileName, rawData, columns, columnMap, leads, template])

  function restoreDraft(draft) {
    setRawData(draft.rawData || [])
    setColumns(draft.columns || [])
    setFileName(draft.fileName || '')
    setColumnMap(draft.columnMap || {})
    setLeads(draft.leads || [])
    setTemplate(draft.template || DEFAULT_TEMPLATE)
    setSavedDraft(null)
    setStep(draft.step || 2)
  }

  function clearDraft() {
    localStorage.removeItem('loi_sender_draft')
    setSavedDraft(null)
  }

  // ── Load past campaigns ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.firebaseUid) return
    setLoadingHistory(true)
    getDocs(query(collection(db, 'loi_campaigns', user.firebaseUid, 'campaigns'), orderBy('createdAt', 'desc')))
      .then(snap => setPastCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }, [user?.firebaseUid])

  async function handleUploadComplete(data, name) {
    setRawData(data)
    setColumns(Object.keys(data[0] || {}))
    setFileName(name)
    setStep(2)
  }

  function handleMappingComplete(mapping, mappedLeads) {
    setColumnMap(mapping)
    setLeads(mappedLeads)
    setStep(3)
  }

  function handleTemplateComplete(tmpl) {
    setTemplate(tmpl)
    setStep(4)
  }

  async function handlePreviewComplete() {
    if (!user?.firebaseUid) { setStep(5); return }
    try {
      const ref = doc(collection(db, 'loi_campaigns', user.firebaseUid, 'campaigns'))
      await setDoc(ref, {
        fileName, leads, template, columnMap,
        status: 'ready', sentCount: 0, totalCount: leads.length,
        createdAt: serverTimestamp(),
      })
      setCampaignId(ref.id)
    } catch (e) {
      console.error('Failed to save campaign:', e)
    }
    localStorage.removeItem('loi_sender_draft')
    setSavedDraft(null)
    setStep(5)
  }

  async function resumeCampaign(campaign) {
    setLeads(campaign.leads || [])
    setTemplate(campaign.template || DEFAULT_TEMPLATE)
    setColumnMap(campaign.columnMap || {})
    setFileName(campaign.fileName || '')
    setCampaignId(campaign.id)
    setStep(5)
  }

  return (
    <>
      {/* CSS keyframe animations */}
      <style>{`
        @keyframes loi-float-a {
          0%,100% { transform: translate(0,0) }
          50%      { transform: translate(22px,-34px) }
        }
        @keyframes loi-float-b {
          0%,100% { transform: translate(0,0) }
          50%      { transform: translate(-28px,18px) }
        }
        @keyframes loi-float-c {
          0%,100% { transform: translate(0,0) }
          50%      { transform: translate(14px,28px) }
        }
      `}</style>

      <div className="relative min-h-screen">
        {/* Background image */}
        <div className="fixed inset-0 -z-20 bg-center bg-no-repeat" style={{
          backgroundImage: 'url(/loi-sender-bg.png)',
          backgroundSize: '120%',
          backgroundPosition: '85% 30%',
        }} />
        {/* Dark overlay */}
        <div className="fixed inset-0 -z-10" style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 25%, rgba(6,6,15,0.15) 0%, rgba(6,6,15,0.35) 50%, rgba(6,6,15,0.55) 100%),
            linear-gradient(180deg, rgba(6,6,15,0.1) 0%, rgba(6,6,15,0.25) 40%, rgba(6,6,15,0.5) 100%)
          `,
        }} />

        <div className="px-6 py-16 max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 max-w-[680px] mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div style={{ filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.7))' }}>
                <Send size={36} style={{ color: '#00C6FF' }} />
              </div>
              <h1
                className="font-display text-4xl"
                style={{
                  color: '#F4F7FA',
                  textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(11,15,20,0.8)',
                }}
              >
                LOI Sender
              </h1>
            </div>
            <p className="text-sm mt-2" style={{ color: '#C8D1DA', maxWidth: '480px', lineHeight: 1.6, textAlign: 'center', margin: '8px auto 0' }}>
              Bulk Letters of Intent via Gmail — personalized, paced, professional.
            </p>
          </motion.div>

          {/* Wizard card with animated border */}
          <div className="relative rounded-3xl p-px overflow-hidden mb-8">
            {/* Rotating conic gradient border */}
            <motion.div
              className="absolute pointer-events-none"
              style={{
                width: '400%', height: '400%',
                top: '-150%', left: '-150%',
                background: 'conic-gradient(from 0deg, transparent 15%, rgba(0,198,255,0.45) 32%, transparent 48%, rgba(229,57,53,0.25) 68%, transparent 83%)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            />

            {/* Card inner */}
            <div className="relative rounded-[calc(1.5rem-1px)] overflow-hidden p-8"
              style={{
                background: 'rgba(11,15,20,0.58)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}>
              {/* Ambient orbs (inside card, behind content) */}
              <div className="pointer-events-none absolute inset-0">
                <div style={{
                  position: 'absolute', width: 360, height: 360, borderRadius: '50%',
                  background: 'rgba(14,90,136,0.1)', filter: 'blur(80px)',
                  top: '-10%', left: '-8%',
                  animation: 'loi-float-a 14s ease-in-out infinite',
                }} />
                <div style={{
                  position: 'absolute', width: 280, height: 280, borderRadius: '50%',
                  background: 'rgba(229,57,53,0.07)', filter: 'blur(60px)',
                  bottom: '-8%', right: '5%',
                  animation: 'loi-float-b 18s ease-in-out infinite',
                }} />
                <div style={{
                  position: 'absolute', width: 200, height: 200, borderRadius: '50%',
                  background: 'rgba(127,0,255,0.05)', filter: 'blur(50px)',
                  top: '40%', right: '25%',
                  animation: 'loi-float-c 11s ease-in-out infinite',
                }} />
              </div>

              {/* Wizard content */}
              <div className="relative">
                <StepIndicator current={step} />
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <UploadStep key="1" onComplete={handleUploadComplete}
                      savedDraft={savedDraft} onRestoreDraft={restoreDraft} onClearDraft={clearDraft} />
                  )}
                  {step === 2 && (
                    <MapStep key="2" rawData={rawData} columns={columns}
                      onComplete={handleMappingComplete} onBack={() => setStep(1)} />
                  )}
                  {step === 3 && (
                    <TemplateStep key="3" leads={leads} user={user}
                      onComplete={handleTemplateComplete} onBack={() => setStep(2)} />
                  )}
                  {step === 4 && (
                    <PreviewStep key="4" leads={leads} template={template}
                      onComplete={handlePreviewComplete} onBack={() => setStep(3)} />
                  )}
                  {step === 5 && (
                    <SendStep key="5" leads={leads} setLeads={setLeads}
                      template={template} campaignId={campaignId} user={user}
                      onBack={() => setStep(4)} />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Campaign History */}
          {step === 1 && pastCampaigns.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
              <div className="px-6 py-4 flex items-center gap-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <Clock className="w-4 h-4 text-[#F6C445]" />
                <h3 className="font-heading text-white/60 text-sm">Past Campaigns</h3>
              </div>
              <div>
                {pastCampaigns.map(c => (
                  <div key={c.id}
                    className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-white/2"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div>
                      <p className="text-white/65 text-sm font-medium">{c.fileName || 'Untitled Campaign'}</p>
                      <p className="text-white/25 text-xs mt-0.5">
                        {c.totalCount?.toLocaleString()} leads · {c.sentCount?.toLocaleString()} sent ·{' '}
                        <span className={`capitalize ${c.status === 'complete' ? 'text-emerald-400' : c.status === 'sending' ? 'text-[#00C6FF]' : 'text-[#F6C445]'}`}>
                          {c.status}
                        </span>
                      </p>
                    </div>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => resumeCampaign(c)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200"
                      style={{
                        background: 'rgba(14,90,136,0.3)',
                        border: '1px solid rgba(0,198,255,0.2)',
                        color: '#00C6FF',
                      }}>
                      <RefreshCw className="w-3 h-3" />Resume
                    </motion.button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  )
}
