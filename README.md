# png2pdf

A library to convert pngs to DPF. Built on [jsPDF](https://github.com/parallax/jsPDF) with all features removed except png.

## usage

```typescript
import { png2pdf } from "png2pdf";

const pdfBuf = png2pdf({
  pageWidth: 960,
  pageHeight: 720,
  pages: [
    [
        {
          dataUrl: "data:**",
          x: 0,
          y: 0,
          w: 960,
          h: 720
        }
    ], // page 1
    [
      {
        dataUrl: "data:**",
        x: 0,
        y: 0,
        w: 960,
        h: 720
      },
      {
        dataUrl: "data:**",
        x: 10,
        y: 10,
        w: 950,
        h: 710
      }
    ] // page 2
  ]
})
```
