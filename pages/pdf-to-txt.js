import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useTranslation } from "next-i18next";
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
import useUploadStats from "../hooks/useUploadStats";
import useDocuments from "../hooks/useDocuments";
import useToolsData from "../hooks/useToolsData";
import DocumentPreview from "../components/DocumentPreview";
import ProcessingFilesFormStep from "../components/ProcessingFilesFormStep";
import UploadingFilesFormStep from "../components/UploadingFilesFormStep";
import DownloadFilesFormStep from "../components/DownloadFilesFormStep";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import EditFilesFormStep from "../components/EditFilesFormStep";
import AvailableTools from "../components/AvailableTools";
import Steps from "../components/Steps";
import Features from "../components/Features";
import Share from "../components/Share";
import styles from "../styles/UploadContainer.module.css";
import {
  handleFileSelection,
  uploadFiles,
  downloadFiles,
  saveNewFiles,
} from "../helpers/utils.js";
import Alerts from "../components/Alerts";
import pageStyles from "../styles/Page.module.css";
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "pdf-to-txt"])),
    },
  };
}

const PDFToTextPage = () => {
  const { PDFToTXTTool } = useToolsData();
  const mountedRef = useRef(false);
  const compressBtnRef = useRef();
  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  const [formStep, updateFormStep] = useState(0);
  //loadedfilesCount is used to count the files currently being loaded to show progress spinner while loading the files //
  const [loadedfilesCount, setLoadedFilesCount] = useState(0);
  const [requestSignal, setRequestSignal] = useState();
  const { t } = useTranslation();
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

  const handleChange = (event) => {
    //Calling handleFileSelection function to extract pdf pages and their data and insert them in an array
    handleFileSelection(
      event,
      setLoadedFilesCount,
      handleAddDocument,
      t,
      mountedRef,
      PDFToTXTTool
    );
  };

  const convertFilesToTXT = async () => {
    //reset upload status
    handleResetCurrentUploadingStatus();
    handleResetCurrentProcessingStatus();
    //convert Files
    /**
     **  Files compressing will be done on three steps:
     *** First step : uploading files one by one to server and start processing the files
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
        uri: PDFToTXTTool.URI,
      });
    //updating form step in UI
    updateFormStep(3);

    //Second step : Check if files are done processing
    const { downloadResponsesArray, downloadResponsesUnseccessfulRequests } =
      await downloadFiles({
        responseMimeType: PDFToTXTTool.outputFileMimeType,
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
    //save refs to remove events in clean up function
    const compressBtnRefCurrent = compressBtnRef.current;

    //cleanup function
    return () => {
      // cancel all the requests
      controller.abort();
      //set mounedRef to false
      mountedRef.current = false;
      //removing event listeners
      compressBtnRefCurrent?.removeEventListener(
        "click",
        convertFilesToTXT,
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
        <title>Convert PDF to Text | Free PDF to Text Converter Online</title>
        <meta
          name="description"
          content="Effortlessly convert your PDF files to editable TXT format. Our free online tool extracts text from PDFs while preserving formatting. Simplify your document editing process today!"
        />
        <meta
          name="Keywords"
          content="PDF to TXT converter, PDF to TXT, online PDF to TXT converter, Extract text from PDF"
        />
        {/* You can add your canonical link here */}
        <link
          rel="canonical"
          href={`https://pdfdok.com${PDFToTXTTool.href}`}
          key="canonical"
        />
        {/* You can add your alternate links here, example: */}
        <link
          rel="alternate"
          href={`https://pdfdok.com/en${PDFToTXTTool.href}`}
          hrefLang="en"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/es${PDFToTXTTool.href}`}
          hrefLang="es"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ar${PDFToTXTTool.href}`}
          hrefLang="ar"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/zh${PDFToTXTTool.href}`}
          hrefLang="zh"
        />{" "}
        <link
          rel="alternate"
          href={`https://pdfdok.com/de${PDFToTXTTool.href}`}
          hrefLang="de"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/fr${PDFToTXTTool.href}`}
          hrefLang="fr"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/it${PDFToTXTTool.href}`}
          hrefLang="it"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/pt${PDFToTXTTool.href}`}
          hrefLang="pt"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ru${PDFToTXTTool.href}`}
          hrefLang="ru"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/uk${PDFToTXTTool.href}`}
          hrefLang="uk"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/id${PDFToTXTTool.href}`}
          hrefLang="id"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/da${PDFToTXTTool.href}`}
          hrefLang="da"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/nl${PDFToTXTTool.href}`}
          hrefLang="nl"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/hi${PDFToTXTTool.href}`}
          hrefLang="hi"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ko${PDFToTXTTool.href}`}
          hrefLang="ko"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ja${PDFToTXTTool.href}`}
          hrefLang="ja"
        />
<link
          rel="alternate"
          href={`https://pdfdok.com/es${PDFToTXTTool.href}`}
          key="canonical-es"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ar${PDFToTXTTool.href}`}
          key="canonical-es"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/zh${PDFToTXTTool.href}`}
          key="canonical-zh"
        />{" "}
        <link
          rel="alternate"
          href={`https://pdfdok.com/de${PDFToTXTTool.href}`}
          key="canonical-de"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/fr${PDFToTXTTool.href}`}
          key="canonical-fr"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/it${PDFToTXTTool.href}`}
          key="canonical-it"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/pt${PDFToTXTTool.href}`}
          key="canonical-pt"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ru${PDFToTXTTool.href}`}
          key="canonical-ru"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/uk${PDFToTXTTool.href}`}
          key="canonical-uk"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/id${PDFToTXTTool.href}`}
          key="canonical-id"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/da${PDFToTXTTool.href}`}
          key="canonical-da"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/nl${PDFToTXTTool.href}`}
          key="canonical-nl"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/hi${PDFToTXTTool.href}`}
          key="canonical-hi"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ko${PDFToTXTTool.href}`}
          key="canonical-ko"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ja${PDFToTXTTool.href}`}
          key="canonical-ja"
        />
      </Head>

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("pdf-to-txt:page_header_title")}</h1>
          <p className="description">{t("pdf-to-txt:page_header_text")}</p>
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
                  acceptedMimeType={PDFToTXTTool.acceptedInputMimeType}
                />
              )}

              {formStep === 1 && (
                <EditFilesFormStep
                  acceptedMimeType={PDFToTXTTool.acceptedInputMimeType}
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
                  action={() => convertFilesToTXT()}
                  actionTitle={t("pdf-to-txt:convert_to_txt")}
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
          title={t("pdf-to-txt:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("pdf-to-txt:how_to_step_one"),
            },
            {
              number: 2,
              description: t("pdf-to-txt:how_to_step_two"),
            },
            {
              number: 3,
              description: t("pdf-to-txt:how_to_step_three"),
            },
            {
              number: 4,
              description: t("pdf-to-txt:how_to_step_four"),
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
              description: t("pdf-to-txt:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("pdf-to-txt:feature_two_title"),
              description: t("pdf-to-txt:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("pdf-to-txt:feature_three_title"),
              description: t("pdf-to-txt:feature_three_text"),
              icon: <GearFill />,
            },
            {
              title: t("pdf-to-txt:feature_four_title"),
              description: t("pdf-to-txt:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("pdf-to-txt:feature_five_title"),
              description: t("pdf-to-txt:feature_five_text"),
              icon: <HeartFill />,
            },

            {
              title: t("pdf-to-txt:feature_six_title"),
              description: t("pdf-to-txt:feature_six_text"),
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
                {t("pdf-to-txt:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("pdf-to-txt:article_paragraph_01")}</p>
              <p>{t("pdf-to-txt:article_paragraph_02")}</p>
              <p>{t("pdf-to-txt:article_paragraph_03")}</p>
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
export default PDFToTextPage;
