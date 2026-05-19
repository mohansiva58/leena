

import React from "react";
import "./ui/footer.css";
import Footercard from "./ui/Footercard";
export function Footer() {
  return (
    <>
      <Footercard />

      <footer className="new_footer_area mb-16 lg:mb-0">
        <div className="new_footer_top">
          <div className="footer_bg">
            <div className="footer_bg_one"></div>
            <div className="footer_bg_two"></div>
            <div className="footer_bg_three"></div>
          </div>
        </div>
      </footer>
    </>
  );
}