import { AppProps } from "next/app";
import "../style/main.css";
import NavbarStyle from "./Navbar.module.css";

export default function BdsApp({ Component, pageProps }: AppProps) {
  const ExtraNavbar = Array.from<{ name: string, path?: string, action?: () => void }>(pageProps.navbarprops || Component["navBar"] || []);
  return <>
    <div>
      <nav className={NavbarStyle.navigation}>
        <a href="/dashboard" className="brand-name">
          Dashboard
        </a>
        <div
          className={NavbarStyle["navigation-menu"]}>
          <ul>
            {
              ExtraNavbar.map((value, index) => {
                return <li key={`keyNavbar_${index}`}>
                  <a href={value.path||"#"} onClick={value.action}>{value.name}</a>
                </li>
              })
            }
            <li>
              <a href="/about">About</a>
            </li>
          </ul>
        </div>
      </nav>
    </div>
    <div className="appBody">
      <Component {...pageProps} />
    </div>
  </>;
}