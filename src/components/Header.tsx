import React from "react";
import "./Header.css";

export default function Header() {
  return (
    <header
      className="header"
      style={{ '--header-bg-pattern': `url(${process.env.PUBLIC_URL}/images/succulentas-pattern.png)` } as React.CSSProperties}
    >
      <div className="header__inner">
        <img
          className="header__logo"
          src={`${process.env.PUBLIC_URL}/images/madiba-logo.svg`}
          alt="Madiba Garden"
          width="336"
          height="192"
        />
        <span className="header__tagline">Catálogo de presentes</span>
      </div>
    </header>
  );
}
