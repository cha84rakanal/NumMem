import { Chip, Stack, TextField } from "@mui/material";
import { styled } from "@mui/material/styles";

const InputField = styled(TextField)(() => ({
  width: "min(520px, 90vw)",
  "& .MuiInputBase-root": {
    fontSize: "1.4rem",
    padding: "8px 12px",
    background: "rgba(22, 27, 34, 0.9)",
    borderRadius: 18,
  },
}));

const Chips = styled(Stack)(() => ({
  flexWrap: "wrap",
  justifyContent: "center",
}));

type InputSectionProps = {
  input: string;
  onInputChange: (value: string) => void;
  archLabel: string;
  endian: string;
  isValid: boolean;
  parsedBase: number | null;
};

export function InputSection({
  input,
  onInputChange,
  archLabel,
  endian,
  isValid,
  parsedBase,
}: InputSectionProps) {
  return (
    <>
      <InputField
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="例: 255, 0xff, 0b101010"
        InputProps={{
          inputProps: { "aria-label": "numeric input" },
        }}
      />

      <Chips direction="row" spacing={1}>
        <Chip label={`${archLabel} / ${endian} Endian`} color="primary" variant="outlined" />
        <Chip
          label={isValid ? `Detected: base ${parsedBase}` : "Invalid literal"}
          color={isValid ? "secondary" : "default"}
          variant={isValid ? "filled" : "outlined"}
        />
      </Chips>
    </>
  );
}
