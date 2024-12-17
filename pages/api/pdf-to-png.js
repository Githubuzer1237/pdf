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
        const selectedIndexesArray = result.fields.selectedIndexesArray;
        //Extract the new file name under which it was saved on the server (in the temporary directory) and use it as an identifier (id).
        const id = path.parse(result.files.file.newFilename).name;
        //Extract saved file path
        const filepath = result.files.file.filepath;
        //Create a json file to store file data and to keep track of file status and return a file object containing file data
        const file = await filesRepo.saveDataToJsonForImages(id, filepath);

        if (file != null) {
          //extracting original file
          const originalFileData = await fsPromises.readFile(
            file.inputFilePath
          );
          //check if originalFileData is not null
          if (originalFileData) {
            //conversion commad
            let command;

            if (selectedIndexesArray === "") {
              // if extracting all pdf pages
              command = `gs -dSAFER -dBATCH -dNOPAUSE -q \
                        -sDEVICE=png16m -dQFactor=1 -r300 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 \
                        -sOutputFile="${file.extractedImagesPath}/Page-%d.png" -f ${file.inputFilePath}`;
            } else {
              // if extracting only selected pages
              //-sPageList=1,3,5 indicates that pages 1, 3 and 5 should be processed.
              command = `gs -dSAFER -dBATCH -dNOPAUSE -q \
                        -sDEVICE=png16m -dQFactor=1 -r300 -dTextAlphaBits=4 -dGraphicsAlphaBits=4 \
                        -sPageList=${selectedIndexesArray} \
                        -sOutputFile="${file.extractedImagesPath}/Page-%d.png" -f ${file.inputFilePath}`;
            }

            //starting conversion
            filesRepo.runConvertPDFToImageCommand(
              command,
              file.dataJSONPath,
              file.extractedImagesPath,
              file.outputFilePath
            );
            //return file object in response
            res.status(200).json({
              file: file,
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

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default handler;
