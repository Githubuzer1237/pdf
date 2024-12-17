import { toast } from "react-toastify";
import JSZip from "jszip";
import axios from "axios";
import {
  PDFDocumentFromFile,
  rotatePDF,
  mergePDF,
  extractPageFromPDFAsPDF,
} from "./pdf-utils.js";

//Used for documnets IDs
let uuid = 1;

// Define an array of RTL language codes
export const rtlLanguages = ["ar", "fa", "ur", "ps", "ku"];

export function range(start, end) {
  return Array(end - start + 1)
    .fill()
    .map((_, idx) => start + idx);
}

//Function to check file type
export function checkFileType(fileType, acceptedInputMimeType) {
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
  return acceptedInputMimeType.includes(fileType);
}

//Function to check file size
export function checkFileSize(fileSize, acceptedInputFileMaxSize) {
  return fileSize < acceptedInputFileMaxSize;
}

//Function to check for applying file validation rules
export function ApplyFileValidationRules(
  fileName,
  fileSize,
  fileType,
  t,
  acceptedInputMimeType,
  acceptedInputFileMaxSize
) {
  if (checkFileType(fileType, acceptedInputMimeType) === false) {
    notify("warning", t("common:file_extension_error"));
    return false;
  }

  if (checkFileSize(fileSize, acceptedInputFileMaxSize) === false) {
    notify(
      "warning",
      "The file : " +
        fileName +
        " is too large. Please try to upload a file smaller than " +
        formatBytes(acceptedInputFileMaxSize) +
        " size."
    );
    return false;
  }

  return true;
}

export const createNewFileName = (newFileNameSuffix, originalFileName) => {
  return originalFileName.replace(/\.[^/.]+$/, newFileNameSuffix);
};

//Function to handle files selection from local storage
export const handleFileSelection = (
  event,
  setLoadedFilesCount,
  handleAddDocument,
  t,
  mountedRef,
  tool
) => {
  //To prevent browser from openening the file in a new tab
  event.preventDefault();

  //   case "GrayscalePDF":
  //   case "PDFToPPTX":
  //   case "PDFToTXT":
  //   case "PDFToWORD":
  //   case "ProtectPDF":

  //get files from input
  let files = getFilesFromInput(event);
  //Update loaded files counter
  if (mountedRef.current) {
    setLoadedFilesCount(files.length);
  }

  /**
   * Loop through all the files to :
   * Extract each file's data and wrapp each file's data in an object and store it in documents array.
   * **/
  for (const file of files) {
    if (file) {
      const fileName = file.name;
      const fileSize = file.size;
      const fileType = file.type;
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        if (
          ApplyFileValidationRules(
            fileName,
            fileSize,
            fileType,
            t,
            tool.acceptedInputMimeType,
            tool.acceptedInputFileMaxSize
          )
        ) {
          const blob = await getBlob(reader.result);
          let pdfDocument = null;
          //Function to extract PDF documents info, and add documents to state.documents array
          pdfDocument = await PDFDocumentFromFile(blob);
          //Check if pdf file is protected or damaged
          //if pdf file is not protected or damaged
          if (pdfDocument.content) {
            //extract document preview first page rotation
            const previewRotation = pdfDocument.content
              .getPage(0)
              .getRotation().angle;
            //extract document preview first page width and height for preview orientation display
            const width = pdfDocument.content.getPage(0).getWidth();
            const height = pdfDocument.content.getPage(0).getHeight();
            //Increment uuid and store it as file id
            let id = uuid++;
            const numberOfPages = pdfDocument.content.getPages().length;
            handleAddDocument({
              id,
              file,
              fileName: fileName,
              newFileName: createNewFileName(tool.newFileNameSuffix, fileName),
              width,
              height,
              previewRotation,
              inputBlob: blob,
              outputBlob: blob,
              numberOfPages,
              action: tool.key,
            });
          } else {
            //if pdf file is either protected or damaged
            if (pdfDocument.error === "password") {
              notify(
                "error",
                <>
                  Something went wrong! The file ({fileName}) is
                  Password-protected, Please unlock the file(s) and try again.
                </>
              );
            } else if (pdfDocument.error === "damaged") {
              notify(
                "error",
                <>
                  Something went wrong! The file ({fileName}) is Corrupted,
                  Please make a new copy of the file(s) and try again.
                </>
              );
            } else {
              notify(
                "error",
                "An unknown error occurred. Please try again later."
              );
            }
          }
        }
        //Update loaded files counter
        if (mountedRef.current) {
          setLoadedFilesCount((prev) => prev - 1);
        }
      };
    } else {
      notify("error", "File is not defined");
    }
  }
};

// get files from input in case of browsing files or drag & drop
export const getFilesFromInput = (event) => {
  if (typeof event.dataTransfer === "undefined") {
    if (!event.target.files) return;
    //Browsed and selected files
    return event.target.files;
  } else {
    if (!event.dataTransfer.files) return;
    //Dragged and droped files
    return event.dataTransfer.files;
  }
};

//this function will calculate a new rotation to the right based on the initial rotation
export const rotatePageLeft = (prevRotation) => {
  return prevRotation - 90 < 0 ? 270 : prevRotation - 90;
};

//this function will calculate a new rotation to the left based on the initial rotation
export const rotatePageRight = (prevRotation) => {
  return prevRotation + 90 > 270 ? 0 : prevRotation + 90;
};

export const handlePreventDefault = (event) => {
  event.preventDefault();
};

//Fucntion to show alert notifications, using react-toastify library
export const notify = (expr, message) => {
  switch (expr) {
    case "success":
      return toast.success(message);
    case "warning":
      return toast.warning(message);
    case "error":
      return toast.error(message);
    default:
      return toast(message);
  }
};

//Function to handle Seconds formating to string
export const formatSeconds = (seconds) => {
  if (seconds === 0) return "2 Seconds";
  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) {
    const rest_seconds = seconds % 60;
    return (
      minutes +
      (minutes.length === 1 ? " Minute " : " Minutes ") +
      rest_seconds +
      (rest_seconds.length === 1 ? " Second" : " Seconds")
    );
  } else {
    return seconds + (seconds.length === 1 ? " Second" : " Seconds");
  }
};

