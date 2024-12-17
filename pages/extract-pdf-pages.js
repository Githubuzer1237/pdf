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
import { isMobile } from "react-device-detect";
import { useTranslation } from "next-i18next";
import Selecto from "react-selecto";
import DocumentPreviewSelectable from "../components/DocumentPreviewSelectable";
import ProcessingFilesFormStep from "../components/ProcessingFilesFormStep";
import {
  notify,
  uploadFiles,
  saveNewFiles,
  downloadFiles,
  handleExtractPagesFileSelection,
} from "../helpers/utils.js";
import Steps from "../components/Steps";
import styles from "../styles/UploadContainer.module.css";
import Features from "../components/Features";
import Share from "../components/Share";
import UploadingFilesFormStep from "../components/UploadingFilesFormStep";
import DownloadFilesFormStep from "../components/DownloadFilesFormStep";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import AvailableTools from "../components/AvailableTools";
import useUploadStats from "../hooks/useUploadStats";
import useDocuments from "../hooks/useDocuments";
import usePages from "../hooks/usePages";
import useToolsData from "../hooks/useToolsData";
import Option from "../components/Option";
import SelectOptionFormStep from "../components/SelectOptionFormStep";
import EditFilesFormStep from "../components/EditFilesFormStep";
import Alerts from "../components/Alerts";
import pageStyles from "../styles/Page.module.css";
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        "common",
        "extract-pdf-pages",
      ])),
    },
  };
}

