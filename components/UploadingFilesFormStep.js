import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "next-i18next";
import { CloudArrowUp } from "react-bootstrap-icons";
import { formatBytes } from "../helpers/utils.js";
import styles from "../styles/UploadContainer.module.css";

const UploadingFilesFormStep = React.memo(function UploadingFilesFormStep({
  title,
  uploadTimeLeft,
  uploadSpeed,
  totalUploadingProgress,
  currentUploadingFileName,
  currentUploadingFileSize,
}) {
  const { t } = useTranslation();

  return (
    <section className={`${styles.toolbox} py-0 mt-0`}>
      <div className="d-flex">
        <div className="w-100 pt-3 pb-3 d-flex flex-column align-items-center">
          <div className="row w-100 d-flex justify-content-center text-center mt-2">
            <h2 className={`${styles.container_title}`}>{title}</h2>
          </div>
          <div className="row w-100 d-flex justify-content-center text-center mt-5 mb-5">
            <CloudArrowUp
              className={`${styles.saved_percentage}`}
              size={130}
              color="#7d64ff"
            />

            <span
              style={{
                color: "#2d3748",
              }}
            >
              <span style={{ fontWeight: "bold" }}>
                {t("common:time_left")}
              </span>{" "}
              {uploadTimeLeft} -{" "}
              <span style={{ fontWeight: "bold" }}>
                {t("common:upload_speed")}
              </span>{" "}
              {uploadSpeed}
            </span>
          </div>
          <div className="w-100 d-flex justify-content-center">
            <div className={`${styles.uploading_bar}`}>
              <span
                className={`${styles.uploading_bar_completed}`}
                style={{ width: `${totalUploadingProgress}%` }}
              >
                {totalUploadingProgress}%
              </span>
            </div>
          </div>

          <div className="row w-100 d-flex justify-content-center text-center mt-2 mb-2">
            <span
              style={{
                color: "#2d3748",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                width: "100%",
                display: "block",
                overflow: "hidden",
              }}
            >
              {currentUploadingFileName}
            </span>
            <span
              style={{
                color: "#2d3748",
              }}
            >
              ({formatBytes(currentUploadingFileSize)})
            </span>
          </div>
        </div>
      </div>
    </section>
  );
});

export default UploadingFilesFormStep;

UploadingFilesFormStep.propTypes = {
  title: PropTypes.string.isRequired,
  uploadTimeLeft: PropTypes.string.isRequired,
  uploadSpeed: PropTypes.string.isRequired,
  totalUploadingProgress: PropTypes.number.isRequired,
};