//Function to handle Bytes formating to string
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

//Fucntion to extract blob from base64 data
export const getBlob = async (b64Data) => {
  const result = await fetch(b64Data);
  const blob = await result.blob();
  return blob;
};

// Function to set a timer between two download requests
export const timer = (ms) => {
  return new Promise((res) => setTimeout(res, ms));
};

export const updatePagesOrder = (newPages) => {
  for (let index = 0; index < newPages.length; index++) {
    const page = newPages[index];
    page.order = index + 1;
  }
  return newPages;
};

//Function to handle updating UI after compression level changes
export const handleLevelChange = (evt) => {
  //source
  //https://stackoverflow.com/questions/45338238/how-to-style-the-parent-label-of-a-checked-radio-input

  let trg = evt.target,
    trg_par = trg.parentElement;

  if (
    trg.type === "radio" &&
    trg_par &&
    trg_par.tagName.toLowerCase() === "label"
  ) {
    let prior = document.querySelector(
      'label.checked input[name="' + trg.name + '"]'
    );

    if (prior) {
      prior.parentElement.classList.remove("checked");
    }

    trg_par.classList.add("checked");
  }
};

export const handleMerge = async (pages, fileName) => {
  const filesDocArray = [];

  for (const page of pages) {
    const { content } = await PDFDocumentFromFile(page.outputBlob);

    if (content) {
      const rotationAngleBefore = content.getPage(0).getRotation().angle;
      if (rotationAngleBefore != page.degree) {
        const rotatedPDF = await rotatePDF(content, page.degree);
        filesDocArray.push(rotatedPDF);
      } else {
        filesDocArray.push(content);
      }
    } else {
      notify("error", "An unknown error occurred. Please try again later.");
    }
  }

  if (filesDocArray.length !== 0) {
    const mergedPdf = await mergePDF(filesDocArray);
    const mergedPdfFile = await mergedPdf.save();
    const mergedPdfBlob = new Blob([mergedPdfFile], {
      type: "application/pdf",
    });
    download(mergedPdfBlob, fileName);
  }
};

//Fucntion to send upload requests
export const uploadFiles = async ({
  signal,
  documents,
  handleUpdateCurrentUploadingStatus,
  uri,
  data,
}) => {
  //an array to store upload progress of each file
  let documentsUploadingProgress = [];
  //an array to store success upload responses and document data
  const uploadResponsesArray = [];
  //an array to store failure upload responses and document data
  const uploadResponsesUnseccessfulRequests = [];

  //loop through all the documents and send separate upload requests
  for (let index = 0; index < documents.length; index++) {
    const document = documents[index];
    await (async (document) => {
      //use a timer to track upload speed
      //start timer
      let startTime = performance.now();
      const formData = new FormData();
      formData.append("file", document.file);
      if (data) {
        Object.getOwnPropertyNames(data).forEach((val, idx, array) => {
          formData.append(val, data[val]);
        });
      }
      try {
        const response = await axios.post(`/api${uri}`, formData, {
          signal: signal,
          headers: {
            "content-type": `multipart/form-data; boundary=${formData._boundary}`,
          },
          onUploadProgress: (progressEvent) => {
            //check if function to update upload progress state is defined
            if (handleUpdateCurrentUploadingStatus) {
              const loaded = progressEvent.loaded;
              const total = progressEvent.total;
              const currentProgress = Math.round((loaded * 100) / total);

              ////calculating loading speed
              //Get current spent time
              const endTime = performance.now();
              const timeTakenInSeconds = ((endTime - startTime) % 60000) / 1000;
              //Formula : Speed = Loaded / Time
              const speed = Math.round(loaded / timeTakenInSeconds);
              const loadingSpeedString = formatBytes(speed, 0) + "/S";

              ////calculating Left Time to complete upload for each file
              //Formula : TimeLeft = LeftToLoad / Speed
              const bytesLeftToLoad = total - loaded;
              const timeLeft = Math.round(bytesLeftToLoad / speed);
              const timeLeftString = formatSeconds(timeLeft);

              ////Updating current prgress percentage
              //check if the individual file's progress percentage already added in progress tracking array
              let isProgressBeingTracked = documentsUploadingProgress.filter(
                (fileProgress) => fileProgress.id === document.id
              );
              //if the individual file's progress percentage is not added to progress tracking array, add it
              if (isProgressBeingTracked.length === 0) {
                documentsUploadingProgress.push({
                  id: document.id,
                  progress: currentProgress,
                });
              } else {
                //if progress already exist update it
                documentsUploadingProgress = documentsUploadingProgress.map(
                  (fileProgress) => {
                    if (fileProgress.id === document.id) {
                      return { ...fileProgress, progress: currentProgress };
                    } else {
                      return fileProgress;
                    }
                  }
                );
              }
              // sum up all file progress percentages to calculate the overall progress
              const sumWithInitial = documentsUploadingProgress.reduce(
                function (accumulator, currentValue) {
                  return accumulator + currentValue.progress;
                },
                0
              );

              const newTotalUploadingProgress = Math.round(
                sumWithInitial / documents.length
              );

              //updating current uploading status
              handleUpdateCurrentUploadingStatus(
                document,
                index + 1,
                newTotalUploadingProgress,
                loadingSpeedString,
                timeLeftString
              );
            }
          },
        });
        //add successful response and document data to uploadResponsesArray
        uploadResponsesArray.push({
          file: response.data.file,
          document,
        });
      } catch (error) {
        //if error is due to request abortion, do not update state
        if (error.code != "ERR_CANCELED") {
          //add failure response and document data to uploadResponsesUnseccessfulRequests
          uploadResponsesUnseccessfulRequests.push({
            // ...response.data,
            document,
          });
        }
      }
    })(document);
  }
  //returning uploadResponsesArray and uploadResponsesUnseccessfulRequests to use them in next steps
  return { uploadResponsesArray, uploadResponsesUnseccessfulRequests };
};

//Function to download pdf file(s)
export const download = (file, fileName) => {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = URL.createObjectURL(file);
  link.click();
};

