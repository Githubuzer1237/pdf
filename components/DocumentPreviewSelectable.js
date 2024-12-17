import React from "react";
import styles from "../styles/DocumentPreview.module.css";
import PageContent from "./PageContent";
import {
  ArrowClockwise,
  ArrowCounterclockwise,
  Trash,
  ZoomIn,
} from "react-bootstrap-icons";
import FileButton from "./FileButton";
import { useTranslation } from "next-i18next";
const DocumentPreviewSelectable = React.memo(
  function DocumentPreviewSelectable({
    page,
    index,
    onSelectionChange,
    handleRotatePageLeft,
    handleRotatePageRight,
    handleDeletePage,
    zoomOnPage,
  }) {
    const { t } = useTranslation();
    const onClick = (e) => {
      onSelectionChange(index, e.ctrlKey);
    };

    const fileOrioentation =
      page.width > page.height ? styles.landscape : styles.portrait;

    return (
      <>
        <div
          className={`preview ${styles.preview} ${
            page.selected ? styles.selected : ""
          }`}
          onClick={onClick}
          id={page.id}
          data-id={page.id}
          data-index={index}
          data-page-rotation={page.degree}
          data-page-number="1"
        >
          <div className="d-flex">
            <div className={`file ${styles.file}`}>
              <div className={`${styles.file_actions}`}>
                {zoomOnPage && (
                  <FileButton title={t("common:zoom")} onClick={zoomOnPage}>
                    <ZoomIn />
                  </FileButton>
                )}

                {handleRotatePageLeft && (
                  <FileButton
                    title={t("common:rotate_left")}
                    onClick={handleRotatePageLeft}
                    hideOnMobile={true}
                  >
                    <ArrowCounterclockwise />
                  </FileButton>
                )}

                {handleRotatePageRight && (
                  <FileButton
                    title={t("common:rotate_right")}
                    onClick={handleRotatePageRight}
                  >
                    <ArrowClockwise />
                  </FileButton>
                )}
                {handleDeletePage && (
                  <FileButton
                    title={t("common:delete")}
                    onClick={handleDeletePage}
                  >
                    <Trash />
                  </FileButton>
                )}
              </div>
              <div
                className={`${styles.file_canvas} ${fileOrioentation}`}
                style={{ transform: `rotate(${page.degree}deg)` }}
              >
                <PageContent blob={page.outputBlob} width={149} scale={1} />
              </div>
              <div className={`${styles.file_info}`}>
                <span className={`${styles.file_info_name}`}>{page.order}</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
);

export default DocumentPreviewSelectable;
