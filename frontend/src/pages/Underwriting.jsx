import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Calculator, TrendingUp, Home, DollarSign, BarChart2, Layers } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { incrementStat } from '../lib/userProfile'
import {
  calcMonthlyPayment,
  calcSellerNet,
  calcMaxEntryFee,
  calcMonthlyExpenses,
  calcNetCashFlow,
  calcCashOnCash,
  calcPML,
  ncfColor,
} from '../lib/underwriting'

/* ── style tokens ── */
const inputCls =
  'w-full bg-black/40 border border-[rgba(246,196,69,0.15)] rounded-sm px-3 py-2 text-sm text-[#F4F7FA] placeholder:text-[#C8D1DA]/30 focus:outline-none focus:border-[rgba(246,196,69,0.4)] transition-colors'

const labelCls =
  'block text-[10px] font-heading font-semibold tracking-widest uppercase text-[#C8D1DA]/50 mb-1'

const cardCls =
  'bg-[#111B24] rounded-sm border border-[rgba(246,196,69,0.1)] p-5 mb-4'

const LOAN_TYPES = ['FHA', 'Conventional', 'VA', 'Other']
const TABS = ['Property', 'Financing', 'Deal', 'Rental', 'PML']

/* ── helper ── */
function num(val) {
  const n = parseFloat(val)
  return isNaN(n) ? 0 : n
}

function fmt(n, dec = 0) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  })
}

function fmtDollar(n, dec = 0) {
  return '$' + fmt(n, dec)
}

/* ── sub-components ── */
function Field({ label, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

function NumInput({ value, onChange, placeholder = '0', prefix = '' }) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#C8D1DA]/40 text-sm pointer-events-none select-none">
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputCls + (prefix ? ' pl-6' : '')}
      />
    </div>
  )
}

function TextInput({ value, onChange, placeholder = '' }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={inputCls}
    />
  )
}

function SelectInput({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={inputCls + ' appearance-none pr-8 cursor-pointer'}
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#0B0F14] text-[#F4F7FA]">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#C8D1DA]/40"
      />
    </div>
  )
}

