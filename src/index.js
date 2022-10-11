import { jsPDF } from "./jspdf.js";
import "./modules/addimage.js";
import "./modules/png_support.js";

export function png2pdf(config) {
    const orientation = config.pageWidth > config.pageHeight ? "l" : "p";
    var doc = new jsPDF({ format: [config.pageWidth, config.pageHeight], orientation });
    for (var i = 0, iLen = config.pages.length; i < iLen; i++ ) {
        var images = config.pages[i];
        for (var p = 0, pLen = images.length; p < pLen; p++ ) {
            var image = images[p];
            doc.addImage(image.dataUrl, "PNG", image.x, image.y, image.w, image.h);
        }
        if (i < iLen - 1) {
            doc.addPage();
        }
    }
    return doc.output("arraybuffer");
}
