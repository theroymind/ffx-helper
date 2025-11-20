import { describe, it, expect } from "vitest";
import { BitWriter } from "./BitWriter";

describe("BitWriter", () => {
  describe("basic operations", () => {
    it("writes single bit", () => {
      const writer = new BitWriter();
      writer.write(1, 1);
      const bytes = writer.toBytes();
      expect(bytes[0]).toBe(0b10000000);
    });

    it("writes multiple bits in single byte", () => {
      const writer = new BitWriter();
      writer.write(0b101, 3);
      const bytes = writer.toBytes();
      expect(bytes[0]).toBe(0b10100000);
    });

    it("writes full byte", () => {
      const writer = new BitWriter();
      writer.write(0b11010110, 8);
      const bytes = writer.toBytes();
      expect(bytes[0]).toBe(0b11010110);
    });

    it("writes zero value", () => {
      const writer = new BitWriter();
      writer.write(0, 4);
      const bytes = writer.toBytes();
      expect(bytes[0]).toBe(0b00000000);
    });

    it("writes maximum value for bit count", () => {
      const writer = new BitWriter();
      writer.write(0b1111, 4);
      const bytes = writer.toBytes();
      expect(bytes[0]).toBe(0b11110000);
    });
  });

  describe("multi-byte operations", () => {
    it("writes across byte boundary", () => {
      const writer = new BitWriter();
      writer.write(0b11111111, 8);
      writer.write(0b10101010, 8);
      const bytes = writer.toBytes();
      expect(bytes[0]).toBe(0b11111111);
      expect(bytes[1]).toBe(0b10101010);
    });

    it("writes value spanning two bytes", () => {
      const writer = new BitWriter();
      writer.write(0b101, 3);
      writer.write(0b11111111, 8);
      const bytes = writer.toBytes();
      expect(bytes[0]).toBe(0b10111111);
      expect(bytes[1]).toBe(0b11100000);
    });

    it("writes multiple small values across bytes", () => {
      const writer = new BitWriter();
      writer.write(0b111, 3);
      writer.write(0b101, 3);
      writer.write(0b110, 3);
      writer.write(0b001, 3);
      const bytes = writer.toBytes();
      expect(bytes[0]).toBe(0b11110111);
      expect(bytes[1]).toBe(0b00010000);
    });
  });

  describe("partial byte padding", () => {
    it("pads partial byte with zeros", () => {
      const writer = new BitWriter();
      writer.write(0b111, 3);
      const bytes = writer.toBytes();
      expect(bytes[0]).toBe(0b11100000);
      expect(bytes.length).toBe(1);
    });

    it("pads 5-bit value correctly", () => {
      const writer = new BitWriter();
      writer.write(0b10101, 5);
      const bytes = writer.toBytes();
      expect(bytes[0]).toBe(0b10101000);
    });

    it("pads 7-bit value correctly", () => {
      const writer = new BitWriter();
      writer.write(0b1010101, 7);
      const bytes = writer.toBytes();
      expect(bytes[0]).toBe(0b10101010);
    });

    it("no padding needed for full byte", () => {
      const writer = new BitWriter();
      writer.write(0b11111111, 8);
      const bytes = writer.toBytes();
      expect(bytes.length).toBe(1);
      expect(bytes[0]).toBe(0b11111111);
    });

    it("pads correctly after writing multiple values", () => {
      const writer = new BitWriter();
      writer.write(0b11, 2);
      writer.write(0b101, 3);
      const bytes = writer.toBytes();
      expect(bytes[0]).toBe(0b11101000);
    });
  });

  describe("sphere grid specific values", () => {
    it("writes valid node index (10 bits)", () => {
      const writer = new BitWriter();
      writer.write(42, 10);
      const bytes = writer.toBytes();
      expect(bytes.length).toBe(2);
    });

    it("writes maximum standard grid index (859)", () => {
      const writer = new BitWriter();
      writer.write(859, 10);
      const bytes = writer.toBytes();
      const value = (bytes[0]! << 2) | (bytes[1]! >> 6);
      expect(value).toBe(859);
    });

    it("writes maximum expert grid index (802)", () => {
      const writer = new BitWriter();
      writer.write(802, 10);
      const bytes = writer.toBytes();
      const value = (bytes[0]! << 2) | (bytes[1]! >> 6);
      expect(value).toBe(802);
    });

    it("writes all sphere types (4 bits, values 0-11)", () => {
      for (let type = 0; type <= 11; type++) {
        const writer = new BitWriter();
        writer.write(type, 4);
        const bytes = writer.toBytes();
        expect((bytes[0]! >> 4) & 0b1111).toBe(type);
      }
    });

    it("writes all valid sphere values (4 bits, indices 0-9)", () => {
      for (let valueIndex = 0; valueIndex <= 9; valueIndex++) {
        const writer = new BitWriter();
        writer.write(valueIndex, 4);
        const bytes = writer.toBytes();
        expect((bytes[0]! >> 4) & 0b1111).toBe(valueIndex);
      }
    });

    it("writes complete modification (18 bits)", () => {
      const writer = new BitWriter();
      writer.write(500, 10);
      writer.write(5, 4);
      writer.write(3, 4);
      const bytes = writer.toBytes();
      expect(bytes.length).toBe(3);
    });

    it("writes modification count (10 bits)", () => {
      const writer = new BitWriter();
      writer.write(50, 10);
      const bytes = writer.toBytes();
      expect(bytes.length).toBe(2);
    });

    it("writes maximum modification count for standard grid (860)", () => {
      const writer = new BitWriter();
      writer.write(860, 10);
      const bytes = writer.toBytes();
      const value = (bytes[0]! << 2) | (bytes[1]! >> 6);
      expect(value).toBe(860);
    });
  });

  describe("realistic grid encoding", () => {
    it("encodes single modification", () => {
      const writer = new BitWriter();
      writer.write(1, 10);
      writer.write(123, 10);
      writer.write(5, 4);
      writer.write(3, 4);
      const bytes = writer.toBytes();
      expect(bytes.length).toBe(4);
    });

    it("encodes multiple modifications", () => {
      const writer = new BitWriter();
      writer.write(3, 10);

      writer.write(42, 10);
      writer.write(5, 4);
      writer.write(3, 4);

      writer.write(123, 10);
      writer.write(8, 4);
      writer.write(7, 4);

      writer.write(500, 10);
      writer.write(2, 4);
      writer.write(4, 4);

      const bytes = writer.toBytes();
      expect(bytes.length).toBe(8);
    });

    it("encodes 50 modifications efficiently", () => {
      const writer = new BitWriter();
      writer.write(50, 10);

      for (let i = 0; i < 50; i++) {
        writer.write(i * 10, 10);
        writer.write(i % 12, 4);
        writer.write(i % 10, 4);
      }

      const bytes = writer.toBytes();
      const expectedBits = 10 + 50 * 18;
      const expectedBytes = Math.ceil(expectedBits / 8);
      expect(bytes.length).toBe(expectedBytes);
    });

    it("encodes maximum grid modifications (860)", () => {
      const writer = new BitWriter();
      writer.write(860, 10);

      for (let i = 0; i < 860; i++) {
        writer.write(i, 10);
        writer.write(i % 12, 4);
        writer.write(i % 10, 4);
      }

      const bytes = writer.toBytes();
      const expectedBits = 10 + 860 * 18;
      const expectedBytes = Math.ceil(expectedBits / 8);
      expect(bytes.length).toBe(expectedBytes);
    });
  });

  describe("edge cases", () => {
    it("handles empty writer", () => {
      const writer = new BitWriter();
      const bytes = writer.toBytes();
      expect(bytes.length).toBe(0);
    });

    it("handles writing only zeros", () => {
      const writer = new BitWriter();
      writer.write(0, 10);
      writer.write(0, 4);
      writer.write(0, 4);
      const bytes = writer.toBytes();
      expect(bytes.every((b) => b === 0)).toBe(true);
    });

    it("handles writing max values", () => {
      const writer = new BitWriter();
      writer.write(0b1111111111, 10);
      writer.write(0b1111, 4);
      writer.write(0b1111, 4);
      const bytes = writer.toBytes();
      expect(bytes.length).toBe(3);
    });

    it("handles alternating bits", () => {
      const writer = new BitWriter();
      for (let i = 0; i < 16; i++) {
        writer.write(i % 2, 1);
      }
      const bytes = writer.toBytes();
      expect(bytes[0]).toBe(0b01010101);
      expect(bytes[1]).toBe(0b01010101);
    });

    it("toBytes can be called multiple times", () => {
      const writer = new BitWriter();
      writer.write(0b111, 3);
      const bytes1 = writer.toBytes();
      const bytes2 = writer.toBytes();
      expect(bytes1[0]).toBe(bytes2[0]);
    });

    it("subsequent writes after toBytes include previous data", () => {
      const writer = new BitWriter();
      writer.write(0b111, 3);
      const bytes1 = writer.toBytes();
      writer.write(0b101, 3);
      const bytes2 = writer.toBytes();
      expect(bytes2[0]).toBe(bytes1[0]);
      expect(bytes2.length).toBeGreaterThan(bytes1.length);
    });
  });

  describe("byte array properties", () => {
    it("returns Uint8Array", () => {
      const writer = new BitWriter();
      writer.write(1, 1);
      const bytes = writer.toBytes();
      expect(bytes instanceof Uint8Array).toBe(true);
    });

    it("byte values are in valid range (0-255)", () => {
      const writer = new BitWriter();
      for (let i = 0; i < 100; i++) {
        writer.write(i, 8);
      }
      const bytes = writer.toBytes();
      bytes.forEach((byte) => {
        expect(byte).toBeGreaterThanOrEqual(0);
        expect(byte).toBeLessThanOrEqual(255);
      });
    });
  });
});
