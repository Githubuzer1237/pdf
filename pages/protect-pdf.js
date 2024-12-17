import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";  // Новый импорт
import {
  Infinity as InfinityIcon,
  LightningChargeFill,
  Lock,
  HeartFill,
  AwardFill,
  ShieldFillCheck,
  Check2Circle,
  ExclamationTriangle,
} from "react-bootstrap-icons";
import useUploadStats from "../hooks/useUploadStats";
import useDocuments from "../hooks/useDocuments";
import useToolsData from "../hooks/useToolsData";
import usePassword from "../hooks/usePassword";
import ProcessingFilesFormStep from "../components/ProcessingFilesFormStep";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import Steps from "../components/Steps";
import Features from "../components/Features";
import Share from "../components/Share";
import DownloadFilesFormStep from "../components/DownloadFilesFormStep";
import AvailableTools from "../components/AvailableTools";
import PasswordForm from "../components/PasswordForm";
import styles from "../styles/UploadContainer.module.css";
import {
  handleFileSelection,
  saveNewFiles,
  uploadFiles,
  downloadFiles,
} from "../helpers/utils.js";
import Alerts from "../components/Alerts";
import pageStyles from "../styles/Page.module.css";
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "protect-pdf"])),
    },
  };
}
const ProtectPDFPage = () => {
  const { ProtectPDFTool } = useToolsData();
  const mountedRef = useRef(false);
  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  const [formStep, updateFormStep] = useState(0);
  //loadedfilesCount is used to count the files currently being loaded to show spinner while loading the files
  const [loadedfilesCount, setLoadedFilesCount] = useState(0);
  const [requestSignal, setRequestSignal] = useState();
  const { t } = useTranslation();

  const {
    resultsInfoVisibility,
    resultsErrors,
    handleResetInitialUploadState,
    handleUpdateResultsDisplay,
  } = useUploadStats();

  const {
    documents,
    handleAddDocument,
    handleUpdateDocument,
    handleResetInitialDocumentsState,
  } = useDocuments();

  const {
    password,
    confirmPassword,
    passwordsMatch,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleResetPassword,
  } = usePassword();

  const handleChange = (event) => {
    //Calling handleFileSelection function to extract pdf pages and their data and insert them in an array
    handleFileSelection(
      event,
      setLoadedFilesCount,
      handleAddDocument,
      t,
      mountedRef,
      ProtectPDFTool
    );
  };

  const handlehandleResetInitialStates = () => {
    handleResetInitialDocumentsState();
    handleResetInitialUploadState();
    handleResetPassword();
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    /**
     * File protection  will be done on two steps:
     *** First step : uploading file to server and start processing it
     *** Second step : sending periodic download requests to check if file is done processing and return the result.
     */

    //updating form step in UI
    updateFormStep(2);

    //First step : Uploading Files & Start Files Processing
    // storing password in data Array-like object
    const data = {
      password: password,
    };

    const { uploadResponsesArray, uploadResponsesUnseccessfulRequests } =
      await uploadFiles({
        signal: requestSignal,
        documents: documents,
        uri: ProtectPDFTool.URI,
        data: data,
      });

    //in case error occured while uploding file
    if (uploadResponsesUnseccessfulRequests.length === 1) {
      handleUpdateResultsDisplay(false, uploadResponsesUnseccessfulRequests);
      updateFormStep(3);
      return;
    }

    //Second step : Check if files are done processing
    const { downloadResponsesArray, downloadResponsesUnseccessfulRequests } =
      await downloadFiles({
        responseMimeType: ProtectPDFTool.outputFileMimeType,
        signal: requestSignal,
        uploadResponsesArray,
        handleUpdateDocument,
      });

    //check if all documents have been processed, no failed documents
    if (downloadResponsesArray.length === 1) {
      handleUpdateResultsDisplay(true, []);
    } else {
      //in case error occured while downloading the file
      //check if document has failed being processed
      handleUpdateResultsDisplay(false, downloadResponsesUnseccessfulRequests);
    }
    //updating form step in UI
    updateFormStep(3);
  };

  useEffect(() => {
    if (documents.length <= 0) {
      updateFormStep(0);
    } else {
      updateFormStep(1);
    }
  }, [documents.length]);


  const router = useRouter();          // Новый код для получения информации о маршруте
  const { locale } = router;           // Получаем текущий язык страницы
  const canonicalUrl = `https://pdfdok.com${locale === 'en' ? '' : '/' + locale}${ProtectPDFTool.href}`; // Определяем канонический URL
  



  return (
    <>
      <Head>
        {/* Anything you add here will be added to this page only */}
        <title>Password Protect PDF | Protect Your PDF Files Online Free</title>
        <meta
          name="description"
          content="Protect your PDF files by adding a password to secure them from unauthorized access. Easily encrypt your PDF documents online with our simple and fast PDF protection tool."
        />
        <meta
          name="Keywords"
          content="Protect PDF, PDF protection, PDF encryption, secure PDF, password protect PDF, online PDF protection, PDF security, PDF password, PDF security tool, PDF encryption tool"
        />
        {/* You can add your canonical link here */}
        <link rel="canonical" href={canonicalUrl} key="canonical" />

        {/* You can add your alternate links here, example: */}
        <link
          rel="alternate"
          href={`https://pdfdok.com/en${ProtectPDFTool.href}`}
          hrefLang="en"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/es${ProtectPDFTool.href}`}
          hrefLang="es"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ar${ProtectPDFTool.href}`}
          hrefLang="ar"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/zh${ProtectPDFTool.href}`}
          hrefLang="zh"
        />{" "}
        <link
          rel="alternate"
          href={`https://pdfdok.com/de${ProtectPDFTool.href}`}
          hrefLang="de"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/fr${ProtectPDFTool.href}`}
          hrefLang="fr"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/it${ProtectPDFTool.href}`}
          hrefLang="it"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/pt${ProtectPDFTool.href}`}
          hrefLang="pt"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ru${ProtectPDFTool.href}`}
          hrefLang="ru"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/uk${ProtectPDFTool.href}`}
          hrefLang="uk"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/id${ProtectPDFTool.href}`}
          hrefLang="id"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/da${ProtectPDFTool.href}`}
          hrefLang="da"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/nl${ProtectPDFTool.href}`}
          hrefLang="nl"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/hi${ProtectPDFTool.href}`}
          hrefLang="hi"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ko${ProtectPDFTool.href}`}
          hrefLang="ko"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ja${ProtectPDFTool.href}`}
          hrefLang="ja"
        />
      </Head>

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("protect-pdf:page_header_title")}</h1>
          <p className="description">{t("protect-pdf:page_header_text")}</p>
        </header>
        <section className="page_section mt-0">
          <article className="container">
            <section className={pageStyles.tool_container_wrapper}>
              {/* Container start */}
              {formStep === 0 && (
                <UploadAreaFormStep
                  handleChange={handleChange}
                  isSpinnerActive={isSpinnerActive}
                  isMultipleInput={false}
                  acceptedMimeType={ProtectPDFTool.acceptedInputMimeType}
                />
              )}
              {formStep === 1 && (
                <PasswordForm
                  password={password}
                  confirmPassword={confirmPassword}
                  passwordsMatch={passwordsMatch}
                  setPassword={handlePasswordChange}
                  setConfirmPassword={handleConfirmPasswordChange}
                  handleSubmit={handleSubmit}
                  actionTitle={t("protect-pdf:protect_pdf")}
                />
              )}

              {formStep === 2 && (
                <ProcessingFilesFormStep
                  progress={t("protect-pdf:locking_pdf")}
                />
              )}

              {formStep === 3 && (
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
          title={t("protect-pdf:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("protect-pdf:how_to_step_one"),
            },
            {
              number: 2,
              description: t("protect-pdf:how_to_step_two"),
            },
            {
              number: 3,
              description: t("protect-pdf:how_to_step_three"),
            },
          ]}
        />
        {/* steps end */}
        {/* features start */}
        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: t("protect-pdf:feature_one_title"),
              description: t("protect-pdf:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("protect-pdf:feature_two_title"),
              description: t("protect-pdf:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("protect-pdf:feature_three_title"),
              description: t("protect-pdf:feature_three_text"),
              icon: <Lock />,
            },
            {
              title: t("protect-pdf:feature_four_title"),
              description: t("protect-pdf:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("protect-pdf:feature_five_title"),
              description: t("protect-pdf:feature_five_text"),
              icon: <HeartFill />,
            },
            {
              title: t("protect-pdf:feature_six_title"),
              description: t("protect-pdf:feature_six_text"),
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
                {t("protect-pdf:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("protect-pdf:article_paragraph_01")}</p>
              <p>{t("protect-pdf:article_paragraph_02")}</p>
              <p>{t("protect-pdf:article_paragraph_03")}</p>
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
export default ProtectPDFPage;
