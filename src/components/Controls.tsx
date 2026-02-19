import { FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";

const SelectControl = styled(FormControl)(() => ({
  width: 200,
  minWidth: 200,
  maxWidth: 200,
  padding: "2px 0",
  backdropFilter: "blur(12px)",
  background: "rgba(22, 27, 34, 0.85)",
  borderRadius: 14,
  overflow: "visible",
  "& .MuiInputLabel-root": {
    transform: "translate(14px, 8px) scale(1)",
  },
  "& .MuiInputLabel-root.MuiInputLabel-shrink": {
    transform: "translate(14px, -6px) scale(0.75)",
  },
}));

const BaseAddressField = styled(TextField)(() => ({
  width: 200,
  minWidth: 200,
  maxWidth: 200,
  padding: "2px 0",
  backdropFilter: "blur(12px)",
  background: "rgba(22, 27, 34, 0.85)",
  borderRadius: 14,
  overflow: "visible",
  "& .MuiInputLabel-root": {
    transform: "translate(14px, 8px) scale(1)",
  },
  "& .MuiInputLabel-root.MuiInputLabel-shrink": {
    transform: "translate(14px, -6px) scale(0.75)",
  },
}));

type ControlsProps = {
  arch: string;
  onArchChange: (value: string) => void;
  bitWidth: number;
  onBitWidthChange: (value: number) => void;
  baseAddrInput: string;
  onBaseAddrInputChange: (value: string) => void;
  lang: string;
  onLangChange: (value: string) => void;
  archs: { id: string; label: string }[];
  bitWidths: readonly number[];
  langs: { id: string; label: string }[];
};

export function Controls({
  arch,
  onArchChange,
  bitWidth,
  onBitWidthChange,
  baseAddrInput,
  onBaseAddrInputChange,
  lang,
  onLangChange,
  archs,
  bitWidths,
  langs,
}: ControlsProps) {
  return (
    <>
      <SelectControl size="small">
        <InputLabel id="arch-label">Architecture</InputLabel>
        <Select labelId="arch-label" value={arch} label="Architecture" onChange={(e) => onArchChange(e.target.value)}>
          {archs.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.label}
            </MenuItem>
          ))}
        </Select>
      </SelectControl>
      <SelectControl size="small">
        <InputLabel id="width-label">Bit Width</InputLabel>
        <Select
          labelId="width-label"
          value={bitWidth}
          label="Bit Width"
          onChange={(e) => onBitWidthChange(Number(e.target.value))}
        >
          {bitWidths.map((width) => (
            <MenuItem key={width} value={width}>
              {width}-bit
            </MenuItem>
          ))}
        </Select>
      </SelectControl>
      <BaseAddressField
        size="small"
        value={baseAddrInput}
        onChange={(e) => onBaseAddrInputChange(e.target.value)}
        label="Base Address"
        placeholder="0x00"
      />
      <SelectControl size="small">
        <InputLabel id="lang-label">Language</InputLabel>
        <Select labelId="lang-label" value={lang} label="Language" onChange={(e) => onLangChange(e.target.value)}>
          {langs.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.label}
            </MenuItem>
          ))}
        </Select>
      </SelectControl>
    </>
  );
}
