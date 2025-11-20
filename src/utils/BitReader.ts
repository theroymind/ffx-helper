export class BitReader {
  private bytes: Uint8Array;
  private byteIndex = 0;
  private bitPosition = 0;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  read(numBits: number): number {
    let value = 0;

    for (let i = 0; i < numBits; i++) {
      if (this.byteIndex >= this.bytes.length) {
        throw new Error("Unexpected end of data");
      }

      const currentByte = this.bytes[this.byteIndex];
      if (currentByte === undefined) {
        throw new Error("Unexpected end of data");
      }

      const bit = (currentByte >> (7 - this.bitPosition)) & 1;
      value = (value << 1) | bit;
      this.bitPosition++;

      if (this.bitPosition === 8) {
        this.byteIndex++;
        this.bitPosition = 0;
      }
    }

    return value;
  }

  hasMore(): boolean {
    return this.byteIndex < this.bytes.length || (this.byteIndex === this.bytes.length - 1 && this.bitPosition > 0);
  }
}
