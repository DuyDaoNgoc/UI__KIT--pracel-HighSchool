import React from "react";

interface PortfolioProps {
  list: {
    title: string;
  }[];
}

export default function Portfolio({ list }: PortfolioProps) {
  return (
    <>
      {list.map((_, index) => (
        <section
          key={index}
          className="main__content--mgt section"
          id="Portfolio"
        >
          <div className="content--mgbt-4">
            <h2 className="title" data-aos="zoom-in-down">
              Portfolio
            </h2>
          </div>

          <div className="card__container">
            {/* Card 1 */}
            <figure
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
            >
              <img
                src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=600&fit=crop"
                alt="Lớp học hiện đại"
              />
            </figure>

            {/* Card 2 */}
            <div
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
            >
              <figure>
                <img
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=600&fit=crop"
                  alt="Phòng thí nghiệm"
                />
              </figure>

              <div className="card__items--hover text__content--white">
                <div className="card__items--div">
                  <div>
                    <h3 className="text__content--size-32 text__content--lh-5 text__wrapper--ellipsis-3">
                      Phòng Thí Nghiệm Khoa Học Hiện Đại
                    </h3>
                    <p
                      className="text__content--size-18 text__content--lh-4"
                      style={{ letterSpacing: "1px" }}
                    >
                      15 Tháng 12, 2024
                    </p>
                  </div>

                  <div className="text__content--lh-2 portfolio__content--hr text__content--small">
                    <p>
                      Trang bị đầy đủ thiết bị thí nghiệm tiên tiến, phục vụ cho
                      các môn Vật lý, Hóa học và Sinh học.
                    </p>
                  </div>
                </div>

                {/* Icons */}
                <div className="portfolio-icons--container">
                  <div className="portfolio-icons--items">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z" />
                    </svg>
                    <p className="text__content--size-12">2.5k</p>
                  </div>

                  <div className="portfolio-icons--items">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5" />
                    </svg>
                    <p className="text__content--size-12">856</p>
                  </div>

                  <div className="portfolio-icons--items">
                    <svg viewBox="0 0 24 24">
                      <path d="M20 2H4v18l4-4h14z" />
                    </svg>
                    <p className="text__content--size-12">124</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <figure
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
            >
              <img
                src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=600&fit=crop"
                alt="Hoạt động ngoại khóa"
              />
            </figure>

            {/* Card 4 */}
            <figure
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
            >
              <img
                src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&h=600&fit=crop"
                alt="Thư viện trường"
              />
            </figure>

            {/* Card 5 */}
            <figure
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
            >
              <img
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop"
                alt="Sân thể thao"
              />
            </figure>

            {/* Card 6 */}
            <div className="card__items" data-aos="zoom-in-down">
              <div className="card__items--flex">
                <div>
                  <h3 className="text__content--size-32 text__content--lh-5">
                    Thư Viện Ảnh Trường Học
                  </h3>
                  <p className="text__content--size-18 text__content--dark">
                    BỞI BAN TRUYỀN THÔNG
                  </p>
                </div>
                <p className="text__content--size-64 text__content--dark">
                  Đời Sống
                  <br />
                  Học Đường
                </p>
              </div>
            </div>

            {/* Card 7 */}
            <figure
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
            >
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=600&fit=crop"
                alt="Giảng đường"
              />
            </figure>
          </div>

          {/* Pagination */}
          <div className="card__form--actice" data-aos="zoom-in-down">
            <div className="list__items--btn">
              <button className="items--btn">1</button>
              <button className="items--btn">2</button>
              <button className="items--btn active">3</button>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
