// src/components/Testimonials.tsx
import React from "react";
import LinkedinIcon from "../../../icons/Linkedin";
import GooglePlusIcon from "../../../icons/GooglePlus";
import FacebookIcon from "../../../icons/Facebook";
import TwitterIcon from "../../../icons/Twitter";

interface TestimonialsProps {
  list: {
    title: string;
    user1: string;
    subtitle_user1: string;
    content_user1: string;
    person1: string;

    user2: string;
    subtitle_user2: string;
    content_user2: string;
    person2: string;

    user3: string;
    subtitle_user3: string;
    content_user3: string;
    person3: string;

    user4: string;
    subtitle_user4: string;
    content_user4: string;
    person4: string;
  }[];
}

export default function Testimonials({ list }: TestimonialsProps) {
  return (
    <>
      {list.map((items, index) => (
        <section key={index} className="main__content--mgt section">
          <h2 className="title" data-aos="zoom-in-down">
            {items.title}
          </h2>

          <div className="testimonials testimonials__grid">
            {/* content 1 */}
            <div
              className="testimonials__items--content testimonials__items--hover"
              data-aos="zoom-in-down"
            >
              <img
                src={items.person1}
                alt="user1"
                className="person__img--size person__img--circle"
              />
              <div>
                <h3 className="title__content--size-18 title-2">
                  {items.user1}
                </h3>
                <p className="hr">{items.subtitle_user1}</p>
                <p className="testimonials__items--description text__wrapper--ellipsis-2">
                  {items.content_user1}
                </p>
                <div className="main__icons product-list__item">
                  <div className="icons--fill icons--size">
                    <LinkedinIcon width={18} height={18} />
                  </div>
                  <div className="icons--fill icons--size">
                    <TwitterIcon width={18} height={18} />
                  </div>
                  <div className="icons--fill icons--size">
                    <GooglePlusIcon width={18} height={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* content 2 */}
            <div
              className="testimonials__items--content testimonials__items--hover"
              data-aos="zoom-in-down"
            >
              <img
                src={items.person2}
                alt="user2"
                className="person__img--size person__img--circle"
              />
              <div>
                <h3 className="text__content--size-18 title-2">
                  {items.user2}
                </h3>
                <p className="hr">{items.subtitle_user2}</p>
                <p className="testimonials__items--description text__wrapper--ellipsis-2">
                  {items.content_user2}
                </p>
                <div className="main__icons product-list__item">
                  <div className="icons--fill icons--size">
                    <FacebookIcon width={18} height={18} />
                  </div>
                  <div className="icons--fill icons--size">
                    <TwitterIcon width={18} height={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* content 3 */}
            <div
              className="testimonials__items--content testimonials__items--hover"
              data-aos="zoom-in-down"
            >
              <img
                src={items.person3}
                alt="user3"
                className="person__img--size person__img--circle"
              />
              <div>
                <h3 className="text__content--size-18 title-2">
                  {items.user3}
                </h3>
                <p className="hr">{items.subtitle_user3}</p>
                <p className="testimonials__items--description text__wrapper--ellipsis-2">
                  {items.content_user3}
                </p>
                <div className="main__icons product-list__item">
                  <div className="icons--fill icons--size">
                    <FacebookIcon width={18} height={18} />
                  </div>
                  <div className="icons--fill icons--size">
                    <LinkedinIcon width={18} height={18} />
                  </div>
                  <div className="icons--fill icons--size">
                    <GooglePlusIcon width={18} height={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* content 4 */}
            <div
              className="testimonials__items--content testimonials__items--hover"
              data-aos="fade-up"
            >
              <img
                src={items.person4}
                alt="user4"
                className="person__img--size person__img--circle"
              />
              <div>
                <h3 className="text__content--size-18 title-2">
                  {items.user4}
                </h3>
                <p className="hr">{items.subtitle_user4}</p>
                <p className="testimonials__items--description text__wrapper--ellipsis-2">
                  {items.content_user4}
                </p>
                <div className="main__icons product-list__item">
                  <div className="icons--fill icons--size">
                    <FacebookIcon width={18} height={18} />
                  </div>
                  <div className="icons--fill icons--size">
                    <LinkedinIcon width={18} height={18} />
                  </div>
                  <div className="icons--fill icons--size">
                    <TwitterIcon width={18} height={18} />
                  </div>
                  <div className="icons--fill icons--size">
                    <GooglePlusIcon width={18} height={18} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
