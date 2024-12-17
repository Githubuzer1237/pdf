const fs = require("fs");
const fsPromises = require("fs/promises");
const os = require("os");
const tempDir = os.tmpdir();
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execProm = util.promisify(exec);
const JSZip = require("jszip");
const PDFDocument = require("pdfkit");
const Jimp = require("jimp");

// Function to check if file exists
async function isExists(path) {
  try {
    await fsPromises.access(path);
    return true;
  } catch {
    return false;
  }
}

async function createDirectory(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }
  } catch (error) {
    console.log("error", error);
    throw new Error(error);
  }
}

//Function to write file
async function writeFile(filePath, data) {
  try {
    const dirname = path.dirname(filePath);
    const exist = await isExists(dirname);
    if (!exist) {
      await fsPromises.mkdir(dirname, { recursive: true });
    }

    await fsPromises.writeFile(filePath, data);
  } catch (err) {
    throw new Error(err);
  }
}

const scheduleFileDeletion = (pdfToolsFilesPath, filepath) => {
  console.log("Called scheduleFileDeletion");
  //setting interval to delete files after one hour from there creation
  let delInterval = setInterval(async () => {
    {
      try {
        let stat = await fs.promises.stat(pdfToolsFilesPath);
        let now = new Date().getTime();
        let endTime =
          new Date(stat.mtime).getTime() +
          parseInt(process.env.NEXT_PUBLIC_DELETION_TIMEOUT);
        if (now > endTime) {
          console.log("----------- DEL:", pdfToolsFilesPath);
          await fs.promises.rm(pdfToolsFilesPath, {
            recursive: true,
            force: true,
          });
          console.log("done deleting folder");
          await fs.promises.rm(filepath, {
            recursive: true,
            force: true,
          });
          console.log(filepath, "done deleting original file");
          clearInterval(delInterval);
        }
      } catch (err) {
        // File deletion failed
        if (err.code === "EBUSY") {
          //do nothing till next loop
          console.log(pdfToolsFilesPath, "----------- file EBUSY");
        } else if (err.code === "ENOENT") {
          console.log(pdfToolsFilesPath, "----------- already deleted");
          await fs.promises.rm(filepath, {
            recursive: true,
            force: true,
          });
          console.log(filepath, "done deleting original file");
          clearInterval(delInterval);
        }
      }
    }
  }, parseInt(process.env.NEXT_PUBLIC_DELETION_INTERVAL_DURATION));
};

