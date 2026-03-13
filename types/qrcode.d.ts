declare module "qrcode" {
  export type QRCodeToBufferOptions = {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  };

  export function toBuffer(text: string, options?: QRCodeToBufferOptions): Promise<Buffer>;

  const QRCode: {
    toBuffer: typeof toBuffer;
  };

  export default QRCode;
}
