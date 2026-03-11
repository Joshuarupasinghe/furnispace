"use client"

import { useMemo } from "react"
import { useDesignStore } from "@/store/design-store"
import { FileText, Tag } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface QuotationRow {
  key: string
  name: string
  color: string
  qty: number
  unitPrice: number
  subtotal: number
  hasPrice: boolean
}

export function QuotationPanel() {
  const { currentDesign } = useDesignStore()

  const rows = useMemo<QuotationRow[]>(() => {
    if (!currentDesign?.furnitureItems.length) return []

    const groups: Record<string, QuotationRow> = {}
    for (const item of currentDesign.furnitureItems) {
      // Group by name + color so different colour variants are separate line items
      const key = `${item.name}::${item.color}`
      if (!groups[key]) {
        groups[key] = {
          key,
          name: item.name,
          color: item.color,
          qty: 0,
          unitPrice: item.price ?? 0,
          subtotal: 0,
          hasPrice: item.price !== undefined && item.price > 0,
        }
      }
      groups[key].qty++
      groups[key].subtotal = groups[key].qty * groups[key].unitPrice
    }
    return Object.values(groups)
  }, [currentDesign?.furnitureItems])

  const total = rows.reduce((sum, r) => sum + r.subtotal, 0)
  const hasPricing = rows.some((r) => r.hasPrice)
  const itemCount = currentDesign?.furnitureItems.length ?? 0

  if (!itemCount) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">No items in design</p>
        <p className="mt-1 text-xs text-gray-400">
          Add furniture from the catalog to generate a quotation.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header block */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quotation</p>
        <p className="mt-0.5 text-sm font-semibold text-gray-900">
          {currentDesign?.name || "Untitled Design"}
        </p>
        <p className="text-xs text-gray-400">
          {new Date().toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Line items */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="w-full px-3 py-2 text-left font-semibold text-gray-500">Item</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-500">Qty</th>
              {hasPricing && (
                <>
                  <th className="whitespace-nowrap px-3 py-2 text-right font-semibold text-gray-500">
                    Unit
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 text-right font-semibold text-gray-500">
                    Total
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border border-gray-300"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="truncate font-medium text-gray-800">{row.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center text-gray-600">{row.qty}</td>
                {hasPricing && (
                  <>
                    <td className="px-3 py-2.5 text-right text-gray-500">
                      {row.hasPrice ? `$${row.unitPrice.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-800">
                      {row.hasPrice ? `$${row.subtotal.toFixed(2)}` : "—"}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total row */}
      {hasPricing && total > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-gray-900 px-4 py-3">
          <span className="text-sm text-gray-300">Grand Total</span>
          <span className="text-base font-bold text-white">${total.toFixed(2)}</span>
        </div>
      )}

      {!hasPricing && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
          <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <p className="text-xs text-amber-700">
            No pricing data found for the added products. Set prices in the product catalog to
            enable cost estimation.
          </p>
        </div>
      )}

      <Separator />

      {/* Room summary */}
      {currentDesign?.roomConfig && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 space-y-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Room</p>
          <p className="text-xs text-gray-600">
            {currentDesign.roomConfig.width}m × {currentDesign.roomConfig.length}m ·{" "}
            {currentDesign.roomConfig.height}m height
          </p>
          <p className="text-xs text-gray-500">
            Floor area: {(currentDesign.roomConfig.width * currentDesign.roomConfig.length).toFixed(1)} m²
          </p>
        </div>
      )}
    </div>
  )
}
