import React from "react";
import { ArrowClockwise, Trash } from "react-bootstrap-icons";
import { formatBytes, rotatePageRight } from "../helpers/utils.js";
import styles from "../styles/DocumentPreview.module.css";
import PageContent from "./PageContent";
import PropTypes from "prop-types";
import FileButton from "./FileButton.js";
import { useTranslation } from "next-i18next";
const DocumentPreview = React.memo(function DocumentPreview({
  blob,
  fileName,
  width,
  height,
  numberOfPages,
  degree,
  rotationsCounter,
  handleDeleteDocument,
  handleRotateDocument,
}) {
  const { t } = useTranslation();
  const fileOrioentation = width > height ? styles.landscape : styles.portrait;
  const fileSizeString = formatBytes(blob.size, 2);

  if (degree != undefined) {
    //Refactore this remove it from compoenent
    for (let index = 0; index < rotationsCounter; index++) {
      degree = rotatePageRight(degree);
    }
  }

  return (
    <>
      <div className={`preview ${styles.preview}`}>
        <div className="d-flex">
          <div
            className={`file ${styles.file}`}
            title={`${fileSizeString} - ${numberOfPages} pages`}
          >
            <div className={`${styles.file_actions}`}>
              {handleRotateDocument && (
                <FileButton
                  title={t("common:rotate_right")}
                  onClick={handleRotateDocument}
                >
                  <ArrowClockwise />
                </FileButton>
              )}

              <FileButton
                title={t("common:delete")}
                onClick={handleDeleteDocument}
              >
                <Trash />
              </FileButton>
            </div>
            <div
              className={`${styles.file_canvas} ${fileOrioentation}`}
              style={{
                transform: `rotate(${degree != undefined ? degree : 0}deg)`,
              }}
            >
              <PageContent blob={blob} width={149} scale={1} />
            </div>
            <div className={`${styles.file_info}`}>
              <span className={`${styles.file_info_name}`}>{fileName}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default DocumentPreview;

DocumentPreview.propTypes = {
  blob: PropTypes.object.isRequired,
  fileName: PropTypes.string.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  numberOfPages: PropTypes.number.isRequired,
  handleDeleteDocument: PropTypes.func.isRequired,
};
