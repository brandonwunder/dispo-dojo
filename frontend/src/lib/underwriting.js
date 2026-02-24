export function calcMonthlyPayment(loanBalance, annualRate, yearsRemaining) {
  if (!loanBalance || !annualRate || !yearsRemaining) return 0
  const r = annualRate / 100 / 12
  const n = yearsRemaining * 12
  if (r === 0) return loanBalance / n
  return (loanBalance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

export function calcSellerNet(askingPrice, closingCostPct = 8) {
  return askingPrice * (1 - closingCostPct / 100)
}

export function calcMaxEntryFee(askingPrice, pct = 10) {
  return askingPrice * (pct / 100)
}

export function calcMonthlyExpenses(proFormaRent, opts = {}) {
  const {
    warchestPct = 5, propMgmtPct = 10,
    insurance = 0, taxes = 0, piti = 0,
    internet = 0, electric = 0, gas = 0,
    water = 0, pest = 0, landscaping = 0,
    snow = 0, security = 0, pmlPayment = 0,
  } = opts
  const warchest = proFormaRent * (warchestPct / 100)
  const propMgmt = proFormaRent * (propMgmtPct / 100)
  return warchest + propMgmt + insurance + taxes + piti +
    internet + electric + gas + water + pest + landscaping + snow + security + pmlPayment
}

export function calcNetCashFlow(proFormaRent, monthlyExpenses) {
  return proFormaRent - monthlyExpenses
}

export function calcCashOnCash(annualNCF, totalEntry) {
  if (!totalEntry) return 0
  return (annualNCF / totalEntry) * 100
}

export function calcPML(amount, annualRate) {
  if (!amount || !annualRate) return 0
  return amount * (annualRate / 100 / 12)
}

export function ncfColor(monthlyNCF) {
  if (monthlyNCF >= 300) return '#10b981'
  if (monthlyNCF >= 100) return '#F6C445'
  return '#E53935'
}