//Function to handle saving and downloading files
export const saveNewFiles = (documents) => {
  //check if documents array contains only a single pdf, in this case no need to create a zip file
  if (documents.length === 1) {
    const doc = documents[0];
    //to download pdf file
    if (doc.outputBlob != undefined) {
      download(doc.outputBlob, doc.newFileName);
    } else {
      download(doc.inputBlob, doc.fileName);
    }
  }
  //check if documents array contains more than a single pdf, in this case we create a zip file
  if (documents.length > 1) {
    ZipFiles(documents);
  }
};

export const ZipFiles = (documents) => {
  // Create a new Zip archive object
  let zip = new JSZip();
  // Create an object to store the number of times each file name appears
  const fileCounts = {};

  // Iterate over each file
  documents.forEach((doc) => {
    // Get the file name
    let fileName = doc.newFileName;

    // Check if the file name already exists in the `fileCounts` object
    if (fileName in fileCounts) {
      // If it does, increment the count and add a suffix to the file name
      fileCounts[fileName]++;
      fileName = fileName.replace(/(\.[^.]+)$/, `_${fileCounts[fileName]}$1`);
    } else {
      // If it doesn't, add the file name to the `fileCounts` object
      fileCounts[fileName] = 1;
    }

    // Add the file to the Zip archive with the modified file name
    zip.file(fileName, doc.outputBlob);
  });

  // Generate the Zip archive as a blob
  zip.generateAsync({ type: "blob" }).then(function (content) {
    // Download generated blob
    download(content, "PDFTools.zip");
  });
};

//Function to send download request
export const downloadFiles = async ({
  responseMimeType,
  signal,
  uploadResponsesArray,
  handleUpdateDocument,
  handleUpdateCurrentProcessingStatus,
}) => {
  //an array to store successfuly processed documents data
  const downloadResponsesArray = [];
  //an array to store documents that failed to be processed
  const downloadResponsesUnseccessfulRequests = [];
  /**
   * loop through all documents that successfuly started processing and that are stored in
   * uploadResponsesArray and send repeated download requests for each file to
   * check if it is done processing
   */
  for (let index = 0; index < uploadResponsesArray.length; index++) {
    const startProcessingResponse = uploadResponsesArray[index];

    //check if handleUpdateCurrentProcessingStatus is defined or not, because some tools does not use it
    if (handleUpdateCurrentProcessingStatus != null) {
      //updating processing counter status
      handleUpdateCurrentProcessingStatus(index + 1);
    }

    let done = true;
    /**
     adding a timer to track the time spent from the first sent download request,
     to be able to stop requests sending after a certain amount of time if 
     there's no response or if the file is taking a long time
     **/
    //start timer
    let startTime = performance.now();

    await (async (startProcessingResponse) => {
      do {
        /**
         * Check if file is done processing by sending download requests in a loop every 5s.
         * Add timeout for sending download requestes so that if timout is consumed without
         * a response containing status (processed or failed) quit do while loop and add
         * file to failed files
         */
        let endTime = performance.now();
        //calculating time spent in seconds
        const timeTakenInMiliSeconds = (endTime - startTime) % 60000;
        //check if time spent is bigger than 3600 sec,if true, add document to failed files and break the loop
        if (
          Math.round(timeTakenInMiliSeconds) >
          parseInt(process.env.NEXT_PUBLIC_DOWNLOAD_TIMEOUT)
        ) {
          downloadResponsesUnseccessfulRequests.push({
            document: startProcessingResponse.document,
          });
          //update done to false to break the loop
          done = false;
        } else {
          //if timout is not consumed yet
          //check if file is done processing by sending download request every 5s
          done = await checkIfFileIsDoneProcessing(
            responseMimeType,
            signal,
            startProcessingResponse,
            handleUpdateDocument,
            downloadResponsesArray,
            downloadResponsesUnseccessfulRequests
          );
        }
      } while (done);
    })(startProcessingResponse);
  }

  //returning below arrays to use them in next steps
  return {
    downloadResponsesArray,
    downloadResponsesUnseccessfulRequests,
  };
};

//Function to check if file is done compressing
const checkIfFileIsDoneProcessing = async (
  responseMimeType,
  signal,
  startProcessingResponse,
  handleUpdateDocument,
  downloadResponsesArray,
  downloadResponsesUnseccessfulRequests
) => {
  try {
    const formData = new FormData();
    formData.append("file", JSON.stringify(startProcessingResponse.file));
    const response = await axios.post("/api/check-processing", formData, {
      signal: signal,
      headers: {
        "content-type": `multipart/form-data; boundary=${formData._boundary}`,
      },
    });
    //check if file is done compressing (file status is equal to processed)
    if (
      response.data != null &&
      response.data.status === "processed" &&
      response.data.processedFile != null
    ) {
      //create a blob containing the compressed file
      const b64Data = `data:${responseMimeType};base64,${response.data.processedFile}`;
      const result = await fetch(b64Data);
      const processedFileBlob = await result.blob();
      /**
       * add document to the array containing successfuly compressed files, and update the state
       * with the processed file blob.
       */

      downloadResponsesArray.push({
        document: {
          ...startProcessingResponse.document,
          outputBlob: processedFileBlob,
        },
      });

      //update state,
      handleUpdateDocument(
        processedFileBlob,
        startProcessingResponse.document.id
      );
      //return false to break the do-while loop from sending download requests
      return false;
    } else if (response.data.status === "failed") {
      /* If file is failed compressing (file status is equal to failed)
       * add document to the array containing failed files
       */
      downloadResponsesUnseccessfulRequests.push({
        document: startProcessingResponse.document,
        errorCode: "ERR_FAILED_PROCESSING",
      });
      //return false to break the do-while loop from sending download requests
      return false;
    } else {
      /* If file is still processing (file status is equal to processing)
       * add a delay of 5 sec between two download requests if file is not done yet
       */
      await timer(parseInt(process.env.NEXT_PUBLIC_DOWNLOAD_REQUEST_DELAY));
      //return true to continue executing do-while loop and send another download request
      return true;
    }
  } catch (error) {
    console.log("error.code", error);
    //add failed documents to the array containing failed files
    downloadResponsesUnseccessfulRequests.push({
      document: startProcessingResponse.document,
      errorCode: error.code,
    });
    //return false to break the do-while loop from sending download requests
    return false;
  }
};

