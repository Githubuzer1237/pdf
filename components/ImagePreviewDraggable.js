import React, { useRef, useEffect } from "react";
import { ArrowClockwise, Trash } from "react-bootstrap-icons";
import { formatBytes } from "../helpers/utils.js";
import styles from "../styles/DocumentPreview.module.css";
import { getEmptyImage } from "react-dnd-html5-backend";
import { useDrag, useDrop } from "react-dnd";
import { isMobile } from "react-device-detect";
import PropTypes from "prop-types";
import Image from "next/legacy/image";
import FileButton from "./FileButton.js";
import { useTranslation } from "next-i18next";

const ImagePreviewDraggable = React.memo(function ImagePreviewDraggable({
  index,
  page,
  selectedPages,
  handleRearrangePages,
  handleSetInsertIndex,
  onSelectionChange,
  handleClearPageSelection,
  insertLineOnLeft,
  insertLineOnRight,
  handleDeletePage,
  handleRotatePageRight,
}) {
  const { t } = useTranslation();
  const {
    id,
    degree,
    selected,
    thumbnailImageURL,
    fileSize,
    fileName,
    width,
    height,
    margin,
    orientation,
    pageSize,
  } = page;
  const ref = useRef(null);
  const [{ isDragging }, drag, preview] = useDrag({
    type: "page",
    item: (monitor) => {
      const draggedPage = { ...page };
      // width, height
      let pages;
      if (selectedPages.find((page) => page.id === id)) {
        pages = selectedPages;
      } else {
        handleClearPageSelection();
        onSelectionChange(index, null);
        pages = [draggedPage];
      }
      const otherPages = pages.concat();
      otherPages.splice(
        pages.findIndex((c) => c.id === id),
        1
      );
      const pagesDragStack = [draggedPage, ...otherPages];
      const pagesIDs = pages.map((c) => c.id);
      return { pages, pagesDragStack, draggedPage, pagesIDs };
    },
    isDragging: (monitor) => {
      return monitor.getItem().pagesIDs.includes(id);
    },
    end: (item, monitor) => {
      handleRearrangePages(item);
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ hovered }, drop] = useDrop({
    accept: "page",
    hover: (item, monitor) => {
      const hoverIndex = index;

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get horizontal middle
      const midX =
        hoverBoundingRect.left +
        (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      // Determine mouse position
      const pointerOffset = monitor.getClientOffset();

      const newInsertIndex =
        pointerOffset.x < midX ? hoverIndex : hoverIndex + 1;
      handleSetInsertIndex(hoverIndex, newInsertIndex);

      //Add scroll in mobile
      if (isMobile) {
        if (monitor.getDifferenceFromInitialOffset().y > 0) {
          document.body.scrollLeft = 0;
          document.body.scrollTop = document.body.scrollTop + 2;
        }
        if (monitor.getDifferenceFromInitialOffset().y < 0) {
          document.body.scrollLeft = 0;
          document.body.scrollTop = document.body.scrollTop - 2;
        }
      }
    },
    collect: (monitor) => ({
      hovered: monitor.isOver(),
    }),
  });

  drag(drop(ref));

  const onClick = (e) => {
    onSelectionChange(index, e.ctrlKey);
  };

  useEffect(() => {
    preview(getEmptyImage(), {
      captureDraggingState: true,
    });
  }, []);

  const opacity = isDragging ? 0.4 : 1;

  const borderLeft = insertLineOnLeft && hovered ? "2px solid #7d64ff" : null;

  const borderRight = insertLineOnRight && hovered ? "2px solid #7d64ff" : null;

  const fileSizeString = formatBytes(fileSize, 2);

  const fileOrioentation =
    width > height
      ? styles.awa_landscape
      : width < height
      ? styles.awa_portrait
      : styles.awa_portrait;

  return (
    <>
      <div
        className={`preview ${styles.preview} ${
          selected ? styles.selected : ""
        }`}
        ref={ref}
        onClick={onClick}
        style={{ opacity, borderLeft, borderRight }}
        id={id}
        data-id={id}
        data-index={index}
        data-page-rotation={degree}
        data-page-number="1"
      >
        <div className="d-flex">
          <div className={`file ${styles.file}`} title={`${fileSizeString}`}>
            <div className={`${styles.file_actions}`}>
              <FileButton
                title={t("common:rotate_right")}
                onClick={handleRotatePageRight}
              >
                <ArrowClockwise />
              </FileButton>

              <FileButton title={t("common:delete")} onClick={handleDeletePage}>
                <Trash />
              </FileButton>
            </div>
            <div
              className={`${styles.file_image} 
              ${
                pageSize === "Fit"
                  ? styles.awa_fit
                  : pageSize === "A4"
                  ? styles.awa_a4
                  : styles.awa_letter
              }
              ${
                pageSize === "Fit"
                  ? fileOrioentation
                  : orientation === "landscape"
                  ? styles.awa_landscape
                  : orientation === "portrait"
                  ? styles.awa_portrait
                  : fileOrioentation
              } 
              `}
              style={{
                transform: `rotate(${degree}deg)`,
              }}
            >
              <Image
                className={`${
                  margin === "no-margin"
                    ? styles.awa_no_margin
                    : margin === "small-margin"
                    ? styles.awa_small_margin
                    : styles.awa_big_margin
                }`}
                src={thumbnailImageURL}
                layout="fill"
                objectFit="contain"
                alt={fileName}
              />
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

export default ImagePreviewDraggable;

ImagePreviewDraggable.propTypes = {
  page: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  selectedPages: PropTypes.array.isRequired,
  handleClearPageSelection: PropTypes.func.isRequired,
  handleRearrangePages: PropTypes.func.isRequired,
  handleSetInsertIndex: PropTypes.func.isRequired,
  onSelectionChange: PropTypes.func.isRequired,
  insertLineOnLeft: PropTypes.bool.isRequired,
  insertLineOnRight: PropTypes.bool.isRequired,
};
