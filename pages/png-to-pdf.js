import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";  // Новый импорт
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
import Selecto from "react-selecto";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { isMobile } from "react-device-detect";
import ImageDragLayer from "../components/ImageDragLayer";
import {
  saveNewFiles,
  handleMerge,
  convertImageToPDF,
  handleImagesSelection,
} from "../helpers/utils.js";
import Steps from "../components/Steps";
import styles from "../styles/UploadContainer.module.css";
import Features from "../components/Features";
import Share from "../components/Share";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import ImagePreviewDraggable from "../components/ImagePreviewDraggable";
import ProcessingFilesFormStep from "../components/ProcessingFilesFormStep";
import DownloadFilesFormStep from "../components/DownloadFilesFormStep";
import SetPagesSettingsFormStep from "../components/SetPagesSettingsFormStep";
import AvailableTools from "../components/AvailableTools";
import useImages from "../hooks/useImages";
import useUploadStats from "../hooks/useUploadStats";
import useToolsData from "../hooks/useToolsData";
import Alerts from "../components/Alerts";
import pageStyles from "../styles/Page.module.css";
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "png-to-pdf"])),
    },
  };
}

const PNGToPDFPage = () => {
  const { PNGToPDFTool } = useToolsData();

  const {
    pages,
    hoverIndex,
    insertIndex,
    handleResetInitialState,
    handleAddPage,
    handleClearPageSelection,
    handlePageSelection,
    handleRemovePageSelection,
    handlePagesSelection,
    handleRotatePageRight,
    handleRotateSelectedPagesToRight,
    handleMarginChange,
    handleDeleteSelectedPages,
    handleSetInsertIndex,
    handleRearrangePages,
    handleDeletePage,
    handleUpdateDocument,
    handleOrientationChange,
    handlePageSizeChange,
  } = useImages();

  const {
    resultsInfoVisibility,
    resultsErrors,
    handleResetInitialUploadState,
    handleResetCurrentUploadingStatus,
    handleUpdateResultsDisplay,
  } = useUploadStats();

  const { t } = useTranslation();

  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  const [formStep, updateFormStep] = useState(0);
  const mountedRef = useRef(false);
  //loadedfilesCount is used to count the files currently being loaded to show progress spinner while loading the files //
  const [loadedfilesCount, setLoadedFilesCount] = useState(0);
  const [scrollOptions, setScrollOptions] = useState({});
  const [mergePages, setMergePages] = useState(true);

  const opts = {
    scrollAngleRanges: [
      { start: 30, end: 150 },
      { start: 210, end: 330 },
    ],
  };
  const [requestSignal, setRequestSignal] = useState();

  const handleChange = (event) => {
    //Calling handleImagesSelection function to extract pdf pages and their data and insert them in an array
    handleImagesSelection(
      event,
      setLoadedFilesCount,
      handleAddPage,
      t,
      mountedRef,
      PNGToPDFTool
    );
    //To empty input value; to input same file many time in a row
    event.target.value = null;
  };

  const handleConvertPNGToPDF = async () => {
    //reset upload status
    handleResetCurrentUploadingStatus();

    // updating form step in UI
    updateFormStep(2);

    // Uploading Files and converting images to pdf
    const { successfullyConvertedFiles, failedFiles } = await convertImageToPDF(
      PNGToPDFTool.outputFileMimeType,
      requestSignal,
      pages,
      handleUpdateDocument,
      PNGToPDFTool.URI
    );

    //check if all documents have been processed, no failed documents
    if (successfullyConvertedFiles.length === pages.length) {
      handleUpdateResultsDisplay(true, []);
    } else {
      //check if all documents have failed being processed
      if (failedFiles.length === pages.length) {
        handleUpdateResultsDisplay(false, failedFiles);
      } else {
        //If some documents have being successfuly processed and some documents have failed being processed
        handleUpdateResultsDisplay(true, failedFiles);
      }
    }
    //updating form step in UI
    updateFormStep(3);
  };

  const handleCheckboxChange = (e) => {
    setMergePages(e.target.checked);
  };

  const handlehandleResetInitialStates = () => {
    handleResetInitialState();
    handleResetInitialUploadState();
    setMergePages(true);
    updateFormStep(0);
  };

  const handleDownload = () => {
    if (mergePages) {
      // Merge all pages into a single pdf file
      handleMerge(pages, PNGToPDFTool.newFileNameSuffix);
    } else {
      // Download each page in a separate pdf file
      saveNewFiles(pages);
    }
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
    if (pages.length <= 0) {
      updateFormStep(0);
    } else {
      updateFormStep(1);
    }
  }, [pages.length]);

  const pagesComponentsArray = (
    <DndProvider
      backend={isMobile ? TouchBackend : HTML5Backend}
      options={isMobile ? opts : null}
    >
      <div
        className={`previewer_content ${styles.previewer_content} d-flex flex-wrap ${styles.previewer_content_scrollable}`}
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
        <ImageDragLayer />
        {pages.map((page, i) => {
          const insertLineOnLeft = hoverIndex === i && insertIndex === i;
          const insertLineOnRight = hoverIndex === i && insertIndex === i + 1;
          return (
            <ImagePreviewDraggable
              key={"page-" + page.id}
              index={i}
              page={page}
              selectedPages={pages.filter((page) => page.selected === true)}
              handleRearrangePages={handleRearrangePages}
              handleSetInsertIndex={handleSetInsertIndex}
              onSelectionChange={handlePagesSelection}
              handleClearPageSelection={handleClearPageSelection}
              insertLineOnLeft={insertLineOnLeft}
              insertLineOnRight={insertLineOnRight}
              handleDeletePage={() => handleDeletePage(page.id)}
              handleRotatePageRight={(e) => {
                // Stop event bubbling after click event handler executes, to prevent parent click event from unselecting/selecting page
                e.stopPropagation();
                handleRotatePageRight(page.id);
              }}
            />
          );
        })}
      </div>
    </DndProvider>
  );


  const router = useRouter();          // Новый код для получения информации о маршруте
  const { locale } = router;           // Получаем текущий язык страницы
  const canonicalUrl = `https://pdfdok.com${locale === 'en' ? '' : '/' + locale}${PNGToPDFTool.href}`; // Определяем канонический URL
  

  return (
    <>
      <Head>
        {/* Anything you add here will be added to this page only */}
        <title>Convert PNG to PDF | PNG to PDF Converter Online Free</title>
        <meta
          name="description"
          content="PNG to PDF format with our online converter. Upload your PNG files and create high-quality PDFs in seconds. Perfect for creating documents, reports, and presentations."
        />
        <meta
          name="Keywords"
          content="PNG to PDF converter, PNG to PDF, online PNG to PDF converter, free PNG to PDF converter, PNG image to PDF conversion."
        />
        {/* You can add your canonical link here */}
        <link rel="canonical" href={canonicalUrl} key="canonical" />
        {/* You can add your alternate links here, example: */}
        <link
          rel="alternate"
          href={`https://pdfdok.com/en${PNGToPDFTool.href}`}
          hrefLang="en"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/es${PNGToPDFTool.href}`}
          hrefLang="es"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ar${PNGToPDFTool.href}`}
          hrefLang="ar"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/zh${PNGToPDFTool.href}`}
          hrefLang="zh"
        />{" "}
        <link
          rel="alternate"
          href={`https://pdfdok.com/de${PNGToPDFTool.href}`}
          hrefLang="de"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/fr${PNGToPDFTool.href}`}
          hrefLang="fr"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/it${PNGToPDFTool.href}`}
          hrefLang="it"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/pt${PNGToPDFTool.href}`}
          hrefLang="pt"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ru${PNGToPDFTool.href}`}
          hrefLang="ru"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/uk${PNGToPDFTool.href}`}
          hrefLang="uk"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/id${PNGToPDFTool.href}`}
          hrefLang="id"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/da${PNGToPDFTool.href}`}
          hrefLang="da"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/nl${PNGToPDFTool.href}`}
          hrefLang="nl"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/hi${PNGToPDFTool.href}`}
          hrefLang="hi"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ko${PNGToPDFTool.href}`}
          hrefLang="ko"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ja${PNGToPDFTool.href}`}
          hrefLang="ja"
        />
      </Head>

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("png-to-pdf:page_header_title")}</h1>
          <p className="description">{t("png-to-pdf:page_header_text")}</p>
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
                  acceptedMimeType={PNGToPDFTool.acceptedInputMimeType}
                />
              )}

              {formStep === 1 && (
                <SetPagesSettingsFormStep
                  acceptedMimeType={PNGToPDFTool.acceptedInputMimeType}
                  files={pages}
                  enableAddingMoreFiles={true}
                  filesComponents={pagesComponentsArray}
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={true}
                  deleteFiles={handleDeleteSelectedPages}
                  rotateFilesToRight={handleRotateSelectedPagesToRight}
                  action={handleConvertPNGToPDF}
                  actionTitle={t("common:convert_to_pdf")}
                  handleCheckboxChange={handleCheckboxChange}
                  handleMarginChange={handleMarginChange}
                  handleOrientationChange={handleOrientationChange}
                  handlePageSizeChange={handlePageSizeChange}
                  mergePages={mergePages}
                />
              )}

              {formStep === 2 && (
                <ProcessingFilesFormStep
                  progress={t("common:converting_images_to_PDF")}
                />
              )}

              {formStep === 3 && (
                <DownloadFilesFormStep
                  title={t("common:images_conversion_is_complete")}
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
          title={t("png-to-pdf:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("png-to-pdf:how_to_step_one"),
            },
            {
              number: 2,
              description: t("png-to-pdf:how_to_step_two"),
            },
            {
              number: 3,
              description: t("png-to-pdf:how_to_step_three"),
            },
            {
              number: 4,
              description: t("png-to-pdf:how_to_step_four"),
            },
            {
              number: 5,
              description: t("png-to-pdf:how_to_step_five"),
            },
            {
              number: 6,
              description: t("png-to-pdf:how_to_step_six"),
            },
            {
              number: 7,
              description: t("png-to-pdf:how_to_step_seven"),
            },
            {
              number: 8,
              description: t("png-to-pdf:how_to_step_eight"),
            },
            {
              number: 9,
              description: t("png-to-pdf:how_to_step_nine"),
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
              description: t("png-to-pdf:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("png-to-pdf:feature_two_title"),
              description: t("png-to-pdf:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("png-to-pdf:feature_three_title"),
              description: t("png-to-pdf:feature_three_text"),
              icon: <GearFill />,
            },
            {
              title: t("png-to-pdf:feature_four_title"),
              description: t("png-to-pdf:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("png-to-pdf:feature_five_title"),
              description: t("png-to-pdf:feature_five_text"),
              icon: <HeartFill />,
            },

            {
              title: t("png-to-pdf:feature_six_title"),
              description: t("png-to-pdf:feature_six_text"),
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
                {t("png-to-pdf:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("png-to-pdf:article_paragraph_01")}</p>
              <p>{t("png-to-pdf:article_paragraph_02")}</p>
              <p>{t("png-to-pdf:article_paragraph_03")}</p>
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
export default PNGToPDFPage;