//Function to handle files selection from local storage
export const handleUnlockPDFFileSelection = (
  event,
  setLoadedFilesCount,
  handleAddDocument,
  t,
  mountedRef,
  tool
) => {
  //To prevent browser from openening the file in a new tab
  event.preventDefault();
  // case "PDFToZIP":

  //get files from input
  let files = getFilesFromInput(event);
  //Update loaded files counter
  if (mountedRef.current) {
    setLoadedFilesCount(files.length);
  }

  /**
   * Loop through all the files to :
   * - Extract each file's data (preview's rotation, preview's height, preview's width, number of pages, file name, file blob)
   * and wrapp each file's data in an object and store it in documents array.
   * **/
  for (const file of files) {
    if (file) {
      const fileName = file.name;
      const fileSize = file.size;
      const fileType = file.type;
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        if (
          ApplyFileValidationRules(
            fileName,
            fileSize,
            fileType,
            t,
            tool.acceptedInputMimeType,
            tool.acceptedInputFileMaxSize
          )
        ) {
          const blob = await getBlob(reader.result);
          let pdfDocument = null;
          //Function to extract PDF documents info, and add documents to state.documents array
          pdfDocument = await PDFDocumentFromFile(blob);
          //Check if pdf file is protected or damaged
          //if pdf file is not protected or damaged
          if (pdfDocument.content) {
            notify(
              "error",
              <>
                Something went wrong! The file ({fileName}) is not
                Password-protected, Please select a protected file and try
                again.
              </>
            );
          } else {
            // if pdf file is either protected or damaged
            if (pdfDocument.error === "password") {
              //Increment uuid and store it as file id
              let id = uuid++;
              // const numberOfPages = pdfDocument.content.getPages().length;
              handleAddDocument({
                id,
                file,
                fileName: fileName,
                newFileName: createNewFileName(
                  tool.newFileNameSuffix,
                  fileName
                ),
                previewRotation: 0,
                rotationsCounter: 0,
                inputBlob: blob,
                outputBlob: blob,
                action: tool.key,
              });
            } else if (pdfDocument.error === "damaged") {
              notify(
                "error",
                <>
                  Something went wrong! The file ({fileName}) is Corrupted,
                  Please make a new copy of the file(s) and try again.
                </>
              );
            } else {
              notify(
                "error",
                "An unknown error occurred. Please try again later."
              );
            }
          }
        }
        //Update loaded files counter
        if (mountedRef.current) {
          setLoadedFilesCount((prev) => prev - 1);
        }
      };
    } else {
      notify("error", "File is not defined");
    }
  }
};

//Function to handle files selection from local storage
export const handleRepairPDFFileSelection = (
  event,
  setLoadedFilesCount,
  handleAddDocument,
  t,
  mountedRef,
  tool
) => {
  //To prevent browser from openening the file in a new tab
  event.preventDefault();
  //get files from input
  let files = getFilesFromInput(event);
  //Update loaded files counter
  if (mountedRef.current) {
    setLoadedFilesCount(files.length);
  }

  /**
   * Loop through all the files to :
   * Extract each file's data and wrapp each file's data in an object and store it in documents array.
   * **/
  for (const file of files) {
    if (file) {
      const fileName = file.name;
      const fileSize = file.size;
      const fileType = file.type;
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        if (
          ApplyFileValidationRules(
            fileName,
            fileSize,
            fileType,
            t,
            tool.acceptedInputMimeType,
            tool.acceptedInputFileMaxSize
          )
        ) {
          const blob = await getBlob(reader.result);
          let pdfDocument = null;
          //Function to extract PDF documents info, and add documents to state.documents array
          pdfDocument = await PDFDocumentFromFile(blob);
          //Check if pdf file is protected or damaged
          //if pdf file is not protected or damaged
          if (pdfDocument.content) {
            //extract document preview first page rotation
            const previewRotation = pdfDocument.content
              .getPage(0)
              .getRotation().angle;
            const width = pdfDocument.content.getPage(0).getWidth();
            const height = pdfDocument.content.getPage(0).getHeight();
            //Increment uuid and store it as file id
            let id = uuid++;
            const numberOfPages = pdfDocument.content.getPages().length;
            handleAddDocument({
              id,
              file,
              fileName: fileName,
              newFileName: createNewFileName(tool.newFileNameSuffix, fileName),
              previewRotation,
              rotationsCounter: 0,
              width,
              height,
              inputBlob: blob,
              outputBlob: blob,
              numberOfPages,
              action: tool.key,
            });
          } else {
            //if pdf file is either protected or damaged
            if (pdfDocument.error === "password") {
              notify(
                "error",
                <>
                  Something went wrong! The file ({fileName}) is
                  Password-protected, Please unlock the file(s) and try again.
                </>
              );
            } else if (pdfDocument.error === "damaged") {
              let id = uuid++;
              handleAddDocument({
                id,
                file,
                fileName: fileName,
                newFileName: createNewFileName(
                  tool.newFileNameSuffix,
                  fileName
                ),
                previewRotation: 0,
                rotationsCounter: 0,
                inputBlob: blob,
                outputBlob: blob,
                action: tool.key,
              });
            } else {
              notify(
                "error",
                "An unknown error occurred. Please try again later."
              );
            }
          }
        }
        //Update loaded files counter
        if (mountedRef.current) {
          setLoadedFilesCount((prev) => prev - 1);
        }
      };
    } else {
      notify("error", "File is not defined");
    }
  }
};

