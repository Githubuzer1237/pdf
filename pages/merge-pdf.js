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
} from "react-bootstrap-icons";
import { useTranslation } from "next-i18next";
import Selecto from "react-selecto";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { isMobile } from "react-device-detect";
import PagePreviwerModal from "../components/PagePreviwerModal";
import PageDragLayer from "../components/PageDragLayer";
import DocumentPreviewDraggable from "../components/DocumentPreviewDraggable";
import {
  handleMerge,
  handlePDFOperationsFileSelection,
} from "../helpers/utils.js";
import Steps from "../components/Steps";
import styles from "../styles/UploadContainer.module.css";
import Features from "../components/Features";
import Share from "../components/Share";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import EditFilesFormStep from "../components/EditFilesFormStep";
import AvailableTools from "../components/AvailableTools";
import usePages from "../hooks/usePages";
import useToolsData from "../hooks/useToolsData";
import pageStyles from "../styles/Page.module.css";
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "merge-pdf"])),
    },
  };
}

const MergePDFPage = () => {
  const { MergePDFTool } = useToolsData();
  const {
    pages,
    hoverIndex,
    insertIndex,
    handleAddPage,
    handleRotatePageRight,
    handleRotatePageLeft,
    handleRotateSelectedPagesToRight,
    rotateSelectedPagesToLeft,
    handleDeleteSelectedPages,
    handleSetInsertIndex,
    handleRemovePageSelection,
    handleClearPageSelection,
    handlePageSelection,
    handlePagesSelection,
    handleRearrangePages,
    handleDeletePage,
  } = usePages();

  const { t } = useTranslation();

  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  const mountedRef = useRef(false);
  //loadedfilesCount is used to count the files currently being loaded to show progress spinner while loading the files //
  const [loadedfilesCount, setLoadedFilesCount] = useState(0);

  const [scrollOptions, setScrollOptions] = useState({});
  const opts = {
    scrollAngleRanges: [
      { start: 30, end: 150 },
      { start: 210, end: 330 },
    ],
  };
  const [zoomedPage, setZoomedPage] = useState(null);

  const handleChange = (event) => {
    //Calling handlePDFOperationsFileSelection function to extract pdf pages and their data and insert them in an array
    handlePDFOperationsFileSelection(
      event,
      setLoadedFilesCount,
      handleAddPage,
      t,
      mountedRef,
      MergePDFTool
    );
    //To empty input value; to input same file many time in a row
    event.target.value = null;
  };

  useEffect(() => {
    //set mountedRef to true
    mountedRef.current = true;

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
      //set mounedRef to false
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (zoomedPage) {
      //clear page selection
      handleClearPageSelection();
      // get zoomed Page index
      const zoomedPageIndex = pages.findIndex(
        (page) => page.id === zoomedPage.id
      );
      // set zoomed page as selected
      handlePageSelection(zoomedPageIndex);
    }
  }, [zoomedPage]);

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
        <PageDragLayer />
        {pages.map((page, i) => {
          const insertLineOnLeft = hoverIndex === i && insertIndex === i;
          const insertLineOnRight = hoverIndex === i && insertIndex === i + 1;
          return (
            <DocumentPreviewDraggable
              key={"page-" + page.id}
              id={page.id}
              index={i}
              order={page.order}
              degree={page.degree}
              height={page.height}
              width={page.width}
              blob={page.outputBlob}
              selectedPages={pages.filter((page) => page.selected === true)}
              handleRearrangePages={handleRearrangePages}
              handleSetInsertIndex={handleSetInsertIndex}
              onSelectionChange={handlePagesSelection}
              handleClearPageSelection={handleClearPageSelection}
              insertLineOnLeft={insertLineOnLeft}
              insertLineOnRight={insertLineOnRight}
              isSelected={page.selected}
              zoomOnPage={(e) => {
                // Stop event bubbling after click event handler executes, to prevent parent click event from unselecting/selecting page
                e.stopPropagation();
                setZoomedPage(page);
              }}
              handleDeletePage={() => handleDeletePage(page.id)}
              handleRotatePageRight={(e) => {
                // Stop event bubbling after click event handler executes, to prevent parent click event from unselecting/selecting page
                e.stopPropagation();
                handleRotatePageRight(page.id);
              }}
              handleRotatePageLeft={(e) => {
                // Stop event bubbling after click event handler executes, to prevent parent click event from unselecting/selecting page
                e.stopPropagation();
                handleRotatePageLeft(page.id);
              }}
            />
          );
        })}
      </div>
    </DndProvider>
  );

  return (
    <>
      <Head>
        {/* Anything you add here will be added to this page only */}
        <title>Merge PDF Files | Combine Multiple PDFs into One Online Free</title>
        <meta
          name="description"
          content="Easily merge multiple PDF files into a single document with our online PDF merger. Combine, rearrange, and organize your PDFs effortlessly in just a few clicks. Perfect for consolidating reports, presentations, and more!"
        />
        <meta
          name="Keywords"
          content="merge PDF, PDF merger, online PDF merging, PDF combine, delete pages, rotate pages, online PDF tool, PDF document management"
        />
        {/* You can add your canonical link here */}
        <link rel="canonical"
          href={`https://pdfdok.com${MergePDFTool.href}`}
          key="canonical" />

        {/* You can add your alternate links here, example: */}
<link
  rel="alternate"
  href={`https://pdfdok.com/en${MergePDFTool.href}`}
  hreflang="en"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/es${MergePDFTool.href}`}
  hreflang="es"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ar${MergePDFTool.href}`}
  hreflang="ar"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/zh${MergePDFTool.href}`}
  hreflang="zh"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/de${MergePDFTool.href}`}
  hreflang="de"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/fr${MergePDFTool.href}`}
  hreflang="fr"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/it${MergePDFTool.href}`}
  hreflang="it"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/pt${MergePDFTool.href}`}
  hreflang="pt"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ru${MergePDFTool.href}`}
  hreflang="ru"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/uk${MergePDFTool.href}`}
  hreflang="uk"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/id${MergePDFTool.href}`}
  hreflang="id"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/da${MergePDFTool.href}`}
  hreflang="da"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/nl${MergePDFTool.href}`}
  hreflang="nl"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/hi${MergePDFTool.href}`}
  hreflang="hi"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ko${MergePDFTool.href}`}
  hreflang="ko"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com/ja${MergePDFTool.href}`}
  hreflang="ja"
/>
<link
  rel="alternate"
  href={`https://pdfdok.com${MergePDFTool.href}`}
  hreflang="x-default"
