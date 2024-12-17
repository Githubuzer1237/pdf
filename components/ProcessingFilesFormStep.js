import React from "react";
import { useTranslation } from "next-i18next";
import PropTypes from "prop-types";
import { GearWide } from "react-bootstrap-icons";
import styles from "../styles/UploadContainer.module.css";

const ProcessingFilesFormStep = React.memo(function ProcessingFilesFormStep({
  progress,
}) {
  const { t } = useTranslation();

  return (
    <section className={`${styles.toolbox} py-0 mt-0`}>
      <div className="d-flex">
        <div className="w-100 pt-3 pb-3 d-flex flex-column align-items-center">
          <div className="row w-100 d-flex justify-content-center text-center mt-2">
            <h2 className={`${styles.container_title}`}>{progress}</h2>
          </div>

          <div className="row w-100 d-flex justify-content-center text-center mt-5 mb-5">
            <GearWide
              className={`${styles.process_circle}`}
              size={130}
              color="#7d64ff"
            />
          </div>

          <div className="row w-100 d-flex justify-content-center text-center mt-5 mb-5">
            <span style={{ color: "#2d3748" }}>
              {t("common:do_not_close_window")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
});

export default ProcessingFilesFormStep;

ProcessingFilesFormStep.propTypes = {
  progress: PropTypes.string.isRequired,
};
