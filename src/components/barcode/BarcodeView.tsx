import React, { useMemo } from 'react';
import { generateBarcodeSvgElements } from '../../utils/barcodeGenerator';

interface BarcodeViewProps {
  value: string;
  height?: number;
  barWidth?: number;
  showText?: boolean;
  className?: string;
  textColor?: string;
}

export const BarcodeView: React.FC<BarcodeViewProps> = ({
  value,
  height = 42,
  barWidth = 1.6,
  showText = true,
  className = '',
  textColor = '#000000',
}) => {
  const cleanValue = (value || '').trim() || 'ALMAS-001';

  const { rects, totalWidth } = useMemo(() => {
    return generateBarcodeSvgElements(cleanValue, barWidth, height);
  }, [cleanValue, barWidth, height]);

  if (!rects.length) {
    return (
      <div className="text-center font-mono text-xs text-slate-400 py-2">
        Kode barcode tidak valid
      </div>
    );
  }

  const svgHeight = showText ? height + 16 : height;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${svgHeight}`}
        width="100%"
        height={svgHeight}
        className="max-w-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
      >
        {/* Background quiet zone */}
        <rect x="0" y="0" width={totalWidth} height={svgHeight} fill="#ffffff" />

        {/* Black Barcode Bars */}
        {rects.map((r, i) => (
          <rect
            key={i}
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.height}
            fill="#000000"
          />
        ))}

        {/* Human Readable Text underneath bars */}
        {showText && (
          <text
            x={totalWidth / 2}
            y={height + 13}
            textAnchor="middle"
            fill={textColor}
            fontSize="10"
            fontFamily="monospace, 'Courier New', sans-serif"
            fontWeight="bold"
            letterSpacing="2"
          >
            {cleanValue}
          </text>
        )}
      </svg>
    </div>
  );
};
