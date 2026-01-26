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

          <div
            className="card__container"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: "8px",
              gridAutoRows: "auto",
            }}
          >
            {/* Card 1 - Top Left */}
            <figure
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
              style={{ gridColumn: "1 / 3", gridRow: "1 / 2" }}
            >
              <img
                src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=500&h=400&fit=crop"
                alt="Lớp học hiện đại"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </figure>

            {/* Card 2 - Top Right (Featured) */}
            <div
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
              style={{ gridColumn: "3 / 7", gridRow: "1 / 2" }}
            >
              <figure style={{ width: "100%", height: "100%" }}>
                <img
                  src="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=900&h=400&fit=crop"
                  alt="Phòng thí nghiệm"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
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

            {/* Card 3 - Middle Left Large */}
            <figure
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
              style={{ gridColumn: "1 / 4", gridRow: "2 / 4" }}
            >
              <img
                src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=700&h=600&fit=crop"
                alt="Hoạt động ngoại khóa"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </figure>

            {/* Card 4 - Middle Right Top */}
            <figure
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
              style={{ gridColumn: "4 / 7", gridRow: "2 / 3" }}
            >
              <img
                src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&h=300&fit=crop"
                alt="Thư viện trường"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </figure>

            {/* Card 5 - Bottom Right Top */}
            <figure
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
              style={{ gridColumn: "4 / 7", gridRow: "3 / 4" }}
            >
              <img
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=300&fit=crop"
                alt="Sân thể thao"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </figure>

            {/* Card 6 - Bottom Left Small */}
            <figure
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
              style={{ gridColumn: "1 / 2", gridRow: "4 / 5" }}
            >
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&h=300&fit=crop"
                alt="Giảng đường"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </figure>

            {/* Card 7 - Text Card */}
            <div
              className="card__items"
              data-aos="zoom-in-down"
              style={{ gridColumn: "2 / 5", gridRow: "4 / 5" }}
            >
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

            {/* Card 8 - Bottom Right Large */}
            <figure
              className="card__items card__items--hover-dark"
              data-aos="zoom-in-down"
              style={{ gridColumn: "5 / 7", gridRow: "4 / 5" }}
            >
              <img
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&h=300&fit=crop"
                alt="Sân thể thao"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
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
