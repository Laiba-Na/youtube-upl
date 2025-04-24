declare module 'gifshot' {
    export interface CreateGIFOptions {
      images: string[];
      gifWidth?: number;
      gifHeight?: number;
      interval: number;
      numFrames: number;
      frameDuration: number;
      sampleInterval: number;
      progressCallback?: (progress: number) => void;
    }
  
    export interface CreateGIFResult {
      error: boolean;
      image?: string;
      errorCode?: string | number;
      errorMsg?: string;
    }
  
    export function createGIF(
      options: CreateGIFOptions,
      callback: (result: CreateGIFResult) => void
    ): void;
  
    const gifshot: {
      createGIF: typeof createGIF;
    };
  
    export default gifshot;
  }
  