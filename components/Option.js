import React from "react";
import { handleLevelChange } from "../helpers/utils.js";
import styles from "../styles/UploadContainer.module.css";
import PropTypes from "prop-types";

const Option = React.memo(function Option({
  children,
  onChange,
  isChecked,
  value,
  icon,
}) {
  return (
    <div className={`${styles.box}`}>
      <label className={`form-control ${isChecked && "checked"}`}>
        <input
          type="radio"
          name="radioLevel"
          value={value}
          onChange={(event) => {
            onChange();
            handleLevelChange(event);
          }}
          checked={isChecked}
        />
        <div className="d-flex flex-row w-100">
          <div className={`${styles.option_icon}`}>{icon}</div>
          <div className={`${styles.pdf_to_image_option_desc_wrapper}`}>
            {children}
          </div>
        </div>
      </label>
    </div>
  );
});

export default Option;

Option.propTypes = {
  onChange: PropTypes.func.isRequired,
  isChecked: PropTypes.bool.isRequired,
  value: PropTypes.string.isRequired,
};
