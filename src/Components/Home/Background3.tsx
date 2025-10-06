// src/components/Background3.tsx
import React from "react";
import Dots from "../settings/Dots";

interface Background3Props {
  list: {
    title: string;
    subtitle: string;
    content: string;
  }[];
}

export default function Background3({ list }: Background3Props) {
  return (
    <>
      {list.map((items, index) => (
        <section
          key={index}
          className="background-3 text__content--white section"
          data-aos="zoom-in-down"
        >
          <div className="text__wrapper">
            <div>
              <h3 className="title__content--size-32 text__content--white text__content--lh-5">
                {items.title}
              </h3>
              <p className="text__content--size-18 text__content--white text__content--lh-4">
                {items.subtitle}
              </p>
            </div>
            <div className="content__dot--items">
              <p className="text__content--small text__content--white text__content--lh-2 text__wrapper--ellipsis">
                {items.content}
              </p>
              <Dots />
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
