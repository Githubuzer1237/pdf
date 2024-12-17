import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  Infinity as InfinityIcon,
  LightningChargeFill,
  GearFill,
  HeartFill,
  AwardFill,
  ShieldFillCheck,
  Check2Circle,
  ExclamationTriangle,
} from "react-bootstrap-icons";
import { useTranslation } from "next-i18next";
import {
  uploadFiles,
  saveNewFiles,
  downloadFiles,
  handleOfficeToPDFFileSelection,
} from "../helpers/utils.js";
import styles from "../styles/UploadContainer.module.css";
import Steps from "../components/Steps";
import Features from "../components/Features";
import Share from "../components/Share";
import ProcessingFilesFormStep from "../components/ProcessingFilesFormStep";
import UploadingFilesFormStep from "../components/UploadingFilesFormStep";
import DownloadFilesFormStep from "../components/DownloadFilesFormStep";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import EditFilesFormStep from "../components/EditFilesFormStep";
import AvailableTools from "../components/AvailableTools";
import ImagePreview from "../components/ImagePreview";
import useUploadStats from "../hooks/useUploadStats";
import useDocuments from "../hooks/useDocuments";
import useToolsData from "../hooks/useToolsData";
import Alerts from "../components/Alerts.js";
import pageStyles from "../styles/Page.module.css";
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "excel-to-pdf"])),
    },
  };
}

const EXCELToPDFPage = () => {
  const { EXCELToPDFTool } = useToolsData();
  const {
    currentUploadingFile,
    currentUploadedFilesCounter,
    currentProccessedFilesCounter,
    totalUploadingProgress,
    uploadSpeed,
    uploadTimeLeft,
    resultsInfoVisibility,
    resultsErrors,
    handleResetInitialUploadState,
    handleResetCurrentUploadingStatus,
    handleUpdateCurrentUploadingStatus,
    handleUpdateResultsDisplay,
    handleResetCurrentProcessingStatus,
    handleUpdateCurrentProcessingStatus,
  } = useUploadStats();

  const {
    documents,
    handleAddDocument,
    handleUpdateDocument,
    handleDeleteDocument,
    handleResetInitialDocumentsState,
  } = useDocuments();

  const { t } = useTranslation();

  const mountedRef = useRef(false);
  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  const [formStep, updateFormStep] = useState(0);
  //loadedfilesCount is used to count the files currently being loaded to show progress spinner while loading the files //
  const [loadedfilesCount, setLoadedFilesCount] = useState(0);
  const [requestSignal, setRequestSignal] = useState();

  const handleChange = (event) => {
    //Calling handleOfficeToPDFFileSelection function to extract pdf pages and their data and insert them in an array
    handleOfficeToPDFFileSelection(
      event,
      setLoadedFilesCount,
      handleAddDocument,
      t,
      mountedRef,
      EXCELToPDFTool
    );
  };

  const handleCompressFiles = async () => {
    //reset upload status
    handleResetCurrentUploadingStatus();
    handleResetCurrentProcessingStatus();
    //convert Files
    /**
     * Files compressing will be done on three steps:
     *** First step : uploading files one by one to server
     *** Second step : sending requests to server to Start Files Processing, sending individual request for each file
     *** Second step : sending periodic download requests to check if files are done compressing and return the result, sending individual download requests for each file.
     */

    //updating form step in UI
    updateFormStep(2);
    //First step : Uploading Files & Start Files Processing
    const { uploadResponsesArray, uploadResponsesUnseccessfulRequests } =
      await uploadFiles({
        signal: requestSignal,
        documents: documents,
        handleUpdateCurrentUploadingStatus: handleUpdateCurrentUploadingStatus,
        uri: EXCELToPDFTool.URI,
      });

    //updating form step in UI
    updateFormStep(3);

    //Second step : Check if files are done processing
    const { downloadResponsesArray, downloadResponsesUnseccessfulRequests } =
      await downloadFiles({
        responseMimeType: EXCELToPDFTool.outputFileMimeType,
        signal: requestSignal,
        uploadResponsesArray: uploadResponsesArray,
        handleUpdateDocument: handleUpdateDocument,
        handleUpdateCurrentProcessingStatus:
          handleUpdateCurrentProcessingStatus,
      });

    //stroing all failed documents from each step in an array
    const failedFiles = [
      ...uploadResponsesUnseccessfulRequests,
      ...downloadResponsesUnseccessfulRequests,
    ];

    //check if all documents have been processed, no failed documents
    if (downloadResponsesArray.length === documents.length) {
      handleUpdateResultsDisplay(true, []);
    } else {
      //check if all documents have failed being processed
      if (failedFiles.length === documents.length) {
        handleUpdateResultsDisplay(false, failedFiles);
      } else {
        //If some documents have being successfuly processed and some documents have failed being processed
        handleUpdateResultsDisplay(true, failedFiles);
      }
    }
    //updating form step in UI
    updateFormStep(4);
  };

  const handlehandleResetInitialStates = () => {
    handleResetInitialDocumentsState();
    handleResetInitialUploadState();
    updateFormStep(0);
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
    //cleanup function
    return () => {
      // cancel all the requests
      controller.abort();
      //set mounedRef to false
      mountedRef.current = false;
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

  useEffect(() => {
    if (documents.length <= 0) {
      updateFormStep(0);
    } else {
      updateFormStep(1);
    }
  }, [documents.length]);

  const pagesComponentsArray = (
    <div className={`${styles.previewer_content} d-flex flex-wrap`}>
      {documents.map((doc) => {
        return (
          <ImagePreview
            key={"doc-" + doc.id}
            document={doc}
            handleDeleteDocument={(event) => {
              event.preventDefault();
              handleDeleteDocument(doc.id);
            }}
            thumbnailImageURL={EXCELToPDFTool.thumbnailImageURL}
          />
        );
      })}
    </div>
  );

  return (
    <>
      <Head>
        {/* Anything you add here will be added to this page only */}
        <title>EXCEL To PDF | Free Online Excel to PDF Tool</title>
        <meta
          name="description"
          content="Convert Excel to PDF in just a few clicks! Our user-friendly online tool allows you to securely convert your Excel files to PDF without losing any formatting. Perfect for sharing and archiving your spreadsheets."
        />
        <meta
          name="Keywords"
          content="Excel to PDF, XLS to PDF, XLSX to PDF, convert Excel to PDF, online Excel to PDF, free, free Excel to PDF conversion, secure, no watermark, no registration"
        />
        {/* You can add your canonical link here */}
        <link rel="canonical"
          href={`https://pdfdok.com${EXCELToPDFTool.href}`}
          key="canonical" />

        {/* You can add your alternate links here, example: */}
<link
  rel="alternate"
  href={`https://pdfdok.com/en${EXCELToPDFTool.href}`}
  hreflang="en"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/es${EXCELToPDFTool.href}`}
  hreflang="es"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ar${EXCELToPDFTool.href}`}
  hreflang="ar"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/zh${EXCELToPDFTool.href}`}
  hreflang="zh"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/de${EXCELToPDFTool.href}`}
  hreflang="de"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/fr${EXCELToPDFTool.href}`}
  hreflang="fr"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/it${EXCELToPDFTool.href}`}
  hreflang="it"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/pt${EXCELToPDFTool.href}`}
  hreflang="pt"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ru${EXCELToPDFTool.href}`}
  hreflang="ru"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/uk${EXCELToPDFTool.href}`}
  hreflang="uk"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/id${EXCELToPDFTool.href}`}
  hreflang="id"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/da${EXCELToPDFTool.href}`}
  hreflang="da"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/nl${EXCELToPDFTool.href}`}
  hreflang="nl"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/hi${EXCELToPDFTool.href}`}
  hreflang="hi"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ko${EXCELToPDFTool.href}`}
  hreflang="ko"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ja${EXCELToPDFTool.href}`}
  hreflang="ja"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com${EXCELToPDFTool.href}`}
  hreflang="x-default"