const ExtractPagesPage = () => {
  const { ExtractPagesTool } = useToolsData();
  const mountedRef = useRef(false);
  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  const [formStep, updateFormStep] = useState(0);
  //loadedfilesCount is used to count the files currently being loaded to show progress spinner while loading the files //
  const [loadedfilesCount, setLoadedFilesCount] = useState(0);
  const [requestSignal, setRequestSignal] = useState();
  const [scrollOptions, setScrollOptions] = useState({});
  const [extractionOption, setExtractionOption] = useState(
    "EXTRACT_SELECTED_PAGES"
  );
  const { t } = useTranslation();

  const {
    currentUploadingFile,
    totalUploadingProgress,
    uploadSpeed,
    uploadTimeLeft,
    resultsInfoVisibility,
    resultsErrors,
    handleResetInitialUploadState,
    handleResetCurrentUploadingStatus,
    handleUpdateCurrentUploadingStatus,
    handleUpdateResultsDisplay,
  } = useUploadStats();

  const {
    documents,
    handleAddDocument,
    handleUpdateDocument,
    handleResetInitialDocumentsState,
  } = useDocuments();

  const {
    pages,
    handleAddPage,
    handleRemovePageSelection,
    handleClearPageSelection,
    handlePageSelection,
    handlePagesSelection,
    handleResetInitialPagesstate,
  } = usePages();

  const handlehandleResetInitialStates = () => {
    handleResetInitialDocumentsState();
    handleResetInitialUploadState();
    handleResetInitialPagesstate();
    updateFormStep(0);
    setExtractionOption("EXTRACT_EVEN_PAGES");
  };

  const handleChange = (event) => {
    //Calling handleExtractPagesFileSelection function to extract pdf pages and their data and insert them in an array
    handleExtractPagesFileSelection(
      event,
      setLoadedFilesCount,
      handleAddDocument,
      handleAddPage,
      t,
      mountedRef,
      ExtractPagesTool
    );
  };

  const extrcatPages = async (
    signal,
    documents,
    updateFormStep,
    extractionOption,
    selectedIndexesArray
  ) => {
    /**
     * Files compressing will be done on three steps:
     *** First step : uploading files one by one to server
     *** Second step : sending requests to server to Start Files Processing, sending individual request for each file
     *** Second step : sending periodic download requests to check if files are done compressing and return the result, sending individual download requests for each file.
     */

    // //updating form step in UI
    updateFormStep(3);
    //First step : Uploading Files & Start Files Processing

    // Array-like object
    const data = {
      selectedIndexesArray: selectedIndexesArray,
      extractionOption: extractionOption,
    };

    const { uploadResponsesArray, uploadResponsesUnseccessfulRequests } =
      await uploadFiles({
        signal: signal,
        documents: documents,
        handleUpdateCurrentUploadingStatus: handleUpdateCurrentUploadingStatus,
        uri: ExtractPagesTool.URI,
        data: data,
      });

    updateFormStep(4);

    // //Second step : Check if files are done processing
    const { downloadResponsesArray, downloadResponsesUnseccessfulRequests } =
      await downloadFiles({
        responseMimeType: ExtractPagesTool.outputFileMimeType,
        signal: signal,
        uploadResponsesArray: uploadResponsesArray,
        handleUpdateDocument: handleUpdateDocument,
      });

    //stroing all failed documents from each step in an array
    const failedFiles = [
      ...uploadResponsesUnseccessfulRequests,
      ...downloadResponsesUnseccessfulRequests,
    ];

    //check if all documents have been processed, no failed documents
    if (downloadResponsesArray.length === 1) {
      handleUpdateResultsDisplay(true, []);
    } else {
      //check if all documents have failed being processed
      handleUpdateResultsDisplay(false, failedFiles);
    }
    //updating form step in UI
    updateFormStep(5);
  };

  const handlePagesExtraction = () => {
    //reset upload status
    handleResetCurrentUploadingStatus();

    //Check if extraction option is "EXTRACT_EVEN_PAGES" and even pages doesn't exist
    if (extractionOption === "EXTRACT_EVEN_PAGES" && pages.length === 1) {
      notify(
        "warning",
        "No matching pages found. Correct your input and try again."
      );
      return;
    }

    //extract selected Pages indexes
    const selectedIndexesArray = [];

    pages.map((page, i) => {
      if (page.selected === true) {
        selectedIndexesArray.push(i + 1);
      }
    });

    //Check if extraction option is 3 === (select specific pages) and no page is selected
    if (
      extractionOption === "EXTRACT_SELECTED_PAGES" &&
      selectedIndexesArray.length === 0
    ) {
      notify(
        "warning",
        "No selected pages found. Please select at least one page."
      );
      return;
    }

    extrcatPages(
      requestSignal,
      documents,
      updateFormStep,
      extractionOption,
      selectedIndexesArray
    );
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

    setScrollOptions({
      container: document.body,
      getScrollPosition: () => [
        document.body.scrollLeft,
        document.body.scrollTop,
      ],
      throttleTime: 0,
      threshold: 0,
    });

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
    <div
      className={`previewer_content ${styles.previewer_content} d-flex flex-wrap ${styles.previewer_content_scrollable} mb-0`}
    >
      {!isMobile && (
        <Selecto
          dragContainer={".previewer_content"}
          selectableTargets={[".preview"]}
          selectByClick={false}
          selectFromInside={false}
          toggleContinueSelect={["ctrl"]}
          boundContainer={false}
          hitRate={0}
          ratio={0}
          onSelectStart={(e) => {
            if (
              pages.filter((page) => page.selected === true).length > 0 &&
              !e.inputEvent.ctrlKey
            ) {
              handleClearPageSelection();
            }
          }}
          onSelect={(e) => {
            e.added.forEach((el) => {
              const index = parseInt(el.getAttribute("data-index"));
              handlePageSelection(index);
            });
            e.removed.forEach((el) => {
              const removedIndex = parseInt(el.getAttribute("data-index"));
              if (e.selected.length === 0) {
                handleClearPageSelection();
              } else {
                handleRemovePageSelection(removedIndex);
              }
            });
          }}
          scrollOptions={scrollOptions}
          onScroll={(e) => {
            document.body.scrollBy(e.direction[0] * 10, e.direction[1] * 10);
          }}
        />
      )}

      {pages.map((page, i) => {
        return (
          <DocumentPreviewSelectable
            key={"page-" + page.id}
            page={page}
            index={i}
            onSelectionChange={handlePagesSelection}
          />
        );
      })}
    </div>
  );

  return (
    <>
      <Head>
        {/* Anything you add here will be added to this page only */}
        <title>Extract PDF Pages | Easy and Free Online PDF Page Extraction Tool</title>
        <meta
          name="description"
          content="Extract pages from your PDF files effortlessly with our intuitive online tool. Whether you need to separate certain pages for sharing or editing, our PDF page extractor is quick, secure, and free to use!"
        />
        <meta
          name="Keywords"
          content="extract pdf pages, pdf page extractor, remove pages from PDF, free online pdf page extractor, split PDF, online PDF splitter."
        />
        {/* You can add your canonical link here */}
        <link rel="canonical"
          href={`https://pdfdok.com${ExtractPagesTool.href}`}
          key="canonical" />
        {/* You can add your alternate links here, example: */}
<link
  rel="alternate"
  href={`https://pdfdok.com/en${ExtractPagesTool.href}`}
  hreflang="en"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/es${ExtractPagesTool.href}`}
  hreflang="es"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ar${ExtractPagesTool.href}`}
  hreflang="ar"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/zh${ExtractPagesTool.href}`}
  hreflang="zh"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/de${ExtractPagesTool.href}`}
  hreflang="de"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/fr${ExtractPagesTool.href}`}
  hreflang="fr"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/it${ExtractPagesTool.href}`}
  hreflang="it"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/pt${ExtractPagesTool.href}`}
  hreflang="pt"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ru${ExtractPagesTool.href}`}
  hreflang="ru"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/uk${ExtractPagesTool.href}`}
  hreflang="uk"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/id${ExtractPagesTool.href}`}
  hreflang="id"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/da${ExtractPagesTool.href}`}
  hreflang="da"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/nl${ExtractPagesTool.href}`}
  hreflang="nl"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/hi${ExtractPagesTool.href}`}
  hreflang="hi"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ko${ExtractPagesTool.href}`}
  hreflang="ko"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ja${ExtractPagesTool.href}`}
  hreflang="ja"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com${ExtractPagesTool.href}`}
  hreflang="x-default"
