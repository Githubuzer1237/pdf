import React from "react";
import { Trash } from "react-bootstrap-icons";
import { formatBytes } from "../helpers/utils.js";
import styles from "../styles/DocumentPreview.module.css";
import PropTypes from "prop-types";
import Image from "next/legacy/image";
import FileButton from "./FileButton.js";
import { useTranslation } from "next-i18next";

const ImagePreview = React.memo(function ImagePreview({
  document,
  handleDeleteDocument,
  thumbnailImageURL,
}) {
  const { t } = useTranslation();
  const fileSizeString = formatBytes(document.fileSize, 2);

  return (
    <>
      <div className={`preview ${styles.preview}`}>
        <div className="d-flex">
          <div className={`file ${styles.file}`} title={`${fileSizeString}`}>
            <div className={`${styles.file_actions}`}>
              <FileButton
                title={t("common:delete")}
                onClick={handleDeleteDocument}
              >
                <Trash />
              </FileButton>
            </div>
            <div
              className={`${styles.file_image} ${styles.awa_a4} ${styles.awa_portrait} `}
            >
              <Image
                className={`${styles.awa_no_margin}`}
                src={thumbnailImageURL}
                layout="fill"
                objectFit="contain"
                alt={document.fileName}
              />
            </div>
            <div className={`${styles.file_info}`}>
              <span className={`${styles.file_info_name}`}>
                {document.fileName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default ImagePreview;

ImagePreview.propTypes = {
  document: PropTypes.object.isRequired,
  handleDeleteDocument: PropTypes.func.isRequired,
  thumbnailImageURL: PropTypes.string.isRequired,
};
