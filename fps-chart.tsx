"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Group } from "@visx/group"
import { AreaClosed, LinePath, Line } from "@visx/shape"
import { AxisLeft, AxisBottom } from "@visx/axis"
import { GridRows } from "@visx/grid"
import { scaleTime, scaleLinear } from "@visx/scale"
import { curveMonotoneX } from "@visx/curve"
import { LinearGradient } from "@visx/gradient"
import { localPoint } from "@visx/event"
import { Tooltip, defaultStyles } from "@visx/tooltip"
import { timeFormat } from "d3-time-format"

// Define the data type
type FPSData = {
  time: Date
  fps: number
}

// Generate dummy data
const generateData = (): FPSData[] => {
  const now = new Date()
  return Array.from({ length: 10 }, (_, i) => {
    const time = new Date(now)
    time.setMinutes(now.getMinutes() - (9 - i) * 5)
    return {
      time,
      fps: 30 + Math.random() * 90,
    }
  })
}

// Format time for display
const formatTime = timeFormat("%H:%M")

// Tooltip styles
const tooltipStyles = {
  ...defaultStyles,
  background: "rgba(255, 255, 255, 0.95)",
  border: "1px solid #ddd",
  color: "#333",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  padding: "8px 12px",
  fontSize: "14px",
}

export default function FPSChart({ width = 800, height = 400 }) {
  const data = useMemo(() => generateData(), [])
  const [tooltipData, setTooltipData] = useState<FPSData | null>(null)
  const [tooltipLeft, setTooltipLeft] = useState<number | null>(null)
  const [tooltipTop, setTooltipTop] = useState<number | null>(null)

  // Define margins
  const margin = { top: 40, right: 40, bottom: 60, left: 60 }

  // Chart dimensions
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  // Accessors
  const getTime = (d: FPSData) => d.time
  const getFPS = (d: FPSData) => d.fps

  // Scales
  const timeScale = useMemo(
    () =>
      scaleTime<number>({
        domain: [Math.min(...data.map((d) => d.time.getTime())), Math.max(...data.map((d) => d.time.getTime()))],
        range: [0, innerWidth],
      }),
    [data, innerWidth],
  )

  const fpsScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, Math.max(...data.map((d) => d.fps)) * 1.1],
        range: [innerHeight, 0],
        nice: true,
      }),
    [data, innerHeight],
  )

  // Handle tooltip
  const handleTooltip = (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
    const { x } = localPoint(event) || { x: 0 }
    const x0 = timeScale.invert(x - margin.left).getTime()

    // Find the closest data point
    let closestPoint = data[0]
    let minDistance = Math.abs(getTime(closestPoint).getTime() - x0)

    for (const point of data) {
      const distance = Math.abs(getTime(point).getTime() - x0)
      if (distance < minDistance) {
        minDistance = distance
        closestPoint = point
      }
    }

    setTooltipData(closestPoint)
    setTooltipLeft(timeScale(getTime(closestPoint)) + margin.left)
    setTooltipTop(fpsScale(getFPS(closestPoint)) + margin.top)
  }

  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        style={{ borderRadius: "12px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)" }}
      >
        <LinearGradient id="area-gradient" from="#6366F1" to="#6366F1" fromOpacity={0.4} toOpacity={0.1} />

        <Group left={margin.left} top={margin.top}>
          <GridRows
            scale={fpsScale}
            width={innerWidth}
            height={innerHeight}
            stroke="#e0e0e0"
            strokeDasharray="3,3"
            numTicks={5}
          />

          <AreaClosed
            data={data}
            x={(d) => timeScale(getTime(d))}
            y={(d) => fpsScale(getFPS(d))}
            yScale={fpsScale}
            curve={curveMonotoneX}
            fill="url(#area-gradient)"
          />

          <LinePath
            data={data}
            x={(d) => timeScale(getTime(d))}
            y={(d) => fpsScale(getFPS(d))}
            stroke="#4F46E5"
            strokeWidth={3}
            curve={curveMonotoneX}
          />

          <AxisBottom
            top={innerHeight}
            scale={timeScale}
            tickFormat={formatTime}
            stroke="#888"
            tickStroke="#888"
            tickLabelProps={() => ({
              fill: "#666",
              fontSize: 12,
              textAnchor: "middle",
              dy: "0.33em",
            })}
          />

          <AxisLeft
            scale={fpsScale}
            stroke="#888"
            tickStroke="#888"
            tickLabelProps={() => ({
              fill: "#666",
              fontSize: 12,
              textAnchor: "end",
              dx: "-0.33em",
              dy: "0.33em",
            })}
          />

          <text x={-innerHeight / 2} y={-40} transform="rotate(-90)" textAnchor="middle" fontSize={14} fill="#666">
            FPS
          </text>

          <text x={innerWidth / 2} y={innerHeight + 40} textAnchor="middle" fontSize={14} fill="#666">
            Time
          </text>

          {/* Invisible rect for tooltip area */}
          <rect
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => {
              setTooltipData(null)
              setTooltipLeft(null)
              setTooltipTop(null)
            }}
          />

          {tooltipData && (
            <g>
              <Line
                from={{ x: timeScale(getTime(tooltipData)), y: 0 }}
                to={{ x: timeScale(getTime(tooltipData)), y: innerHeight }}
                stroke="#6366F1"
                strokeWidth={1}
                strokeDasharray="4,4"
                pointerEvents="none"
              />
              <circle
                cx={timeScale(getTime(tooltipData))}
                cy={fpsScale(getFPS(tooltipData))}
                r={6}
                fill="white"
                stroke="#4F46E5"
                strokeWidth={2}
                pointerEvents="none"
              />
            </g>
          )}
        </Group>

        <text x={width / 2} y={25} textAnchor="middle" fontSize={18} fontWeight="bold" fill="#333">
          FPS over Time
        </text>
      </svg>

      {tooltipData && tooltipLeft != null && tooltipTop != null && (
        <Tooltip top={tooltipTop - 40} left={tooltipLeft} style={tooltipStyles}>
          <div className="text-sm">
            <div className="font-medium">Time: {formatTime(getTime(tooltipData))}</div>
            <div>FPS: {getFPS(tooltipData).toFixed(1)}</div>
          </div>
        </Tooltip>
      )}
    </div>
  )
}
