const { PDFDocument, degrees } = require("pdf-lib");
import { rotatePageRight } from "./utils.js";

//This function inputs the pdf file and the number of times each page of this
// pdf file should be rotated to the right direction
export const rotatePDFPages = async (pdfDoc, rotationsCount) => {
  //stores pdf pages in pages
  const pages = pdfDoc.getPages();
  pages.forEach((page) => {
    //initialize the newRotation variable with the initial page rotation
    let rotation = page.getRotation().angle;
    //rotate pdf page (rotationsCount) number of times
    for (let index = 0; index < rotationsCount; index++) {
      rotation = rotatePageRight(rotation);
    }
    //change page rotation with new rotation
    page.setRotation(degrees(rotation));
  });

  return pdfDoc;
};

export const PDFDocumentFromFile = async (file) => {
  try {
    const content = await PDFDocument.load(await file.arrayBuffer(), {
      ignoreEncryption: true,
    });
    if (content.isEncrypted === false) {
      return { content, error: null };
    } else {
      return { content: null, error: "password" };
    }
  } catch (error) {
    return { content: null, error: "damaged" };
  }
};

export const rotatePDFDocument = async (file, rotationsCounter) => {
  try {
    const pdfDoc = await PDFDocument.load(await file.arrayBuffer(), {
      ignoreEncryption: true,
    });
    //rotating pdf file
    const rotatedPDF = await rotatePDFPages(pdfDoc, rotationsCounter);
    rotatedPDF.setProducer("PDFCompressor");
    const pdfBytes = await rotatedPDF.save();
    let blob = new Blob([new Uint8Array(pdfBytes).buffer], {
      type: "application/pdf",
    });
    return blob;
  } catch (error) {
    console.log(
      "An unknown error occurred while rotating the file. Please try again later.",
      error
    );
    return file;
  }
};

export const mergePDF = async (filesDocArray) => {
  if (filesDocArray.length < 2) {
    return filesDocArray[0] || null;
  }
  const mergedPdf = await PDFDocument.create();
  for (let i = 0; i < filesDocArray.length; i++) {
    const fileDoc = filesDocArray[i];
    const pages = await mergedPdf.copyPages(fileDoc, fileDoc.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  return mergedPdf;
};

export const extractPageFromPDFAsPDF = async (srcDoc, page) => {
  const pdfDoc = await PDFDocument.create();
  const copiedPages = await pdfDoc.copyPages(srcDoc, [page]);
  const [firstPage] = copiedPages;
  pdfDoc.insertPage(0, firstPage);
  return pdfDoc;
};

export const rotatePDF = async (pdfDoc, degree) => {
  const pages = pdfDoc.getPages();
  pages.forEach((page) => {
    page.setRotation(degrees(degree));
  });
  return pdfDoc;
};
