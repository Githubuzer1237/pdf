import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import LangModal from "./LangModal";
import ToolsList from "./ToolsList";
import { useTranslation } from "next-i18next";
import LanguageCountryFlag from "./LanguageCountryFlag";
import styles from "../styles/MegaMenu.module.css";
import { List, ChevronDown, X, ChevronUp } from "react-bootstrap-icons";
import useToolsData from "../hooks/useToolsData";

const Nav = React.memo(function Nav() {
  const router = useRouter();
  const toolsData = useToolsData();
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [navToggleShow, setNavToggleShow] = useState(false);
  const navMenuRef = useRef(null);

  const handleRouteChange = () => {
    //Route changes
    // close the menu
    setNavToggleShow(false);
  };

  const handleClickOutside = (event) => {
    if (navMenuRef.current && !navMenuRef.current.contains(event.target)) {
      // clicked outside the nav menu, close it
      // close the menu
      setNavToggleShow(false);
    }
  };

  useEffect(() => {
    //Add event listener on the document object to close the dropdown menu when clicking outside the dropdown menu
    document.addEventListener("mousedown", handleClickOutside);

    //Add event listener to close the dropdown menu when route change
    router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      // remove event listener when component unmounts
      document.removeEventListener("mousedown", handleClickOutside);
      // remove event listener when component unmounts
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, []);

  return (
    <>
      <header>
        <div>
          <nav className={`${styles.navigation}`}>
            <Link href="/" className={`${styles.logo}`}>
              <h3>
                <span style={{ color: "#7d64ff" }}>PDF</span>
                <span style={{ color: "#2d3748" }}>dok</span>
                <span className="dot"></span>
              </h3>
            </Link>
            <ul
              ref={navMenuRef}
              className={`${styles.nav_menu} ${
                navToggleShow ? styles.active : ""
              }`}
            >
              <li className={`${styles.nav_list} ${styles.remove_in_mobile}`}>
                <Link href="/" className={`${styles.nav_link}`}>
                  <span>{t("common:home_page")}</span>
                </Link>
              </li>

              <li className={`${styles.nav_list} ${styles.remove_in_mobile}`}>
                <Link
                  href={toolsData["MergePDFTool"].href}
                  className={`${styles.nav_link}`}
                  prefetch={false}
                >
                  <span>{toolsData["MergePDFTool"].title}</span>
                </Link>
              </li>

              <li className={`${styles.nav_list} ${styles.remove_in_mobile}`}>
                <Link
                  href={toolsData["CompressPDFTool"].href}
                  className={`${styles.nav_link}`}
                  prefetch={false}
                >
                  <span>{toolsData["CompressPDFTool"].title}</span>
                </Link>
              </li>

              <li
                className={`${styles.nav_list} ${
                  navToggleShow ? styles.nav_list_menu : ""
                }`}
              >
                <div
                  className={`${styles.nav_link} ${styles.remove_in_mobile}`}
                  onClick={() => {
                    setNavToggleShow(!navToggleShow);
                  }}
                >
                  <span>{t("common:all_pdf_tools")}</span>
                  {navToggleShow ? <ChevronUp /> : <ChevronDown />}
                </div>
                <div className={`${styles.dropdown}`}>
                  <div className={`${styles.dropdown_inner}`}>
                    {navToggleShow && <ToolsList />}
                  </div>
                </div>
              </li>
            </ul>
            <div className={`${styles.nav_action}`}>
              <div
                className={`${styles.btn_primary}`}
                onClick={() => setShowModal(true)}
              >
                <LanguageCountryFlag locale={router.locale} />
              </div>
              <div
                className={`${styles.nav_toggle}`}
                onClick={() => setNavToggleShow(!navToggleShow)}
              >
                {navToggleShow ? <X size={25} /> : <List size={25} />}
              </div>
            </div>
          </nav>
        </div>
      </header>
      {showModal && (
        <LangModal show={showModal} onClose={() => setShowModal(false)} />
      )}
    </>
  );
});

export default Nav;
