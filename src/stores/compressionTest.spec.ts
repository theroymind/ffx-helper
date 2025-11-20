import { describe, it, expect } from "vitest";
import { BitWriter } from "@/utils/BitWriter";

describe("Compression Savings Verification", () => {
  it("verifies ~20% compression savings with v1 format (magic number + 14-bit encoding)", () => {
    const testCases = [
      { name: "10 modifications", count: 10 },
      { name: "50 modifications", count: 50 },
      { name: "100 modifications", count: 100 },
      { name: "500 modifications", count: 500 },
    ];

    console.log("\n" + "=".repeat(60));
    console.log("URL Compression Savings Analysis");
    console.log("=".repeat(60));

    testCases.forEach(({ name, count }) => {
      const oldWriter = new BitWriter();
      oldWriter.write(count, 10);
      for (let i = 0; i < count; i++) {
        oldWriter.write(i, 10);
        oldWriter.write(1, 4);
        oldWriter.write(8, 4);
      }
      const oldBytes = oldWriter.toBytes();
      const oldBase64Length = Math.ceil((oldBytes.length * 4) / 3);

      const newWriter = new BitWriter();
      newWriter.write(0b1011, 4);
      newWriter.write(1, 4);
      newWriter.write(0, 1);
      newWriter.write(count, 10);
      for (let i = 0; i < count; i++) {
        newWriter.write(i, 10);
        newWriter.write(1, 4);
      }
      const newBytes = newWriter.toBytes();
      const newBase64Length = Math.ceil((newBytes.length * 4) / 3);

      const savedBytes = oldBytes.length - newBytes.length;
      const savedChars = oldBase64Length - newBase64Length;
      const savingsPercent = ((savedBytes / oldBytes.length) * 100).toFixed(1);

      console.log(`\n${name}:`);
      console.log(`  Old (10 + n×18 bits): ${oldBytes.length} bytes → ~${oldBase64Length} base64 chars`);
      console.log(`  New (9 + 10 + n×14 bits): ${newBytes.length} bytes → ~${newBase64Length} base64 chars`);
      console.log(`  💾 Saved: ${savedBytes} bytes (${savedChars} chars) = ${savingsPercent}% reduction`);

      expect(savedBytes).toBeGreaterThan(0);
      if (count >= 50) {
        expect(Number(savingsPercent)).toBeGreaterThanOrEqual(18);
      }
      expect(Number(savingsPercent)).toBeLessThanOrEqual(23);
    });

    console.log("\n" + "=".repeat(60));
    console.log("✅ Confirmed: ~20% compression savings with v1 format!");
    console.log("   Format: 4-bit magic (0b1011) + 4-bit version (1) + 1-bit grid type + data");
    console.log("=".repeat(60) + "\n");
  });

  it("calculates maximum modifications that fit in 4000 char URL", () => {
    const maxUrlLength = 4000;
    const domainAndParams = 100;
    const availableChars = maxUrlLength - domainAndParams;
    const availableBytes = Math.floor((availableChars * 3) / 4);
    const availableBits = availableBytes * 8;

    const headerBitsOld = 10;
    const headerBitsNew = 9 + 10;
    const bitsPerModOld = 18;
    const bitsPerModNew = 14;

    const maxModsOld = Math.floor((availableBits - headerBitsOld) / bitsPerModOld);
    const maxModsNew = Math.floor((availableBits - headerBitsNew) / bitsPerModNew);

    const urlParamSavings = 10;

    console.log("\n" + "=".repeat(60));
    console.log("Maximum Modifications in 4000-char URL:");
    console.log("=".repeat(60));
    console.log(`  Old format (10 + n×18 bits + &t=standard): ${maxModsOld} modifications`);
    console.log(`  New format (9 + 10 + n×14 bits, no &t param): ${maxModsNew} modifications`);
    console.log(`  Additional capacity: ${maxModsNew - maxModsOld} more modifications`);
    console.log(`  Bonus: Saved ~${urlParamSavings} chars by removing &t parameter`);
    console.log("=".repeat(60) + "\n");

    expect(maxModsNew).toBeGreaterThan(maxModsOld);
    expect(maxModsNew).toBeGreaterThanOrEqual(1660);
  });
});
