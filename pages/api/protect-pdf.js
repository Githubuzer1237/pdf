import { filesRepo } from "../../helpers/files-repo.js";
const formidable = require("formidable");
const path = require("path");

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
        //Get output File Extention
        const outputFileExtension = ".pdf";

        //Get password
        const passwordToLock = result.fields.password.toString();

        //Extract the new file name under which it was saved on the server (in the temporary directory) and use it as an identifier (id).
        const id = path.parse(result.files.file.newFilename).name;

        //Extract saved file path
        const filepath = result.files.file.filepath;

        //Create a json file to store file data and to keep track of file status and return a file object containing file data
        //if successful return file object containing file data in response
        const file = await filesRepo.saveDataToJson(
          id,
          filepath,
          outputFileExtension
        );

        //Checking if file object is not empty
        if (file != null) {
          //check if original PDF file exists
          const exist = await filesRepo.isExists(file.inputFilePath);

          if (exist) {
            //qpdf --encrypt <userpassword> <ownerpassword> 256 -- <input-file> <output-file>
            const command = `qpdf --encrypt "${passwordToLock}" "${passwordToLock}" 256 -- ${file.inputFilePath} ${file.outputFilePath}`;

            //Run command to password protect the pdf file
            await filesRepo.runCommand(command, file.dataJSONPath);

            //return file object in response
            res.status(200).json({
              file: file,
            });
          } else {
            res.status(400).json({
              error:
                "An error occured while processing the file, missing original PDF file",
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
