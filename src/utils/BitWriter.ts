export class BitWriter {
  private bytes: number[] = [];
  private currentByte = 0;
  private bitPosition = 0;

  write(value: number, numBits: number) {
    for (let i = numBits - 1; i >= 0; i--) {
      const bit = (value >> i) & 1;
      this.currentByte = (this.currentByte << 1) | bit;
      this.bitPosition++;

      if (this.bitPosition === 8) {
        this.bytes.push(this.currentByte);
        this.currentByte = 0;
        this.bitPosition = 0;
      }
    }
  }

  toBytes(): Uint8Array {
    if (this.bitPosition > 0) {
      this.currentByte <<= 8 - this.bitPosition;
      this.bytes.push(this.currentByte);
    }
    return new Uint8Array(this.bytes);
  }
}
