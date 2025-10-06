// lib/format.ts
export function fmt(n: any): string {
  if (typeof n === "number" && Number.isFinite(n)) return n.toLocaleString("en-US")
  if (typeof n === "bigint") return Number(n).toLocaleString("en-US")
  if (typeof n === "string") {
    const num = Number(n)
    if (Number.isFinite(num)) return num.toLocaleString("en-US")
    return n
  }
  if (n === 0) return "0"
  return "—"
}

export function fmtSat(n: any): string {
  const v = (typeof n === "number" ? n : Number(n))
  if (!Number.isFinite(v)) return "—"
  return `${v.toLocaleString("en-US")} sat`
}

export function fmtMBfromVsize(vbytes: any): string {
  const v = Number(vbytes)
  if (!Number.isFinite(v)) return "—"
  return (v / 1_000_000).toFixed(2) + " vMB"
}
