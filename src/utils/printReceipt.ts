/**
 * Printing utility for thermal receipt printers (58mm and 80mm).
 */
export interface PrintOptions {
  paperSize?: '58mm' | '80mm';
  invoiceNumber?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

export function executeThermalPrint(options?: PrintOptions) {
  const originalTitle = document.title;

  try {
    options?.onBeforePrint?.();

    // Set custom print document title so browser print header/footer doesn't show default URL/title
    if (options?.invoiceNumber) {
      document.title = `Struk-${options.invoiceNumber}`;
    }

    // Trigger standard browser print which is targeted by @media print CSS
    window.print();
  } catch (error) {
    console.error('Thermal printer error:', error);
  } finally {
    document.title = originalTitle;
    options?.onAfterPrint?.();
  }
}
