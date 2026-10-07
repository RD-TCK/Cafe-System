declare module 'qrcode' {
  export function toDataURL(
    text: string | Array<any>,
    options?: {
      type?: string;
      rendererOpts?: any;
      errorCorrectionLevel?: string;
      margin?: number;
      scale?: number;
      width?: number;
      color?: {
        dark?: string;
        light?: string;
      };
    }
  ): Promise<string>;

  export function toString(
    text: string | Array<any>,
    options?: any
  ): Promise<string>;
}
