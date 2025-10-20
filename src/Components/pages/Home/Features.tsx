import React from "react";
import DesktopIcon from "../../../icons/Desktop";
import DiamondIcon from "../../../icons/Diamond";
import LayerIcon from "../../../icons/Layer";

interface FeatureItem {
  title: string;
  subtitle: string;
  subtile_phone: string;
  content_phone: string;
  subtile_diamon: string;
  content_diamon: string;
  subtitle_layer: string;
  content_layer: string;
  mac: string;
}

interface FeaturesProps {
  list: FeatureItem[];
}

const Features: React.FC<FeaturesProps> = ({ list }) => {
  return (
    <>
      {list.map((items, index) => (
        <section className="main__content--mgt section" id="main" key={index}>
          <div>
            <h2 className="title" data-aos="zoom-in-down">
              {items.title}
            </h2>
            <p
              className="text__content--ct text__content--size-18"
              data-aos="zoom-in-down"
            >
              {items.subtitle}
            </p>
          </div>

          <div className="features">
            <div className="features__container">
              {[
                {
                  Icon: DesktopIcon,
                  title: items.subtile_phone,
                  content: items.content_phone,
                },
                {
                  Icon: DiamondIcon,
                  title: items.subtile_diamon,
                  content: items.content_diamon,
                },
                {
                  Icon: LayerIcon,
                  title: items.subtitle_layer,
                  content: items.content_layer,
                },
              ].map(({ Icon, title, content }, i) => (
                <div
                  className="features__items"
                  data-aos="zoom-in-down"
                  key={i}
                >
                  <div className="features__icons--size">
                    <Icon />
                  </div>
                  <div>
                    <h2 className="text__content--size-18 content--mgbt-0">
                      {title}
                    </h2>
                    <p className="testimonials__items--description text__wrapper--ellipsis-2">
                      {content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* content img */}
            <div className="mac" data-aos="zoom-in-down">
              <img src={items.mac} alt="" />
            </div>
          </div>
        </section>
      ))}
    </>
  );
};

export default Features;
