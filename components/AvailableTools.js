import React from "react";
import styles from "../styles/ToolsList.module.css";
import pageStyles from "../styles/Page.module.css";
import ToolsList from "./ToolsList";

const AvailableTools = React.memo(function AvailableTools() {
  return (
    <>
      <section className="page_section">
        <article className={`container`}>
          <header className={`${styles.tools_title}`}>
            <h2 className={pageStyles.title_section}>TOOLS</h2>
            <div
              className={`${pageStyles.divider} ${pageStyles.mx_auto}`}
            ></div>
          </header>
          <div className={`${styles.dropdown}`}>
            <div className={`${styles.dropdown_inner}`}>
              <ToolsList />
            </div>
          </div>
        </article>
      </section>
    </>
  );
});

export default AvailableTools;
