import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { ArrowLeft, Download } from "react-bootstrap-icons";
import { useTranslation } from "next-i18next";
import styles from "../styles/UploadContainer.module.css";
import ToolButton from "./ToolButton";

const DownloadFilesFormStep = React.memo(function DownloadFilesFormStep({
  children,
  title,
  handleDownload,
  handleResetInitialState,
}) {
  const { t } = useTranslation();
  const downloadBtnRef = useRef();
  const goBackBtnRef = useRef();

  useEffect(() => {
    //save refs to remove events in clean up function
    const downloadBtnRefCurrent = downloadBtnRef.current;
    const goBackBtnRefCurrent = goBackBtnRef.current;

    //cleanup function
    return () => {
      downloadBtnRefCurrent?.removeEventListener(
        "click",
        handleDownload,
        false
      );
      goBackBtnRefCurrent?.removeEventListener(
        "click",
        handleResetInitialState,
        false
      );
    };
  }, []);

  return (
    <section className={`${styles.toolbox} py-0 mt-0`}>
      <div className="d-flex">
        <div className="w-100 pt-3 pb-3 d-flex flex-column align-items-center">
          <div className="row w-100 d-flex justify-content-center text-center mt-2 mb-2">
            <h2 className={`${styles.container_title}`}>{title}</h2>
          </div>

          {children}

          <div
            className={`row d-flex justify-content-center ${styles.download_container} mt-4`}
          >
            <ToolButton
              title={t("common:download")}
              onClick={handleDownload}
              isActive={true}
              buttonStyle={styles.download_btn}
            >
              <Download />
              {t("common:download")}
            </ToolButton>
            <div className={`${styles.start_over}`}>
              <ArrowLeft className={`${styles.start_over_icon}`} size={20} />
              <span onClick={handleResetInitialState}>
                {t("common:start_over")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default DownloadFilesFormStep;

DownloadFilesFormStep.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  handleDownload: PropTypes.func.isRequired,
  handleResetInitialState: PropTypes.func.isRequired,
};
