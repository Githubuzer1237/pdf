import React, { useReducer, useState, useEffect, useRef } from "react";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import {
  ArrowRightShort,
  ExclamationCircle,
  ExclamationTriangle,
  Infinity as InfinityIcon,
  LightningChargeFill,
  GearFill,
  HeartFill,
  AwardFill,
  ShieldFillCheck,
} from "react-bootstrap-icons";
import {
  formatBytes,
  uploadFiles,
  saveNewFiles,
  downloadFiles,
  displaySizeEstimations,
  handleCompressPDFFileSelection,
} from "../helpers/utils.js";
import styles from "../styles/UploadContainer.module.css";
import Steps from "../components/Steps";
import Features from "../components/Features";
import Share from "../components/Share";
import DocumentPreview from "../components/DocumentPreview";
import ProcessingFilesFormStep from "../components/ProcessingFilesFormStep";
import UploadingFilesFormStep from "../components/UploadingFilesFormStep";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import EditFilesFormStep from "../components/EditFilesFormStep";
import { rotatePDFDocument } from "../helpers/pdf-utils";
import AvailableTools from "../components/AvailableTools";
import useDocuments from "../hooks/useDocuments";
import useUploadStats from "../hooks/useUploadStats";
import useToolsData from "../hooks/useToolsData";
import Option from "../components/Option.js";
import SelectOptionFormStep from "../components/SelectOptionFormStep.js";
import DownloadFilesFormStep from "../components/DownloadFilesFormStep.js";
import Alerts from "../components/Alerts.js";
import pageStyles from "../styles/Page.module.css";
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "compress-pdf"])),
    },
  };
}