//Function to handle files selection from local storage
export const handlePDFToZIPFileSelection = (
  event,
  setLoadedFilesCount,
  handleAddDocument,
  t,
  mountedRef,
  tool
) => {
  //To prevent browser from openening the file in a new tab
  event.preventDefault();
  //get files from input
  let files = getFilesFromInput(event);
  //Update loaded files counter
  if (mountedRef.current) {
    setLoadedFilesCount(files.length);
  }

  /**
   * Loop through all the files to :
   * - Extract each file's data and wrapp each file's data in an object and store it in documents array.
   * **/
  for (const file of files) {
    if (file) {
      const fileName = file.name;
      const fileSize = file.size;
      const fileType = file.type;
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        if (
          ApplyFileValidationRules(
            fileName,
            fileSize,
            fileType,
            t,
            tool.acceptedInputMimeType,
            tool.acceptedInputFileMaxSize
          )
        ) {
          const blob = await getBlob(reader.result);
          let pdfDocument = null;
          //Function to extract PDF documents info, and add documents to state.documents array
          pdfDocument = await PDFDocumentFromFile(blob);
          //Check if pdf file is protected or damaged
          //if pdf file is not protected or damaged
          if (pdfDocument.content) {
            //extract document preview first page rotation
            const previewRotation = pdfDocument.content
              .getPage(0)
              .getRotation().angle;
            const width = pdfDocument.content.getPage(0).getWidth();
            const height = pdfDocument.content.getPage(0).getHeight();
            //Increment uuid and store it as file id
            let id = uuid++;
            const numberOfPages = pdfDocument.content.getPages().length;
            handleAddDocument({
              id,
              file,
              fileName: fileName,
              newFileName: createNewFileName(tool.newFileNameSuffix, fileName),
              previewRotation,
              rotationsCounter: 0,
              width,
              height,
              inputBlob: blob,
              outputBlob: blob,
              numberOfPages,
              action: tool.key,
            });
          } else {
            //if pdf file is either protected or damaged
            if (pdfDocument.error === "password") {
              notify(
                "error",
                <>
                  Something went wrong! The file ({fileName}) is
                  Password-protected, Please unlock the file(s) and try again.
                </>
              );
            } else if (pdfDocument.error === "damaged") {
              notify(
                "error",
                <>
                  Something went wrong! The file ({fileName}) is Corrupted,
                  Please make a new copy of the file(s) and try again.
                </>
              );
            } else {
              notify(
                "error",
                "An unknown error occurred. Please try again later."
              );
            }
          }
        }
        //Update loaded files counter
        if (mountedRef.current) {
          setLoadedFilesCount((prev) => prev - 1);
        }
      };
    } else {
      notify("error", "File is not defined");
    }
  }
};

//Function to handle files selection from local storage
export const handlePDFToImageFileSelection = (
  event,
  setLoadedFilesCount,
  handleAddDocument,
  addPage,
  t,
  mountedRef,
  tool
) => {
  // case "PDFToJPG":
  // case "PDFToPNG":
  // case "PDFToTIFF":
  // case "PDFToBMP":

  //To prevent browser from openening the file in a new tab
  event.preventDefault();

  //Used for documnets IDs
  let uuidExtractPages = 1;

  //get files from input
  let files = getFilesFromInput(event);
  //Update loaded files counter
  if (mountedRef.current) {
    setLoadedFilesCount(files.length);
  }

  /**
   * Loop through all the files to :
   * - Extract each file's data and wrapp each file's data in an object and store it in documents array.
   * **/
  for (const file of files) {
    if (file) {
      const fileName = file.name;
      const fileSize = file.size;
      const fileType = file.type;
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        if (
          ApplyFileValidationRules(
            fileName,
            fileSize,
            fileType,
            t,
            tool.acceptedInputMimeType,
            tool.acceptedInputFileMaxSize
          )
        ) {
          const blob = await getBlob(reader.result);

          //Function to extract PDF documents info
          let pdfDocument = await PDFDocumentFromFile(blob);

          if (pdfDocument.content) {
            //add document to documents array
            let id = uuid++;
            handleAddDocument({
              id,
              file,
              fileName,
              newFileName: createNewFileName(tool.newFileNameSuffix, fileName),
              action: tool.key,
              inputBlob: blob,
              outputBlob: undefined,
            });

            //add pages to pages array
            for (const page of range(
              0,
              pdfDocument.content.getPages().length - 1
            )) {
              const extractPageAsPDF = await extractPageFromPDFAsPDF(
                pdfDocument.content,
                page
              );
              const base64DataUri = await extractPageAsPDF.saveAsBase64({
                dataUri: true,
              });
              const result = await fetch(base64DataUri);
              const pageFileblob = await result.blob();
              //extract document preview first page rotation
              const previewRotation = extractPageAsPDF
                .getPage(0)
                .getRotation().angle;
              const width = extractPageAsPDF.getPage(0).getWidth();
              const height = extractPageAsPDF.getPage(0).getHeight();
              let id = uuidExtractPages++;
              addPage({
                id,
                outputBlob: pageFileblob,
                width,
                height,
                previewRotation,
                selected: false,
              });
              if (!mountedRef.current) {
                break;
              }
            }
          } else {
            if (pdfDocument.error === "password") {
              notify(
                "error",
                <>
                  Something went wrong! The file ({fileName}) is
                  Password-protected, Please unlock the file(s) and try again.
                </>
              );
            } else if (pdfDocument.error === "damaged") {
              notify(
                "error",
                <>
                  Something went wrong! The file ({fileName}) is Corrupted,
                  Please make a new copy of the file(s) and try again.
                </>
              );
            } else {
              notify(
                "error",
                "An unknown error occurred. Please try again later."
              );
            }
          }
        }
        //Update loaded files counter
        if (mountedRef.current) {
          setLoadedFilesCount((prev) => prev - 1);
        }
      };
    } else {
      notify("error", "File is not defined");
    }
  }
};

