import React, { useEffect } from "react";
import Features from "../Components/pages/Home/Features";
import Background2 from "../Components/pages/Home/Background2";
import Testimonials from "../Components/pages/Home/Testimonials";
import Pricing from "../Components/pages/Home/Pricing";
import Portfolio from "../Components/pages/Home/Portfolio";
import Background3 from "../Components/pages/Home/Background3";
import ContactPhone from "../Components/pages/Home/ContactPhone";

// ICONS + ASSETS
import mac from "../../public/assets/imgs/phone/mac.png";
import br2 from "../../public/assets/imgs/background/background-2.png";
import project1 from "../../public/assets/imgs/project/project-card-1.png";
import project2 from "../../public/assets/imgs/project/project-card-2.png";
import project3 from "../../public/assets/imgs/project/project-card-3.png";
import project4 from "../../public/assets/imgs/project/project-card-4.png";
import project5 from "../../public/assets/imgs/project/project-card-5.png";
import project6 from "../../public/assets/imgs/project/project-card-6.png";
import person1 from "../../public/assets/imgs/person/person.png";
import person2 from "../../public/assets/imgs/person/person-2.png";
import person3 from "../../public/assets/imgs/person/person-3.png";
import person4 from "../../public/assets/imgs/person/person-4.png";
import iphone from "../../public/assets/imgs/phone/iphone.png";
import mail from "../../public/assets/icons/phone/mail.svg";
import phones from "../../public/assets/icons/phone/phone.svg";
import localtion from "../../public/assets/icons/phone/location.svg";

import AOS from "aos";
import "aos/dist/aos.css";

export default function Home() {
  // 👇 useEffect phải nằm trong component
  useEffect(() => {
    AOS.init({
      duration: 800,
      delay: 100,
      once: true,
    });
    AOS.refresh();
  }, []);

  return (
    <main>
      {/* FEATURES */}
      <Features
        list={[
          {
            title: "Trường Học",
            subtitle: "KIẾN TẠO TƯƠNG LAI HỌC SINH",
            subtile_phone: "ĐỘI NGŨ GIÁO VIÊN TẬN TÂM",
            content_phone:
              "Giáo viên giàu kinh nghiệm, nhiệt huyết và luôn đồng hành cùng học sinh.",
            subtile_diamon: "CHƯƠNG TRÌNH HỌC HIỆN ĐẠI",
            content_diamon:
              "Nội dung giảng dạy được cập nhật, bám sát thực tiễn và tiêu chuẩn quốc tế.",
            subtitle_layer: "HOẠT ĐỘNG NGOẠI KHÓA PHONG PHÚ",
            content_layer:
              "Các hoạt động đa dạng giúp học sinh phát triển kỹ năng mềm và sáng tạo.",
            mac: mac,
          },
        ]}
      />

      {/* BACKGROUND 2 */}
      <Background2
        list={[
          {
            title: "Get Your Free Version",
            subtitle:
              "Having used discount toner cartridges for twenty years, there have been a lot of changes in the toner cartridge market. The market today is approximately a twenty billion dollar business.",
            br2: br2,
          },
        ]}
      />

      {/* TESTIMONIALS */}
      <Testimonials
        list={[
          {
            title: "Testimonials",
            user1: "LULU HOFFMAN",
            subtitle_user1: "Marketing Consultant at okodesign.net",
            content_user1:
              "If you are an entrepreneur, you know that your success cannot depend on the opinions of others...",
            person1: person1,
            user2: "ELSIE DUNCAN",
            subtitle_user2: "Project Manager at okodesign.net",
            content_user2:
              "Ever heard of the Fuller Brush Man? You know, those legendary guys...",
            person2: person2,
            user3: "DUSTIN GONZALES",
            subtitle_user3: "CEO at hofmannui.net",
            content_user3:
              "Do you remember the story of “The Wizard of Oz”?...",
            person3: person3,
            user4: "LAURA PARKS",
            subtitle_user4: "UX Lead at hofmannui.net",
            content_user4:
              "They are big, bold and beautiful. Billboards have been around for quite a while...",
            person4: person4,
          },
        ]}
      />

      {/* PRICING */}
      <Pricing
        list={[
          {
            title: "Choose Your Plan",
            dola: "$",
            year: "YEAR",
            btn: "PURCHASE",
            subtitle1: "SILVER",
            silver_content1: "Personal Account",
            silver_content2: "25 GB Discspace",
            silver_content3: "50 Uploads per day",
            subtitle2: "GOLD",
            gold_content1: "Personal Account",
            gold_content2: "50 GB Discspace",
            gold_content3: "500 Uploads per day",
            subtitle3: "PLATINUM",
            platinum_content1: "Team Account",
            platinum_content2: "500 GB Discspace",
            platinum_content3: "Unlimited Uploads per day",
            price1: "49",
            price2: "99",
            price3: "299",
          },
        ]}
      />

      {/* PORTFOLIO */}
      <Portfolio
        list={[
          {
            title: "Portfolio",
            card1: project1,
            card2: project2,
            card3: project3,
            card4: project4,
            card5: project5,
            card6: project6,
            subtitle: "Blue Mountains",
            date: "17 Apr 2016",
            content:
              "Planning a vacation to Europe? No doubt you have certain expectations...",
            card7_title: "Scenery Photos",
            card7_subtitle: "BY EVGENY METILAN",
            card7_content: "Wild Nature",
            view: "92924",
            like: "1273",
            comments: "4894",
          },
        ]}
      />

      {/* BACKGROUND 3 */}
      <Background3
        list={[
          {
            title: "Gregory Francis",
            subtitle: "CHIEF ENGINEER",
            content:
              "I’ve started to work in company at 2009. Photographs are a way of preserving...",
          },
        ]}
      />

      {/* CONTACT PHONE */}
      <ContactPhone
        list={[
          {
            title: "Stay In Touch",
            phone: iphone,
            mail: mail,
            phones: phones,
            location: localtion,
            address: "2300 W Arbutus Dr Citrus Springs, FL 34434, USA",
            tel: "793-891-7938, 952-775-6021",
            email: "contact@hofmannui.net",
          },
        ]}
      />
    </main>
  );
}
