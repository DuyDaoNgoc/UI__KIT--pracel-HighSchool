import React, { useEffect } from "react";
import "../../../stylesheets/components/_highschools.scss";
import AOS from "aos";
import "aos/dist/aos.css"; // Import AOS styles

interface TestimonialsProps {
  list: {
    title: string;
  }[];
}

export default function Testimonials({ list }: TestimonialsProps) {
  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 1000, // Animation duration
      once: true, // Whether animation should happen only once
      offset: 100, // Offset from the original trigger point
    });
  }, []);

  const testimonialData = [
    {
      name: "Emily Rodriguez",
      role: "Part-time Student at Marketing School",
      image: "https://c.animaapp.com/mjlp8gt8euLIrx/img/ai_1.png",
      quote:
        "The flexible schedule allowed me to balance work and studies perfectly. The instructors were incredibly supportive and understanding of my commitments.",
    },
    {
      name: "Michael Chen",
      role: "Part-time Student at Business School",
      image: "https://c.animaapp.com/mjlp8gt8euLIrx/img/ai_2.png",
      quote:
        "Enrolling in the part-time program was the best decision I made. I gained practical skills while maintaining my career, and the networking opportunities were invaluable.",
    },
    {
      name: "Sarah Thompson",
      role: "Part-time Student at Design School",
      image: "https://c.animaapp.com/mjlp8gt8euLIrx/img/ai_3.png",
      quote:
        "As a working parent, the evening classes were perfect for me. The curriculum was engaging and directly applicable to my professional goals.",
    },
    {
      name: "David Patel",
      role: "Part-time Student at Technology School",
      image: "https://c.animaapp.com/mjlp8gt8euLIrx/img/ai_4.png",
      quote:
        "The part-time program exceeded my expectations. The quality of education matched full-time programs, and I could immediately apply what I learned at work.",
    },
  ];

  return (
    <>
      {list.map((_, index) => (
        <section key={index} className="testimonials-section">
          <div className="testimonials-container">
            <h2 className="testimonials-heading" data-aos="zoom-in-down">
              Student Testimonials
            </h2>

            <div className="testimonials-grid">
              {testimonialData.map((testimonial, idx) => (
                <article
                  key={idx}
                  className="testimonial-card title"
                  data-aos="zoom-in-down"
                >
                  <div className="testimonial-content" data-aos="zoom-in-down">
                    <div className="testimonial-avatar-wrapper">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="testimonial-avatar"
                        loading="lazy"
                      />
                    </div>

                    <h3 className="testimonial-name">{testimonial.name}</h3>

                    <p className="testimonial-role">{testimonial.role}</p>

                    <p className="testimonial-quote">"{testimonial.quote}"</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