const CompressPDFPage = () => {
  const { CompressPDFTool } = useToolsData();
  const mountedRef = useRef(false);
  const downloadBtnRef = useRef();
  const goBackBtnRef = useRef();
  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  const [formStep, updateFormStep] = useState(0);
  //loadedfilesCount is used to count the files currently being loaded to show progress spinner while loading the files //
  const [loadedfilesCount, setLoadedFilesCount] = useState(0);
  const [requestSignal, setRequestSignal] = useState();

  const [compressionLevel, setCompressionLevel] = useState(2);
  const { t } = useTranslation();

  const {
    documents,
    handleAddDocument,
    handleUpdateDocument,
    handleDeleteDocument,
    handleRotateDocument,
    handleRotateAllDocuments,
    handleResetInitialDocumentsState,
  } = useDocuments();

  const {
    currentUploadingFile,
    currentUploadedFilesCounter,
    currentProccessedFilesCounter,
    totalUploadingProgress,
    uploadSpeed,
    uploadTimeLeft,
    resultsInfoVisibility,
    resultsAlerts,
    resultsErrors,
    handleResetInitialUploadState,
    handleResetCurrentUploadingStatus,
    handleUpdateCurrentUploadingStatus,
    handleUpdateResultsDisplay,
    handleResetCurrentProcessingStatus,
    handleUpdateCurrentProcessingStatus,
  } = useUploadStats();

  const initialState = {
    totalOriginalFilesSize: "0 Bytes",
    totalCompressedFilesSize: "0 Bytes",
    totalReducedSizePercentage: 0,
  };
  const reducer = (state, action) => {
    switch (action.type) {
      case "UPDATE_TOTAL_REDUCED_SIZE":
        let counter = 0;
        let total = 0;
        let newtotalOriginalFilesSize = 0;
        let newtotalCompressedFilesSize = 0;
        for (const document of documents) {
          if (document.outputBlob != null) {
            counter = counter + 1;
            const originalSize = document.inputBlob.size;
            const compressedSize = document.outputBlob.size;
            newtotalOriginalFilesSize =
              newtotalOriginalFilesSize + originalSize;
            newtotalCompressedFilesSize =
              newtotalCompressedFilesSize + compressedSize;
            const reducedSize = originalSize - compressedSize;
            const reducedSizePercentage = Math.round(
              (reducedSize * 100) / originalSize
            );
            total = total + reducedSizePercentage;
          }
        }
        return {
          ...state,
          totalCompressedFilesSize: formatBytes(newtotalCompressedFilesSize, 2),
          totalOriginalFilesSize: formatBytes(newtotalOriginalFilesSize, 2),
          totalReducedSizePercentage: Math.round(total / counter),
        };

      case "RESET_TOTAL_REDUCED_SIZE":
        return {
          ...state,
          totalOriginalFilesSize: initialState.totalOriginalFilesSize,
          totalCompressedFilesSize: initialState.totalCompressedFilesSize,
          totalReducedSizePercentage: initialState.totalReducedSizePercentage,
        };

      default:
        return state;
    }
  };
  const [state, dispatch] = useReducer(reducer, initialState);

  const calculateTotalReducedSize = () => {
    if (mountedRef.current) {
      dispatch({
        type: "UPDATE_TOTAL_REDUCED_SIZE",
      });
    }
  };

  const resetTotaleReducedSize = () => {
    if (mountedRef.current) {
      dispatch({
        type: "RESET_TOTAL_REDUCED_SIZE",
      });
    }
  };

  const handlehandleResetInitialStates = () => {
    resetTotaleReducedSize();
    handleResetInitialDocumentsState();
    handleResetInitialUploadState();
    setCompressionLevel(2);
    updateFormStep(0);
  };

  const handleChange = (event) => {
    //Calling handleCompressPDFFileSelection function to extract pdf pages and their data and insert them in an array
    handleCompressPDFFileSelection(
      event,
      setLoadedFilesCount,
      handleAddDocument,
      t,
      mountedRef,
      CompressPDFTool
    );
  };

  const rotateAndComparePDFSizes = async (
    compressedFilesArray,
    handleUpdateDocument
  ) => {
    // an array to store documents that are successfuly compressed, the size is smaller than the original
    const successfullyCompressed = [];
    // an array to store documents that are successfuly compressed but the size is larger or same as the original
    const alreadyCompressed = [];

    /**
     * loop through all documents that successfuly started compression and that are stored in
     * compressedFilesArray and send repeated download requests for each file to
     * check if it is done compressiong
     */
    for (let index = 0; index < compressedFilesArray.length; index++) {
      const document = compressedFilesArray[index].document;

      await (async (document) => {
        // Rotating the original file to use later for comparing files size
        const rotatedOriginalDocBlob = await rotatePDFDocument(
          document.inputBlob,
          document.rotationsCounter
        );
        //Rotating the compressed file
        const rotatedCompressedDocBlob = await rotatePDFDocument(
          document.outputBlob,
          document.rotationsCounter
        );

        //check if compressed file size is bigger than or equal to the original file size
        if (rotatedCompressedDocBlob.size >= document.inputBlob.size) {
          /** if true, it means that the returned file has not faced any errors while compressing
           *  on the backend but its size has gotten bigger or its size remained the same.
           */
          /**
           * I'm using pdf-lib for rotating the files, and noticed that this library can sometimes
           * reduce the size of the pdf, so basically it can also compress files sometimes.
           * So i added a condition to check if the rotated (original) file size is smaller than the (original) file size,
           * by (original), i mean the file before compression.
           * if the condition is true, it means that the file was compressed only with pdf-lib. in this case
           * we add the document to the array contained successfuly compressed files and we update the state with the rotated original blob
           * if the condition is false, it mean that the file was not compressed. in this case
           * we consider that the file is already compressed (since we cannot compress it) and
           * add the document to the array containing already compressed files and update the state with the rotated original blob
           */

          if (rotatedOriginalDocBlob.size < document.inputBlob.size) {
            //File compresed using pdf-lib only
            //add document to the array containing successfuly Compressed files
            successfullyCompressed.push({
              document: document,
            });
          } else {
            //File considered already compressed
            //add document to the array containing already Compressed files
            alreadyCompressed.push({
              document: document,
            });
          }
          //update state,
          handleUpdateDocument(rotatedOriginalDocBlob, document.id);
        } else {
          //compressed file size is smaller than the original file size
          //add document to the array containing successfuly compressed files
          successfullyCompressed.push({
            document: document,
          });
          //update state,
          handleUpdateDocument(rotatedCompressedDocBlob, document.id);
        }
      })(document);
    }

    return { successfullyCompressed, alreadyCompressed };
  };

  const handleCompressFiles = async () => {
    //reset upload status
    handleResetCurrentUploadingStatus();
    handleResetCurrentProcessingStatus();
    resetTotaleReducedSize();
    /**
     * Files compressing will be done on three steps:
     *** First step : uploading files one by one to server
     *** Second step : sending requests to server to Start Files Processing, sending individual request for each file
     *** Second step : sending periodic download requests to check if files are done compressing and return the result, sending individual download requests for each file.
     */

    //updating form step in UI
    updateFormStep(3);
    //First step : Uploading Files & Start Files Processing
    // Array-like object
    const data = {
      compressionLevel: compressionLevel,
    };
    const { uploadResponsesArray, uploadResponsesUnseccessfulRequests } =
      await uploadFiles({
        signal: requestSignal,
        documents: documents,
        handleUpdateCurrentUploadingStatus: handleUpdateCurrentUploadingStatus,
        uri: CompressPDFTool.URI,
        data: data,
      });

    //updating form step in UI
    updateFormStep(4);

    //Second step : Check if files are done processing

    //stroring all successful documents from each step in an array
    const { downloadResponsesArray, downloadResponsesUnseccessfulRequests } =
      await downloadFiles({
        responseMimeType: CompressPDFTool.outputFileMimeType,
        signal: requestSignal,
        uploadResponsesArray: uploadResponsesArray,
        handleUpdateDocument: handleUpdateDocument,
        handleUpdateCurrentProcessingStatus:
          handleUpdateCurrentProcessingStatus,
      });

    //Rotating the PDFs and comparing their sizes
    const { successfullyCompressed, alreadyCompressed } =
      await rotateAndComparePDFSizes(
        downloadResponsesArray,
        handleUpdateDocument
      );

    //stroing all failed documents from each step in an array
    const failedFiles = [
      ...uploadResponsesUnseccessfulRequests,
      ...downloadResponsesUnseccessfulRequests,
    ];

    //stroring all successful documents from each step in an array
    const successfulyProcessedFiles = [
      ...successfullyCompressed,
      ...alreadyCompressed,
    ];

    //check if all documents have been processed, no failed documents
    if (successfulyProcessedFiles.length === documents.length) {
      //check if all successfully compressed files are already compressed; (if file is bigger or same size as the original)
      if (alreadyCompressed.length === successfulyProcessedFiles.length) {
        //1 or many
        handleUpdateResultsDisplay(false, [], alreadyCompressed);
      } else {
        //if successfully compressed files are a mix between already compressed files and true compressed files
        handleUpdateResultsDisplay(true, [], []);
      }
    } else {
      //check if all documents have failed being processed
      if (
        failedFiles.length === documents.length &&
        successfulyProcessedFiles.length === 0
      ) {
        handleUpdateResultsDisplay(false, failedFiles, []);
      } else {
        //If some documents have being successfuly processed and some documents have failed being processed
        if (alreadyCompressed.length === successfulyProcessedFiles.length) {
          //1 or many
          handleUpdateResultsDisplay(false, failedFiles, alreadyCompressed);
        } else {
          handleUpdateResultsDisplay(true, failedFiles, []);
        }
      }
    }

    //calculating and updating total reduced size after downloading all the files.
    calculateTotalReducedSize();

    //updating form step in UI
    updateFormStep(5);
  };

  const handleDownload = () => {
    saveNewFiles(documents);
  };

  useEffect(() => {
    //set mountedRef to true
    mountedRef.current = true;

    //Axios AbortController to abort requests
    const controller = new AbortController();
    const signal = controller.signal;
    setRequestSignal(signal);
    //save refs to remove events in clean up function
    const downloadBtnRefCurrent = downloadBtnRef.current;
    const goBackBtnRefCurrent = goBackBtnRef.current;

    //cleanup function
    return () => {
      // cancel all the requests
      controller.abort();
      //set mounedRef to false
      mountedRef.current = false;
      //removing event listeners
      downloadBtnRefCurrent?.removeEventListener(
        "click",
        handleDownload,
        false
      );
      goBackBtnRefCurrent?.removeEventListener(
        "click",
        handlehandleResetInitialStates,
        false
      );
    };
  }, []);

  useEffect(() => {
    // if loadedfilesCount (count of file currently being loaded) is greater than zero than show spinner
    if (loadedfilesCount > 0) {
      //show spinner
      if (mountedRef.current) {
        setIsSpinnerActive(true);
      }
    } else {
      //after all files are loaded, hide spinner
      if (mountedRef.current) {
        setIsSpinnerActive(false);
      }
    }
  }, [loadedfilesCount]);

  const pagesComponentsArray = (
    <div className={`${styles.previewer_content} d-flex flex-wrap`}>
      {documents.map((doc) => {
        return (
          <DocumentPreview
            key={"doc-" + doc.id}
            blob={doc.inputBlob}
            fileName={doc.fileName}
            width={doc.width}
            height={doc.height}
            numberOfPages={doc.numberOfPages}
            degree={doc.previewRotation}
            rotationsCounter={doc.rotationsCounter}
            handleDeleteDocument={(event) => {
              event.preventDefault();
              handleDeleteDocument(doc.id);
            }}
            handleRotateDocument={() => handleRotateDocument(doc)}
          />
        );
      })}
    </div>
  );

  useEffect(() => {
    if (documents.length <= 0) {
      updateFormStep(0);
    } else {
      updateFormStep(1);
    }
  }, [documents.length]);

  return (
    <>
      <Head>
        {/* Anything you add here will be added to this page only */}
        <title>Compress PDF | Fast, Free, and Effective Tool</title>
        <meta
          name="description"
          content="Compress your PDF files in seconds! Our free tool helps you minimize file sizes for easier sharing and storage. Enjoy fast and reliable compression without compromising on document quality."
        />
        <meta
          name="Keywords"
          content="compress PDF, PDF compression, Reduce PDF file size, online PDF compressor, free PDF compressor, PDF file reducer"
        />
        {/* You can add your canonical link here */}
        <link rel="canonical"
          href={`https://pdfdok.com${CompressPDFTool.href}`}
          key="canonical" />
        {/* You can add your alternate links here, example: */}
<link
  rel="alternate"
  href={`https://pdfdok.com/en${CompressPDFTool.href}`}
  hreflang="en"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/es${CompressPDFTool.href}`}
  hreflang="es"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ar${CompressPDFTool.href}`}
  hreflang="ar"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/zh${CompressPDFTool.href}`}
  hreflang="zh"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/de${CompressPDFTool.href}`}
  hreflang="de"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/fr${CompressPDFTool.href}`}
  hreflang="fr"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/it${CompressPDFTool.href}`}
  hreflang="it"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/pt${CompressPDFTool.href}`}
  hreflang="pt"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ru${CompressPDFTool.href}`}
  hreflang="ru"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/uk${CompressPDFTool.href}`}
  hreflang="uk"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/id${CompressPDFTool.href}`}
  hreflang="id"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/da${CompressPDFTool.href}`}
  hreflang="da"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/nl${CompressPDFTool.href}`}
  hreflang="nl"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/hi${CompressPDFTool.href}`}
  hreflang="hi"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ko${CompressPDFTool.href}`}
  hreflang="ko"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ja${CompressPDFTool.href}`}
  hreflang="ja"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com${CompressPDFTool.href}`}
  hreflang="x-default"
