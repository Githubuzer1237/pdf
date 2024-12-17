const fsPromises = require("fs/promises");
const formidable = require("formidable");
// source :
// https://bytemeta.vip/repo/node-formidable/formidable/issues/728

const handler = async (req, res) => {
  const contentType = req.headers["content-type"];
  if (contentType && contentType.indexOf("multipart/form-data") !== -1) {
    const form = formidable();
    const result = await new Promise(function (resolve, reject) {
      form.parse(req, function (error, fields, files) {
        if (error) {
          reject(error);
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
      const file = JSON.parse(result.fields.file);
      try {
        const data = await fsPromises.readFile(file.dataJSONPath);
        //check if json file not null
        if (data) {
          // parse json file data
          let fileData = JSON.parse(data);
          //check if file has done compressing
          if (fileData.status === "processed") {
            //if file is done processing read the file and return it in response
            try {
              const processedData = await fsPromises.readFile(
                fileData.outputFilePath
              );
              if (processedData) {
                let dataString = processedData.toString("base64");
                res.status(200).json({
                  status: "processed",
                  processedFile: dataString,
                });
              } else {
                res.status(400).json({
                  error:
                    "An error occured while readding processed file content",
                });
              }
            } catch (error) {
              console.log("download error", error);
              res.status(400).json({
                error:
                  "An error occured while processing the file, missing output File",
              });
            }
          } else {
            res.status(200).json({
              status: fileData.status,
              processedFile: null,
            });
          }
        } else {
          res.status(400).json({
            error:
              "An error occured while processing the file, missing dataJSONPath file",
          });
        }
      } catch (error) {
        console.log("error", error);
        res.status(400).json({
          error: "An error occured while downloading the file: " + error,
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
