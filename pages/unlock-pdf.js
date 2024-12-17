import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";  // Новый импорт
import {
  Infinity as InfinityIcon,
  LightningChargeFill,
  Unlock,
  HeartFill,
  AwardFill,
  ShieldFillCheck,
  Check2Circle,
  ExclamationTriangle,
} from "react-bootstrap-icons";
import usePassword from "../hooks/usePassword";
import useUploadStats from "../hooks/useUploadStats";
import useDocuments from "../hooks/useDocuments";
import useToolsData from "../hooks/useToolsData";
import ProcessingFilesFormStep from "../components/ProcessingFilesFormStep";
import UploadAreaFormStep from "../components/UploadAreaFormStep";
import Steps from "../components/Steps";
import Features from "../components/Features";
import Share from "../components/Share";
import DownloadFilesFormStep from "../components/DownloadFilesFormStep";
import AvailableTools from "../components/AvailableTools";
import PasswordForm from "../components/PasswordForm.js";
import styles from "../styles/UploadContainer.module.css";
import {
  saveNewFiles,
  uploadFiles,
  downloadFiles,
  handleUnlockPDFFileSelection,
} from "../helpers/utils.js";
import Alerts from "../components/Alerts";
import pageStyles from "../styles/Page.module.css";
export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "unlock-pdf"])),
    },
  };
}

