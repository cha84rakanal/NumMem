import { describe, expect, it } from "vitest";
import {
  detectFloat,
  float32Bits,
  parseLiteral,
  fractionBitsToDecimal,
  toBits,
  toPrintableAscii,
  toUintN,
} from "./numberLogic";

describe("parseLiteral", () => {
  it("parses C-style hex", () => {
    const parsed = parseLiteral("0x2A", "c");
    expect(parsed?.value).toBe(42n);
    expect(parsed?.base).toBe(16);
  });

  it("parses C-style octal when leading zero", () => {
    const parsed = parseLiteral("0755", "c");
    expect(parsed?.value).toBe(493n);
    expect(parsed?.base).toBe(8);
  });

  it("parses JS binary with underscores", () => {
    const parsed = parseLiteral("0b1010_0001", "javascript");
    expect(parsed?.value).toBe(161n);
    expect(parsed?.base).toBe(2);
  });

  it("rejects invalid digits", () => {
    const parsed = parseLiteral("0b1201", "javascript");
    expect(parsed).toBeNull();
  });
});

describe("detectFloat", () => {
  it("detects float with decimal", () => {
    const parsed = detectFloat("3.5", "c");
    expect(parsed?.kind).toBe("float64");
    expect(parsed?.value).toBeCloseTo(3.5);
  });

  it("detects float32 with f suffix", () => {
    const parsed = detectFloat("1.5f", "c");
    expect(parsed?.kind).toBe("float32");
    expect(parsed?.value).toBeCloseTo(1.5);
  });

  it("skips hex literals", () => {
    const parsed = detectFloat("0x10", "c");
    expect(parsed).toBeNull();
  });
});

describe("bit helpers", () => {
  it("computes float32 bits", () => {
    const info = float32Bits(1.0);
    expect(info.bits).toBe("00111111100000000000000000000000");
  });

  it("converts fraction bits to decimal", () => {
    expect(fractionBitsToDecimal("1")).toBe(0.5);
    expect(fractionBitsToDecimal("01")).toBe(0.25);
  });

  it("pads bits", () => {
    expect(toBits(5, 8).join("")).toBe("00000101");
  });

  it("normalizes unsigned", () => {
    expect(toUintN(-1n, 8)).toBe(255n);
  });

  it("prints ascii", () => {
    expect(toPrintableAscii(65)).toBe("A");
    expect(toPrintableAscii(10)).toBe("\\n");
  });
});
