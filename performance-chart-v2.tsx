"use client";

import type React from "react";

import { useState, useMemo } from "react";
import { Group } from "@visx/group";
import { LinePath, Line, AreaClosed } from "@visx/shape";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { GridRows, GridColumns } from "@visx/grid";
import { scaleTime, scaleLinear } from "@visx/scale";
import { localPoint } from "@visx/event";
import { Tooltip, defaultStyles } from "@visx/tooltip";
import { timeFormat } from "d3-time-format";
import { LinearGradient } from "@visx/gradient";
import { Pattern } from "@visx/pattern";

// Define the data type
type PerformanceData = {
  time: Date;
  value: number;
};

// Generate dummy data that resembles the LiveKit chart
const generateFPSData = (): PerformanceData[] => {
  const baseTime = new Date(2025, 4, 12, 15, 45, 0); // 3:45 PM

  // This data pattern roughly matches the FPS chart in the image
  const values = [
    1, 8, 2, 0, 5, 15, 12, 7, 14, 7, 10, 8, 12, 15, 9, 7, 10, 8, 5, 2, 10, 7, 3,
    10, 5, 3, 4, 5, 4, 3,
  ];

  return values.map((value, i) => {
    const time = new Date(baseTime);
    time.setMinutes(baseTime.getMinutes() + i * 2); // 2-minute intervals
    return { time, value };
  });
};

// Format time for display
const formatTime = timeFormat("%I:%M %p");

// Tooltip styles
const tooltipStyles = {
  ...defaultStyles,
  background: "#1a1a1a",
  border: "1px solid #333",
  color: "#fff",
  borderRadius: "4px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
  padding: "8px 12px",
  fontSize: "12px",
};

type PerformanceChartProps = {
  width?: number;
  height?: number;
  title: string;
  yLabel: string;
  data: PerformanceData[];
  yMax: number;
  color?: string;
};

export function PerformanceChart({
  width = 500,
  height = 300,
  title,
  yLabel,
  data,
  yMax,
  color = "#00E5FF",
}: PerformanceChartProps) {
  const [tooltipData, setTooltipData] = useState<PerformanceData | null>(null);
  const [tooltipLeft, setTooltipLeft] = useState<number | null>(null);
  const [tooltipTop, setTooltipTop] = useState<number | null>(null);

  // Define margins
  const margin = { top: 40, right: 30, bottom: 40, left: 60 };

  // Chart dimensions
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Accessors
  const getTime = (d: PerformanceData) => d.time;
  const getValue = (d: PerformanceData) => d.value;

  // Scales
  const timeScale = useMemo(
    () =>
      scaleTime<number>({
        domain: [
          Math.min(...data.map((d) => d.time.getTime())),
          Math.max(...data.map((d) => d.time.getTime())),
        ],
        range: [0, innerWidth],
      }),
    [data, innerWidth]
  );

  const valueScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, yMax],
        range: [innerHeight, 0],
        nice: true,
      }),
    [innerHeight, yMax]
  );

  // Generate unique IDs for patterns and gradients
  const chartId = title.replace(/\s+/g, "-").toLowerCase();
  const patternId = `dots-${chartId}`;
  const gradientId = `gradient-${chartId}`;

  // Handle tooltip
  const handleTooltip = (
    event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>
  ) => {
    const { x } = localPoint(event) || { x: 0 };
    const x0 = timeScale.invert(x - margin.left).getTime();

    // Find the closest data point
    let closestPoint = data[0];
    let minDistance = Math.abs(getTime(closestPoint).getTime() - x0);

    for (const point of data) {
      const distance = Math.abs(getTime(point).getTime() - x0);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }

    setTooltipData(closestPoint);
    setTooltipLeft(timeScale(getTime(closestPoint)) + margin.left);
    setTooltipTop(valueScale(getValue(closestPoint)) + margin.top);
  };

  return (
    <div className="relative">
      <div className="text-gray-300 text-sm font-medium mb-2 flex items-center">
        {title}
        <svg
          className="ml-1"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" stroke="#666" strokeWidth="2" />
          <path
            d="M12 7v6M12 16v1"
            stroke="#666"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <svg width={width} height={height}>
        <rect width={width} height={height} fill="#121212" rx="4" />

        <defs>
          {/* Create a dot pattern for the texture */}
          <Pattern
            id={patternId}
            width={4}
            height={4}
            patternUnits="userSpaceOnUse"
          >
            <rect width={4} height={4} fill="#121212" />
            <circle cx={2} cy={2} r={0.5} fill={color} fillOpacity={0.2} />
          </Pattern>

          {/* Create a gradient for the area */}
          <LinearGradient
            id={gradientId}
            from={color}
            to={color}
            fromOpacity={0.25}
            toOpacity={0.05}
          />
        </defs>

        <Group left={margin.left} top={margin.top}>
          <GridColumns
            scale={timeScale}
            height={innerHeight}
            stroke="#222"
            strokeOpacity={0.8}
            numTicks={5}
          />

          <GridRows
            scale={valueScale}
            width={innerWidth}
            stroke="#222"
            strokeOpacity={0.8}
            numTicks={5}
          />

          {/* First render the area with the pattern */}
          <AreaClosed
            data={data}
            x={(d) => timeScale(getTime(d))}
            y={(d) => valueScale(getValue(d))}
            yScale={valueScale}
            fill={`url(#${patternId})`}
          />

          {/* Then render the area with the gradient on top for the combined effect */}
          <AreaClosed
            data={data}
            x={(d) => timeScale(getTime(d))}
            y={(d) => valueScale(getValue(d))}
            yScale={valueScale}
            fill={`url(#${gradientId})`}
            fillOpacity={0.7}
          />

          <LinePath
            data={data}
            x={(d) => timeScale(getTime(d))}
            y={(d) => valueScale(getValue(d))}
            stroke={color}
            strokeWidth={2}
            // No curve - use straight lines with sharp angles as in the image
          />

          <AxisBottom
            top={innerHeight}
            scale={timeScale}
            tickFormat={(d) => {
              const time = formatTime(d as Date).toLowerCase();
              return time;
            }}
            stroke="#333"
            tickStroke="#333"
            tickLabelProps={() => ({
              fill: "#888",
              fontSize: 10,
              textAnchor: "middle",
              dy: "0.33em",
            })}
            numTicks={4}
          />

          <AxisLeft
            scale={valueScale}
            stroke="#333"
            tickStroke="#333"
            tickLabelProps={() => ({
              fill: "#888",
              fontSize: 10,
              textAnchor: "end",
              dx: "-0.33em",
              dy: "0.33em",
            })}
            tickFormat={(d) => `${d} ${yLabel}`}
          />

          {/* Invisible rect for tooltip area */}
          <rect
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => {
              setTooltipData(null);
              setTooltipLeft(null);
              setTooltipTop(null);
            }}
          />

          {tooltipData && (
            <g>
              <Line
                from={{ x: timeScale(getTime(tooltipData)), y: 0 }}
                to={{ x: timeScale(getTime(tooltipData)), y: innerHeight }}
                stroke={color}
                strokeWidth={1}
                strokeOpacity={0.5}
                pointerEvents="none"
              />
              <circle
                cx={timeScale(getTime(tooltipData))}
                cy={valueScale(getValue(tooltipData))}
                r={4}
                fill={color}
                stroke="#121212"
                strokeWidth={1}
                pointerEvents="none"
              />
            </g>
          )}
        </Group>
      </svg>

      {tooltipData && tooltipLeft != null && tooltipTop != null && (
        <Tooltip top={tooltipTop - 40} left={tooltipLeft} style={tooltipStyles}>
          <div className="text-xs">
            <div className="font-medium">
              {formatTime(getTime(tooltipData)).toLowerCase()}
            </div>
            <div>
              {getValue(tooltipData).toFixed(1)} {yLabel}
            </div>
          </div>
        </Tooltip>
      )}
    </div>
  );
}

