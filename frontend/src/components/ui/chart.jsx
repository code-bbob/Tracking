"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

const ChartContainer = React.forwardRef(({ id, className, children, config, ...props }, ref) => {
  // Create CSS variables for the chart colors
  const style = React.useMemo(() => {
    if (!config) return {}
    
    const cssVars = {}
    Object.entries(config).forEach(([key, value]) => {
      if (value.color) {
        cssVars[`--color-${key}`] = value.color
      }
    })
    return cssVars
  }, [config])

  return (
    <div 
      ref={ref} 
      id={id} 
      className={cn("aspect-auto w-full", className)} 
      style={style}
      {...props}
    >
      {children}
    </div>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = ({ cursor, content }) => {
  return null // This will be handled by recharts itself
}

const ChartTooltipContent = React.forwardRef(({ active, payload, label, hideLabel, className, ...props }, ref) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-white p-3 shadow-md",
        className
      )}
      {...props}
    >
      {!hideLabel && label && (
        <div className="text-sm font-medium text-gray-900 mb-1">
          {label}
        </div>
      )}
      <div className="grid gap-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name || entry.dataKey}:</span>
            <span className="font-medium text-gray-900">
              {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

export { ChartContainer, ChartTooltip, ChartTooltipContent }
