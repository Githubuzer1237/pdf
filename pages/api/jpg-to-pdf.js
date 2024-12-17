import { filesRepo } from "../../helpers/files-repo";
const formidable = require("formidable");
const fsPromises = require("fs/promises");

const handler = async (req, res) => {
  const contentType = req.headers["content-type"];
  if (contentType && contentType.indexOf("multipart/form-data") !== -1) {
    const form = formidable();
    const result = await new Promise(function (resolve, reject) {
      form.parse(req, function (err, fields, files) {
        if (err) {
          reject(err);
        }
        resolve({ files, fields });
      });
    });
    if (!result.fields) {
      // Skipping it all
      res
        .status(400)
        .json({ error: "An error occured while parsing the form data" });
    } else {
      //Extract saved file path
      const filepath = result.files.file.filepath;
      //path to store the pdf file
      const outputFilePath = filepath + ".pdf";
      // Get the margin value type string
      const margin = result.fields.margin;
      // Get the page orientation value type string
      const pageOrientation = result.fields.pageOrientation;
      // Get the page size value type string
      const pageSize = result.fields.pageSize;
      try {
        await filesRepo.createPDFFromImages(
          filepath,
          outputFilePath,
          margin,
          pageOrientation,
          pageSize
        );

        //check if output file exists
        const processedData = await fsPromises.readFile(outputFilePath);
        if (processedData) {
          const dataString = processedData.toString("base64");
          res.status(200).json({
            processedFile: dataString,
          });
        } else {
          res.status(200).json({
            processedFile: null,
          });
        }
      } catch (error) {
        console.log("error", error);

        res.status(400).json({
          error: "An error occured while processing the file",
        });
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