// Generate dummy data for bit rate that resembles the LiveKit chart
const generateBitRateData = (): PerformanceData[] => {
  const baseTime = new Date(2025, 4, 12, 15, 45, 0); // 3:45 PM

  // This data pattern roughly matches the bit rate chart in the image
  const values = [
    0, 200, 100, 50, 100, 300, 500, 600, 400, 200, 600, 800, 400, 1000, 600,
    200, 100, 400, 600, 1000, 800, 400, 200, 600, 400, 200, 300, 200, 150, 100,
  ];

  return values.map((value, i) => {
    const time = new Date(baseTime);
    time.setMinutes(baseTime.getMinutes() + i * 2); // 2-minute intervals
    return { time, value };
  });
};

export default function PerformanceDashboard({ width = 1000, height = 800 }) {
  const fpsData = useMemo(() => generateFPSData(), []);
  const bitRateData = useMemo(() => generateBitRateData(), []);

  // Calculate chart dimensions
  const chartWidth = width / 2 - 20;
  const chartHeight = height / 2 - 20;

  return (
    <div className="grid grid-cols-2 gap-4">
      <PerformanceChart
        width={chartWidth}
        height={chartHeight}
        title="Average FPS"
        yLabel="fps"
        data={fpsData}
        yMax={15}
      />
      <PerformanceChart
        width={chartWidth}
        height={chartHeight}
        title="Average bit rate"
        yLabel="Kbps"
        data={bitRateData}
        yMax={1000}
      />
      <PerformanceChart
        width={chartWidth}
        height={chartHeight}
        title="Average FPS"
        yLabel="fps"
        data={fpsData.map((d) => ({ ...d, value: d.value * 1.3 }))}
        yMax={20}
      />
      <PerformanceChart
        width={chartWidth}
        height={chartHeight}
        title="Average bit rate"
        yLabel="Kbps"
        data={bitRateData.map((d) => ({ ...d, value: d.value * 0.5 }))}
        yMax={500}
      />
    </div>
  );
}
