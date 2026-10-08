/**
 * Pure Code 128 (Subset B) Barcode Generator.
 * Converts alphanumeric strings into standard, crisp vector barcodes
 * compatible with retail barcode scanners, laser/CCD scanners, and phone cameras.
 */

// Code 128 patterns (Indices 0 to 106)
// Each pattern is an 11-module sequence (except Stop which is 13 modules)
const CODE128_PATTERNS: string[] = [
  '11011001100', // 0: ' '
  '11001101100', // 1: '!'
  '11001100110', // 2: '"'
  '10010011000', // 3: '#'
  '10010001100', // 4: '$'
  '10001001100', // 5: '%'
  '10011001000', // 6: '&'
  '10011000100', // 7: '\''
  '10001100100', // 8: '('
  '11001001000', // 9: ')'
  '11001000100', // 10: '*'
  '11000100100', // 11: '+'
  '10110011100', // 12: ','
  '10011011100', // 13: '-'
  '10011001110', // 14: '.'
  '10111001100', // 15: '/'
  '10011101100', // 16: '0'
  '10011100110', // 17: '1'
  '11001110010', // 18: '2'
  '11001011100', // 19: '3'
  '11001001110', // 20: '4'
  '11011100100', // 21: '5'
  '11001110100', // 22: '6'
  '11101101110', // 23: '7'
  '11101001100', // 24: '8'
  '11100101100', // 25: '9'
  '11100100110', // 26: ':'
  '11101100100', // 27: ';'
  '11100110100', // 28: '<'
  '11100110010', // 29: '='
  '11011011000', // 30: '>'
  '11011000110', // 31: '?'
  '11000110110', // 32: '@'
  '10100011000', // 33: 'A'
  '10001011000', // 34: 'B'
  '10001000110', // 35: 'C'
  '10110001000', // 36: 'D'
  '10001101000', // 37: 'E'
  '10001100010', // 38: 'F'
  '11010001000', // 39: 'G'
  '11000101000', // 40: 'H'
  '11000100010', // 41: 'I'
  '10110111000', // 42: 'J'
  '10110001110', // 43: 'K'
  '10001101110', // 44: 'L'
  '10111011000', // 45: 'M'
  '10111000110', // 46: 'N'
  '10001110110', // 47: 'O'
  '11101110110', // 48: 'P'
  '11010001110', // 49: 'Q'
  '11000101110', // 50: 'R'
  '11011101000', // 51: 'S'
  '11011100010', // 52: 'T'
  '11011101110', // 53: 'U'
  '11101011000', // 54: 'V'
  '11101000110', // 55: 'W'
  '11100010110', // 56: 'X'
  '11101101000', // 57: 'Y'
  '11101100010', // 58: 'Z'
  '11100011010', // 59: '['
  '11101111010', // 60: '\\'
  '11001000010', // 61: ']'
  '11110001010', // 62: '^'
  '10100110000', // 63: '_'
  '10100001100', // 64: '`'
  '10010110000', // 65: 'a'
  '10010000110', // 66: 'b'
  '10000101100', // 67: 'c'
  '10000100110', // 68: 'd'
  '10110010000', // 69: 'e'
  '10110000100', // 70: 'f'
  '10011010000', // 71: 'g'
  '10011000010', // 72: 'h'
  '10000110100', // 73: 'i'
  '10000110010', // 74: 'j'
  '11000010010', // 75: 'k'
  '11001010000', // 76: 'l'
  '11110111010', // 77: 'm'
  '11000010100', // 78: 'n'
  '10001111010', // 79: 'o'
  '10100111100', // 80: 'p'
  '10010111100', // 81: 'q'
  '10010011110', // 82: 'r'
  '10111100100', // 83: 's'
  '10011110100', // 84: 't'
  '10011110010', // 85: 'u'
  '11110100100', // 86: 'v'
  '11110010100', // 87: 'w'
  '11110010010', // 88: 'x'
  '11011011110', // 89: 'y'
  '11011110110', // 90: 'z'
  '11110110110', // 91: '{'
  '10101111000', // 92: '|'
  '10100011110', // 93: '}'
  '10001011110', // 94: '~'
  '10111101000', // 95: DEL
  '10111100010', // 96: FNC3
  '11110101000', // 97: FNC2
  '11110100010', // 98: SHIFT
  '10111011110', // 99: CODE C
  '10111101110', // 100: CODE B
  '11101011110', // 101: FNC4
  '11110101110', // 102: FNC1
  '11010000100', // 103: START A
  '11010010000', // 104: START B
  '11010011100', // 105: START C
  '1100011101011', // 106: STOP (13 modules)
];

const START_B_INDEX = 104;
const STOP_INDEX = 106;

/**
 * Encodes text into Code 128B module bits (1s for black bars, 0s for white spaces).
 */
export function encodeCode128B(text: string): string {
  if (!text) return '';

  const cleanText = text.trim();
  const indices: number[] = [START_B_INDEX];

  for (let i = 0; i < cleanText.length; i++) {
    const code = cleanText.charCodeAt(i);
    // ASCII 32 to 127 correspond to indices 0 to 95 in Code 128B
    if (code >= 32 && code <= 126) {
      indices.push(code - 32);
    } else {
      // Fallback for unexpected characters
      indices.push(0); // space
    }
  }

  // Calculate checksum: (START_B + sum(index * weight)) % 103
  let checksum = indices[0];
  for (let i = 1; i < indices.length; i++) {
    checksum += indices[i] * i;
  }
  const checkDigit = checksum % 103;
  indices.push(checkDigit);
  indices.push(STOP_INDEX);

  // Convert indices to binary string pattern
  return indices.map((idx) => CODE128_PATTERNS[idx] || '').join('');
}

/**
 * Returns SVG path / rect representation of Code 128 Barcode.
 */
export function generateBarcodeSvgElements(
  barcodeText: string,
  barWidth: number = 2,
  height: number = 50
): { rects: { x: number; y: number; width: number; height: number }[]; totalWidth: number } {
  const binaryString = encodeCode128B(barcodeText);
  if (!binaryString) {
    return { rects: [], totalWidth: 0 };
  }

  const rects: { x: number; y: number; width: number; height: number }[] = [];
  const quietZoneModules = 10; // Standard 10-module quiet zone on each side
  let currentModule = quietZoneModules;

  let i = 0;
  while (i < binaryString.length) {
    if (binaryString[i] === '1') {
      let runLength = 0;
      while (i < binaryString.length && binaryString[i] === '1') {
        runLength++;
        i++;
      }
      rects.push({
        x: currentModule * barWidth,
        y: 0,
        width: runLength * barWidth,
        height,
      });
      currentModule += runLength;
    } else {
      currentModule++;
      i++;
    }
  }

  const totalModules = currentModule + quietZoneModules;
  const totalWidth = totalModules * barWidth;

  return { rects, totalWidth };
}
