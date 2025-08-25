import React from "react";
import NavFt from "../Components/settings/NavFt";

// ICONS
import PinterestIcon from "../icons/Pinterest";
import LinkedinIcon from "../icons/Linkedin";
import GooglePlusIcon from "../icons/GooglePlus";
import TwitterIcon from "../icons/Twitter";
import FacebookIcon from "../icons/Facebook";
import InstagramIcon from "../icons/Instagram";
import NextIcon from "../icons/Next";

type FooterItem = {
  logo: string;
  content: string;
  subtitle: string;
  subscribe: string;
};

type FooterProps = {
  list: FooterItem[];
};

const Footer: React.FC<FooterProps> = ({ list }) => {
  return (
    <>
      {list.map((item, index) => (
        <footer className="footer" key={index}>
          {/* LOGO + SUBSCRIBE */}
          <div className="footer--logo">
            <h3 className="text__content--size-36 pricing__text--light-yellow text__content--lh-0">
              {item.logo}
            </h3>
            <p className="text__content--size-18 text__content--white text__content--lh-2">
              {item.content}
            </p>
            <p className="text__content--small text__content--white text__content--lh-2 content--ft-hidden">
              {item.subtitle}
            </p>
            <p className="text__content--size-18 text__content--white text__content--lh-0">
              {item.subscribe}
            </p>
            <div className="footer__email">
              <input
                type="text"
                placeholder="Your Email"
                className="footer--input text__content--small"
              />
              <button className="footer--btn">
                <NextIcon />
              </button>
            </div>
          </div>

          {/* NAV + SOCIAL ICONS */}
          <div className="nav__footer--container">
            <NavFt />

            <div className="footer__icons--container">
              <div className="footer__icons--items">
                <p className="text__content--size-18 text__content--white">
                  FOLLOW US
                </p>
                <div className="icons--items-ft">
                  <PinterestIcon />
                  <LinkedinIcon />
                  <GooglePlusIcon />
                  <TwitterIcon />
                  <FacebookIcon />
                  <InstagramIcon />
                </div>
              </div>
            </div>

            <p className="text__content--small text__content--white text__content--lh-2 content--ft-flex">
              {item.subtitle}
            </p>
          </div>
        </footer>
      ))}
    </>
  );
};

export default Footer;
