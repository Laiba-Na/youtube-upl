import 'fabric';

declare module 'fabric' {
  
  namespace fabric {
    
    interface IImageOptions {
      crossOrigin?: string | null;
    }

    interface Image {
      fromURL(
        url: string,
        callback: (img: Image) => void,
        imgOptions?: IImageOptions
      ): void;
    }
  }

  interface Object {
    bringForward: (intersecting?: boolean) => Object;
    sendBackwards: (intersecting?: boolean) => Object;
  }
  namespace Image {
    // Define a Filters interface listing the available filters.
    export const filters: {
      Brightness: new (options: { brightness: number }) => fabric.IBaseFilter;
      Contrast: new (options: { contrast: number }) => fabric.IBaseFilter;
      Saturation: new (options: { saturation: number }) => fabric.IBaseFilter;
      // Add any additional filters as needed.
    };
  }
}
