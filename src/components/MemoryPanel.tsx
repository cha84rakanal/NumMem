import { Box, Typography } from "@mui/material";
import { keyframes, styled } from "@mui/material/styles";

const floatIn = keyframes`
  from {
    transform: translateY(12px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const Panel = styled(Box)(() => ({
  marginTop: 16,
  padding: "20px 24px",
  borderRadius: 20,
  background: "rgba(22, 27, 34, 0.9)",
  boxShadow: "0 18px 40px rgba(0, 0, 0, 0.4)",
  width: "min(720px, 95vw)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  animation: `${floatIn} 0.8s ease-out`,
}));

const RowStack = styled(Box)(() => ({
  display: "grid",
  gap: 12,
}));

const ByteLine = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "120px minmax(0, 1fr) minmax(140px, 190px)",
  gap: 12,
  alignItems: "center",
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "1fr",
  },
}));

const RowLabel = styled(Typography)(() => ({
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "rgba(139, 148, 158, 0.8)",
  paddingTop: 6,
}));

const ByteRow = styled(Box)(() => ({
  display: "grid",
  gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
  gap: 2,
}));

const BitCell = styled(Box, {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active: boolean }>(({ active }) => ({
  height: 64,
  display: "grid",
  placeItems: "center",
  borderRadius: 6,
  fontWeight: 600,
  background: active ? "#58a6ff" : "#0f172a",
  color: active ? "#0d1117" : "#8b949e",
  border: "1px solid rgba(88, 166, 255, 0.25)",
  transition: "transform 0.2s ease, background 0.2s ease",
  opacity: active ? 1 : 0.85,
}));

const RowConversions = styled(Box, {
  shouldForwardProp: (prop) => prop !== "compact",
})<{ compact?: boolean }>(({ compact }) => ({
  display: "grid",
  gap: compact ? 1.5 : 8,
  padding: compact ? "6px 10px" : "10px 12px",
  borderRadius: 10,
  background: "rgba(13, 17, 23, 0.9)",
  "& .MuiTypography-caption": {
    fontSize: compact ? "0.6rem" : undefined,
  },
  "& .MuiTypography-overline": {
    fontSize: compact ? "0.5rem" : undefined,
  },
}));

const RowConversion = styled(Box)(() => ({
  display: "grid",
  gap: 2,
}));

const MonoText = styled(Typography)(() => ({
  fontFamily: '"IBM Plex Mono", "SFMono-Regular", "SF Mono", "Consolas", monospace',
}));

const BitCaption = styled(Typography)(() => ({
  color: "rgba(139, 148, 158, 0.7)",
}));

type MemoryPanelProps = {
  effectiveBitWidth: number;
  rows: Array<number | null>;
  bitsPerRow: number;
  baseAddress: bigint;
  addressHexWidth: number;
  endian: string;
  toBits: (value: number, width: number) => string[];
  toPrintableAscii: (value: number) => string;
};

export function MemoryPanel({
  effectiveBitWidth,
  rows,
  bitsPerRow,
  baseAddress,
  addressHexWidth,
  endian,
  toBits,
  toPrintableAscii,
}: MemoryPanelProps) {
  return (
    <Panel>
      <Typography variant="h6">Memory ({effectiveBitWidth}-bit)</Typography>
      <RowStack>
        {rows.map((rowByte, rowIndex) => {
          const byte = rowByte;
          const bits = byte === null ? Array.from({ length: bitsPerRow }, () => "-") : toBits(byte, bitsPerRow);
          const hex = byte === null ? "--" : byte.toString(16).toUpperCase().padStart(2, "0");
          const bin = byte === null ? "--------" : byte.toString(2).padStart(8, "0");
          const ascii = byte === null ? "·" : toPrintableAscii(byte);
          const dec = byte === null ? "-" : String(byte);
          return (
            <ByteLine key={`row-${rowIndex}`}>
              <RowLabel variant="caption">
                {`0x${(baseAddress + BigInt(rowIndex))
                  .toString(16)
                  .toUpperCase()
                  .padStart(addressHexWidth, "0")}`}
              </RowLabel>
              <ByteRow>
                {bits.map((bit, bitIndex) => (
                  <BitCell key={`cell-${rowIndex}-${bitIndex}`} active={bit === "1"}>
                    <Typography variant="caption">{bit}</Typography>
                  </BitCell>
                ))}
              </ByteRow>
              <RowConversions compact>
                <RowConversion>
                  <MonoText variant="caption">Hex: {hex}</MonoText>
                </RowConversion>
                <RowConversion>
                  <MonoText variant="caption">Dec: {dec}</MonoText>
                </RowConversion>
                <RowConversion>
                  <MonoText variant="caption">Bin: {bin}</MonoText>
                </RowConversion>
                <RowConversion>
                  <MonoText variant="caption">ASCII: {ascii}</MonoText>
                </RowConversion>
              </RowConversions>
            </ByteLine>
          );
        })}
      </RowStack>
      <BitCaption variant="caption">Byte order: {endian} Endian | Bits: MSB → LSB</BitCaption>
    </Panel>
  );
}
