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

const SAMPLE_OPTIONS = [
  "1",
  "2",
  "3",
  "123456",
  "9007199254740992",
  "0.1",
  "0.2",
  "0.3",
  "0.5",
  "123.456",
  "+0",
  "-0",
  "Infinity",
  "-Infinity",
  "Number.MAX_SAFE_INTEGER",
  "Number.MIN_SAFE_INTEGER",
  "Number.MAX_VALUE",
  "Number.MIN_VALUE",
  "NaN",
];

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

  it("parses integer samples", () => {
    const integerOptions = SAMPLE_OPTIONS.filter(
      (option) => option === "+0" || option === "-0" || /^[0-9]+$/.test(option)
    );

    for (const option of integerOptions) {
      const expected = BigInt(option);
      const parsedC = parseLiteral(option, "c");
      const parsedJs = parseLiteral(option, "javascript");
      expect(parsedC?.value).toBe(expected);
      expect(parsedC?.base).toBe(10);
      expect(parsedJs?.value).toBe(expected);
      expect(parsedJs?.base).toBe(10);
    }
  });

  it("rejects non-literal samples", () => {
    const invalidOptions = SAMPLE_OPTIONS.filter(
      (option) => option === "NaN" || option.startsWith("Number.")
    );

    for (const option of invalidOptions) {
      expect(parseLiteral(option, "c")).toBeNull();
      expect(parseLiteral(option, "javascript")).toBeNull();
    }
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

  it("detects decimal samples", () => {
    const decimalOptions = SAMPLE_OPTIONS.filter(
      (option) => option.includes(".") && !option.startsWith("Number.")
    );

    for (const option of decimalOptions) {
      const expected = Number(option);
      const parsedC = detectFloat(option, "c");
      const parsedJs = detectFloat(option, "javascript");
      expect(parsedC?.kind).toBe("float64");
      expect(parsedC?.value).toBeCloseTo(expected);
      expect(parsedJs?.kind).toBe("float64");
      expect(parsedJs?.value).toBeCloseTo(expected);
    }
  });

  it("handles Infinity samples in javascript only", () => {
    const infinityOptions = SAMPLE_OPTIONS.filter((option) => option === "Infinity" || option === "-Infinity");

    for (const option of infinityOptions) {
      const expected = Number(option);
      const parsedC = detectFloat(option, "c");
      const parsedJs = detectFloat(option, "javascript");
      expect(parsedC).toBeNull();
      expect(parsedJs?.kind).toBe("float64");
      expect(parsedJs?.value).toBe(expected);
    }
  });

  it("rejects non-numeric samples", () => {
    const invalidOptions = SAMPLE_OPTIONS.filter(
      (option) => option === "NaN" || option.startsWith("Number.")
    );

    for (const option of invalidOptions) {
      expect(detectFloat(option, "c")).toBeNull();
      expect(detectFloat(option, "javascript")).toBeNull();
    }
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
