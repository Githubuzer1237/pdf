import React from "react";
import styles from "../styles/DocumentPreview.module.css";
import PropTypes from "prop-types";
import Image from "next/legacy/image";

const ImagesDragPreview = React.memo(function ImagesDragPreview({ pages }) {
  let backPreviews = 1;
  if (pages.length === 2) {
    backPreviews = 2;
  } else if (pages.length >= 3) {
    backPreviews = 3;
  }

  return (
    <div>
      {pages.slice(0, backPreviews).map((page, i) => (
        <div
          key={page.id}
          className={`card ${styles.card} ${styles.card_dragged}  ${styles.awa_a4} ${styles.awa_portrait}`}
          style={{
            zIndex: pages.length - i,
            transform: `rotateZ(${-i * 2.5}deg)`,
          }}
        >
          <Image
            src={page.thumbnailImageURL}
            layout="fill"
            objectFit="contain"
            alt="dragged-preview"
          />
        </div>
      ))}
    </div>
  );
});

export default ImagesDragPreview;

ImagesDragPreview.propTypes = {
  pages: PropTypes.array.isRequired,
};
