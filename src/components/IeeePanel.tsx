import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const Panel = styled(Box)(() => ({
  marginTop: 16,
  padding: "16px 18px",
  borderRadius: 18,
  background: "rgba(22, 27, 34, 0.9)",
  boxShadow: "0 12px 28px rgba(0, 0, 0, 0.35)",
  width: "min(720px, 95vw)",
  display: "grid",
  gap: 10,
}));

const Note = styled(Typography)(() => ({
  color: "rgba(139, 148, 158, 0.7)",
}));

const Card = styled(Box)(() => ({
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(13, 17, 23, 0.9)",
  display: "grid",
  gap: 6,
}));

const MonoText = styled(Typography)(() => ({
  fontFamily: '"IBM Plex Mono", "SFMono-Regular", "SF Mono", "Consolas", monospace',
}));

type FloatInfo = {
  kind: "float32" | "float64";
  bits: string;
  sign: number;
  exponent: number;
  fraction: number | bigint;
  fractionBits: string;
};

type IeeePanelProps = {
  floatInfo: FloatInfo | null;
  parsedFloat: { value: number } | null;
  fractionBitsToDecimal: (bits: string) => number;
};

export function IeeePanel({ floatInfo, parsedFloat, fractionBitsToDecimal }: IeeePanelProps) {
  return (
    <Panel>
      <Typography variant="h6">IEEE754</Typography>
      <Note variant="caption">入力が `.` / `e` / `f` を含むと浮動小数として推論されます</Note>
      <Card>
        <MonoText variant="caption">{floatInfo ? `${floatInfo.kind} = ${parsedFloat?.value}` : "-"}</MonoText>
        <MonoText variant="caption">{floatInfo ? floatInfo.bits : "-"}</MonoText>
        {floatInfo && (
          <MonoText variant="caption">
            sign: {floatInfo.sign} exp: {floatInfo.exponent} frac: {floatInfo.fraction.toString()}
          </MonoText>
        )}
        {floatInfo && (
          <MonoText variant="caption">frac(2^-n): {fractionBitsToDecimal(floatInfo.fractionBits)}</MonoText>
        )}
        {floatInfo && (
          <MonoText variant="caption">
            -1 ^ (sign) * (1 + frac(2^-n) * 2^(exp - 127)): {Math.pow(-1, floatInfo.sign) *
              (1 + fractionBitsToDecimal(floatInfo.fractionBits)) *
              Math.pow(2, floatInfo.exponent - (floatInfo.kind === "float32" ? 127 : 1023))}
          </MonoText>
        )}
      </Card>
    </Panel>
  );
}
