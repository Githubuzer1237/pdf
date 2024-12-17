import React from "react";
import { useDragLayer } from "react-dnd";
import ImagesDragPreview from "./ImagesDragPreview";

const layerStyles = {
  position: "fixed",
  pointerEvents: "none",
  zIndex: 999,
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
};

const getItemStyles = (currentOffset) => {
  if (!currentOffset) {
    return {
      display: "none",
    };
  }
  const { x, y } = currentOffset;
  return {
    transform: `translate(${x}px, ${y}px)`,
    filter: "drop-shadow(0 2px 12px rgba(0,0,0,0.45))",
  };
};

const ImageDragLayer = React.memo(function ImageDragLayer() {
  const { itemType, isDragging, item, currentOffset } = useDragLayer(
    (monitor) => ({
      item: monitor.getItem(),
      itemType: monitor.getItemType(),
      currentOffset: monitor.getSourceClientOffset(),
      isDragging: monitor.isDragging(),
    })
  );

  const renderItem = (type, item) => {
    if (type === "page") {
      return <ImagesDragPreview pages={item.pagesDragStack} />;
    }
    return null;
  };
  if (!isDragging) {
    return null;
  }

  return (
    <div style={layerStyles}>
      <div style={getItemStyles(currentOffset)}>
        {renderItem(itemType, item)}
      </div>
    </div>
  );
});
export default ImageDragLayer;
