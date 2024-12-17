import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import {
  AwardFill,
  GearFill,
  HeartFill,
  ShieldFillCheck,
  Infinity as InfinityIcon,
  LightningChargeFill,
  Check2Circle,
  ExclamationTriangle,
} from "react-bootstrap-icons";
import { useTranslation } from "next-i18next";
import DocumentPreview from "../components/DocumentPreview";
import {
  handleFileSelection,
  uploadFiles,
  saveNewFiles,
  downloadFiles,
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
import useUploadStats from "../hooks/useUploadStats";
import useDocuments from "../hooks/useDocuments";
import useToolsData from "../hooks/useToolsData";
import Alerts from "../components/Alerts";
import pageStyles from "../styles/Page.module.css";
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "grayscale-pdf"])),
    },
  };
}

const GrayscalePDFPage = () => {
  const { GrayscalePDFTool } = useToolsData();
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
    //Calling handleFileSelection function to extract pdf pages and their data and insert them in an array
    handleFileSelection(
      event,
      setLoadedFilesCount,
      handleAddDocument,
      t,
      mountedRef,
      GrayscalePDFTool
    );
  };

  const handleConvertToGrayscale = async () => {
    //reset upload status
    handleResetCurrentUploadingStatus();
    handleResetCurrentProcessingStatus();

    /**
     * Files compressing will be done on three steps:
     *** First step : uploading files one by one to server and Start Processing each file
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
        uri: GrayscalePDFTool.URI,
      });

    // //updating form step in UI
    updateFormStep(3);

    //Second step : Check if files are done processing
    const { downloadResponsesArray, downloadResponsesUnseccessfulRequests } =
      await downloadFiles({
        responseMimeType: GrayscalePDFTool.outputFileMimeType,
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
    //stroring all successful documents from each step in an array
    const successfulyProcessedFiles = [...downloadResponsesArray];

    //check if all documents have been processed, no failed documents
    if (successfulyProcessedFiles.length === documents.length) {
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

  const pagesComponentsArray = (
    <div className={`${styles.previewer_content} d-flex flex-wrap`}>
      {documents.map((doc) => {
        return (
          <DocumentPreview
            key={"doc-" + doc.id}
            id={doc.id}
            blob={doc.inputBlob}
            fileName={doc.fileName}
            width={doc.width}
            height={doc.height}
            degree={doc.previewRotation}
            numberOfPages={doc.numberOfPages}
            handleDeleteDocument={(event) => {
              event.preventDefault();
              handleDeleteDocument(doc.id);
            }}
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
        <title>
        Convert to Grayscale |  Grayscale Image & PDF Converter Online Free
        </title>
        <meta
          name="description"
          content="Transform your colorful images and PDFs into stunning grayscale versions with our easy-to-use online converter. Perfect for creating professional-looking documents, enhancing images for print, or achieving a classic monochrome aesthetic."
        />
        <meta
          name="Keywords"
          content="Grayscale conversion, convert to grayscale, image to grayscale, PDF to grayscale, monochrome converter, online grayscale tool, grayscale PDF converter"
        />
        {/* You can add your canonical link here */}
        <link rel="canonical"
          href={`https://pdfdok.com${GrayscalePDFTool.href}`}
          key="canonical" />

        {/* You can add your alternate links here, example: */}
<link
  rel="alternate"
  href={`https://pdfdok.com/en${GrayscalePDFTool.href}`}
  hreflang="en"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/es${GrayscalePDFTool.href}`}
  hreflang="es"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ar${GrayscalePDFTool.href}`}
  hreflang="ar"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/zh${GrayscalePDFTool.href}`}
  hreflang="zh"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/de${GrayscalePDFTool.href}`}
  hreflang="de"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/fr${GrayscalePDFTool.href}`}
  hreflang="fr"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/it${GrayscalePDFTool.href}`}
  hreflang="it"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/pt${GrayscalePDFTool.href}`}
  hreflang="pt"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ru${GrayscalePDFTool.href}`}
  hreflang="ru"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/uk${GrayscalePDFTool.href}`}
  hreflang="uk"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/id${GrayscalePDFTool.href}`}
  hreflang="id"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/da${GrayscalePDFTool.href}`}
  hreflang="da"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/nl${GrayscalePDFTool.href}`}
  hreflang="nl"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/hi${GrayscalePDFTool.href}`}
  hreflang="hi"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ko${GrayscalePDFTool.href}`}
  hreflang="ko"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ja${GrayscalePDFTool.href}`}
  hreflang="ja"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com${GrayscalePDFTool.href}`}
  hreflang="x-default"
/>

      </Head>
      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("grayscale-pdf:page_header_title")}</h1>
          <p className="description">{t("grayscale-pdf:page_header_text")}</p>
        </header>
        <section className="page_section mt-0">
          <article className="container ">
            <section className={pageStyles.tool_container_wrapper}>
              {/* Container start */}

              {formStep === 0 && (
                <UploadAreaFormStep
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={true}
                  acceptedMimeType={GrayscalePDFTool.acceptedInputMimeType}
                />
              )}

              {formStep === 1 && (
                <EditFilesFormStep
                  acceptedMimeType={GrayscalePDFTool.acceptedInputMimeType}
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
                  action={() => handleConvertToGrayscale()}
                  actionTitle={t("grayscale-pdf:convert_to_grayscale")}
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
          title={t("grayscale-pdf:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("grayscale-pdf:how_to_step_one"),
            },
            {
              number: 2,
              description: t("grayscale-pdf:how_to_step_two"),
            },
            {
              number: 3,
              description: t("grayscale-pdf:how_to_step_three"),
            },
            {
              number: 4,
              description: t("grayscale-pdf:how_to_step_four"),
            },
          ]}
        />
        {/* steps end */}
        {/* features start */}
        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: t("grayscale-pdf:feature_one_title"),
              description: t("grayscale-pdf:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("grayscale-pdf:feature_two_title"),
              description: t("grayscale-pdf:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("grayscale-pdf:feature_three_title"),
              description: t("grayscale-pdf:feature_three_text"),
              icon: <GearFill />,
            },
            {
              title: t("grayscale-pdf:feature_four_title"),
              description: t("grayscale-pdf:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("grayscale-pdf:feature_five_title"),
              description: t("grayscale-pdf:feature_five_text"),
              icon: <HeartFill />,
            },

            {
              title: t("grayscale-pdf:feature_six_title"),
              description: t("grayscale-pdf:feature_six_text"),
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
                {t("grayscale-pdf:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("grayscale-pdf:article_paragraph_01")}</p>
              <p>{t("grayscale-pdf:article_paragraph_02")}</p>
              <p>{t("grayscale-pdf:article_paragraph_03")}</p>
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
export default GrayscalePDFPage;