//Function to handle files selection from local storage
export const handlePDFOperationsFileSelection = (
  event,
  setLoadedFilesCount,
  addPage,
  t,
  mountedRef,
  tool
) => {
  //To prevent browser from openening the file in a new tab
  event.preventDefault();
  // case "MergePDFTool":
  // case "OrganizePDF":
  // case "RemovePDFPages":
  // case "RotatePDF":

  //get files from input
  let files = getFilesFromInput(event);
  //Update loaded files counter
  if (mountedRef.current) {
    setLoadedFilesCount(files.length);
  }

  /**
   * Loop through all the files to :
   * - Extract each file's data and wrapp each file's data in an object and store it in documents array.
   * **/
  for (const file of files) {
    if (file) {
      const fileName = file.name;
      const fileSize = file.size;
      const fileType = file.type;
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        if (
          ApplyFileValidationRules(
            fileName,
            fileSize,
            fileType,
            t,
            tool.acceptedInputMimeType,
            tool.acceptedInputFileMaxSize
          )
        ) {
          const blob = await getBlob(reader.result);
          let pdfDocument = null;
          //Function to extract PDF documents info, and add documents to state.documents array
          pdfDocument = await PDFDocumentFromFile(blob);

          if (pdfDocument.content) {
            for (const page of range(
              0,
              pdfDocument.content.getPages().length - 1
            )) {
              const extractPageAsPDF = await extractPageFromPDFAsPDF(
                pdfDocument.content,
                page
              );
              const base64DataUri = await extractPageAsPDF.saveAsBase64({
                dataUri: true,
              });
              const result = await fetch(base64DataUri);
              const blob = await result.blob();
              const degree = extractPageAsPDF.getPage(0).getRotation().angle;
              const width = extractPageAsPDF.getPage(0).getWidth();
              const height = extractPageAsPDF.getPage(0).getHeight();
              let id = uuid++;
              addPage({
                id,
                order: id,
                outputBlob: blob,
                degree,
                width,
                height,
                selected: false,
              });
              if (!mountedRef.current) {
                break;
              }
            }
          } else {
            if (pdfDocument.error === "password") {
              notify(
                "error",
                <>
                  Something went wrong! The file ({fileName}) is
                  Password-protected, Please unlock the file(s) and try again.
                </>
              );
            } else if (pdfDocument.error === "damaged") {
              notify(
                "error",
                <>
                  Something went wrong! The file ({fileName}) is Corrupted,
                  Please make a new copy of the file(s) and try again.
                </>
              );
            } else {
              notify(
                "error",
                "An unknown error occurred. Please try again later."
              );
            }
          }
        }
        //Update loaded files counter
        if (mountedRef.current) {
          setLoadedFilesCount((prev) => prev - 1);
        }
      };
    } else {
      notify("error", "File is not defined");
    }
  }
};

//Function to handle files selection from local storage
export const handleOfficeToPDFFileSelection = (
  event,
  setLoadedFilesCount,
  handleAddDocument,
  t,
  mountedRef,
  tool
) => {
  //To prevent browser from openening the file in a new tab
  event.preventDefault();
  //   case "EXCELToPDF":
  //   case "WORDToPDF":
  //   case "PPTXToPDF":
  //   case "TXTToPDF":

  //get files from input
  let files = getFilesFromInput(event);
  //Update loaded files counter
  if (mountedRef.current) {
    setLoadedFilesCount(files.length);
  }

  /**
   * Loop through all the files to :
   * - Extract each file's data and wrapp each file's data in an object and store it in documents array.
   * **/
  for (const file of files) {
    if (file) {
      const fileName = file.name;
      const fileSize = file.size;
      const fileType = file.type;
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        if (
          ApplyFileValidationRules(
            fileName,
            fileSize,
            fileType,
            t,
            tool.acceptedInputMimeType,
            tool.acceptedInputFileMaxSize
          )
        ) {
          const blob = await getBlob(reader.result);
          let id = uuid++;
          handleAddDocument({
            id,
            file,
            fileName: fileName,
            newFileName: createNewFileName(tool.newFileNameSuffix, fileName),
            fileSize,
            inputBlob: blob,
            outputBlob: blob,
            action: tool.key,
          });
        }
        //Update loaded files counter
        if (mountedRef.current) {
          setLoadedFilesCount((prev) => prev - 1);
        }
      };
    } else {
      notify("error", "File is not defined");
    }
  }
};

//Function to handle files selection from local storage
export const handleExtractPagesFileSelection = (
  event,
  setLoadedFilesCount,
  handleAddDocument,
  addPage,
  t,
  mountedRef,
  tool
) => {
  //To prevent browser from openening the file in a new tab
  event.preventDefault();
  //Used for documnets IDs
  let uuidExtractPages = 1;

  //get files from input
  let files = getFilesFromInput(event);
  //Update loaded files counter
  if (mountedRef.current) {
    setLoadedFilesCount(files.length);
  }

  /**
   * Loop through all the files to :
   * - Extract each file's data and wrapp each file's data in an object and store it in documents array.
   * **/
  for (const file of files) {
    if (file) {
      const fileName = file.name;
      const fileSize = file.size;
      const fileType = file.type;
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        if (
          ApplyFileValidationRules(
            fileName,
            fileSize,
            fileType,
            t,
            tool.acceptedInputMimeType,
            tool.acceptedInputFileMaxSize
          )
        ) {
          const blob = await getBlob(reader.result);
          let pdfDocument = null;

          //Function to extract PDF documents info, and add documents to state.documents array
          pdfDocument = await PDFDocumentFromFile(blob);

          if (pdfDocument.content) {
            let id = uuid++;
            handleAddDocument({
              id,
              file,
              fileName,
              fileSize,
              newFileName: createNewFileName(tool.newFileNameSuffix, fileName),
              action: tool.key,
            });

            for (const page of range(
              0,
              pdfDocument.content.getPages().length - 1
            )) {
              const extractPageAsPDF = await extractPageFromPDFAsPDF(
                pdfDocument.content,
                page
              );
              const base64DataUri = await extractPageAsPDF.saveAsBase64({
                dataUri: true,
              });
              const result = await fetch(base64DataUri);
              const blob = await result.blob();
              //extract document preview first page rotation
              const previewRotation = extractPageAsPDF
                .getPage(0)
                .getRotation().angle;
              const width = extractPageAsPDF.getPage(0).getWidth();
              const height = extractPageAsPDF.getPage(0).getHeight();
              let id = uuidExtractPages++;
              addPage({
                id,
                order: id,
                outputBlob: blob,
                width,
                height,
                previewRotation,
                selected: false,
              });
              if (!mountedRef.current) {
                break;
              }
            }
          } else {
            if (pdfDocument.error === "password") {
              notify(
                "error",
                <>
                  Something went wrong! The file ({fileName}) is
                  Password-protected, Please unlock the file(s) and try again.
                </>
              );
            } else if (pdfDocument.error === "damaged") {
              notify(
                "error",
                <>
                  Something went wrong! The file ({fileName}) is Corrupted,
                  Please make a new copy of the file(s) and try again.
                </>
              );
            } else {
              notify(
                "error",
                "An unknown error occurred. Please try again later."
              );
            }
          }
        }
        //Update loaded files counter
        if (mountedRef.current) {
          setLoadedFilesCount((prev) => prev - 1);
        }
      };
    } else {
      notify("error", "File is not defined");
    }
  }
};