/>
      </Head>

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("extract-pdf-pages:page_header_title")}</h1>
          <p className="description">
            {t("extract-pdf-pages:page_header_text")}
          </p>
        </header>
        <section className="page_section mt-0">
          <article className="container ">
            <section className={pageStyles.tool_container_wrapper}>
              {/* Container start */}

              {formStep === 0 && (
                <UploadAreaFormStep
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={false}
                  acceptedMimeType={ExtractPagesTool.acceptedInputMimeType}
                />
              )}

              {formStep === 1 && (
                <SelectOptionFormStep
                  title={t("extract-pdf-pages:select_pages_extraction_option")}
                  action={() => {
                    //CONVERT ENTIRE PAGES
                    if (
                      extractionOption === "EXTRACT_ODD_PAGES" ||
                      extractionOption === "EXTRACT_EVEN_PAGES"
                    ) {
                      handlePagesExtraction();
                    } else if (extractionOption === "EXTRACT_SELECTED_PAGES") {
                      //Next Step select images to extact
                      updateFormStep(2);
                    }
                  }}
                  /* Start Images Extraction or Select Images to be extracted */
                  actionTitle={
                    extractionOption === "EXTRACT_ODD_PAGES" ||
                    extractionOption === "EXTRACT_EVEN_PAGES"
                      ? t("extract-pdf-pages:start_pages_extraction")
                      : t("extract-pdf-pages:select_pages_to_extract")
                  }
                >
                  <Option
                    onChange={() => setExtractionOption("EXTRACT_ODD_PAGES")}
                    isChecked={extractionOption === "EXTRACT_ODD_PAGES"}
                    value="1"
                  >
                    <span>
                      {t("extract-pdf-pages:extract_odd_pages")}{" "}
                      <span className={`${styles.pdf_to_image_option_desc}`}>
                        {t("extract-pdf-pages:extract_odd_pages_description")}
                      </span>
                    </span>
                  </Option>

                  <Option
                    onChange={() => setExtractionOption("EXTRACT_EVEN_PAGES")}
                    isChecked={extractionOption === "EXTRACT_EVEN_PAGES"}
                    value="2"
                  >
                    <span>
                      {t("extract-pdf-pages:extract_even_pages")}{" "}
                      <span className={`${styles.pdf_to_image_option_desc}`}>
                        {t("extract-pdf-pages:extract_even_pages_description")}
                      </span>
                    </span>
                  </Option>

                  <Option
                    onChange={() =>
                      setExtractionOption("EXTRACT_SELECTED_PAGES")
                    }
                    isChecked={extractionOption === "EXTRACT_SELECTED_PAGES"}
                    value="3"
                  >
                    <span>
                      {t("extract-pdf-pages:extract_selected_pages")}{" "}
                      <span className={`${styles.pdf_to_image_option_desc}`}>
                        {t(
                          "extract-pdf-pages:extract_selected_pages_description"
                        )}
                      </span>
                    </span>
                  </Option>
                </SelectOptionFormStep>
              )}

              {formStep === 2 &&
                extractionOption === "EXTRACT_SELECTED_PAGES" && (
                  <EditFilesFormStep
                    showTitle={t("extract-pdf-pages:select_pages_to_extract")}
                    acceptedMimeType={ExtractPagesTool.acceptedInputMimeType}
                    files={pages}
                    enableAddingMoreFiles={false}
                    filesComponents={pagesComponentsArray}
                    handleChange={handleChange}
                    isSpinnerActive={isSpinnerActive}
                    isMultipleInput={false}
                    isFilesSelectionActive={true}
                    isPanelTopSticky={false}
                    isPanelBottomSticky={true}
                    positionPanelBottomItems={styles.spaced}
                    action={handlePagesExtraction}
                    actionTitle={
                      formStep === 0
                        ? t("extract-pdf-pages:select_pages_extraction_option")
                        : t("extract-pdf-pages:start_pages_extraction")
                    }
                  />
                )}

              {formStep === 3 && (
                <UploadingFilesFormStep
                  title={t("common:uploading_file")}
                  uploadTimeLeft={uploadTimeLeft}
                  uploadSpeed={uploadSpeed}
                  totalUploadingProgress={totalUploadingProgress}
                  currentUploadingFileName={currentUploadingFile?.fileName}
                  currentUploadingFileSize={currentUploadingFile?.fileSize}
                />
              )}

              {formStep === 4 && (
                <ProcessingFilesFormStep
                  progress={t("extract-pdf-pages:extracting_pages")}
                />
              )}

              {formStep === 5 && (
                <DownloadFilesFormStep
                  title={t("extract-pdf-pages:pages_extraction_is_complete")}
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
          title={t("extract-pdf-pages:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("extract-pdf-pages:how_to_step_one"),
            },
            {
              number: 2,
              description: t("extract-pdf-pages:how_to_step_two"),
            },
            {
              number: 3,
              description: t("extract-pdf-pages:how_to_step_three"),
            },
            {
              number: 4,
              description: t("extract-pdf-pages:how_to_step_four"),
            },
            {
              number: 5,
              description: t("extract-pdf-pages:how_to_step_five"),
            },
          ]}
        />
        {/* steps end */}
        {/* features start */}
        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: t("extract-pdf-pages:feature_one_title"),
              description: t("extract-pdf-pages:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("extract-pdf-pages:feature_two_title"),
              description: t("extract-pdf-pages:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("extract-pdf-pages:feature_three_title"),
              description: t("extract-pdf-pages:feature_three_text"),
              icon: <GearFill />,
            },
            {
              title: t("extract-pdf-pages:feature_four_title"),
              description: t("extract-pdf-pages:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("extract-pdf-pages:feature_five_title"),
              description: t("extract-pdf-pages:feature_five_text"),
              icon: <HeartFill />,
            },

            {
              title: t("extract-pdf-pages:feature_six_title"),
              description: t("extract-pdf-pages:feature_six_text"),
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
                {t("extract-pdf-pages:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("extract-pdf-pages:article_paragraph_01")}</p>
              <p>{t("extract-pdf-pages:article_paragraph_02")}</p>
              <p>{t("extract-pdf-pages:article_paragraph_03")}</p>
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
export default ExtractPagesPage;
