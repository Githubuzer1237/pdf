import React, { useEffect, useRef } from "react";
import { ArrowRight } from "react-bootstrap-icons";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { handlePreventDefault, rtlLanguages } from "../helpers/utils.js";
import PropTypes from "prop-types";
import uploadContainerStyles from "../styles/UploadContainer.module.css";
import passwordFormStyles from "../styles/PasswordForm.module.css";
import ToolButton from "./ToolButton.js";

const PasswordForm = React.memo(function PasswordForm({
  password,
  confirmPassword,
  passwordsMatch,
  setPassword,
  setConfirmPassword,
  handleSubmit,
  actionTitle,
  showErrorMessage,
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const direction = rtlLanguages.includes(router.locale) ? "rtl" : "ltr";
  const formRef = useRef();
  const submitBtnRef = useRef();

  useEffect(() => {
    //save refs to remove events in clean up function
    const formRefCurrent = formRef.current;
    const submitBtnRefCurrent = submitBtnRef.current;

    //cleanup function
    return () => {
      //removing event listeners
      submitBtnRefCurrent?.removeEventListener("click", handleSubmit, false);
      formRefCurrent?.removeEventListener(
        "submit",
        handlePreventDefault,
        false
      );
    };
  }, []);

  return (
    <section className={`${uploadContainerStyles.toolbox} py-0 mt-0`}>
      <div className="d-flex">
        <div className="w-100 pt-3 pb-3 d-flex flex-column align-items-center">
          <div
            className={`row w-100 d-flex justify-content-center text-center`}
          >
            <h2 className={`${uploadContainerStyles.container_title}`}>
              {t("common:enter_password")}
            </h2>
            {showErrorMessage && (
              <div
                className={`${passwordFormStyles.error_message} justify-content-center`}
              >
                {t("unlock-pdf:wrong_password")}
              </div>
            )}
          </div>

          <div className={`${passwordFormStyles.form_wrapper}`}>
            <form onSubmit={handlePreventDefault} ref={formRef}>
              <div className={`${passwordFormStyles.input_box}`}>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event)}
                  required
                />
                <label
                  htmlFor="password"
                  className={
                    direction === "ltr"
                      ? passwordFormStyles.left
                      : passwordFormStyles.right
                  }
                >
                  {t("common:password")}
                </label>
              </div>
              <div className={`${passwordFormStyles.input_box}`}>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event)}
                  required
                />
                <label
                  htmlFor="confirmPassword"
                  className={
                    direction === "ltr"
                      ? passwordFormStyles.left
                      : passwordFormStyles.right
                  }
                >
                  {t("common:confirm_password")}
                </label>
              </div>
              <div className={`${passwordFormStyles.alert_message}`}>
                {!passwordsMatch && t("common:password_must_match")}
              </div>

              <div
                className={`${passwordFormStyles.input_box} ${passwordFormStyles.button} mb-0 mt-3`}
              >
                <ToolButton
                  title={actionTitle}
                  onClick={handleSubmit}
                  isActive={
                    password != "" &&
                    confirmPassword != "" &&
                    passwordsMatch === true
                  }
                  buttonStyle={uploadContainerStyles.action_btn}
                >
                  <ArrowRight />
                  {actionTitle}
                </ToolButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
});

export default PasswordForm;

PasswordForm.propTypes = {
  password: PropTypes.string.isRequired,
  confirmPassword: PropTypes.string.isRequired,
  setPassword: PropTypes.func.isRequired,
  setConfirmPassword: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
};