/>
      </Head>

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("compress-pdf:page_header_title")}</h1>
          <p className="description">{t("compress-pdf:page_header_text")}</p>
        </header>
        <section className="page_section mt-0">
          <article className="container">
            <section className={pageStyles.tool_container_wrapper}>
              {/* Container start */}

              {formStep === 0 && (
                <UploadAreaFormStep
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={true}
                  acceptedMimeType={CompressPDFTool.acceptedInputMimeType}
                />
              )}

              {formStep === 1 && (
                <EditFilesFormStep
                  acceptedMimeType={CompressPDFTool.acceptedInputMimeType}
                  files={documents}
                  enableAddingMoreFiles={true}
                  filesComponents={pagesComponentsArray}
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={true}
                  isFilesSelectionActive={false}
                  isPanelTopSticky={false}
                  isPanelBottomSticky={false}
                  positionPanelBottomItems={styles.centered}
                  deleteFiles={handleResetInitialDocumentsState}
                  rotateFilesToRight={handleRotateAllDocuments}
                  action={() => updateFormStep(2)}
                  actionTitle={t("compress-pdf:select_compression_level")}
                />
              )}

              {formStep === 2 && (
                <SelectOptionFormStep
                  title={t("compress-pdf:select_compression_level_title")}
                  action={handleCompressFiles}
                  actionTitle={
                    documents.length === 1
                      ? t("compress-pdf:compress_file")
                      : documents.length > 1
                      ? t("compress-pdf:compress_files")
                      : ""
                  }
                >
                  <Option
                    onChange={() => setCompressionLevel(1)}
                    isChecked={compressionLevel === 1}
                    value="low"
                  >
                    <span>
                      {t("compress-pdf:less_compression")} (
                      {t("compress-pdf:high_quality_less_compression")})
                    </span>
                    <span className={`${styles.pdf_to_image_option_desc}`}>
                      {t("compress-pdf:estimated_size")}
                      {": ~ "}
                      {displaySizeEstimations(documents, 1)}
                    </span>
                  </Option>

                  <Option
                    onChange={() => setCompressionLevel(2)}
                    isChecked={compressionLevel === 2}
                    value="medium"
                  >
                    <span>
                      {t("compress-pdf:recommended_compression")} (
                      {t("compress-pdf:good_quality_good_compression")})
                    </span>
                    <span className={`${styles.pdf_to_image_option_desc}`}>
                      {t("compress-pdf:estimated_size")}
                      {": ~ "}
                      {displaySizeEstimations(documents, 2)}
                    </span>
                  </Option>

                  <Option
                    onChange={() => setCompressionLevel(3)}
                    isChecked={compressionLevel === 3}
                    value="high"
                  >
                    <span>
                      {t("compress-pdf:extreme_compression")} (
                      {t("compress-pdf:less_quality_high_compression")})
                    </span>
                    <span className={`${styles.pdf_to_image_option_desc}`}>
                      {t("compress-pdf:estimated_size")}
                      {": ~ "}
                      {displaySizeEstimations(documents, 3)}
                    </span>
                  </Option>
                </SelectOptionFormStep>
              )}

              {formStep === 3 && (
                <UploadingFilesFormStep
                  title={`${t(
                    "common:uploading_file"
                  )} ${currentUploadedFilesCounter} ${t("common:of")} ${
                    documents.length
                  }`}
                  uploadTimeLeft={uploadTimeLeft}
                  uploadSpeed={uploadSpeed}
                  totalUploadingProgress={totalUploadingProgress}
                  currentUploadingFileName={currentUploadingFile?.fileName}
                  currentUploadingFileSize={
                    currentUploadingFile?.inputBlob.size
                  }
                />
              )}

              {formStep === 4 && (
                <ProcessingFilesFormStep
                  progress={`${t(
                    "common:processing"
                  )} ${currentProccessedFilesCounter} ${t("common:of")} ${
                    documents.length
                  }`}
                />
              )}

              {formStep === 5 && (
                <DownloadFilesFormStep
                  title={
                    documents.length === 1
                      ? t("compress-pdf:file_is_compressed")
                      : documents.length > 1
                      ? t("compress-pdf:files_are_compressed")
                      : ""
                  }
                  handleDownload={handleDownload}
                  handleResetInitialState={handlehandleResetInitialStates}
                >
                  {resultsInfoVisibility && (
                    <>
                      <div className="row w-100 d-flex justify-content-center text-center mt-5 mb-5">
                        <span style={{ color: "#2d3748", fontWeight: "bold" }}>
                          {t("compress-pdf:saved")}
                        </span>
                        <span className={`${styles.saved_percentage}`}>
                          {state.totalReducedSizePercentage}%
                        </span>
                      </div>
                      <div className="row w-100 d-flex justify-content-center text-center mt-2 mb-2">
                        <span style={{ color: "#2d3748", fontWeight: "bold" }}>
                          {documents.length === 1
                            ? t("compress-pdf:your_pdf_is_now")
                            : documents.length > 1
                            ? t("compress-pdf:your_pdfs_are_now")
                            : ""}{" "}
                          {state.totalReducedSizePercentage}%{" "}
                          {t("compress-pdf:smaller")}
                        </span>
                        <span
                          style={{
                            color: "#2d3748",
                            fontWeight: "bold",
                            direction: "ltr",
                          }}
                        >
                          {state.totalOriginalFilesSize} <ArrowRightShort />{" "}
                          {state.totalCompressedFilesSize}
                        </span>
                      </div>
                    </>
                  )}

                  {resultsAlerts.length > 0 && (
                    <Alerts
                      alerts={resultsAlerts}
                      type="warning"
                      icon={<ExclamationCircle size={22} />}
                    />
                  )}

                  {resultsErrors.length > 0 && (
                    <Alerts
                      alerts={resultsErrors}
                      type="error"
                      icon={<ExclamationTriangle size={22} />}
                    />
                  )}
                </DownloadFilesFormStep>
              )}

              {/* Conatiner end */}
            </section>
          </article>
        </section>
        {/* steps Start */}
        <Steps
          title={t("compress-pdf:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("compress-pdf:how_to_step_one"),
            },
            {
              number: 2,
              description: t("compress-pdf:how_to_step_two"),
            },
            {
              number: 3,
              description: t("compress-pdf:how_to_step_three"),
            },
            {
              number: 4,
              description: t("compress-pdf:how_to_step_four"),
            },
          ]}
        />
        {/* steps end */}
        {/* features start */}
        {/* features start */}
        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: t("compress-pdf:feature_one_title"),
              description: t("compress-pdf:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("compress-pdf:feature_two_title"),
              description: t("compress-pdf:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("compress-pdf:feature_three_title"),
              description: t("compress-pdf:feature_three_text"),
              icon: <GearFill />,
            },
            {
              title: t("compress-pdf:feature_four_title"),
              description: t("compress-pdf:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("compress-pdf:feature_five_title"),
              description: t("compress-pdf:feature_five_text"),
              icon: <HeartFill />,
            },

            {
              title: t("compress-pdf:feature_six_title"),
              description: t("compress-pdf:feature_six_text"),
              icon: <AwardFill />,
            },
          ]}
        />
        {/* features end */}
        {/* Article Start */}
        <section className="page_section">
          <article className={`container ${pageStyles.article_section}`}>
            <header className={pageStyles.article_header}>
              <h2 className={pageStyles.title_section}>
                {t("compress-pdf:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("compress-pdf:article_paragraph_01")}</p>
              <p>{t("compress-pdf:article_paragraph_02")}</p>
              <p>{t("compress-pdf:article_paragraph_03")}</p>
            </section>
          </article>
        </section>
        {/* Article End */}
        <AvailableTools />
        <Share />
      </main>
    </>
  );
};
export default CompressPDFPage;