/* ── Rental sub-section ── */
function RentalSection({ label, color, data, onChange }) {
  const [showUtils, setShowUtils] = useState(false)

  const f = (key) => (e) => onChange(key, e.target.value)

  const utilFields = [
    { key: 'internet', label: 'Internet' },
    { key: 'electric', label: 'Electric' },
    { key: 'gas', label: 'Gas' },
    { key: 'water', label: 'Water / Sewer' },
    { key: 'pest', label: 'Pest Control' },
    { key: 'landscaping', label: 'Landscaping' },
    { key: 'snow', label: 'Snow Removal' },
    { key: 'security', label: 'Security' },
  ]

  return (
    <div className="mb-5 last:mb-0">
      <div
        className="flex items-center gap-2 mb-3 pb-2"
        style={{ borderBottom: `1px solid ${color}30` }}
      >
        <span
          className="text-[10px] font-heading font-bold tracking-widest uppercase px-2 py-0.5 rounded-sm"
          style={{ background: `${color}18`, color }}
        >
          {label}
        </span>
      </div>
      <div className="space-y-2.5">
        <Field label="Pro Forma Rent ($/mo)">
          <NumInput value={data.proFormaRent} onChange={f('proFormaRent')} placeholder="2000" prefix="$" />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Warchest (%)">
            <NumInput value={data.warchestPct} onChange={f('warchestPct')} placeholder="5" />
          </Field>
          <Field label="Prop Mgmt (%)">
            <NumInput value={data.propMgmtPct} onChange={f('propMgmtPct')} placeholder="10" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Insurance ($/mo)">
            <NumInput value={data.insurance} onChange={f('insurance')} placeholder="0" prefix="$" />
          </Field>
          <Field label="Taxes ($/mo)">
            <NumInput value={data.taxes} onChange={f('taxes')} placeholder="0" prefix="$" />
          </Field>
        </div>
        <Field label="PITI ($/mo)">
          <NumInput value={data.piti} onChange={f('piti')} placeholder="0" prefix="$" />
        </Field>

        <button
          type="button"
          onClick={() => setShowUtils((v) => !v)}
          className="flex items-center gap-1.5 text-[10px] font-heading font-semibold tracking-widest uppercase text-[#C8D1DA]/40 hover:text-[#C8D1DA]/70 transition-colors"
        >
          {showUtils ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {showUtils ? 'Hide' : 'Show'} Utilities
        </button>

        {showUtils && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {utilFields.map(({ key, label: lbl }) => (
              <Field key={key} label={`${lbl} ($/mo)`}>
                <NumInput value={data[key]} onChange={f(key)} placeholder="0" prefix="$" />
              </Field>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Result row ── */
function ResultRow({ label, value, sub, highlight }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-[rgba(246,196,69,0.06)] last:border-0">
      <span className="text-xs text-[#C8D1DA]/60">{label}</span>
      <div className="text-right">
        <span
          className="text-sm font-heading font-semibold"
          style={{ color: highlight || '#F4F7FA' }}
        >
          {value}
        </span>
        {sub && <span className="ml-1.5 text-[10px] text-[#C8D1DA]/40">{sub}</span>}
      </div>
    </div>
  )
}

/* ── Strategy card ── */
function StrategyCard({ label, color, proFormaRent, expenses, expenseBreakdown, entryFee }) {
  const [expanded, setExpanded] = useState(false)
  const ncf = calcNetCashFlow(proFormaRent, expenses)
  const annualNCF = ncf * 12
  const coc = calcCashOnCash(annualNCF, entryFee)
  const color_ = ncfColor(ncf)

  return (
    <div
      className="bg-[#0B0F14] rounded-sm border p-4"
      style={{ borderColor: `${color}25` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] font-heading font-bold tracking-widest uppercase px-2 py-0.5 rounded-sm"
          style={{ background: `${color}18`, color }}
        >
          {label}
        </span>
        <span className="text-[10px] text-[#C8D1DA]/40 font-heading tracking-widest uppercase">Strategy</span>
      </div>

      <div className="space-y-0.5">
        <ResultRow label="Pro Forma Rent" value={fmtDollar(proFormaRent)} />
        <ResultRow label="Total Expenses" value={fmtDollar(expenses)} />

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-[9px] font-heading tracking-widest uppercase text-[#C8D1DA]/30 hover:text-[#C8D1DA]/60 transition-colors py-0.5"
        >
          {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          {expanded ? 'Hide' : 'Show'} breakdown
        </button>

        {expanded && (
          <div className="pl-2 border-l border-[rgba(246,196,69,0.08)] mb-1 space-y-0.5">
            {expenseBreakdown.map(({ label: l, value: v }) =>
              v > 0 ? (
                <div key={l} className="flex justify-between">
                  <span className="text-[10px] text-[#C8D1DA]/40">{l}</span>
                  <span className="text-[10px] text-[#C8D1DA]/60">{fmtDollar(v, 2)}</span>
                </div>
              ) : null
            )}
          </div>
        )}

        <div className="pt-2 border-t border-[rgba(246,196,69,0.1)] mt-1">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-[#C8D1DA]/60">Net Cash Flow / mo</span>
            <span className="text-lg font-heading font-bold" style={{ color: color_ }}>
              {fmtDollar(ncf)}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xs text-[#C8D1DA]/60">Annual NCF</span>
            <span className="text-sm font-heading font-semibold text-[#F4F7FA]">
              {fmtDollar(annualNCF)}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xs text-[#C8D1DA]/60">Cash-on-Cash Return</span>
            <span className="text-sm font-heading font-semibold" style={{ color: color_ }}>
              {fmt(coc, 1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── default rental state ── */
function defaultRental() {
  return {
    proFormaRent: '', warchestPct: '5', propMgmtPct: '10',
    insurance: '', taxes: '', piti: '',
    internet: '', electric: '', gas: '', water: '',
    pest: '', landscaping: '', snow: '', security: '',
  }
}

/* ════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════ */
export default function Underwriting() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const [results, setResults] = useState(null)

  /* ── property ── */
  const [prop, setProp] = useState({
    address: '', bedrooms: '', bathrooms: '', sqft: '', lotSize: '', yearBuilt: '',
  })

  /* ── financing ── */
  const [fin, setFin] = useState({
    askingPrice: '', loanBalance: '', interestRate: '', loanType: 'Conventional',
    yearsRemaining: '', escrow: '', downPaymentAssist: '', solarBalance: '',
    secondaryLien: '', arrears: '',
  })

  /* ── deal ── */
  const [deal, setDeal] = useState({
    entryFee: '', cashToSeller: '', cashToAgent: '', assignmentFee: '',
    rehab: '', furnishing: '', holdingCosts: '', marketing: '',
    closingCosts: '', tc: '', arrears: '',
  })

  /* ── rental ── */
  const [ltr, setLtr] = useState(defaultRental())
  const [mtr, setMtr] = useState(defaultRental())
  const [str, setStr] = useState(defaultRental())
  const [sec8, setSec8] = useState(defaultRental())

  /* ── pml ── */
  const [pml, setPml] = useState({ amount: '', rate: '', term: '' })

  /* ── setters ── */
  const sp = (key) => (e) => setProp((s) => ({ ...s, [key]: e.target.value }))
  const sf = (key) => (e) => setFin((s) => ({ ...s, [key]: e.target.value }))
  const sd = (key) => (e) => setDeal((s) => ({ ...s, [key]: e.target.value }))
  const pm = (key) => (e) => setPml((s) => ({ ...s, [key]: e.target.value }))

  const setRental = (setter) => (key, val) => setter((s) => ({ ...s, [key]: val }))

  /* ── calculate ── */
  const handleCalculate = async () => {
    if (user?.firebaseUid) {
      try { await incrementStat(user.firebaseUid, 'underwrites') } catch (_) {}
    }

    const askingPrice = num(fin.askingPrice)
    const loanBalance = num(fin.loanBalance)
    const interestRate = num(fin.interestRate)
    const yearsRemaining = num(fin.yearsRemaining)
    const escrow = num(fin.escrow)
    const solarBalance = num(fin.solarBalance)
    const secondaryLien = num(fin.secondaryLien)
    const pmlAmount = num(pml.amount)
    const pmlRate = num(pml.rate)

    const pi = calcMonthlyPayment(loanBalance, interestRate, yearsRemaining)
    const pmlPayment = calcPML(pmlAmount, pmlRate)
    const totalMonthly = pi + escrow
    const sellerNet = calcSellerNet(askingPrice)
    const maxEntry = calcMaxEntryFee(askingPrice)

    /* entry fee from deal tab, or fall back to max */
    const entryFee = num(deal.entryFee) || maxEntry
    const totalEntry =
      entryFee +
      num(deal.cashToSeller) +
      num(deal.cashToAgent) +
      num(deal.rehab) +
      num(deal.furnishing) +
      num(deal.holdingCosts) +
      num(deal.marketing) +
      num(deal.closingCosts) +
      num(deal.tc) +
      num(deal.arrears)

    /* build strategy results */
    const buildStrategy = (rental) => {
      const r = num(rental.proFormaRent)
      const opts = {
        warchestPct: num(rental.warchestPct) || 5,
        propMgmtPct: num(rental.propMgmtPct) || 10,
        insurance: num(rental.insurance),
        taxes: num(rental.taxes),
        piti: num(rental.piti) || totalMonthly,
        internet: num(rental.internet),
        electric: num(rental.electric),
        gas: num(rental.gas),
        water: num(rental.water),
        pest: num(rental.pest),
        landscaping: num(rental.landscaping),
        snow: num(rental.snow),
        security: num(rental.security),
        pmlPayment,
      }
      const expenses = calcMonthlyExpenses(r, opts)
      const breakdown = [
        { label: 'Warchest', value: r * (opts.warchestPct / 100) },
        { label: 'Prop Mgmt', value: r * (opts.propMgmtPct / 100) },
        { label: 'Insurance', value: opts.insurance },
        { label: 'Taxes', value: opts.taxes },
        { label: 'PITI', value: opts.piti },
        { label: 'Internet', value: opts.internet },
        { label: 'Electric', value: opts.electric },
        { label: 'Gas', value: opts.gas },
        { label: 'Water', value: opts.water },
        { label: 'Pest', value: opts.pest },
        { label: 'Landscaping', value: opts.landscaping },
        { label: 'Snow', value: opts.snow },
        { label: 'Security', value: opts.security },
        { label: 'PML Payment', value: pmlPayment },
      ]
      return { rent: r, expenses, breakdown, entryFee: totalEntry }
    }

    setResults({
      prop: { ...prop },
      fin: { askingPrice, loanBalance, interestRate, yearsRemaining, escrow, solarBalance, secondaryLien },
      deal: { ...deal, entryFee, totalEntry },
      pi,
      totalMonthly,
      sellerNet,
      maxEntry,
      pmlPayment,
      ltr: buildStrategy(ltr),
      mtr: buildStrategy(mtr),
      str: buildStrategy(str),
      sec8: buildStrategy(sec8),
      assignmentFee: num(deal.assignmentFee),
    })
  }

  /* ─────────────────────────────────────
     TAB PANELS
  ───────────────────────────────────── */
  const tabPanels = [
    /* Tab 0 — Property */
    <div key="property" className="space-y-3">
      <Field label="Address">
        <TextInput value={prop.address} onChange={sp('address')} placeholder="123 Main St, City, ST" />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Beds">
          <NumInput value={prop.bedrooms} onChange={sp('bedrooms')} placeholder="3" />
        </Field>
        <Field label="Baths">
          <NumInput value={prop.bathrooms} onChange={sp('bathrooms')} placeholder="2" />
        </Field>
        <Field label="Sqft">
          <NumInput value={prop.sqft} onChange={sp('sqft')} placeholder="1400" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Lot Size">
          <TextInput value={prop.lotSize} onChange={sp('lotSize')} placeholder="0.25 ac" />
        </Field>
        <Field label="Year Built">
          <NumInput value={prop.yearBuilt} onChange={sp('yearBuilt')} placeholder="1985" />
        </Field>
      </div>
    </div>,

    /* Tab 1 — Financing */
    <div key="financing" className="space-y-3">
      <Field label="Asking Price">
        <NumInput value={fin.askingPrice} onChange={sf('askingPrice')} placeholder="250000" prefix="$" />
      </Field>
      <Field label="Loan Balance">
        <NumInput value={fin.loanBalance} onChange={sf('loanBalance')} placeholder="180000" prefix="$" />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Interest Rate (%)">
          <NumInput value={fin.interestRate} onChange={sf('interestRate')} placeholder="6.5" />
        </Field>
        <Field label="Years Remaining">
          <NumInput value={fin.yearsRemaining} onChange={sf('yearsRemaining')} placeholder="25" />
        </Field>
      </div>
      <Field label="Loan Type">
        <SelectInput value={fin.loanType} onChange={sf('loanType')} options={LOAN_TYPES} />
      </Field>
      <Field label="Escrow Amount ($/mo)">
        <NumInput value={fin.escrow} onChange={sf('escrow')} placeholder="0" prefix="$" />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Down Payment Assist">
          <NumInput value={fin.downPaymentAssist} onChange={sf('downPaymentAssist')} placeholder="0" prefix="$" />
        </Field>
        <Field label="Solar Balance">
          <NumInput value={fin.solarBalance} onChange={sf('solarBalance')} placeholder="0" prefix="$" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Secondary Lien">
          <NumInput value={fin.secondaryLien} onChange={sf('secondaryLien')} placeholder="0" prefix="$" />
        </Field>
        <Field label="Arrears">
          <NumInput value={fin.arrears} onChange={sf('arrears')} placeholder="0" prefix="$" />
        </Field>
      </div>
    </div>,

    /* Tab 2 — Deal */
    <div key="deal" className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Entry Fee">
          <NumInput value={deal.entryFee} onChange={sd('entryFee')} placeholder="25000" prefix="$" />
        </Field>
        <Field label="Assignment Fee">
          <NumInput value={deal.assignmentFee} onChange={sd('assignmentFee')} placeholder="10000" prefix="$" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Cash to Seller">
          <NumInput value={deal.cashToSeller} onChange={sd('cashToSeller')} placeholder="0" prefix="$" />
        </Field>
        <Field label="Cash to Agent">
          <NumInput value={deal.cashToAgent} onChange={sd('cashToAgent')} placeholder="0" prefix="$" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Rehab">
          <NumInput value={deal.rehab} onChange={sd('rehab')} placeholder="0" prefix="$" />
        </Field>
        <Field label="Furnishing">
          <NumInput value={deal.furnishing} onChange={sd('furnishing')} placeholder="0" prefix="$" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Holding Costs (3 mo)">
          <NumInput value={deal.holdingCosts} onChange={sd('holdingCosts')} placeholder="0" prefix="$" />
        </Field>
        <Field label="Marketing">
          <NumInput value={deal.marketing} onChange={sd('marketing')} placeholder="0" prefix="$" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Closing Costs">
          <NumInput value={deal.closingCosts} onChange={sd('closingCosts')} placeholder="0" prefix="$" />
        </Field>
        <Field label="TC">
          <NumInput value={deal.tc} onChange={sd('tc')} placeholder="0" prefix="$" />
        </Field>
      </div>
      <Field label="Arrears">
        <NumInput value={deal.arrears} onChange={sd('arrears')} placeholder="0" prefix="$" />
      </Field>
    </div>,

    /* Tab 3 — Rental */
    <div key="rental" className="space-y-4">
      <RentalSection label="LTR" color="#00C6FF" data={ltr} onChange={setRental(setLtr)} />
      <div className="h-px bg-[rgba(246,196,69,0.08)]" />
      <RentalSection label="MTR" color="#F6C445" data={mtr} onChange={setRental(setMtr)} />
      <div className="h-px bg-[rgba(246,196,69,0.08)]" />
      <RentalSection label="STR" color="#10b981" data={str} onChange={setRental(setStr)} />
      <div className="h-px bg-[rgba(246,196,69,0.08)]" />
      <RentalSection label="Section 8" color="#7F00FF" data={sec8} onChange={setRental(setSec8)} />
    </div>,

    /* Tab 4 — PML */
    <div key="pml" className="space-y-3">
      <Field label="PML Amount">
        <NumInput value={pml.amount} onChange={pm('amount')} placeholder="50000" prefix="$" />
      </Field>
      <Field label="Interest Rate (%)">
        <NumInput value={pml.rate} onChange={pm('rate')} placeholder="10" />
      </Field>
      <Field label="Term (years)">
        <NumInput value={pml.term} onChange={pm('term')} placeholder="2" />
      </Field>
      {pml.amount && pml.rate && (
        <div className="mt-2 p-3 bg-black/30 border border-[rgba(246,196,69,0.12)] rounded-sm">
          <span className="text-[10px] font-heading tracking-widest uppercase text-[#C8D1DA]/50">
            Est. Monthly Interest
          </span>
          <div className="text-lg font-heading font-bold text-[#F6C445] mt-0.5">
            {fmtDollar(calcPML(num(pml.amount), num(pml.rate)))}
            <span className="text-xs font-body text-[#C8D1DA]/40 ml-1">/mo</span>
          </div>
        </div>
      )}
    </div>,
  ]

  /* ─────────────────────────────────────
     RENDER
  ───────────────────────────────────── */
  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl text-[#F4F7FA] tracking-tight mb-1">
          Underwriting{' '}
          <span
            style={{
              background: 'linear-gradient(90deg, #F6C445, #FFD97A)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Calculator
          </span>
        </h1>
        <p className="text-sm text-[#C8D1DA]/50 font-body">
          Analyze LTR, MTR, STR and Section 8 strategies in one view
        </p>
      </div>

      <div className="flex gap-6 mt-6 items-start">
        {/* ── LEFT: input panel ── */}
        <div className="w-[420px] shrink-0">
          <div className={cardCls + ' !mb-0'}>
            {/* tab bar */}
            <div className="flex gap-0.5 mb-5 bg-black/30 rounded-sm p-1">
              {TABS.map((tab, i) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  className={
                    'flex-1 py-1.5 text-[10px] font-heading font-semibold tracking-widest uppercase rounded-sm transition-colors ' +
                    (activeTab === i
                      ? 'bg-[rgba(246,196,69,0.12)] text-[#F6C445]'
                      : 'text-[#C8D1DA]/40 hover:text-[#C8D1DA]/70')
                  }
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* tab content */}
            <div className="min-h-[320px]">{tabPanels[activeTab]}</div>

            {/* calculate button */}
            <div className="mt-6 pt-5 border-t border-[rgba(246,196,69,0.1)]">
              <button
                type="button"
                onClick={handleCalculate}
                className="w-full py-3 rounded-sm font-heading font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 text-[#0B0F14] transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F6C445]"
                style={{ background: 'linear-gradient(135deg, #F6C445, #FFD97A)' }}
              >
                <Calculator size={16} />
                Calculate
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: results panel ── */}
        <div className="flex-1 min-w-0">
          {!results ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <BarChart2 size={40} className="text-[#C8D1DA]/15 mb-4" />
              <p className="text-sm text-[#C8D1DA]/30 font-body">
                Fill in the inputs and click Calculate.
              </p>
              <p className="text-[11px] text-[#C8D1DA]/20 font-body mt-1">
                Results will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Card 1 — Property Summary */}
              <div className={cardCls}>
                <div className="flex items-center gap-2 mb-4">
                  <Home size={14} className="text-[#F6C445]" />
                  <span className="text-[10px] font-heading font-bold tracking-widest uppercase text-[#F6C445]">
                    Property Summary
                  </span>
                </div>
                {results.prop.address && (
                  <p className="text-sm font-body text-[#F4F7FA] mb-2">{results.prop.address}</p>
                )}
                <div className="flex gap-4 flex-wrap">
                  {results.prop.bedrooms && (
                    <span className="text-xs text-[#C8D1DA]/60">
                      <b className="text-[#F4F7FA]">{results.prop.bedrooms}</b> bed
                    </span>
                  )}
                  {results.prop.bathrooms && (
                    <span className="text-xs text-[#C8D1DA]/60">
                      <b className="text-[#F4F7FA]">{results.prop.bathrooms}</b> bath
                    </span>
                  )}
                  {results.prop.sqft && (
                    <span className="text-xs text-[#C8D1DA]/60">
                      <b className="text-[#F4F7FA]">{fmt(num(results.prop.sqft))}</b> sqft
                    </span>
                  )}
                  {results.prop.yearBuilt && (
                    <span className="text-xs text-[#C8D1DA]/60">
                      Built <b className="text-[#F4F7FA]">{results.prop.yearBuilt}</b>
                    </span>
                  )}
                </div>
              </div>

              {/* Card 2 — Seller Net */}
              <div className={cardCls}>
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign size={14} className="text-[#F6C445]" />
                  <span className="text-[10px] font-heading font-bold tracking-widest uppercase text-[#F6C445]">
                    Seller Net
                  </span>
                </div>
                <ResultRow label="Asking Price" value={fmtDollar(results.fin.askingPrice)} />
                <ResultRow
                  label="Closing Costs (8%)"
                  value={fmtDollar(results.fin.askingPrice * 0.08)}
                />
                <ResultRow
                  label="Seller Net"
                  value={fmtDollar(results.sellerNet)}
                  highlight="#F6C445"
                />
              </div>

              {/* Card 3 — Monthly Payment */}
              <div className={cardCls}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={14} className="text-[#F6C445]" />
                  <span className="text-[10px] font-heading font-bold tracking-widest uppercase text-[#F6C445]">
                    Monthly Payment Breakdown
                  </span>
                </div>
                <ResultRow label="P&I Payment" value={fmtDollar(results.pi, 2)} />
                <ResultRow label="Escrow (T+I)" value={fmtDollar(results.fin.escrow, 2)} />
                {results.pmlPayment > 0 && (
                  <ResultRow label="PML Interest" value={fmtDollar(results.pmlPayment, 2)} />
                )}
                {results.fin.solarBalance > 0 && (
                  <ResultRow label="Solar Lien" value={fmtDollar(results.fin.solarBalance)} sub="(balance)" />
                )}
                <ResultRow
                  label="Total PITI"
                  value={fmtDollar(results.totalMonthly, 2)}
                  highlight="#00C6FF"
                />
              </div>

              {/* Card 4 — Underwriting */}
              <div className={cardCls}>
                <div className="flex items-center gap-2 mb-4">
                  <Layers size={14} className="text-[#F6C445]" />
                  <span className="text-[10px] font-heading font-bold tracking-widest uppercase text-[#F6C445]">
                    Underwriting
                  </span>
                </div>
                <ResultRow label="Max Entry Fee (10%)" value={fmtDollar(results.maxEntry)} />
                <ResultRow label="Entry Fee Used" value={fmtDollar(results.deal.entryFee)} />
                <ResultRow label="Cash to Seller" value={fmtDollar(num(deal.cashToSeller))} />
                <ResultRow label="Cash to Agent" value={fmtDollar(num(deal.cashToAgent))} />
                <ResultRow
                  label="Total Entry Investment"
                  value={fmtDollar(results.deal.totalEntry)}
                  highlight="#F6C445"
                />
              </div>

              {/* Cards 5–8 — Strategy grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <StrategyCard
                  label="LTR"
                  color="#00C6FF"
                  proFormaRent={results.ltr.rent}
                  expenses={results.ltr.expenses}
                  expenseBreakdown={results.ltr.breakdown}
                  entryFee={results.deal.totalEntry}
                />
                <StrategyCard
                  label="MTR"
                  color="#F6C445"
                  proFormaRent={results.mtr.rent}
                  expenses={results.mtr.expenses}
                  expenseBreakdown={results.mtr.breakdown}
                  entryFee={results.deal.totalEntry}
                />
                <StrategyCard
                  label="STR"
                  color="#10b981"
                  proFormaRent={results.str.rent}
                  expenses={results.str.expenses}
                  expenseBreakdown={results.str.breakdown}
                  entryFee={results.deal.totalEntry}
                />
                <StrategyCard
                  label="Section 8"
                  color="#7F00FF"
                  proFormaRent={results.sec8.rent}
                  expenses={results.sec8.expenses}
                  expenseBreakdown={results.sec8.breakdown}
                  entryFee={results.deal.totalEntry}
                />
              </div>

              {/* Card 9 — Wholesale vs Buy */}
              <div className={cardCls}>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 size={14} className="text-[#F6C445]" />
                  <span className="text-[10px] font-heading font-bold tracking-widest uppercase text-[#F6C445]">
                    Wholesale vs Buy
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 rounded-sm p-3 border border-[rgba(246,196,69,0.08)]">
                    <div className="text-[10px] font-heading tracking-widest uppercase text-[#C8D1DA]/50 mb-1">
                      Wholesale
                    </div>
                    <div className="text-[10px] text-[#C8D1DA]/40 mb-2">Assignment fee as income</div>
                    <div
                      className="text-2xl font-heading font-bold"
                      style={{ color: results.assignmentFee > 0 ? '#10b981' : '#C8D1DA' }}
                    >
                      {fmtDollar(results.assignmentFee)}
                    </div>
                    <div className="text-[10px] text-[#C8D1DA]/40 mt-1">one-time</div>
                  </div>
                  <div className="bg-black/30 rounded-sm p-3 border border-[rgba(246,196,69,0.08)]">
                    <div className="text-[10px] font-heading tracking-widest uppercase text-[#C8D1DA]/50 mb-1">
                      If We Buy (LTR)
                    </div>
                    <div className="text-[10px] text-[#C8D1DA]/40 mb-2">Net cash flow / month</div>
                    <div
                      className="text-2xl font-heading font-bold"
                      style={{ color: ncfColor(calcNetCashFlow(results.ltr.rent, results.ltr.expenses)) }}
                    >
                      {fmtDollar(calcNetCashFlow(results.ltr.rent, results.ltr.expenses))}
                    </div>
                    <div className="text-[10px] text-[#C8D1DA]/40 mt-1">per month</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
