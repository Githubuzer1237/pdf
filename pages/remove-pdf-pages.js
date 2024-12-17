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

import styles from "../styles/UploadContainer.module.css";
import Steps from "../components/Steps";
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
      ...(await serverSideTranslations(locale, ["common", "remove-pdf-pages"])),
    },
  };
}

const DeletePDFPages = () => {
  const { RemovePDFPagesTool } = useToolsData();
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

  const handleChange = (event) => {
    //Calling handlePDFOperationsFileSelection function to extract pdf pages and their data and insert them in an array
    handlePDFOperationsFileSelection(
      event,
      setLoadedFilesCount,
      handleAddPage,
      t,
      mountedRef,
      RemovePDFPagesTool
    );
    //To empty input value; to input same file many time in a row
    event.target.value = null;
  };

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
              //
              handleDeletePage={() => handleDeletePage(page.id)}
              //
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


  const router = useRouter();          // Новый код для получения информации о маршруте
  const { locale } = router;           // Получаем текущий язык страницы
  const canonicalUrl = `https://pdfdok.com${locale === 'en' ? '' : '/' + locale}${RemovePDFPagesTool.href}`; // Определяем канонический URL
  


  return (
    <>
      <Head>
        {/* Anything you add here will be added to this page only */}
        <title>Remove PDF Pages | Easily Delete Pages from Your PDF Online Free</title>
        <meta
          name="description"
          content="Remove PDF pages effortlessly with our online tool. Easily delete unwanted pages from your PDF files without any hassle. No downloads or installations required—fast and secure PDF page removal."
        />
        <meta
          name="Keywords"
          content="remove pdf pages, pdf page remover, delete pdf pages, pdf page delete, online pdf page remover, remove specific pages from pdf, remove pages from pdf online"
        />
        {/* You can add your canonical link here */}
        <link rel="canonical" href={canonicalUrl} key="canonical" />

        {/* You can add your alternate links here, example: */}
        <link
          rel="alternate"
          href={`https://pdfdok.com/en${RemovePDFPagesTool.href}`}
          hrefLang="en"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/es${RemovePDFPagesTool.href}`}
          hrefLang="es"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ar${RemovePDFPagesTool.href}`}
          hrefLang="ar"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/zh${RemovePDFPagesTool.href}`}
          hrefLang="zh"
        />{" "}
        <link
          rel="alternate"
          href={`https://pdfdok.com/de${RemovePDFPagesTool.href}`}
          hrefLang="de"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/fr${RemovePDFPagesTool.href}`}
          hrefLang="fr"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/it${RemovePDFPagesTool.href}`}
          hrefLang="it"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/pt${RemovePDFPagesTool.href}`}
          hrefLang="pt"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ru${RemovePDFPagesTool.href}`}
          hrefLang="ru"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/uk${RemovePDFPagesTool.href}`}
          hrefLang="uk"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/id${RemovePDFPagesTool.href}`}
          hrefLang="id"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/da${RemovePDFPagesTool.href}`}
          hrefLang="da"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/nl${RemovePDFPagesTool.href}`}
          hrefLang="nl"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/hi${RemovePDFPagesTool.href}`}
          hrefLang="hi"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ko${RemovePDFPagesTool.href}`}
          hrefLang="ko"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ja${RemovePDFPagesTool.href}`}
          hrefLang="ja"
        />
      </Head>

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("remove-pdf-pages:page_header_title")}</h1>
          <p className="description">
            {t("remove-pdf-pages:page_header_text")}
          </p>
        </header>
        <section className="page_section mt-0">
          <article className="container ">
            <section className={pageStyles.tool_container_wrapper}>
              {/* Container start */}
              {pages.length <= 0 ? (
                <UploadAreaFormStep
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={true}
                  acceptedMimeType={RemovePDFPagesTool.acceptedInputMimeType}
                />
              ) : (
                <EditFilesFormStep
                  acceptedMimeType={RemovePDFPagesTool.acceptedInputMimeType}
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
                    handleMerge(pages, RemovePDFPagesTool.newFileNameSuffix)
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
          title={t("remove-pdf-pages:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("remove-pdf-pages:how_to_step_one"),
            },
            {
              number: 2,
              description: t("remove-pdf-pages:how_to_step_two"),
            },
            {
              number: 3,
              description: t("remove-pdf-pages:how_to_step_three"),
            },
            {
              number: 4,
              description: t("remove-pdf-pages:how_to_step_four"),
            },
            {
              number: 5,
              description: t("remove-pdf-pages:how_to_step_five"),
            },
          ]}
        />
        {/* steps end */}
        {/* features start */}
        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: t("remove-pdf-pages:feature_one_title"),
              description: t("remove-pdf-pages:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("remove-pdf-pages:feature_two_title"),
              description: t("remove-pdf-pages:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("remove-pdf-pages:feature_three_title"),
              description: t("remove-pdf-pages:feature_three_text"),
              icon: <GearFill />,
            },
            {
              title: t("remove-pdf-pages:feature_four_title"),
              description: t("remove-pdf-pages:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("remove-pdf-pages:feature_five_title"),
              description: t("remove-pdf-pages:feature_five_text"),
              icon: <HeartFill />,
            },

            {
              title: t("remove-pdf-pages:feature_six_title"),
              description: t("remove-pdf-pages:feature_six_text"),
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
                {t("remove-pdf-pages:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("remove-pdf-pages:article_paragraph_01")}</p>
              <p>{t("remove-pdf-pages:article_paragraph_02")}</p>
              <p>{t("remove-pdf-pages:article_paragraph_03")}</p>
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
export default DeletePDFPages;
