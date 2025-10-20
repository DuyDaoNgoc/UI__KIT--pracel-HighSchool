// src/components/Portfolio.tsx
import React from "react";

// Import icon components thật
import ViewIcon from "../../../icons/View";
import LikeIcon from "../../../icons/Like";
import CommentsIcon from "../../../icons/Comments";
import PrevIcon from "../../../icons/Prev";
import NextIcon from "../../../icons/Next";

interface PortfolioProps {
  list: {
    title: string;
    subtitle: string;
    date: string;
    content: string;
    view: string;
    like: string;
    comments: string;
    card7_title: string;
    card7_subtitle: string;
    card7_content: string;
    card1: string;
    card2: string;
    card3: string;
    card4: string;
    card5: string;
    card6: string;
  }[];
}

export default function Portfolio({ list }: PortfolioProps) {
  return (
    <>
      {list.map((items, index) => (
        <section
          key={index}
          className="main__content--mgt section"
          id="Portfolio"
        >
          <h2 className="title content--mgbt-4" data-aos="zoom-in-down">
            {items.title}
          </h2>

          <div className="card__container">
            {/* Project 1 */}
            <figure
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
            >
              <img src={items.card1} alt="Project 1" />
            </figure>

            {/* Project 2 */}
            <div
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
            >
              <figure>
                <img src={items.card3} alt="Project 2" />
              </figure>
              <div className="card__items--hover text__content--white">
                <div className="card__items--div">
                  <div>
                    <h3 className="text__content--size-32 text__content--lh-5 text__wrapper--ellipsis-3">
                      {items.subtitle}
                    </h3>
                    <p
                      className="text__content--size-18 text__content--lh-4"
                      style={{ letterSpacing: "1px" }}
                    >
                      {items.date}
                    </p>
                  </div>
                  <div className="text__content--lh-2 portfolio__content--hr text__content--small">
                    <p>{items.content}</p>
                  </div>
                </div>

                {/* ICONS */}
                <div className="portfolio-icons--container">
                  <div className="portfolio-icons--items">
                    <ViewIcon />
                    <p className="text__content--size-12">{items.view}</p>
                  </div>
                  <div className="portfolio-icons--items">
                    <LikeIcon />
                    <p className="text__content--size-12">{items.like}</p>
                  </div>
                  <div className="portfolio-icons--items">
                    <CommentsIcon />
                    <p className="text__content--size-12">{items.comments}</p>
                  </div>
                  <div className="icons--hiden">
                    <ViewIcon />
                  </div>
                </div>
              </div>
            </div>

            {/* Project 3 */}
            <figure
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
            >
              <img src={items.card4} alt="Project 3" />
            </figure>

            {/* Project 4 */}
            <figure
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
            >
              <img src={items.card2} alt="Project 4" />
            </figure>

            {/* Project 5 */}
            <figure
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
            >
              <img src={items.card5} alt="Project 5" />
            </figure>

            {/* Project 6 (Text Card) */}
            <div className="card__items" data-aos="zoom-in-down">
              <div className="card__items--flex">
                <div>
                  <h3 className="text__content--size-32 text__content--lh-5 text__wrapper--ellipsis-3">
                    {items.card7_title}
                  </h3>
                  <p className="text__content--size-18 text__content--dark text__content--lh-4">
                    {items.card7_subtitle}
                  </p>
                </div>
                <p className="text__content--size-64 text__content--dark text__content--lh-7 card__items--hr">
                  {items.card7_content}
                </p>
              </div>
            </div>

            {/* Project 7 */}
            <figure
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
            >
              <img src={items.card6} alt="Project 6" />
            </figure>
          </div>

          {/* Pagination */}
          <div className="card__form--actice" data-aos="zoom-in-down">
            <PrevIcon />
            <div className="list__items--btn">
              <button className="items--btn">1</button>
              <button className="items--btn">2</button>
              <button className="items--btn">3</button>
              <button className="items--btn">4</button>
              <button className="items--btn">5</button>
            </div>
            <NextIcon />
          </div>
        </section>
      ))}
    </>
  );
}