// Function to create json file containing file data
const saveDataToJson = async (id, filepath, outputFileExtension) => {
  const outputFilePath =
    tempDir + "/pdftools_data/" + id + "/" + id + outputFileExtension;
  const pdfToolsFilesPath = tempDir + "/pdftools_data/" + id + "/";
  const dataJSONPath = pdfToolsFilesPath + id + ".json";
  let file = {};
  file.id = id;
  file.outputFilePath = outputFilePath;
  file.inputFilePath = filepath;
  file.dataJSONPath = dataJSONPath;
  file.pdfToolsFilesPath = pdfToolsFilesPath;
  file.status = "uploaded";
  // add and save file
  try {
    await writeFile(dataJSONPath, JSON.stringify(file));

    //Schedule files deletion after one hour from there creation
    scheduleFileDeletion(pdfToolsFilesPath, filepath);

    return file;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// Function to create json file containing file data
const saveDataToJsonForImages = async (id, filepath) => {
  const extractedImagesPath = tempDir + "/pdftools_data/" + id + "/images";
  const outputFilePath = tempDir + "/pdftools_data/" + id + "/images.zip";
  const pdfToolsFilesPath = tempDir + "/pdftools_data/" + id + "/";
  const dataJSONPath = pdfToolsFilesPath + id + ".json";
  let file = {};
  file.extractedImagesPath = extractedImagesPath;
  file.outputFilePath = outputFilePath;
  file.inputFilePath = filepath;
  file.dataJSONPath = dataJSONPath;
  file.pdfToolsFilesPath = pdfToolsFilesPath;
  file.status = "uploaded";

  // add and save file
  try {
    await writeFile(dataJSONPath, JSON.stringify(file));
    await createDirectory(extractedImagesPath);

    //Schedule files deletion after one hour from there creation
    scheduleFileDeletion(pdfToolsFilesPath, filepath);
    return file;
  } catch (error) {
    console.log("upload error", error);
    return null;
  }
};

// Function to update json file containing file data
const update = async (dataJSONPath, params) => {
  try {
    const data = await fsPromises.readFile(dataJSONPath);
    if (data) {
      const file = JSON.parse(data);
      file.status = params.status;
      await writeFile(dataJSONPath, JSON.stringify(file));
      return file;
    } else {
      return null;
    }
  } catch (error) {
    console.log("update json file error: ", error);
    return null;
  }
};

const runCommand = async (command, jSONFilePath) => {
  try {
    //running the command
    await execProm(command);

    //check if json file exists
    const exist = await isExists(jSONFilePath);
    if (exist) {
      //Updating the file processing status from processing to done
      update(jSONFilePath, {
        status: "processed",
      });
    }
  } catch (ex) {
    //handling processing failure
    console.log("runCommand err", ex);
    //Updating the file processing status from processing to failed
    update(jSONFilePath, {
      status: "failed",
    });
  }
};

const zipFile = async (dir, dataJSONPath, outputFilePath) => {
  const zip = new JSZip();

  try {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
      const pdfData = await fs.promises.readFile(dir + "/" + file);
      zip.file(file, pdfData);
    }

    await new Promise((resolve, reject) => {
      zip
        .generateNodeStream({
          type: "nodebuffer",
          streamFiles: true,
          compression: "DEFLATE",
          compressionOptions: {
            level: 9,
          },
        })
        .pipe(fs.createWriteStream(outputFilePath))
        .on("finish", () => {
          // images.zip written in outputFilePath
          // Updating the file conversion status from processing to done
          update(dataJSONPath, { status: "processed" })
            .then(resolve)
            .catch(reject);
        })
        .on("error", (e) => {
          console.log("pipe error", e);
          // Updating the file conversion status from processing to failed
          update(dataJSONPath, { status: "failed" })
            .then(resolve)
            .catch(reject);
        });
    });
  } catch (error) {
    console.log("zipFile error", error);
    // Updating the file conversion status from processing to failed
    await update(dataJSONPath, { status: "failed" });
  }
};

const runConvertPDFToImageCommand = async (
  command,
  dataJSONPath,
  extractedImagesPath,
  outputFilePath
) => {
  try {
    //running the command
    await execProm(command);

    //check if json file exists
    const exist = await isExists(dataJSONPath);
    if (exist) {
      //creating zip file contined extracted images
      await zipFile(extractedImagesPath, dataJSONPath, outputFilePath);
    }
  } catch (ex) {
    //handling conversion failure
    console.log("============================================> err", ex);
    //Updating the file conversion status from processing to failed
    update(dataJSONPath, {
      status: "failed",
    });
  }
};

async function createPDFFromImages(
  inputFilePath,
  outputFilePath,
  margin,
  pageOrientation,
  pageSize
) {
  return new Promise((resolve, reject) => {
    let imageWidth = 0;
    let imageHeight = 0;

    let pageCenterX = 0;
    let pageCenterY = 0;

    // Define margins
    let marginTop =
      margin === "big-margin" ? 40 : margin === "small-margin" ? 20 : 0;
    let marginBottom =
      margin === "big-margin" ? 40 : margin === "small-margin" ? 20 : 0;
    let marginLeft =
      margin === "big-margin" ? 40 : margin === "small-margin" ? 20 : 0;
    let marginRight =
      margin === "big-margin" ? 40 : margin === "small-margin" ? 20 : 0;

    // Create a new PDF document
    const doc = new PDFDocument({
      autoFirstPage: false,
      compress: false,
    });

    // Open the image file
    let image = doc.openImage(inputFilePath);

    //Define automiatic orientation
    let orientation;
    if (pageOrientation === "auto") {
      if (image.width > image.height) {
        orientation = "landscape";
      } else if (image.width < image.height) {
        orientation = "portrait";
      } else {
        orientation = "auto";
      }
    } else {
      orientation = pageOrientation;
    }

    // Define size value and image Fit Value based on pageSize value (Fit, A4, Letter)
    if (pageSize === "A4" || pageSize === "Letter") {
      // Add a new page for the image
      doc.addPage({
        margin: [marginTop, marginBottom, marginLeft, marginRight],
        // Page size shoud be A4 or Letter
        size: pageSize,
        layout: orientation,
      });

      // Calculate image width and height to fit it to the document width
      imageWidth = doc.page.width - marginLeft - marginRight;
      imageHeight = doc.page.height - marginTop - marginBottom;

      // Get the page center
      pageCenterX = (doc.page.width - imageWidth) / 2;
      pageCenterY = (doc.page.height - imageHeight) / 2;
    } else {
      // Page size shoud fit to content

      if (marginTop + marginBottom + marginLeft + marginRight != 0) {
        // Add a new page for the image
        doc.addPage({
          margin: [marginTop, marginBottom, marginLeft, marginRight],
          //if margins != 0, calculate new page width and heigh with margin
          size: [
            image.width + marginLeft + marginRight,
            image.height + marginTop + marginBottom,
          ],
        });
      } else {
        // Add a new page for the image
        doc.addPage({
          margin: [marginTop, marginBottom, marginLeft, marginRight],
          //if no margin, keep image original width and height
          size: [image.width, image.height],
        });
      }

      // Calculate image width and height to fit it to the document width
      imageWidth = image.width;
      imageHeight = image.height;

      // Get the page center
      pageCenterX = (doc.page.width - imageWidth) / 2;
      pageCenterY = (doc.page.height - imageHeight) / 2;
    }

    // Embed the image in the PDF document centered on the page
    doc.image(image, pageCenterX, pageCenterY, {
      fit: [imageWidth, imageHeight],
      align: "center",
      valign: "center",
    });

    // Pipe the PDF document to a writable stream
    const stream = fs.createWriteStream(outputFilePath);
    doc.pipe(stream);

    // Finalize the PDF document and resolve the Promise
    doc.end();

    //Schedule files deletion after one hour from there creation
    scheduleFileDeletion(outputFilePath, inputFilePath);

    stream.on("finish", () => {
      resolve("PDF document created successfully");
    });

    stream.on("error", (error) => {
      reject(error);
    });
  });
}

async function convertImagesToPNGAndCreatePDF(
  inputFilePath,
  outputFilePath,
  margin,
  pageOrientation,
  pageSize
) {
  return new Promise((resolve, reject) => {
    let imageWidth = 0;
    let imageHeight = 0;

    let pageCenterX = 0;
    let pageCenterY = 0;

    // Define margins
    let marginTop =
      margin === "big-margin" ? 40 : margin === "small-margin" ? 20 : 0;
    let marginBottom =
      margin === "big-margin" ? 40 : margin === "small-margin" ? 20 : 0;
    let marginLeft =
      margin === "big-margin" ? 40 : margin === "small-margin" ? 20 : 0;
    let marginRight =
      margin === "big-margin" ? 40 : margin === "small-margin" ? 20 : 0;

    // Load the TIFF image
    Jimp.read(inputFilePath, function (err, image) {
      if (err) throw err;

      // Convert the image to PNG format
      image.write(inputFilePath + ".png", function (err) {
        if (err) throw err;

        // Create a new PDF document
        const doc = new PDFDocument({
          autoFirstPage: false,
          compress: false,
        });

        // Open the image file
        let image = doc.openImage(inputFilePath + ".png");

        //Define automiatic orientation
        let orientation;
        if (pageOrientation === "auto") {
          if (image.width > image.height) {
            orientation = "landscape";
          } else if (image.width < image.height) {
            orientation = "portrait";
          } else {
            orientation = "auto";
          }
        } else {
          orientation = pageOrientation;
        }

        // Define size value and image Fit Value based on pageSize value (Fit, A4, Letter)
        if (pageSize === "A4" || pageSize === "Letter") {
          // Add a new page for the image
          doc.addPage({
            margin: [marginTop, marginBottom, marginLeft, marginRight],
            // Page size shoud be A4 or Letter
            size: pageSize,
            layout: orientation,
          });

          // Calculate image width and height to fit it to the document width
          imageWidth = doc.page.width - marginLeft - marginRight;
          imageHeight = doc.page.height - marginTop - marginBottom;

          // Get the page center
          pageCenterX = (doc.page.width - imageWidth) / 2;
          pageCenterY = (doc.page.height - imageHeight) / 2;
        } else {
          // Page size shoud fit to content

          if (marginTop + marginBottom + marginLeft + marginRight != 0) {
            // Add a new page for the image
            doc.addPage({
              margin: [marginTop, marginBottom, marginLeft, marginRight],
              //if margins != 0, calculate new page width and heigh with margin
              size: [
                image.width + marginLeft + marginRight,
                image.height + marginTop + marginBottom,
              ],
            });
          } else {
            // Add a new page for the image
            doc.addPage({
              margin: [marginTop, marginBottom, marginLeft, marginRight],
              //if no margin, keep image original width and height
              size: [image.width, image.height],
            });
          }

          // Calculate image width and height to fit it to the document width
          imageWidth = image.width;
          imageHeight = image.height;

          // Get the page center
          pageCenterX = (doc.page.width - imageWidth) / 2;
          pageCenterY = (doc.page.height - imageHeight) / 2;
        }

        // Embed the image in the PDF document centered on the page
        doc.image(image, pageCenterX, pageCenterY, {
          fit: [imageWidth, imageHeight],
          align: "center",
          valign: "center",
        });

        // Pipe the PDF document to a writable stream
        const stream = fs.createWriteStream(outputFilePath);
        doc.pipe(stream);

        // Finalize the PDF document and resolve the Promise
        doc.end();

        //Schedule files deletion after one hour from there creation
        //setting interval to delete files after one hour from there creation
        let delInterval = setInterval(async () => {
          {
            try {
              let stat = await fs.promises.stat(outputFilePath);
              let now = new Date().getTime();
              let endTime =
                new Date(stat.mtime).getTime() +
                parseInt(process.env.NEXT_PUBLIC_DELETION_TIMEOUT);
              if (now > endTime) {
                console.log("----------- DEL:", outputFilePath);
                await fs.promises.rm(outputFilePath, {
                  recursive: true,
                  force: true,
                });
                console.log("done deleting output file");
                await fs.promises.rm(inputFilePath, {
                  recursive: true,
                  force: true,
                });
                console.log("done deleting input file");
                await fs.promises.rm(inputFilePath + ".png", {
                  recursive: true,
                  force: true,
                });
                console.log("done deleting png file");
                console.log(inputFilePath, "done deleting original file");
                clearInterval(delInterval);
              }
            } catch (err) {
              // File deletion failed
              if (err.code === "EBUSY") {
                //do nothing till next loop
                console.log(outputFilePath, "----------- file EBUSY");
              } else if (err.code === "ENOENT") {
                console.log(outputFilePath, "----------- already deleted");
                await fs.promises.rm(inputFilePath, {
                  recursive: true,
                  force: true,
                });
                console.log(inputFilePath, "done deleting original file");
                await fs.promises.rm(inputFilePath + ".png", {
                  recursive: true,
                  force: true,
                });
                console.log("catched...done deleting png file");
                clearInterval(delInterval);
              }
            }
          }
        }, parseInt(process.env.NEXT_PUBLIC_DELETION_INTERVAL_DURATION));
        stream.on("finish", () => {
          resolve("PDF document created successfully");
        });

        stream.on("error", (error) => {
          reject(error);
        });
      });
    });
  });
}

export const filesRepo = {
  saveDataToJson,
  saveDataToJsonForImages,
  update,
  isExists,
  runCommand,
  zipFile,
  runConvertPDFToImageCommand,
  createPDFFromImages,
  convertImagesToPNGAndCreatePDF,
};