//Function to handle images selection from local storage
export const handleImagesSelection = (
  event,
  setLoadedFilesCount,
  addPage,
  t,
  mountedRef,
  tool
) => {
  //To prevent browser from openening the file in a new tab
  event.preventDefault();
  //get files from input
  let files = getFilesFromInput(event);
  //Update loaded files counter
  if (mountedRef.current) {
    setLoadedFilesCount(files.length);
  }

  /**
   * Loop through all the images to :
   * - Extract each file's data and wrapp each file's data in an object and store it in documents array.
   * **/
  for (const file of files) {
    if (file) {
      const fileName = file.name;
      const fileSize = file.size;
      const fileType = file.type;
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        if (
          ApplyFileValidationRules(
            fileName,
            fileSize,
            fileType,
            t,
            tool.acceptedInputMimeType,
            tool.acceptedInputFileMaxSize
          )
        ) {
          const blob = await getBlob(reader.result);
          const thumbnailImageURL = URL.createObjectURL(blob);
          const image = new Image();
          image.src = reader.result;
          image.onload = function () {
            if (mountedRef.current) {
              let id = uuid++;
              addPage({
                id,
                order: id,
                file,
                degree: 0,
                selected: false,
                thumbnailImageURL,
                fileSize,
                fileName: fileName,
                newFileName: createNewFileName(
                  tool.newFileNameSuffix,
                  fileName
                ),
                width: image.width,
                height: image.height,
                inputBlob: blob,
                outputBlob: blob,
                action: tool.key,
                margin: "no-margin",
                orientation: "auto",
                pageSize: "A4",
              });
            }
          };
          image.onerror = function (error) {
            notify(
              "error",
              "The image could not be loaded! Please check if it is not damaged and try again."
            );
          };
        }
        //Update loaded files counter
        if (mountedRef.current) {
          setLoadedFilesCount((prev) => prev - 1);
        }
      };
    } else {
      notify("error", "File is not defined");
    }
  }
};

//Function to handle images selection from local storage
export const handleTIFFSelection = (
  event,
  setLoadedFilesCount,
  handleAddPage,
  t,
  mountedRef,
  tool
) => {
  //To prevent browser from openening the file in a new tab
  event.preventDefault();
  //get files from input
  let files = getFilesFromInput(event);
  //Update loaded files counter
  if (mountedRef.current) {
    setLoadedFilesCount(files.length);
  }

  /**
   * Loop through all the images to :
   * - Extract each file's data and wrapp each file's data in an object and store it in documents array.
   * **/
  for (const file of files) {
    if (file) {
      const fileName = file.name;
      const fileSize = file.size;
      const fileType = file.type;
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        if (
          ApplyFileValidationRules(
            fileName,
            fileSize,
            fileType,
            t,
            tool.acceptedInputMimeType,
            tool.acceptedInputFileMaxSize
          )
        ) {
          const blob = await getBlob(reader.result);

          if (mountedRef.current) {
            let id = uuid++;
            handleAddPage({
              id,
              order: id,
              file,
              degree: 0,
              selected: false,
              thumbnailImageURL: tool.thumbnailImageURL,
              fileSize,
              fileName: fileName,
              newFileName: createNewFileName(tool.newFileNameSuffix, fileName),
              inputBlob: blob,
              outputBlob: blob,
              action: tool.key,
              margin: "no-margin",
              orientation: "auto",
              pageSize: "A4",
            });
          }
        }
        //Update loaded files counter
        if (mountedRef.current) {
          setLoadedFilesCount((prev) => prev - 1);
        }
      };
    } else {
      notify("error", "File is not defined");
    }
  }
};

//Fucntion to send requests to Start Files Processing
export const convertImageToPDF = async (
  responseMimeType,
  signal,
  pages,
  handleUpdateDocument,
  uri
) => {
  //an array to store success startCompressing responses and document data
  const successfullyConvertedFiles = [];
  //an array to store failure startCompressing responses and document data
  const failedFiles = [];
  //loop through all successfuly uploaded documents that are stored in pages array and send separate requests to start each file Processing
  for (const page of pages) {
    //for each document send a request to start the processing
    await (async (page) => {
      const formData = new FormData();
      formData.append("file", page.file);
      formData.append("margin", page.margin);
      formData.append("pageOrientation", page.orientation);
      formData.append("pageSize", page.pageSize);
      try {
        const response = await axios.post(`/api${uri}`, formData, {
          signal: signal,
          headers: {
            "content-type": `multipart/form-data; boundary=${formData._boundary}`,
          },
        });
        //check if file is done compressing (file status is equal to processed)
        if (response.data != null && response.data.processedFile != null) {
          //create a blob containing the compressed file
          const b64Data = `data:${responseMimeType};base64,${response.data.processedFile}`;
          const result = await fetch(b64Data);
          const compressedFileBlob = await result.blob();
          /**
           * add document to the array containing successfuly compressed files, and update the state
           * with the compressed blob.
           */
          successfullyConvertedFiles.push({
            document: {
              ...page,
              outputBlob: compressedFileBlob,
            },
          });
          //update state,
          handleUpdateDocument(compressedFileBlob, page.id);
        } else {
          /* If file is failed compressing (file status is equal to failed)
           * add document to the array containing failed files
           */
          failedFiles.push({
            document: page,
          });
        }
      } catch (error) {
        //if error is due to request abortion, do not update state
        if (error.code != "ERR_CANCELED") {
          //add document which failed to start the processing to failedFiles
          failedFiles.push({
            document: page,
          });
        }
      }
    })(page);
  }
  //returning successfullyConvertedFiles and failedFiles to use them in next steps
  return {
    successfullyConvertedFiles,
    failedFiles,
  };
};

