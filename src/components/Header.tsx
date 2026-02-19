import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

const Title = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

const Subtitle = styled(Typography)(() => ({
  color: "rgba(201, 209, 217, 0.7)",
}));

export function Header() {
  return (
    <>
      <Title variant="h2">NumMemory</Title>
      <Subtitle variant="subtitle1">8-bit memory view with literal-aware parsing</Subtitle>
    </>
  );
}
