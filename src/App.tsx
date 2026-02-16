import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  CssBaseline,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0d1117",
    },
    primary: {
      main: "#58a6ff",
    },
    secondary: {
      main: "#f778ba",
    },
  },
  typography: {
    fontFamily: '"Space Grotesk", "Avenir Next", "Segoe UI", sans-serif',
    h2: { fontWeight: 700, letterSpacing: -0.5 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 16 },
});

const ARCHS = [
  { id: "x86-64", label: "x86-64", endian: "Little" },
  { id: "arm64", label: "Arm64", endian: "Little" },
  { id: "arm32", label: "Arm32", endian: "Little" },
  { id: "riscv", label: "RISC-V", endian: "Little" },
  { id: "mips", label: "MIPS", endian: "Big" },
  { id: "powerpc", label: "PowerPC", endian: "Big" },
  { id: "generic-be", label: "Generic (Big Endian)", endian: "Big" },
];

type Lang = "c" | "python" | "javascript";

const LANGS: { id: Lang; label: string }[] = [
  { id: "c", label: "C" },
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
];

const BIT_WIDTHS = [8, 16, 32, 64, 128] as const;

function parseLiteral(inputRaw: string, lang: Lang): { value: bigint; base: number } | null {
  const input = inputRaw.trim();
  if (!input) return null;

  const sign = input.startsWith("-") ? -1n : 1n;
  const unsigned = input.replace(/^[-+]/, "");
  if (!unsigned) return null;

  const hasPrefix = unsigned.startsWith("0x") || unsigned.startsWith("0X") || unsigned.startsWith("0b") || unsigned.startsWith("0B") || unsigned.startsWith("0o") || unsigned.startsWith("0O");

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

  if (lang === "python" || lang === "javascript") {
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

type FloatParse = { value: number; kind: "float32" | "float64" };

function detectFloat(inputRaw: string, lang: Lang): FloatParse | null {
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

function float32Bits(value: number): { bits: string; sign: number; exponent: number; fraction: number; fractionBits: string } {
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

function float64Bits(value: number): { bits: string; sign: number; exponent: number; fraction: bigint; fractionBits: string } {
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

function fractionBitsToDecimal(bits: string): number {
  let sum = 0;
  for (let i = 0; i < bits.length; i += 1) {
    if (bits[i] === "1") sum += Math.pow(2, -(i + 1));
  }
  return sum;
}
function toUintN(value: bigint, width: number): bigint {
  const mod = 1n << BigInt(width);
  let normalized = value % mod;
  if (normalized < 0) normalized += mod;
  return normalized;
}

function toBits(value: number, width = 8): string[] {
  const binary = value.toString(2).padStart(width, "0");
  return binary.split("");
}

function toPrintableAscii(value: number): string {
  if (value >= 32 && value <= 126) return String.fromCharCode(value);
  if (value === 10) return "\\n";
  if (value === 9) return "\\t";
  if (value === 13) return "\\r";
  return "·";
}

export default function App() {
  const [arch, setArch] = useState(ARCHS[0].id);
  const [lang, setLang] = useState<Lang>("c");
  const [input, setInput] = useState("42");
  const [bitWidth, setBitWidth] = useState<(typeof BIT_WIDTHS)[number]>(8);
  const [baseAddrInput, setBaseAddrInput] = useState("0x00");

  const parsed = useMemo(() => parseLiteral(input, lang), [input, lang]);
  const parsedFloat = useMemo(() => detectFloat(input, lang), [input, lang]);
  const floatInfo = useMemo(() => {
    if (!parsedFloat) return null;
    if (parsedFloat.kind === "float32") return { kind: "float32" as const, ...float32Bits(parsedFloat.value) };
    return { kind: "float64" as const, ...float64Bits(parsedFloat.value) };
  }, [parsedFloat]);

  const maxWidth = BIT_WIDTHS[BIT_WIDTHS.length - 1];
  const fitsUnsigned = (value: bigint, width: number) => {
    if (value < 0n) return false;
    return value < (1n << BigInt(width));
  };

  useEffect(() => {
    if (!parsed || floatInfo) return;
    if (fitsUnsigned(parsed.value, bitWidth)) return;
    const next = BIT_WIDTHS.find((width) => width > bitWidth) ?? bitWidth;
    if (next !== bitWidth && bitWidth < maxWidth) {
      setBitWidth(next);
    }
  }, [parsed, floatInfo, bitWidth, maxWidth]);

  const effectiveBitWidth = floatInfo ? (floatInfo.kind === "float32" ? 32 : 64) : bitWidth;
  const normalized = parsed ? toUintN(parsed.value, effectiveBitWidth) : null;
  const byteCount = effectiveBitWidth / 8;
  const bytes = useMemo(() => {
    if (floatInfo) {
      const bits = floatInfo.bits;
      const list: number[] = [];
      // Build bytes in little-endian order to match integer path (LSB-first).
      for (let i = bits.length; i > 0; i -= 8) {
        const chunk = bits.slice(i - 8, i);
        list.push(parseInt(chunk, 2));
      }
      return list;
    }
    if (normalized === null) return [] as number[];
    const list: number[] = [];
    for (let i = 0; i < byteCount; i += 1) {
      const shift = BigInt(8 * i);
      const byte = Number((normalized >> shift) & 0xffn);
      list.push(byte);
    }
    return list;
  }, [floatInfo, normalized, byteCount]);

  const endian = ARCHS.find((a) => a.id === arch)?.endian ?? "Little";
  const orderedBytes = endian === "Little" ? bytes : [...bytes].reverse();

  const archLabel = ARCHS.find((a) => a.id === arch)?.label ?? arch;
  const bitsPerRow = 8;
  const addressHexWidth = Math.max(2, Math.ceil(effectiveBitWidth / 4));
  const baseAddress = useMemo(() => {
    const raw = baseAddrInput.trim();
    if (!raw) return 0n;
    const normalizedRaw = raw.toLowerCase();
    try {
      if (normalizedRaw.startsWith("0x")) return BigInt(normalizedRaw);
      if (/^[0-9]+$/.test(normalizedRaw)) return BigInt(normalizedRaw);
    } catch {
      return 0n;
    }
    return 0n;
  }, [baseAddrInput]);
  // numeric base outputs are currently displayed per-byte; keep these when global conversion panel returns
  const rows = useMemo(() => {
    if (orderedBytes.length === 0) return [null];
    return orderedBytes.map((byte) => byte);
  }, [orderedBytes]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="app-shell">
        <Box className="content">
          <Box className="center-panel">
            <Typography variant="h2" className="title">
              NumMemory
            </Typography>
            <Typography variant="subtitle1" className="subtitle">
              8-bit memory view with literal-aware parsing
            </Typography>

            <TextField
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="例: 255, 0xff, 0b101010"
              className="input-field"
              InputProps={{
                inputProps: { "aria-label": "numeric input" },
              }}
            />

            <Stack direction="row" spacing={1} className="chips">
              <Chip label={`${archLabel} / ${endian} Endian`} color="primary" variant="outlined" />
              <Chip
                label={parsed ? `Detected: base ${parsed.base}` : "Invalid literal"}
                color={parsed ? "secondary" : "default"}
                variant={parsed ? "filled" : "outlined"}
              />
            </Stack>
            <Box className="top-bar">
              <FormControl size="small" className="select-control">
                <InputLabel id="arch-label">Architecture</InputLabel>
                <Select
                  labelId="arch-label"
                  value={arch}
                  label="Architecture"
                  onChange={(e) => setArch(e.target.value)}
                >
                  {ARCHS.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" className="select-control">
                <InputLabel id="width-label">Bit Width</InputLabel>
                <Select
                  labelId="width-label"
                  value={bitWidth}
                  label="Bit Width"
                  onChange={(e) => setBitWidth(Number(e.target.value) as (typeof BIT_WIDTHS)[number])}
                >
                  {BIT_WIDTHS.map((width) => (
                    <MenuItem key={width} value={width}>
                      {width}-bit
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                value={baseAddrInput}
                onChange={(e) => setBaseAddrInput(e.target.value)}
                label="Base Address"
                placeholder="0x00"
                className="select-control"
              />
              <FormControl size="small" className="select-control">
                <InputLabel id="lang-label">Language</InputLabel>
                <Select
                  labelId="lang-label"
                  value={lang}
                  label="Language"
                  onChange={(e) => setLang(e.target.value as Lang)}
                >
                  {LANGS.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box className="memory-panel">
              <Typography variant="h6">Memory ({effectiveBitWidth}-bit)</Typography>
              <Box className="row-stack">
                {rows.map((rowByte, rowIndex) => {
                  const byte = rowByte;
                  const bits = byte === null ? Array.from({ length: bitsPerRow }, () => "-") : toBits(byte, bitsPerRow);
                  const hex = byte === null ? "--" : byte.toString(16).toUpperCase().padStart(2, "0");
                  const bin = byte === null ? "--------" : byte.toString(2).padStart(8, "0");
                  const ascii = byte === null ? "·" : toPrintableAscii(byte);
                  const dec = byte === null ? "-" : String(byte);
                  return (
                    <Box key={`row-${rowIndex}`} className="byte-line">
                      <Typography variant="caption" className="row-label">
                        {`0x${(baseAddress + BigInt(rowIndex))
                          .toString(16)
                          .toUpperCase()
                          .padStart(addressHexWidth, "0")}`}
                      </Typography>
                      <Box className="byte-row-horizontal">
                        {bits.map((bit, bitIndex) => (
                          <Box
                            key={`cell-${rowIndex}-${bitIndex}`}
                            className={`bit-cell ${bit === "1" ? "on" : "off"}`}
                          >
                            <Typography variant="caption">{bit}</Typography>
                          </Box>
                        ))}
                      </Box>
                      <Box className="row-conversions compact">
                        <Box className="row-conversion">
                          <Typography variant="caption" className="mono">
                            Hex: {hex}
                          </Typography>
                        </Box>
                        <Box className="row-conversion">
                          <Typography variant="caption" className="mono">
                            Dec: {dec}
                          </Typography>
                        </Box>
                        <Box className="row-conversion">
                          <Typography variant="caption" className="mono">
                            Bin: {bin}
                          </Typography>
                        </Box>
                        <Box className="row-conversion">
                          <Typography variant="caption" className="mono">
                            ASCII: {ascii}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
              <Typography variant="caption" className="bit-caption">
                Byte order: {endian} Endian | Bits: MSB → LSB
              </Typography>
            </Box>
            <Box className="ieee-panel">
              <Typography variant="h6">IEEE754</Typography>
              <Typography variant="caption" className="note">
                入力が `.` / `e` / `f` を含むと浮動小数として推論されます
              </Typography>
              <Box className="ieee-card">
                <Typography variant="caption" className="mono">
                  {floatInfo ? `${floatInfo.kind} = ${parsedFloat?.value}` : "-"}
                </Typography>
                <Typography variant="caption" className="mono">
                  {floatInfo ? floatInfo.bits : "-"}
                </Typography>
                {floatInfo && (
                  <Typography variant="caption" className="mono">
                    sign: {floatInfo.sign} exp: {floatInfo.exponent} frac: {floatInfo.fraction.toString()}
                  </Typography>
                )}
                {floatInfo && (
                  <Typography variant="caption" className="mono">
                    frac(2^-n): {fractionBitsToDecimal(floatInfo.fractionBits)}
                  </Typography>
                )}
                {floatInfo && (
                  <Typography variant="caption" className="mono">
                    -1 ^ (sign) * (1 + frac(2^-n) * 2^(exp - 127)): {
                    Math.pow(-1, floatInfo.sign) * (1 + fractionBitsToDecimal(floatInfo.fractionBits))
                      * Math.pow(2, floatInfo.exponent - (floatInfo.kind === "float32" ? 127 : 1023))}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