/>
      </Head>

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("merge-pdf:page_header_title")}</h1>
          <p className="description">{t("merge-pdf:page_header_text")}</p>
        </header>
        <section className="page_section mt-0">
          <article className="container">
            <section className={pageStyles.tool_container_wrapper}>
              {/* Container start */}

              {pages.length <= 0 && (
                <UploadAreaFormStep
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={true}
                  acceptedMimeType={MergePDFTool.acceptedInputMimeType}
                />
              )}

              {pages.length > 0 && (
                <EditFilesFormStep
                  acceptedMimeType={MergePDFTool.acceptedInputMimeType}
                  files={pages}
                  enableAddingMoreFiles={true}
                  filesComponents={pagesComponentsArray}
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={true}
                  isFilesSelectionActive={true}
                  isPanelTopSticky={true}
                  isPanelBottomSticky={true}
                  positionPanelBottomItems={styles.spaced}
                  deleteFiles={handleDeleteSelectedPages}
                  rotateFilesToLeft={rotateSelectedPagesToLeft}
                  rotateFilesToRight={handleRotateSelectedPagesToRight}
                  action={() =>
                    handleMerge(pages, MergePDFTool.newFileNameSuffix)
                  }
                  actionTitle={t("common:save_&_download")}
                />
              )}

              {/* Page Viwer Modal Start */}
              {zoomedPage !== null ? (
                <PagePreviwerModal
                  pages={pages}
                  currentPage={zoomedPage}
                  setZoomedPage={setZoomedPage}
                  deletePage={handleDeletePage}
                  handleRotatePageRight={handleRotatePageRight}
                  handleRotatePageLeft={handleRotatePageLeft}
                />
              ) : null}
              {/* Page Viwer Modal Start */}

              {/* Conatiner end */}
            </section>
          </article>
        </section>
        {/* steps Start */}
        <Steps
          title={t("merge-pdf:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("merge-pdf:how_to_step_one"),
            },
            {
              number: 2,
              description: t("merge-pdf:how_to_step_two"),
            },
            {
              number: 3,
              description: t("merge-pdf:how_to_step_three"),
            },
            {
              number: 4,
              description: t("merge-pdf:how_to_step_four"),
            },
            {
              number: 5,
              description: t("merge-pdf:how_to_step_five"),
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
              description: t("merge-pdf:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("merge-pdf:feature_two_title"),
              description: t("merge-pdf:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("merge-pdf:feature_three_title"),
              description: t("merge-pdf:feature_three_text"),
              icon: <GearFill />,
            },
            {
              title: t("merge-pdf:feature_four_title"),
              description: t("merge-pdf:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("merge-pdf:feature_five_title"),
              description: t("merge-pdf:feature_five_text"),
              icon: <HeartFill />,
            },

            {
              title: t("merge-pdf:feature_six_title"),
              description: t("merge-pdf:feature_six_text"),
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
                {t("merge-pdf:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("merge-pdf:article_paragraph_01")}</p>
              <p>{t("merge-pdf:article_paragraph_02")}</p>
              <p>{t("merge-pdf:article_paragraph_03")}</p>
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
export default MergePDFPage;
