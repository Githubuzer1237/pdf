import React, { useEffect, useRef } from "react";
import { ArrowRight } from "react-bootstrap-icons";

import styles from "../styles/UploadContainer.module.css";
import PropTypes from "prop-types";
import ToolButton from "./ToolButton";
const SelectOptionFormStep = React.memo(function SelectOptionFormStep({
  children,
  title,
  action,
  actionTitle,
}) {
  const compressBtnRef = useRef();

  useEffect(() => {
    //save refs to remove events in clean up function
    const compressBtnRefCurrent = compressBtnRef.current;
    //cleanup function
    return () => {
      //removing event listeners
      compressBtnRefCurrent?.removeEventListener("click", action, false);
    };
  }, []);
  return (
    <section className={`${styles.toolbox} py-0 mt-0`}>
      <div className="d-flex">
        <div className="w-100 pt-3 pb-3 d-flex flex-column align-items-center">
          <div className="row w-100 d-flex justify-content-center text-center mt-2">
            <h2 className={`${styles.container_title}`}>{title}</h2>
          </div>

          <div className="row w-100 d-flex justify-content-center mt-3">
            {children}
          </div>

          <div className="row w-100 d-flex justify-content-center">
            <ToolButton
              title={actionTitle}
              onClick={action}
              isActive={true}
              buttonStyle={styles.action_btn}
            >
              <ArrowRight />
              {actionTitle}
            </ToolButton>
          </div>
        </div>
      </div>
    </section>
  );
});

export default SelectOptionFormStep;

SelectOptionFormStep.propTypes = {
  title: PropTypes.string.isRequired,
  actionTitle: PropTypes.string.isRequired,
  action: PropTypes.func.isRequired,
};