// Function to display size estimations
export const displaySizeEstimations = (documents, level) => {
  switch (level) {
    case 1:
      if (documents.length === 1) {
        return formatBytes(
          documents[0].inputBlob.size -
            (documents[0].inputBlob.size *
              documents[0].sizeEstimations.levelOne) /
              100,
          0
        );
      } else if (documents.length > 1) {
        let sumEstimations = 0;
        for (const doc of documents) {
          sumEstimations = sumEstimations + doc.sizeEstimations.levelOne;
        }
        return `-${(sumEstimations / documents.length).toFixed(0)}%`;
      } else {
        return 0;
      }
    case 2:
      if (documents.length === 1) {
        return formatBytes(
          documents[0].inputBlob.size -
            (documents[0].inputBlob.size *
              documents[0].sizeEstimations.levelTwo) /
              100,
          0
        );
      } else if (documents.length > 1) {
        let sumEstimations = 0;
        for (const doc of documents) {
          sumEstimations = sumEstimations + doc.sizeEstimations.levelTwo;
        }
        return `-${(sumEstimations / documents.length).toFixed(0)}%`;
      } else {
        return 0;
      }

    case 3:
      if (documents.length === 1) {
        return formatBytes(
          documents[0].inputBlob.size -
            (documents[0].inputBlob.size *
              documents[0].sizeEstimations.levelThree) /
              100,
          0
        );
      } else if (documents.length > 1) {
        let sumEstimations = 0;
        for (const doc of documents) {
          sumEstimations = sumEstimations + doc.sizeEstimations.levelThree;
        }
        return `-${(sumEstimations / documents.length).toFixed(0)}%`;
      } else {
        return 0;
      }
    default:
      return 0;
  }
};

// Function to calculate size estimations after the compression for each level using file size
// These values are just estimations they might not be 100% accurate.
// I got these values buy testing compression on a number of files grouped by diffrent sizes categories
export const calculateSizeEstimations = (size) => {
  ////magic number on each level === saved percentage
  let levelOne = 0;
  let levelTwo = 0;
  let levelThree = 0;

  if (size > 16777216) {
    ////(16 MB – 128 MB)
    levelOne = 93;
    levelTwo = 98;
    levelThree = 99;
  } else if (size >= 4928307.2 && size < 15099494.4) {
    ////(4.7MB – 14 MB)
    levelOne = 22;
    levelTwo = 52;
    levelThree = 66;
  } else if (size >= 10240 && size < 102400) {
    ////(10 KB – 100 KB)
    if (size >= 10240 && size < 56320) {
      levelOne = 55;
      levelTwo = 56;
      levelThree = 57;
    } else {
      levelOne = 64;
      levelTwo = 65;
      levelThree = 67;
    }
  } else if (size >= 15099494.4 && size < 16777216) {
    //(14,4 MB – 16 MB)
    if (size >= 14994636.8 && size < 15309209.6) {
      levelOne = 70;
      levelTwo = 80;
      levelThree = 90;
    } else {
      levelOne = 67;
      levelTwo = 77;
      levelThree = 87;
    }
  } else if (size >= 1048576 && size < 4928307.2) {
    ////(1mb - 4,7mb)
    levelOne = 55;
    levelTwo = 65;
    levelThree = 75;
  } else if (size >= 102400 && size < 1048576) {
    ////(100 KB – 1 MB)
    levelOne = 30;
    levelTwo = 55;
    levelThree = 60;
  } else if (size < 10240) {
    ////(2 KB - 10kb)
    levelOne = 70;
    levelTwo = 71;
    levelThree = 72;
  }

  return {
    levelOne,
    levelTwo,
    levelThree,
  };
};

//Function to handle files selection from local storage
export const handleCompressPDFFileSelection = (
  event,
  setLoadedFilesCount,
  handleAddDocument,
  t,
  mountedRef,
  tool
) => {
  //To prevent browser from openening the file in a new tab
  event.preventDefault();
  //   case "CompressPDF":

  //get files from input
  let files = getFilesFromInput(event);
  //Update loaded files counter
  if (mountedRef.current) {
    setLoadedFilesCount(files.length);
  }

  /**
   * Loop through all the files to :
   * Extract each file's data and wrapp each file's data in an object and store it in documents array.
   * **/
  for (const file of files) {
    if (file) {
      const fileName = file.name;
      const fileSize = file.size;
      const fileType = file.type;
      let reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        if (
          ApplyFileValidationRules(
            fileName,
            fileSize,
            fileType,
            t,
            tool.acceptedInputMimeType,
            tool.acceptedInputFileMaxSize
          )
        ) {
          const blob = await getBlob(reader.result);
          let pdfDocument = null;
          //Function to extract PDF documents info, and add documents to state.documents array
          pdfDocument = await PDFDocumentFromFile(blob);
          //Check if pdf file is protected or damaged
          //if pdf file is not protected or damaged
          if (pdfDocument.content) {
            //extract document preview first page rotation
            const previewRotation = pdfDocument.content
              .getPage(0)
              .getRotation().angle;
            const width = pdfDocument.content.getPage(0).getWidth();
            const height = pdfDocument.content.getPage(0).getHeight();
            //Increment uuid and store it as file id
            let id = uuid++;
            //calculate size estimations
            const calculatedEstimations = calculateSizeEstimations(fileSize);
            const numberOfPages = pdfDocument.content.getPages().length;
            handleAddDocument({
              id,
              file,
              fileName: fileName,
              newFileName: createNewFileName(tool.newFileNameSuffix, fileName),
              previewRotation,
              rotationsCounter: 0,
              width,
              height,
              inputBlob: blob,
              outputBlob: blob,
              numberOfPages,
              sizeEstimations: calculatedEstimations,
              action: tool.key,
            });
          } else {
            //if pdf file is either protected or damaged
            if (pdfDocument.error === "password") {
              notify(
                "error",
                <>
                  Something went wrong! The file ({fileName}) is
                  Password-protected, Please unlock the file(s) and try again.
                </>
              );
            } else if (pdfDocument.error === "damaged") {
              notify(
                "error",
                <>
                  Something went wrong! The file ({fileName}) is Corrupted,
                  Please make a new copy of the file(s) and try again.
                </>
              );
            } else {
              notify(
                "error",
                "An unknown error occurred. Please try again later."
              );
            }
          }
        }
        //Update loaded files counter
        if (mountedRef.current) {
          setLoadedFilesCount((prev) => prev - 1);
        }
      };
    } else {
      notify("error", "File is not defined");
    }
  }
};
