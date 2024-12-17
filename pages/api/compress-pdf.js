import { filesRepo } from "../../helpers/files-repo.js";
const formidable = require("formidable");
const path = require("path");
const fsPromises = require("fs/promises");

const handler = async (req, res) => {
  const contentType = req.headers["content-type"];
  if (contentType && contentType.indexOf("multipart/form-data") !== -1) {
    const form = formidable({ maxFileSize: 5120 * 1024 * 1024 }); //Max file size is set to 5GB
    const result = await new Promise(function (resolve, reject) {
      form.parse(req, function (err, fields, files) {
        if (err) {
          reject(err);
        }
        resolve({ files, fields });
      });
    });
    //check if ann error occured while parcing the form
    if (!result.files || !result.fields) {
      // Skipping it all
      res
        .status(400)
        .json({ error: "An error occured while parsing the form data" });
    } else {
      //check if file is not null
      if (result.files.file && result.files.file.newFilename) {
        //Get compression Level
        const compressionLevel = result.fields.compressionLevel;
        //Get output File Extention
        const outputFileExtension = ".pdf";
        //Extract the new file name under which it was saved on the server (in the temporary directory) and use it as an identifier (id).
        const id = path.parse(result.files.file.newFilename).name;
        //Extract saved file path
        const filepath = result.files.file.filepath;
        //Create a json file to store file data and to keep track of file status and return a file object containing file data
        const file = await filesRepo.saveDataToJson(
          id,
          filepath,
          outputFileExtension
        );

        //check if json file was created successfuly by checking if file object is not empty
        //if successful return file object containing file data in response
        if (file != null) {
          //check if originalPDF file exists
          const exist = await filesRepo.isExists(file.inputFilePath);

          if (exist) {
            //extracting original file size
            const fileSize = (await fsPromises.stat(file.inputFilePath)).size;
            //calling selectSettings function to select pdfSettings and resolution
            const { pdfSettings, resolution } = await selectSettings(
              compressionLevel,
              fileSize
            );
            //compression commad
            const command = `gs -sDEVICE=pdfwrite -dNOPAUSE -dBATCH -q  \
                    -dPDFSETTINGS=${pdfSettings} -dAutoRotatePages=/None \
                    -dSubsetFonts=true -dEmbedAllFonts=true -dCannotEmbedFontPolicy=/Warning \
                    -dPassThroughJPEGImages=false -dPassThroughJPXImages=false  \
                    -dCompressEntireFile=true -dDetectDuplicateImages=true \
                    -dDownsampleColorImages=true  \
                    -dDownsampleGrayImages=true  \
                    -dDownsampleMonoImages=true \
                    -dColorImageDownsampleThreshold=1 \
                    -dGrayImageDownsampleThreshold=1 \
                    -dMonoImageDownsampleThreshold=1 \
                    -dGrayImageDownsampleType=/Bicubic  \
                    -dColorImageDownsampleType=/Bicubic  \
                    -dMonoImageDownsampleType=/Bicubic  \
                    -dColorImageResolution=${resolution}  \
                    -dGrayImageResolution=${resolution}  \
                    -dMonoImageResolution=${resolution} \
                    -dOptimize=true  \
                    -dUseFlateCompression=true  \
                    -dParseDSCComments=false  \
                    -dParseDSCCommentsForDocInfo=false \
                    -dDoThumbnails=false  \
                    -dCreateJobTicket=false  \
                    -dPreserveEPSInfo=false  \
                    -dPreserveOPIComments=false  \
                    -dPreserveOverprintSettings=false  \
                    -dUCRandBGInfo=/Remove \
                    -sProcessColorModel=DeviceRGB  \
                    -dColorConversionStrategy=/RGB  \
                    -dOmitInfoDate=true -dOmitID=true -dOmitXMP=true  \
                    -dPreserveAnnots=true -dPreserveMarkedContent=true \
                    -dPreserveCopyPage=false -dPreserveHalftoneInfo=false \
                    -dPreserveTrMode=false \
                    -dPreserveEPSInfo=false \
                    -dPreserveHalftoneInfo=false  \
                    -dPreserveCopyPage=false \
                    -dPreserveSeparation=false \
                    -dPreserveDeviceN=false \
                    -sOutputFile=${file.outputFilePath} -c "/PreserveAnnotTypes [/Stamp /Squiggly /Underline /Link /Text /Highlight /Ink /FreeText /StrikeOut /stamp_dict] def" \
                    -f ${file.inputFilePath}`;
            //starting processing
            filesRepo.runCommand(command, file.dataJSONPath);
            //return file object in response
            res.status(200).json({
              file: file,
            });
          } else {
            res.status(400).json({
              error:
                "An error occured while processing the file, missing originalPDF file",
            });
          }
        } else {
          //if json file was not created return an error in response
          res.status(400).json({
            error: "Error occured while creating record for file with id " + id,
          });
        }
      } else {
        res.status(400).json({ error: "file value is not defined" });
      }
    }
  } else {
    res.status(400).json({ error: "Wrong content-type" });
  }
};

//Function to set pdfSettings and resolution values based on compressionLevel and file size
const selectSettings = async (compressionLevel, fileSize) => {
  //Default values
  let pdfSettings = "/ebook";
  let resolution = 150;
  //check if fileSize and compressionLevel are not null
  if (fileSize && compressionLevel) {
    //selecting pdfSettings based on compressionLevel and file size values
    if (compressionLevel === "1") {
      // High quality, less compression
      pdfSettings = "/prepress";
      resolution = 200;
    } else if (compressionLevel === "2") {
      // Good quality, good compression
      pdfSettings = "/ebook";
      if (
        fileSize > 16777216 ||
        (fileSize >= 4928307.2 && fileSize < 15099494.4) ||
        (fileSize >= 10240 && fileSize < 102400)
      ) {
        ////(16 MB – 128 MB)
        ////(4.7MB – 14 MB)
        ////(10 KB – 100 KB)
        resolution = 150;
      } else if (fileSize >= 15099494.4 && fileSize < 16777216) {
        //(14,4 MB – 16 MB)
        resolution = 130;
      } else if (fileSize >= 1048576 && fileSize < 4928307.2) {
        ////(1mb - 4,7mb)
        resolution = 130;
      } else if (fileSize >= 102400 && fileSize < 1048576) {
        ////(100 KB – 1 MB)
        resolution = 110;
      } else if (fileSize < 10240) {
        ////(2 KB - 10kb)
        resolution = 150;
      } else {
        resolution = 150;
      }
    } else if (compressionLevel === "3") {
      // Less quality, high compression
      pdfSettings = "/screen";
      resolution = 72;
    }
  }
  return { pdfSettings, resolution };
};

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default handler;
