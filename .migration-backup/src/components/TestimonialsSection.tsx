import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Priya Sharma',
    location: 'Mumbai',
    rating: 5,
    text: 'Absolutely in love with my purchases! The quality is exceptional and the fit is perfect. Leena has become my go-to for all special occasions.',
    avatar: 'P',
  },
  {
    name: 'Ananya Gupta',
    location: 'Delhi',
    rating: 5,
    text: 'The dresses are stunning and exactly as shown in the pictures. Fast delivery and beautiful packaging. Highly recommend!',
    avatar: 'A',
  },
  {
    name: 'Sneha Patel',
    location: 'Bangalore',
    rating: 5,
    text: 'Found my wedding reception outfit here! The customer service was incredible and they helped me choose the perfect dress.',
    avatar: 'S',
  },
];

export function TestimonialsSection() {
  return (
    <section
      className="
        relative
        overflow-hidden
        bg-white
        py-14
        sm:py-16
      "
    >
      {/* TOP BORDER */}

      <div className="absolute top-0 left-0 h-[1px] w-full bg-neutral-200" />

      {/* BACKGROUND EFFECT */}

      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.03),transparent_28%)]
        "
      />

      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        {/* HEADER */}

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <p
            className="
              mb-3
              text-[11px]
              font-semibold
              uppercase
              tracking-[0.3em]
              text-neutral-400
            "
          >
            Customer Reviews
          </p>

          <h2
            className="
              text-3xl
              font-semibold
              tracking-tight
              text-[#02013f]
              sm:text-4xl
            "
          >
            Loved by Our Customers
          </h2>

          <p
            className="
              mx-auto
              mt-4
              max-w-2xl
              text-sm
              leading-7
              text-neutral-500
              sm:text-base
            "
          >
            Thousands of women trust Leena for
            premium ethnic fashion, elegant designs,
            and exceptional quality.
          </p>
        </motion.div>

        {/* TESTIMONIAL CARDS */}

        <div
          className="
            grid
            gap-4
            md:grid-cols-2
            lg:grid-cols-3
          "
        >
          {testimonials.map(
            (testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{
                  opacity: 0,
                  y: 25,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{ once: true }}
                transition={{
                  delay: index * 0.12,
                  duration: 0.4,
                }}
                whileHover={{ y: -4 }}
                className="
                  relative
                  overflow-hidden
                  rounded-[30px]
                  border
                  border-neutral-200
                  bg-neutral-50
                  p-6
                  transition-all
                  duration-300
                  hover:shadow-[0_10px_40px_rgba(0,0,0,0.05)]
                "
              >
                {/* QUOTE ICON */}

                <div
                  className="
                    absolute
                    right-5
                    top-5
                    text-neutral-200
                  "
                >
                  <Quote size={42} />
                </div>

                {/* STARS */}

                <div className="mb-5 flex items-center gap-1">
                  {[...Array(testimonial.rating)].map(
                    (_, i) => (
                      <Star
                        key={i}
                        size={15}
                        className="
                          fill-black
                          text-black
                        "
                      />
                    )
                  )}
                </div>

                {/* REVIEW TEXT */}

                <p
                  className="
                    mb-6
                    text-sm
                    leading-7
                    text-neutral-600
                  "
                >
                  "{testimonial.text}"
                </p>

                {/* USER */}

                <div className="flex items-center gap-3">
                  {/* AVATAR */}

                  <div
                    className="
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-full
                      bg-black
                      text-sm
                      font-semibold
                      text-white
                    "
                  >
                    {testimonial.avatar}
                  </div>

                  {/* INFO */}

                  <div>
                    <h3
                      className="
                        text-sm
                        font-semibold
                        text-black
                      "
                    >
                      {testimonial.name}
                    </h3>

                    <p
                      className="
                        mt-0.5
                        text-xs
                        text-neutral-400
                      "
                    >
                      {testimonial.location}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
