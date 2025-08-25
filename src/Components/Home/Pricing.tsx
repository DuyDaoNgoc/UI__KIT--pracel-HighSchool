// src/components/Pricing.tsx
import React from "react";

interface PricingProps {
  list: {
    title: string;
    subtitle1: string;
    price1: string;
    subtitle2: string;
    price2: string;
    subtitle3: string;
    price3: string;
    year: string;
    dola: string;
    silver_content1: string;
    silver_content2: string;
    silver_content3: string;
    gold_content1: string;
    gold_content2: string;
    gold_content3: string;
    platinum_content1: string;
    platinum_content2: string;
    platinum_content3: string;
    btn: string;
  }[];
}

export default function Pricing({ list }: PricingProps) {
  return (
    <>
      {list.map((items, index) => (
        <section
          key={index}
          className="pricing--gray main__content--mgt"
          data-aos="zoom-in-down"
        >
          <h3 className="title" data-aos="zoom-in-down">
            {items.title}
          </h3>

          <div className="pricing__container layout__full--width">
            {/* Silver */}
            <div className="card pricing__items--silver" data-aos="fade-up">
              <div className="pricing__content--practice">
                <p className="title__content--size-18 pricing__text--light-yellow">
                  {items.subtitle1}
                </p>
                <div>
                  <p className="text__content--size-64 text__content--items pricing__items--flex">
                    <span className="items--content">{items.dola}</span>
                    {items.price1}
                  </p>
                  <p className="text__content--size-18 text__content--lh-3">
                    {items.year}
                  </p>
                </div>
                <div className="text__content--size-18">
                  <p>{items.silver_content1}</p>
                  <p>{items.silver_content2}</p>
                  <p>{items.silver_content3}</p>
                </div>
                <button className="btn btn--active pricing__items--light-yellow">
                  {items.btn}
                </button>
              </div>
            </div>

            {/* Gold */}
            <div
              className="card pricing__items--light-yellow"
              data-aos="zoom-in-down"
            >
              <div className="pricing__content--practice">
                <p className="text__content--size-18">{items.subtitle2}</p>
                <div>
                  <p className="text__content--size-64 text__content--items pricing__text--silver pricing__items--flex">
                    <span className="items--content">{items.dola}</span>
                    {items.price2}
                  </p>
                  <p className="text__content--size-18 text__content--lh-3">
                    {items.year}
                  </p>
                </div>
                <div className="text__content--size-18">
                  <p>{items.gold_content1}</p>
                  <p>{items.gold_content2}</p>
                  <p>{items.gold_content3}</p>
                </div>
                <button className="btn btn--active pricing__items--silver">
                  {items.btn}
                </button>
              </div>
            </div>

            {/* Platinum */}
            <div className="card pricing__items--silver" data-aos="fade-up">
              <div className="pricing__content--practice">
                <p className="title__content--size-18 pricing__text--light-yellow">
                  {items.subtitle3}
                </p>
                <div>
                  <div>
                    <p className="text__content--size-64 text__content--items pricing__items--flex">
                      <span className="items--content">{items.dola}</span>
                      {items.price3}
                    </p>
                  </div>
                  <p className="text__content--size-18 text__content--lh-3">
                    {items.year}
                  </p>
                </div>
                <div className="text__content--size-18">
                  <p>{items.platinum_content1}</p>
                  <p>{items.platinum_content2}</p>
                  <p>{items.platinum_content3}</p>
                </div>
                <button className="btn btn--active pricing__items--light-yellow">
                  {items.btn}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile hamburger menu */}
          <div className="text__content--ct hambuger">
            <button
              className="select--color text__content--size-18"
              data-aos="fade-up"
            >
              {items.subtitle1}
            </button>
            <button
              className="select--color text__content--size-18"
              data-aos="fade-up"
            >
              {items.subtitle2}
            </button>
            <button
              className="select--color text__content--size-18"
              data-aos="fade-up"
            >
              {items.subtitle3}
            </button>
          </div>
        </section>
      ))}
    </>
  );
}
