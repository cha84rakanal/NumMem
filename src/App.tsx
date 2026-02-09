import { useMemo, useState } from "react";
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
    mode: "light",
    background: {
      default: "#f6f3ee",
    },
    primary: {
      main: "#1f4f52",
    },
    secondary: {
      main: "#c46b28",
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
];

type Lang = "c" | "python" | "javascript";

const LANGS: { id: Lang; label: string }[] = [
  { id: "c", label: "C" },
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
];

const BIT_WIDTHS = [8, 16, 32, 64] as const;

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

  const parsed = useMemo(() => parseLiteral(input, lang), [input, lang]);
  const normalized = parsed ? toUintN(parsed.value, bitWidth) : null;
  const byteCount = bitWidth / 8;
  const bytes = useMemo(() => {
    if (normalized === null) return [] as number[];
    const list: number[] = [];
    for (let i = 0; i < byteCount; i += 1) {
      const shift = BigInt(8 * i);
      const byte = Number((normalized >> shift) & 0xffn);
      list.push(byte);
    }
    return list;
  }, [normalized, byteCount]);

  const endian = ARCHS.find((a) => a.id === arch)?.endian ?? "Little";
  const orderedBytes = endian === "Little" ? bytes : [...bytes].reverse();

  const archLabel = ARCHS.find((a) => a.id === arch)?.label ?? arch;
  const bitsPerRow = 8;
  const base2Pad = bitWidth;
  const base8Pad = Math.ceil(bitWidth / 3);
  const base16Pad = Math.ceil(bitWidth / 4);
  const asciiLabel = orderedBytes
    .map((byte) => toPrintableAscii(byte))
    .join(" ");

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="app-shell">
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

            <Box className="memory-panel">
              <Typography variant="h6">Memory ({bitWidth}-bit)</Typography>
              <Box className="byte-stack">
                {orderedBytes.length === 0
                  ? [0].map((row) => (
                      <Box key={`empty-${row}`} className="byte-row">
                        <Typography variant="caption" className="byte-label">
                          Byte {row}
                        </Typography>
                        <Box className="bit-grid">
                          {Array.from({ length: bitsPerRow }, (_, index) => (
                            <Box key={`empty-bit-${index}`} className="bit-cell off">
                              <Typography variant="h6">-</Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    ))
                  : orderedBytes.map((byte, rowIndex) => (
                      <Box key={`byte-${rowIndex}`} className="byte-row">
                        <Typography variant="caption" className="byte-label">
                          Byte {rowIndex}
                        </Typography>
                        <Box className="bit-grid">
                          {toBits(byte, bitsPerRow).map((bit, bitIndex) => (
                            <Box key={`${rowIndex}-${bitIndex}`} className={`bit-cell ${bit === "1" ? "on" : "off"}`}>
                              <Typography variant="h6">{bit}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    ))}
              </Box>
              <Typography variant="caption" className="bit-caption">
                Byte order: {endian} Endian | Bits: MSB → LSB
              </Typography>
            </Box>
          </Box>

          <Box className="side-panel">
            <Typography variant="h6">Conversions</Typography>
            <Box className="conversion-card">
              <Typography variant="overline">Base 2</Typography>
              <Typography variant="body1" className="mono">
                {normalized !== null ? normalized.toString(2).padStart(base2Pad, "0") : "-"}
              </Typography>
            </Box>
            <Box className="conversion-card">
              <Typography variant="overline">Base 8</Typography>
              <Typography variant="body1" className="mono">
                {normalized !== null ? normalized.toString(8).padStart(base8Pad, "0") : "-"}
              </Typography>
            </Box>
            <Box className="conversion-card">
              <Typography variant="overline">Base 10</Typography>
              <Typography variant="body1" className="mono">
                {normalized !== null ? normalized.toString(10) : "-"}
              </Typography>
            </Box>
            <Box className="conversion-card">
              <Typography variant="overline">Base 16</Typography>
              <Typography variant="body1" className="mono">
                {normalized !== null
                  ? `0x${normalized.toString(16).toUpperCase().padStart(base16Pad, "0")}`
                  : "-"}
              </Typography>
            </Box>
            <Box className="conversion-card">
              <Typography variant="overline">ASCII</Typography>
              <Typography variant="body1" className="mono">
                {normalized !== null ? asciiLabel : "-"}
              </Typography>
            </Box>
            <Typography variant="caption" className="note">
              Value is normalized to unsigned width for the memory grid and conversions.
            </Typography>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
