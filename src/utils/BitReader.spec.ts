import { describe, it, expect } from "vitest";
import { BitReader } from "./BitReader";
import { BitWriter } from "./BitWriter";

describe("BitReader", () => {
  describe("basic operations", () => {
    it("reads single bit", () => {
      const bytes = new Uint8Array([0b10000000]);
      const reader = new BitReader(bytes);
      expect(reader.read(1)).toBe(1);
    });

    it("reads multiple bits from single byte", () => {
      const bytes = new Uint8Array([0b10100000]);
      const reader = new BitReader(bytes);
      expect(reader.read(3)).toBe(0b101);
    });

    it("reads full byte", () => {
      const bytes = new Uint8Array([0b11010110]);
      const reader = new BitReader(bytes);
      expect(reader.read(8)).toBe(0b11010110);
    });

    it("reads zero value", () => {
      const bytes = new Uint8Array([0b00000000]);
      const reader = new BitReader(bytes);
      expect(reader.read(4)).toBe(0);
    });

    it("reads maximum value for bit count", () => {
      const bytes = new Uint8Array([0b11110000]);
      const reader = new BitReader(bytes);
      expect(reader.read(4)).toBe(0b1111);
    });
  });

  describe("multi-byte operations", () => {
    it("reads across byte boundary", () => {
      const bytes = new Uint8Array([0b11111111, 0b10101010]);
      const reader = new BitReader(bytes);
      expect(reader.read(8)).toBe(0b11111111);
      expect(reader.read(8)).toBe(0b10101010);
    });

    it("reads value spanning two bytes", () => {
      const bytes = new Uint8Array([0b10111111, 0b11100000]);
      const reader = new BitReader(bytes);
      expect(reader.read(3)).toBe(0b101);
      expect(reader.read(8)).toBe(0b11111111);
    });

    it("reads multiple small values across bytes", () => {
      const bytes = new Uint8Array([0b11110111, 0b00010000]);
      const reader = new BitReader(bytes);
      expect(reader.read(3)).toBe(0b111);
      expect(reader.read(3)).toBe(0b101);
      expect(reader.read(3)).toBe(0b110);
      expect(reader.read(3)).toBe(0b001);
    });

    it("reads sequential bits correctly", () => {
      const bytes = new Uint8Array([0b10101010, 0b11001100]);
      const reader = new BitReader(bytes);
      const expected = [1, 0, 1, 0, 1, 0, 1, 0];
      for (let i = 0; i < 8; i++) {
        expect(reader.read(1)).toBe(expected[i]);
      }
      expect(reader.read(4)).toBe(0b1100);
      expect(reader.read(4)).toBe(0b1100);
    });
  });

  describe("sphere grid specific values", () => {
    it("reads valid node index (10 bits)", () => {
      const writer = new BitWriter();
      writer.write(42, 10);
      const bytes = writer.toBytes();
      const reader = new BitReader(bytes);
      expect(reader.read(10)).toBe(42);
    });

    it("reads maximum standard grid index (859)", () => {
      const writer = new BitWriter();
      writer.write(859, 10);
      const bytes = writer.toBytes();
      const reader = new BitReader(bytes);
      expect(reader.read(10)).toBe(859);
    });

    it("reads maximum expert grid index (802)", () => {
      const writer = new BitWriter();
      writer.write(802, 10);
      const bytes = writer.toBytes();
      const reader = new BitReader(bytes);
      expect(reader.read(10)).toBe(802);
    });

    it("reads all sphere types (4 bits, values 0-11)", () => {
      for (let type = 0; type <= 11; type++) {
        const writer = new BitWriter();
        writer.write(type, 4);
        const bytes = writer.toBytes();
        const reader = new BitReader(bytes);
        expect(reader.read(4)).toBe(type);
      }
    });

    it("reads all valid sphere values (4 bits, indices 0-9)", () => {
      for (let valueIndex = 0; valueIndex <= 9; valueIndex++) {
        const writer = new BitWriter();
        writer.write(valueIndex, 4);
        const bytes = writer.toBytes();
        const reader = new BitReader(bytes);
        expect(reader.read(4)).toBe(valueIndex);
      }
    });

    it("reads complete modification (18 bits)", () => {
      const writer = new BitWriter();
      writer.write(500, 10);
      writer.write(5, 4);
      writer.write(3, 4);
      const bytes = writer.toBytes();
      const reader = new BitReader(bytes);
      expect(reader.read(10)).toBe(500);
      expect(reader.read(4)).toBe(5);
      expect(reader.read(4)).toBe(3);
    });

    it("reads modification count (10 bits)", () => {
      const writer = new BitWriter();
      writer.write(50, 10);
      const bytes = writer.toBytes();
      const reader = new BitReader(bytes);
      expect(reader.read(10)).toBe(50);
    });

    it("reads maximum modification count for standard grid (860)", () => {
      const writer = new BitWriter();
      writer.write(860, 10);
      const bytes = writer.toBytes();
      const reader = new BitReader(bytes);
      expect(reader.read(10)).toBe(860);
    });
  });

  describe("realistic grid decoding", () => {
    it("decodes single modification", () => {
      const writer = new BitWriter();
      writer.write(1, 10);
      writer.write(123, 10);
      writer.write(5, 4);
      writer.write(3, 4);
      const bytes = writer.toBytes();

      const reader = new BitReader(bytes);
      const count = reader.read(10);
      expect(count).toBe(1);

      const index = reader.read(10);
      const type = reader.read(4);
      const value = reader.read(4);
      expect(index).toBe(123);
      expect(type).toBe(5);
      expect(value).toBe(3);
    });

    it("decodes multiple modifications", () => {
      const modifications = [
        { index: 42, type: 5, value: 3 },
        { index: 123, type: 8, value: 7 },
        { index: 500, type: 2, value: 4 },
      ];

      const writer = new BitWriter();
      writer.write(modifications.length, 10);
      modifications.forEach((mod) => {
        writer.write(mod.index, 10);
        writer.write(mod.type, 4);
        writer.write(mod.value, 4);
      });

      const bytes = writer.toBytes();
      const reader = new BitReader(bytes);
      const count = reader.read(10);
      expect(count).toBe(modifications.length);

      const decoded = [];
      for (let i = 0; i < count; i++) {
        decoded.push({
          index: reader.read(10),
          type: reader.read(4),
          value: reader.read(4),
        });
      }

      expect(decoded).toEqual(modifications);
    });

    it("decodes 50 modifications", () => {
      const modifications = [];
      for (let i = 0; i < 50; i++) {
        modifications.push({
          index: i * 10,
          type: i % 12,
          value: i % 10,
        });
      }

      const writer = new BitWriter();
      writer.write(modifications.length, 10);
      modifications.forEach((mod) => {
        writer.write(mod.index, 10);
        writer.write(mod.type, 4);
        writer.write(mod.value, 4);
      });

      const bytes = writer.toBytes();
      const reader = new BitReader(bytes);
      const count = reader.read(10);
      expect(count).toBe(50);

      const decoded = [];
      for (let i = 0; i < count; i++) {
        decoded.push({
          index: reader.read(10),
          type: reader.read(4),
          value: reader.read(4),
        });
      }

      expect(decoded).toEqual(modifications);
    });

    it("decodes maximum grid modifications (860)", () => {
      const modifications = [];
      for (let i = 0; i < 860; i++) {
        modifications.push({
          index: i,
          type: i % 12,
          value: i % 10,
        });
      }

      const writer = new BitWriter();
      writer.write(modifications.length, 10);
      modifications.forEach((mod) => {
        writer.write(mod.index, 10);
        writer.write(mod.type, 4);
        writer.write(mod.value, 4);
      });

      const bytes = writer.toBytes();
      const reader = new BitReader(bytes);
      const count = reader.read(10);
      expect(count).toBe(860);

      const decoded = [];
      for (let i = 0; i < count; i++) {
        decoded.push({
          index: reader.read(10),
          type: reader.read(4),
          value: reader.read(4),
        });
      }

      expect(decoded).toEqual(modifications);
    });
  });

  describe("error handling", () => {
    it("throws when reading past end of data", () => {
      const bytes = new Uint8Array([0b10101010]);
      const reader = new BitReader(bytes);
      reader.read(8);
      expect(() => reader.read(1)).toThrow("Unexpected end of data");
    });

    it("throws when reading more bits than available", () => {
      const bytes = new Uint8Array([0b10101010]);
      const reader = new BitReader(bytes);
      expect(() => reader.read(16)).toThrow("Unexpected end of data");
    });

    it("throws on empty byte array", () => {
      const bytes = new Uint8Array([]);
      const reader = new BitReader(bytes);
      expect(() => reader.read(1)).toThrow("Unexpected end of data");
    });

    it("throws when byte is undefined", () => {
      const bytes = new Uint8Array([0b10101010]);
      const reader = new BitReader(bytes);
      reader.read(8);
      expect(() => reader.read(8)).toThrow("Unexpected end of data");
    });

    it("handles reading exactly to end of data", () => {
      const bytes = new Uint8Array([0b10101010, 0b11110000]);
      const reader = new BitReader(bytes);
      reader.read(8);
      expect(() => reader.read(8)).not.toThrow();
    });

    it("throws when trying to read one more bit after exact end", () => {
      const bytes = new Uint8Array([0b10101010]);
      const reader = new BitReader(bytes);
      reader.read(8);
      expect(() => reader.read(1)).toThrow("Unexpected end of data");
    });
  });

  describe("hasMore() method", () => {
    it("returns true when data remains", () => {
      const bytes = new Uint8Array([0b10101010, 0b11110000]);
      const reader = new BitReader(bytes);
      expect(reader.hasMore()).toBe(true);
    });

    it("returns true after partial read", () => {
      const bytes = new Uint8Array([0b10101010, 0b11110000]);
      const reader = new BitReader(bytes);
      reader.read(4);
      expect(reader.hasMore()).toBe(true);
    });

    it("returns true when on last byte with bits remaining", () => {
      const bytes = new Uint8Array([0b10101010, 0b11110000]);
      const reader = new BitReader(bytes);
      reader.read(12);
      expect(reader.hasMore()).toBe(true);
    });

    it("returns false after reading all data", () => {
      const bytes = new Uint8Array([0b10101010]);
      const reader = new BitReader(bytes);
      reader.read(8);
      expect(reader.hasMore()).toBe(false);
    });

    it("returns false on empty array", () => {
      const bytes = new Uint8Array([]);
      const reader = new BitReader(bytes);
      expect(reader.hasMore()).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("handles reading all zeros", () => {
      const bytes = new Uint8Array([0, 0, 0]);
      const reader = new BitReader(bytes);
      expect(reader.read(10)).toBe(0);
      expect(reader.read(4)).toBe(0);
      expect(reader.read(3)).toBe(0);
    });

    it("handles reading all ones", () => {
      const bytes = new Uint8Array([0xff, 0xff, 0xff]);
      const reader = new BitReader(bytes);
      expect(reader.read(10)).toBe(0b1111111111);
      expect(reader.read(4)).toBe(0b1111);
      expect(reader.read(4)).toBe(0b1111);
    });

    it("handles alternating bits", () => {
      const bytes = new Uint8Array([0b10101010, 0b10101010]);
      const reader = new BitReader(bytes);
      const expected = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
      for (let i = 0; i < 16; i++) {
        expect(reader.read(1)).toBe(expected[i]);
      }
    });

    it("handles reading single bits sequentially", () => {
      const bytes = new Uint8Array([0b11010010]);
      const reader = new BitReader(bytes);
      expect(reader.read(1)).toBe(1);
      expect(reader.read(1)).toBe(1);
      expect(reader.read(1)).toBe(0);
      expect(reader.read(1)).toBe(1);
      expect(reader.read(1)).toBe(0);
      expect(reader.read(1)).toBe(0);
      expect(reader.read(1)).toBe(1);
      expect(reader.read(1)).toBe(0);
    });
  });

  describe("round-trip with BitWriter", () => {
    it("round-trips single value", () => {
      const writer = new BitWriter();
      writer.write(42, 10);
      const bytes = writer.toBytes();
      const reader = new BitReader(bytes);
      expect(reader.read(10)).toBe(42);
    });

    it("round-trips multiple values", () => {
      const values = [123, 456, 789, 12, 5];
      const writer = new BitWriter();
      values.forEach((v) => writer.write(v, 10));
      const bytes = writer.toBytes();

      const reader = new BitReader(bytes);
      values.forEach((expected) => {
        expect(reader.read(10)).toBe(expected);
      });
    });

    it("round-trips mixed bit sizes", () => {
      const writer = new BitWriter();
      writer.write(500, 10);
      writer.write(5, 4);
      writer.write(3, 4);
      writer.write(1, 1);
      writer.write(255, 8);

      const bytes = writer.toBytes();
      const reader = new BitReader(bytes);

      expect(reader.read(10)).toBe(500);
      expect(reader.read(4)).toBe(5);
      expect(reader.read(4)).toBe(3);
      expect(reader.read(1)).toBe(1);
      expect(reader.read(8)).toBe(255);
    });

    it("round-trips random data", () => {
      const writer = new BitWriter();
      const testData = [];
      for (let i = 0; i < 100; i++) {
        const value = Math.floor(Math.random() * 1024);
        const bits = Math.floor(Math.random() * 10) + 1;
        testData.push({ value: value & ((1 << bits) - 1), bits });
        writer.write(testData[i]!.value, testData[i]!.bits);
      }

      const bytes = writer.toBytes();
      const reader = new BitReader(bytes);

      testData.forEach((data) => {
        expect(reader.read(data.bits)).toBe(data.value);
      });
    });

    it("round-trips empty data", () => {
      const writer = new BitWriter();
      const bytes = writer.toBytes();
      expect(bytes.length).toBe(0);
    });

    it("round-trips partial byte", () => {
      const writer = new BitWriter();
      writer.write(0b111, 3);
      const bytes = writer.toBytes();
      const reader = new BitReader(bytes);
      expect(reader.read(3)).toBe(0b111);
    });

    it("round-trips exactly one byte", () => {
      const writer = new BitWriter();
      writer.write(0b11010110, 8);
      const bytes = writer.toBytes();
      const reader = new BitReader(bytes);
      expect(reader.read(8)).toBe(0b11010110);
    });

    it("round-trips large data set", () => {
      const writer = new BitWriter();
      const modifications = [];
      for (let i = 0; i < 500; i++) {
        modifications.push({
          index: i,
          type: i % 12,
          value: i % 10,
        });
      }

      writer.write(modifications.length, 10);
      modifications.forEach((mod) => {
        writer.write(mod.index, 10);
        writer.write(mod.type, 4);
        writer.write(mod.value, 4);
      });

      const bytes = writer.toBytes();
      const reader = new BitReader(bytes);

      const count = reader.read(10);
      expect(count).toBe(modifications.length);

      const decoded = [];
      for (let i = 0; i < count; i++) {
        decoded.push({
          index: reader.read(10),
          type: reader.read(4),
          value: reader.read(4),
        });
      }

      expect(decoded).toEqual(modifications);
    });
  });
});
