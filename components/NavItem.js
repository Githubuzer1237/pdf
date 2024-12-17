import React from "react";
import styles from "../styles/MegaMenu.module.css";
import PropTypes from "prop-types";
import Link from "next/link";
const NavItem = React.memo(function NavItem({ title, url, icon }) {
  return (
    <div className={`${styles.item_list}`}>
      <div className={`${styles.item_img}`}>{icon}</div>
      <div className={`${styles.item_list_info}`}>
        <Link href={url} prefetch={false} scroll={true}>
          <h4>{title}</h4>
        </Link>
      </div>
    </div>
  );
});

export default NavItem;

NavItem.propTypes = {
  title: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  icon: PropTypes.object.isRequired,
};
