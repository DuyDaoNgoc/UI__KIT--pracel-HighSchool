// src/Components/Home/ContactPhone.tsx
import React from "react";

import LinkedinIcon from "../../icons/Linkedin";
import GooglePlusIcon from "../../icons/GooglePlus";
import FacebookIcon from "../../icons/Facebook";
import TwitterIcon from "../../icons/Twitter";
import PinterestIcon from "../../icons/Pinterest";

interface ContactProps {
  list: {
    title: string;
    phone: string;
    address: string;
    mail: string;
    email: string;
    phones: string;
    tel: string;
    location?: string;
  }[];
}

export default function Contact({ list }: ContactProps) {
  return (
    <>
      {list.map((items, index) => (
        <section key={index} className="content--pdt section">
          <h3 className="title content--mgbt-4" data-aos="zoom-in-down">
            {items.title}
          </h3>
          <div className="phone__container">
            {/* PHONE IMG */}
            <div className="phone" data-aos="zoom-in-down">
              <img src={items.phone} alt="phone" />
            </div>

            {/* EMAIL FORM */}
            <div className="email--phone" data-aos="zoom-in-down">
              <div className="input--container">
                <div className="input--flex">
                  <input
                    type="text"
                    className="input--phone text__content--lh-3"
                    placeholder="Name*"
                  />
                  <input
                    type="email"
                    className="input--phone text__content--lh-3"
                    placeholder="Email*"
                  />
                </div>
                <input
                  type="text"
                  className="input--phone text__content--lh-3"
                  placeholder="Message*"
                />
              </div>
              <button className="btn--phone text__content--size-18">
                submit
              </button>
            </div>

            {/* ADDRESS */}
            <div className="address__container" data-aos="zoom-in-down">
              <div className="address--items text__content--small text__content--lh-2">
                {items.location && <img src={items.location} alt="location" />}
                <p>{items.address}</p>
              </div>

              <div className="address--items text__content--small text__content--lh-2">
                <img src={items.mail} alt="mail" />
                <p>{items.email}</p>
              </div>

              <div className="address--items text__content--small text__content--lh-2">
                <img src={items.phones} alt="phone-icon" />
                <p>{items.tel}</p>
              </div>

              {/* Social Icons */}
              <div className="icons--address">
                <div className="icon--fill-phone">
                  <a href="#">
                    <PinterestIcon width={23} height={23} />
                  </a>
                </div>
                <div className="icon--fill-phone">
                  <a href="#">
                    <LinkedinIcon width={23} height={23} />
                  </a>
                </div>
                <div className="icon--fill-phone">
                  <a href="#">
                    <GooglePlusIcon width={23} height={23} />
                  </a>
                </div>
                <div className="icon--fill-phone">
                  <a href="#">
                    <TwitterIcon width={23} height={23} />
                  </a>
                </div>
                <div className="icon--fill-phone">
                  <a href="#">
                    <FacebookIcon width={23} height={23} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* BACKGROUND */}
          <div className="background--gray">
            <div className="comment__items--background text__content--size-11">
              <p className="text__content--lh-14">{items.address}</p>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