const UnlockPDFPage = () => {
  const { UnlockPDFTool } = useToolsData();
  const mountedRef = useRef(false);
  const [isSpinnerActive, setIsSpinnerActive] = useState(false);
  const [formStep, updateFormStep] = useState(0);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  //loadedfilesCount is used to count the files currently being loaded to show progress spinner while loading the files //
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
    //Calling handleUnlockPDFFileSelection function to extract pdf pages and their data and insert them in an array
    handleUnlockPDFFileSelection(
      event,
      setLoadedFilesCount,
      handleAddDocument,
      t,
      mountedRef,
      UnlockPDFTool
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    /**
     * Files compressing will be done on three steps:
     *** First step : uploading file to server and start processing it.
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
        uri: UnlockPDFTool.URI,
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
        responseMimeType: UnlockPDFTool.outputFileMimeType,
        signal: requestSignal,
        uploadResponsesArray: uploadResponsesArray,
        handleUpdateDocument: handleUpdateDocument,
      });

    //check if document has been processed
    if (downloadResponsesArray.length === 1) {
      handleUpdateResultsDisplay(true, []);
      //updating form step in UI
      updateFormStep(3);
    } else {
      //check if document has failed being processed
      //show error message and stop password trials only when the error is due to network or server error
      const errorCode = downloadResponsesUnseccessfulRequests[0]?.errorCode;

      if (errorCode === "ERR_FAILED_PROCESSING") {
        // failed due to wrong password
        setShowErrorMessage(true);
        handleResetPassword();
        //updating form step in UI
        updateFormStep(1);
      } else {
        // failed due du network or server error
        handleUpdateResultsDisplay(
          false,
          downloadResponsesUnseccessfulRequests
        );
        //updating form step in UI
        updateFormStep(3);
      }
    }
  };

  const handlehandleResetInitialStates = () => {
    handleResetInitialDocumentsState();
    handleResetInitialUploadState();
    updateFormStep(0);
    handleResetPassword();
    setShowErrorMessage(false);
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


  const router = useRouter();          // Новый код для получения информации о маршруте
  const { locale } = router;           // Получаем текущий язык страницы
  const canonicalUrl = `https://pdfdok.com${locale === 'en' ? '' : '/' + locale}${UnlockPDFTool.href}`; // Определяем канонический URL
  


  return (
    <>
      <Head>
        {/* Anything you add here will be added to this page only */}
        <title>Unlock PDF | Remove Password Protection from PDF Files Online Free</title>
        <meta
          name="description"
          content="Easily unlock PDFs online by removing password protection quickly and securely. Access, edit, and share your files hassle-free on any device with no installation."
        />
        <meta
          name="Keywords"
          content="Unlock PDF, Remove PDF password, PDF password remover, PDF unlocker, PDF decryption tool, Online PDF unlock, Free PDF unlock, Secure PDF unlock, PDF password cracker, PDF password recovery"
        />
        {/* You can add your canonical link here */}
        <link rel="canonical" href={canonicalUrl} key="canonical" />

        {/* You can add your alternate links here, example: */}
        <link
          rel="alternate"
          href={`https://pdfdok.com/en${UnlockPDFTool.href}`}
          hrefLang="en"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/es${UnlockPDFTool.href}`}
          hrefLang="es"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ar${UnlockPDFTool.href}`}
          hrefLang="ar"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/zh${UnlockPDFTool.href}`}
          hrefLang="zh"
        />{" "}
        <link
          rel="alternate"
          href={`https://pdfdok.com/de${UnlockPDFTool.href}`}
          hrefLang="de"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/fr${UnlockPDFTool.href}`}
          hrefLang="fr"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/it${UnlockPDFTool.href}`}
          hrefLang="it"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/pt${UnlockPDFTool.href}`}
          hrefLang="pt"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ru${UnlockPDFTool.href}`}
          hrefLang="ru"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/uk${UnlockPDFTool.href}`}
          hrefLang="uk"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/id${UnlockPDFTool.href}`}
          hrefLang="id"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/da${UnlockPDFTool.href}`}
          hrefLang="da"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/nl${UnlockPDFTool.href}`}
          hrefLang="nl"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/hi${UnlockPDFTool.href}`}
          hrefLang="hi"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ko${UnlockPDFTool.href}`}
          hrefLang="ko"
        />
        <link
          rel="alternate"
          href={`https://pdfdok.com/ja${UnlockPDFTool.href}`}
          hrefLang="ja"
        />
      </Head>

      <main>
        <header className="page_section header mb-0">
          <h1 className="title">{t("unlock-pdf:page_header_title")}</h1>
          <p className="description">{t("unlock-pdf:page_header_text")}</p>
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
                  acceptedMimeType={UnlockPDFTool.acceptedInputMimeType}
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
                  actionTitle={t("unlock-pdf:unlock_pdf")}
                  showErrorMessage={showErrorMessage}
                />
              )}

              {formStep === 2 && (
                <ProcessingFilesFormStep
                  progress={t("unlock-pdf:unlocking_pdf")}
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
          title={t("unlock-pdf:how_to_title")}
          stepsArray={[
            {
              number: 1,
              description: t("unlock-pdf:how_to_step_one"),
            },
            {
              number: 2,
              description: t("unlock-pdf:how_to_step_two"),
            },
            {
              number: 3,
              description: t("unlock-pdf:how_to_step_three"),
            },
          ]}
        />
        {/* steps end */}
        {/* features start */}
        <Features
          title={t("common:features_title")}
          featuresArray={[
            {
              title: t("unlock-pdf:feature_one_title"),
              description: t("unlock-pdf:feature_one_text"),
              icon: <LightningChargeFill />,
            },
            {
              title: t("unlock-pdf:feature_two_title"),
              description: t("unlock-pdf:feature_two_text"),
              icon: <InfinityIcon />,
            },
            {
              title: t("unlock-pdf:feature_three_title"),
              description: t("unlock-pdf:feature_three_text"),
              icon: <Unlock />,
            },
            {
              title: t("unlock-pdf:feature_four_title"),
              description: t("unlock-pdf:feature_four_text"),
              icon: <ShieldFillCheck />,
            },
            {
              title: t("unlock-pdf:feature_five_title"),
              description: t("unlock-pdf:feature_five_text"),
              icon: <HeartFill />,
            },
            {
              title: t("unlock-pdf:feature_six_title"),
              description: t("unlock-pdf:feature_six_text"),
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
                {t("unlock-pdf:article_title")}
              </h2>
              <div
                className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
              ></div>
            </header>

            <section className={pageStyles.article_content}>
              <p>{t("unlock-pdf:article_paragraph_01")}</p>
              <p>{t("unlock-pdf:article_paragraph_02")}</p>
              <p>{t("unlock-pdf:article_paragraph_03")}</p>
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
export default UnlockPDFPage;