/>
      </Head>

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("excel-to-pdf:page_header_title")}</h1>
          <p className="description">{t("excel-to-pdf:page_header_text")}</p>
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
                  acceptedMimeType={EXCELToPDFTool.acceptedInputMimeType}
                />
              )}

              {formStep === 1 && (
                <EditFilesFormStep
                  acceptedMimeType={EXCELToPDFTool.acceptedInputMimeType}
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
                  action={() => handleCompressFiles()}
                  actionTitle={t("common:convert_to_pdf")}
                />
              )}

              {formStep === 2 && (
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

              {formStep === 3 && (
                <ProcessingFilesFormStep
                  progress={`${t(
                    "common:processing"
                  )} ${currentProccessedFilesCounter} ${t("common:of")} ${
                    documents.length
                  }`}
                />
              )}

              {formStep === 4 && (
                <DownloadFilesFormStep
                  title={
                    documents.length === 1
                      ? t("common:your_document_is_ready")
                      : documents.length > 1
                      ? t("common:your_documents_are_ready")
                      : ""
                  }
                  handleDownload={handleDownload}
                  handleResetInitialState={handlehandleResetInitialStates}
                >
                  {resultsInfoVisibility && (
                    <div className="row w-100 d-flex justify-content-center text-center mt-5 mb-5">
                      <Check2Circle size={130} color="#7d64ff" />
                    </div>
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
          title={t("excel-to-pdf:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("excel-to-pdf:how_to_step_one"),
            },
            {
              number: 2,
              description: t("excel-to-pdf:how_to_step_two"),
            },
            {
              number: 3,
              description: t("excel-to-pdf:how_to_step_three"),
            },
            {
              number: 4,
              description: t("excel-to-pdf:how_to_step_four"),
            },
          ]}
        />
        {/* steps end */}
        {/* features start */}
        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: "Fast",
              description: t("excel-to-pdf:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("excel-to-pdf:feature_two_title"),
              description: t("excel-to-pdf:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("excel-to-pdf:feature_three_title"),
              description: t("excel-to-pdf:feature_three_text"),
              icon: <GearFill />,
            },
            {
              title: t("excel-to-pdf:feature_four_title"),
              description: t("excel-to-pdf:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("excel-to-pdf:feature_five_title"),
              description: t("excel-to-pdf:feature_five_text"),
              icon: <HeartFill />,
            },

            {
              title: t("excel-to-pdf:feature_six_title"),
              description: t("excel-to-pdf:feature_six_text"),
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
                {t("excel-to-pdf:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("excel-to-pdf:article_paragraph_01")}</p>
              <p>{t("excel-to-pdf:article_paragraph_02")}</p>
              <p>{t("excel-to-pdf:article_paragraph_03")}</p>
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
export default EXCELToPDFPage;
