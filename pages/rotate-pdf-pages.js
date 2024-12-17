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
import { isMobile } from "react-device-detect";
import PagePreviwerModal from "../components/PagePreviwerModal";
import {
  handleMerge,
  handlePDFOperationsFileSelection,
} from "../helpers/utils.js";
import Steps from "../components/Steps";
import styles from "../styles/UploadContainer.module.css";
import DocumentPreviewSelectable from "../components/DocumentPreviewSelectable";
import Features from "../components/Features";
import Share from "../components/Share";
import EditFilesFormStep from "../components/EditFilesFormStep";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import AvailableTools from "../components/AvailableTools";
import usePages from "../hooks/usePages";
import useToolsData from "../hooks/useToolsData";
import pageStyles from "../styles/Page.module.css";
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "rotate-pdf-pages"])),
    },
  };
}

const RotatePDFPage = () => {
  const { RotatePDFTool } = useToolsData();
  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  const mountedRef = useRef(false);
  //loadedfilesCount is used to count the files currently being loaded to show progress spinner while loading the files //
  const [loadedfilesCount, setLoadedFilesCount] = useState(0);

  const [scrollOptions, setScrollOptions] = useState({});

  const [zoomedPage, setZoomedPage] = useState(null);
  const { t } = useTranslation();
  const {
    pages,
    handleAddPage,
    handleRotatePageRight,
    handleRotatePageLeft,
    handleRotateSelectedPagesToRight,
    rotateSelectedPagesToLeft,
    handleDeleteSelectedPages,
    handleRemovePageSelection,
    handleClearPageSelection,
    handlePageSelection,
    handlePagesSelection,
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
      RotatePDFTool
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
    <div
      className={`previewer_content ${styles.previewer_content} d-flex flex-wrap ${styles.previewer_content_scrollable} mb-0 mt-0`}
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
            zoomOnPage={(e) => {
              // Stop event bubbling after click event handler executes, to prevent parent click event from unselecting/selecting page
              e.stopPropagation();
              setZoomedPage(page);
            }}
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
            handleDeletePage={() => handleDeletePage(page.id)}
          />
        );
      })}
    </div>
  );

  const router = useRouter();          // Новый код для получения информации о маршруте
  const { locale } = router;           // Получаем текущий язык страницы
  const canonicalUrl = `https://pdfdok.com${locale === 'en' ? '' : '/' + locale}${RotatePDFTool.href}`; // Определяем канонический URL
  



  return (
    <>
      <Head>
        {/* Anything you add here will be added to this page only */}
        <title>Rotate PDF Page | Easily Rotate Your PDF Files Online Free</title>
        <meta
          name="description"
          content="Easily rotate your PDF pages with our online tool. Whether you need to adjust the orientation of single or multiple pages, our user-friendly interface allows you to rotate PDFs in just a few clicks."
        />
        <meta
          name="Keywords"
          content="rotate pdf pages online, rotate specific pages in pdf, pdf page orientation, online pdf page rotator, rotate pdf files online, pdf document rotator"
        />
        <link rel="canonical" href={canonicalUrl} key="canonical" />

        {/* You can add your alternate links here, example: */}
        <link
          rel="alternate"
          href={`https://pdfdok.com/en${RotatePDFTool.href}`}
          hrefLang="en"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/es${RotatePDFTool.href}`}
          hrefLang="es"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ar${RotatePDFTool.href}`}
          hrefLang="ar"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/zh${RotatePDFTool.href}`}
          hrefLang="zh"
        />{" "}
        <link
          rel="alternate"
          href={`https://pdfdok.com/de${RotatePDFTool.href}`}
          hrefLang="de"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/fr${RotatePDFTool.href}`}
          hrefLang="fr"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/it${RotatePDFTool.href}`}
          hrefLang="it"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/pt${RotatePDFTool.href}`}
          hrefLang="pt"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ru${RotatePDFTool.href}`}
          hrefLang="ru"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/uk${RotatePDFTool.href}`}
          hrefLang="uk"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/id${RotatePDFTool.href}`}
          hrefLang="id"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/da${RotatePDFTool.href}`}
          hrefLang="da"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/nl${RotatePDFTool.href}`}
          hrefLang="nl"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/hi${RotatePDFTool.href}`}
          hrefLang="hi"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ko${RotatePDFTool.href}`}
          hrefLang="ko"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ja${RotatePDFTool.href}`}
          hrefLang="ja"
        />
      </Head>

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("rotate-pdf-pages:page_header_title")}</h1>
          <p className="description">
            {t("rotate-pdf-pages:page_header_text")}
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
                  acceptedMimeType={RotatePDFTool.acceptedInputMimeType}
                />
              ) : (
                <EditFilesFormStep
                  acceptedMimeType={RotatePDFTool.acceptedInputMimeType}
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
                    handleMerge(pages, RotatePDFTool.newFileNameSuffix)
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
          title={t("rotate-pdf-pages:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("rotate-pdf-pages:how_to_step_one"),
            },
            {
              number: 2,
              description: t("rotate-pdf-pages:how_to_step_two"),
            },
            {
              number: 3,
              description: t("rotate-pdf-pages:how_to_step_three"),
            },
            {
              number: 4,
              description: t("rotate-pdf-pages:how_to_step_four"),
            },
            {
              number: 5,
              description: t("rotate-pdf-pages:how_to_step_five"),
            },
            {
              number: 6,
              description: t("rotate-pdf-pages:how_to_step_six"),
            },
          ]}
        />
        {/* steps end */}
        {/* features start */}
        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: t("rotate-pdf-pages:feature_one_title"),
              description: t("rotate-pdf-pages:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("rotate-pdf-pages:feature_two_title"),
              description: t("rotate-pdf-pages:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("rotate-pdf-pages:feature_three_title"),
              description: t("rotate-pdf-pages:feature_three_text"),
              icon: <GearFill />,
            },
            {
              title: t("rotate-pdf-pages:feature_four_title"),
              description: t("rotate-pdf-pages:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("rotate-pdf-pages:feature_five_title"),
              description: t("rotate-pdf-pages:feature_five_text"),
              icon: <HeartFill />,
            },

            {
              title: t("rotate-pdf-pages:feature_six_title"),
              description: t("rotate-pdf-pages:feature_six_text"),
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
                {t("rotate-pdf-pages:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("rotate-pdf-pages:article_paragraph_01")}</p>
              <p>{t("rotate-pdf-pages:article_paragraph_02")}</p>
              <p>{t("rotate-pdf-pages:article_paragraph_03")}</p>
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
export default RotatePDFPage;
