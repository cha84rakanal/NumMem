export type Lang = "c" | "python" | "javascript";

export type FloatParse = { value: number; kind: "float32" | "float64" };

export function parseLiteral(inputRaw: string, lang: Lang): { value: bigint; base: number } | null {
  const input = inputRaw.trim();
  if (!input) return null;

  const sign = input.startsWith("-") ? -1n : 1n;
  const unsigned = input.replace(/^[-+]/, "");
  if (!unsigned) return null;

  const hasPrefix =
    unsigned.startsWith("0x") ||
    unsigned.startsWith("0X") ||
    unsigned.startsWith("0b") ||
    unsigned.startsWith("0B") ||
    unsigned.startsWith("0o") ||
    unsigned.startsWith("0O");

  if (lang === "c") {
    if (unsigned.startsWith("0x") || unsigned.startsWith("0X")) {
      const digits = unsigned.slice(2);
      if (!/^[0-9a-fA-F_]+$/.test(digits)) return null;
      return { value: sign * BigInt("0x" + digits.replace(/_/g, "")), base: 16 };
    }
    if (unsigned.startsWith("0b") || unsigned.startsWith("0B")) {
      const digits = unsigned.slice(2);
      if (!/^[01_]+$/.test(digits)) return null;
      return { value: sign * BigInt("0b" + digits.replace(/_/g, "")), base: 2 };
    }
    if (unsigned.length > 1 && unsigned.startsWith("0") && !hasPrefix) {
      const digits = unsigned.slice(1);
      if (!/^[0-7_]+$/.test(digits)) return null;
      return { value: sign * BigInt("0o" + digits.replace(/_/g, "")), base: 8 };
    }
    if (!/^[0-9_]+$/.test(unsigned)) return null;
    return { value: sign * BigInt(unsigned.replace(/_/g, "")), base: 10 };
  }

  if (lang === "javascript") {
    if (unsigned.startsWith("0x") || unsigned.startsWith("0X")) {
      const digits = unsigned.slice(2);
      if (!/^[0-9a-fA-F_]+$/.test(digits)) return null;
      return { value: sign * BigInt("0x" + digits.replace(/_/g, "")), base: 16 };
    }
    if (unsigned.startsWith("0b") || unsigned.startsWith("0B")) {
      const digits = unsigned.slice(2);
      if (!/^[01_]+$/.test(digits)) return null;
      return { value: sign * BigInt("0b" + digits.replace(/_/g, "")), base: 2 };
    }
    if (unsigned.startsWith("0o") || unsigned.startsWith("0O")) {
      const digits = unsigned.slice(2);
      if (!/^[0-7_]+$/.test(digits)) return null;
      return { value: sign * BigInt("0o" + digits.replace(/_/g, "")), base: 8 };
    }
    if (!/^[0-9_]+$/.test(unsigned)) return null;
    return { value: sign * BigInt(unsigned.replace(/_/g, "")), base: 10 };
  }

  return null;
}

export function detectFloat(inputRaw: string, lang: Lang): FloatParse | null {
  const trimmed = inputRaw.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  const prefixCheck = lower.replace(/^[-+]/, "");
  if (prefixCheck.startsWith("0x") || prefixCheck.startsWith("0b") || prefixCheck.startsWith("0o")) {
    return null;
  }
  const hasFloatSuffix = lower.endsWith("f");
  const core = hasFloatSuffix ? trimmed.slice(0, -1) : trimmed;
  if (!core) return null;
  if (lang === "javascript") {
    const num = Number(core);
    if (Number.isNaN(num)) return null;
    return {
      value: num,
      kind: "float64",
    };
  }
  const isFloatLike = core.includes(".") || core.includes("e") || core.includes("E");
  if (!isFloatLike && !hasFloatSuffix) return null;
  const num = Number(core);
  if (Number.isNaN(num)) return null;
  return {
    value: hasFloatSuffix ? Math.fround(num) : num,
    kind: hasFloatSuffix ? "float32" : "float64",
  };
}

export function float32Bits(value: number): {
  bits: string;
  sign: number;
  exponent: number;
  fraction: number;
  fractionBits: string;
} {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setFloat32(0, value, false);
  const uint = view.getUint32(0, false);
  const sign = (uint >>> 31) & 1;
  const exponent = (uint >>> 23) & 0xff;
  const fraction = uint & 0x7fffff;
  const bits = uint.toString(2).padStart(32, "0");
  const fractionBits = bits.slice(9);
  return { bits, sign, exponent, fraction, fractionBits };
}

export function float64Bits(value: number): {
  bits: string;
  sign: number;
  exponent: number;
  fraction: bigint;
  fractionBits: string;
} {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value, false);
  const high = view.getUint32(0, false);
  const low = view.getUint32(4, false);
  const sign = (high >>> 31) & 1;
  const exponent = (high >>> 20) & 0x7ff;
  const fractionHigh = high & 0xfffff;
  const fraction = (BigInt(fractionHigh) << 32n) | BigInt(low);
  const bits = high.toString(2).padStart(32, "0") + low.toString(2).padStart(32, "0");
  const fractionBits = bits.slice(12);
  return { bits, sign, exponent, fraction, fractionBits };
}

export function fractionBitsToDecimal(bits: string): number {
  let sum = 0;
  for (let i = 0; i < bits.length; i += 1) {
    if (bits[i] === "1") sum += Math.pow(2, -(i + 1));
  }
  return sum;
}

export function toUintN(value: bigint, width: number): bigint {
  const mod = 1n << BigInt(width);
  let normalized = value % mod;
  if (normalized < 0) normalized += mod;
  return normalized;
}

export function toBits(value: number, width = 8): string[] {
  const binary = value.toString(2).padStart(width, "0");
  return binary.split("");
}

export function toPrintableAscii(value: number): string {
  if (value >= 32 && value <= 126) return String.fromCharCode(value);
  if (value === 10) return "\\n";
  if (value === 9) return "\\t";
  if (value === 13) return "\\r";
  return "·";
}
