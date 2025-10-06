// src/components/Background2.tsx
import React from "react";

interface Background2Props {
  list: {
    title: string;
    subtitle: string;
    br2: string;
  }[];
}

export default function Background2({ list }: Background2Props) {
  return (
    <>
      {list.map((items, index) => (
        <section
          key={index}
          className="wd-hg-2 background--filter section"
          data-aos="zoom-in-down"
        >
          {/* Ảnh lấy từ thư mục public */}
          <img
            src={items.br2}
            alt="Background"
            className="background-2 brightness"
          />

          <div className="content__title-2">
            <h2 className="text__content--large">{items.title}</h2>
            <p className="text__content--small content--spaced text__content--white text__content--lh-2 content--mgbt-3 text__wrapper--ellipsis-2">
              {items.subtitle}
            </p>
            <button className="btn__background-2 btn--active pricing__items--light-yellow">
              DOWNLOAD
            </button>
          </div>
        </section>
      ))}
    </>
  );
}
