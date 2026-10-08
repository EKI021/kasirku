import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeSvgProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

export const BarcodeSvg: React.FC<BarcodeSvgProps> = ({
  value,
  width = 1.3,
  height = 36,
  displayValue = true,
  fontSize = 11,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Sanitize value for CODE128 (supports all alphanumeric characters)
    const sanitized = (value || '00000000').trim();

    try {
      JsBarcode(svgRef.current, sanitized, {
        format: 'CODE128',
        width,
        height,
        displayValue,
        fontSize,
        font: 'monospace',
        textMargin: 2,
        margin: 2,
        lineColor: '#000000',
        background: '#ffffff',
      });
    } catch (err) {
      console.warn('JsBarcode render fallback for value:', sanitized, err);
      // Fallback: retry with numeric or auto
      try {
        if (svgRef.current) {
          JsBarcode(svgRef.current, sanitized.replace(/[^0-9]/g, '') || '8990000000000', {
            format: 'auto',
            width,
            height,
            displayValue,
            fontSize,
            font: 'monospace',
            textMargin: 2,
            margin: 2,
            lineColor: '#000000',
          });
        }
      } catch (e2) {
        console.error('Failed all barcode render attempts:', e2);
      }
    }
  }, [value, width, height, displayValue, fontSize]);

  return <svg ref={svgRef} className={`block max-w-full mx-auto ${className}`} />;
};
