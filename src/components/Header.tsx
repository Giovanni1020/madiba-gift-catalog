import React from "react";
import "./Header.css";

export default function Header() {
  return (
    <header
      className="header"
      style={{ '--header-bg-pattern': `url(${process.env.PUBLIC_URL}/images/succulentas-pattern.png)` } as React.CSSProperties}
    >
      <div className="header__inner">
        <a href="/" className="header__brand" aria-label="Gifted — início">
          <span className="header__mark" aria-hidden="true">
            <img
              src={"./images/madibaIcon.png"}
              alt="Madiba logo"
              width="48"
              height="48"
            />
          </span>
          <span className="header__wordmark">Catálogo de presentes</span>
        </a>
      </div>
    </header>
  );
}
