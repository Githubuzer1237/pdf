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
import DocumentPreview from "../components/DocumentPreview";

import { ZipFiles, handlePDFToZIPFileSelection } from "../helpers/utils.js";

import styles from "../styles/UploadContainer.module.css";
import Steps from "../components/Steps";
import Features from "../components/Features";
import Share from "../components/Share";
import EditFilesFormStep from "../components/EditFilesFormStep";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import AvailableTools from "../components/AvailableTools";
import useDocuments from "../hooks/useDocuments";
import useToolsData from "../hooks/useToolsData";
import pageStyles from "../styles/Page.module.css";
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "pdf-to-zip"])),
    },
  };
}

const PDFToZipPage = () => {
  const { PDFToZIPTool } = useToolsData();

  const {
    documents,
    handleAddDocument,
    handleDeleteDocument,
    handleResetInitialDocumentsState,
  } = useDocuments();

  const { t } = useTranslation();

  const mountedRef = useRef(false);
  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  //loadedfilesCount is used to count the files currently being loaded to show progress spinner while loading the files //
  const [loadedfilesCount, setLoadedFilesCount] = useState(0);

  const handleChange = (event) => {
    //Calling handlePDFToZIPFileSelection function to extract pdf pages and their data and insert them in an array
    handlePDFToZIPFileSelection(
      event,
      setLoadedFilesCount,
      handleAddDocument,
      t,
      mountedRef,
      PDFToZIPTool
    );
  };

  const handleDownload = () => {
    ZipFiles(documents);
  };

  useEffect(() => {
    //set mountedRef to true
    mountedRef.current = true;

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
          />
        );
      })}
    </div>
  );

  const router = useRouter();          // Новый код для получения информации о маршруте
  const { locale } = router;           // Получаем текущий язык страницы
  const canonicalUrl = `https://pdfdok.com${locale === 'en' ? '' : '/' + locale}${PDFToZIPTool.href}`; // Определяем канонический URL
  


  return (
    <>
      <Head>
        {/* Anything you add here will be added to this page only */}
        <title>Convert PDF to ZIP | Compress Your PDF Files Online Free</title>
        <meta
          name="description"
          content="PDF to ZIP format with our efficient PDF to ZIP converter. Reduce file size and simplify file sharing by compressing multiple PDF documents into a single ZIP archive."
        />
        <meta
          name="Keywords"
          content="PDF to ZIP, Online PDF to ZIP Converter, Convert PDF to ZIP, ZIP converter, compress PDF files, online PDF to ZIP"
        />
        {/* You can add your canonical link here */}
        <link rel="canonical" href={canonicalUrl} key="canonical" />

        {/* You can add your alternate links here, example: */}
        <link
          rel="alternate"
          href={`https://pdfdok.com/en${PDFToZIPTool.href}`}
          hrefLang="en"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/es${PDFToZIPTool.href}`}
          hrefLang="es"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ar${PDFToZIPTool.href}`}
          hrefLang="ar"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/zh${PDFToZIPTool.href}`}
          hrefLang="zh"
        />{" "}
        <link
          rel="alternate"
          href={`https://pdfdok.com/de${PDFToZIPTool.href}`}
          hrefLang="de"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/fr${PDFToZIPTool.href}`}
          hrefLang="fr"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/it${PDFToZIPTool.href}`}
          hrefLang="it"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/pt${PDFToZIPTool.href}`}
          hrefLang="pt"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ru${PDFToZIPTool.href}`}
          hrefLang="ru"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/uk${PDFToZIPTool.href}`}
          hrefLang="uk"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/id${PDFToZIPTool.href}`}
          hrefLang="id"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/da${PDFToZIPTool.href}`}
          hrefLang="da"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/nl${PDFToZIPTool.href}`}
          hrefLang="nl"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/hi${PDFToZIPTool.href}`}
          hrefLang="hi"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ko${PDFToZIPTool.href}`}
          hrefLang="ko"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ja${PDFToZIPTool.href}`}
          hrefLang="ja"
        />
      </Head>

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("pdf-to-zip:page_header_title")}</h1>
          <p className="description">{t("pdf-to-zip:page_header_text")}</p>
        </header>
        <section className="page_section mt-0">
          <article className="container ">
            <section className={pageStyles.tool_container_wrapper}>
              {/* Container start */}

              {documents.length <= 0 ? (
                <UploadAreaFormStep
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={true}
                  acceptedMimeType={PDFToZIPTool.acceptedInputMimeType}
                />
              ) : (
                <EditFilesFormStep
                  acceptedMimeType={PDFToZIPTool.acceptedInputMimeType}
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
                  action={() => handleDownload()}
                  actionTitle={t("pdf-to-zip:create_zip")}
                />
              )}

              {/* Conatiner end */}
            </section>
          </article>
        </section>
        {/* steps Start */}
        <Steps
          title={t("pdf-to-zip:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("pdf-to-zip:how_to_step_one"),
            },
            {
              number: 2,
              description: t("pdf-to-zip:how_to_step_two"),
            },
            {
              number: 3,
              description: t("pdf-to-zip:how_to_step_three"),
            },
            {
              number: 4,
              description: t("pdf-to-zip:how_to_step_four"),
            },
          ]}
        />
        {/* steps end */}
        {/* features start */}
        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: t("pdf-to-zip:feature_one_title"),
              description: t("pdf-to-zip:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("pdf-to-zip:feature_two_title"),
              description: t("pdf-to-zip:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("pdf-to-zip:feature_three_title"),
              description: t("pdf-to-zip:feature_three_text"),
              icon: <GearFill />,
            },
            {
              title: t("pdf-to-zip:feature_four_title"),
              description: t("pdf-to-zip:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("pdf-to-zip:feature_five_title"),
              description: t("pdf-to-zip:feature_five_text"),
              icon: <HeartFill />,
            },

            {
              title: t("pdf-to-zip:feature_six_title"),
              description: t("pdf-to-zip:feature_six_text"),
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
                {t("pdf-to-zip:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("pdf-to-zip:article_paragraph_01")}</p>
              <p>{t("pdf-to-zip:article_paragraph_02")}</p>
              <p>{t("pdf-to-zip:article_paragraph_03")}</p>
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
export default PDFToZipPage;
