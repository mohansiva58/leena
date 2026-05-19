import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Mail, MapPin, Phone } from 'lucide-react';

type PolicyPageProps = {
  title: string;
  intro: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
};

export function PolicyPage({ title, intro, sections }: PolicyPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <section className="container mx-auto max-w-4xl px-4">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">
            Leena Collection
          </p>
          <h1 className="font-serif text-4xl font-bold text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {intro}
          </p>

          <div className="mt-10 space-y-6">
            {sections.map((section) => (
              <article key={section.heading} className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-3 text-xl font-semibold text-foreground">
                  {section.heading}
                </h2>
                <p className="leading-relaxed text-muted-foreground">
                  {section.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro="We respect your privacy and protect the personal information you share with us while browsing, shopping, or contacting Leena Collection."
      sections={[
        {
          heading: 'Information We Collect',
          body: 'We collect details needed to process your order, including your name, email address, phone number, shipping address, cart details, and payment confirmation status. Payment card or UPI details are handled securely by Razorpay and are not stored on our servers.',
        },
        {
          heading: 'How We Use Information',
          body: 'Your information is used to confirm orders, arrange delivery, provide customer support, prevent fraud, and improve your shopping experience.',
        },
        {
          heading: 'Data Sharing',
          body: 'We share only the required information with payment, delivery, hosting, and support partners to complete your order. We do not sell customer data.',
        },
        {
          heading: 'Contact',
          body: 'For privacy questions, contact us at [EMAIL_ADDRESS] or +91 80087 43531.',
        },
      ]}
    />
  );
}

export function TermsPage() {
  return (
    <PolicyPage
      title="Terms & Conditions"
      intro="By using Leena Collection, you agree to the terms below for browsing, ordering, payment, shipping, and customer support."
      sections={[
        {
          heading: 'Orders',
          body: 'Orders are confirmed only after successful payment and availability verification. We may contact you if product details, stock, or delivery information needs confirmation.',
        },
        {
          heading: 'Pricing & Payments',
          body: 'All prices are shown in INR. Online payments are processed through Razorpay. We do not store sensitive payment credentials.',
        },
        {
          heading: 'Product Information',
          body: 'We make every effort to show accurate product images, prices, and descriptions. Slight color or fit variation can occur due to lighting, screen settings, and garment styling.',
        },
        {
          heading: 'Use Of Website',
          body: 'Customers must provide accurate contact and shipping information. Any misuse, fraudulent transaction, or abusive activity may lead to order cancellation.',
        },
      ]}
    />
  );
}

export function RefundPolicyPage() {
  return (
    <PolicyPage
      title="Refund / Return Policy"
      intro="Please review our policy before placing an order. We want customers to make informed purchases."
      sections={[
        {
          heading: 'No Returns / No Exchanges',
          body: 'All sales are final. We currently do not accept returns or exchanges for size, color preference, or change of mind.',
        },
        {
          heading: 'Damaged Or Incorrect Product',
          body: 'If you receive a damaged or incorrect item, contact us within 24 hours of delivery with your order details and clear photos. We will review the case and assist with a suitable resolution.',
        },
        {
          heading: 'Refund Timeline',
          body: 'If a refund is approved for an eligible issue, it will be processed to the original payment method as per Razorpay and bank timelines.',
        },
        {
          heading: 'Cancellation',
          body: 'Orders can be cancelled only before processing or dispatch. Once an order is packed or shipped, cancellation may not be available.',
        },
      ]}
    />
  );
}

export function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <section className="container mx-auto max-w-6xl px-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-10">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">

              {/* Left Column: Details */}
              <div className="flex flex-col">
                <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
                  Leena Collection
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Leena Designer Boutique and Retail Outlet
                </p>

                {/* Address Box */}
                <div className="mt-8 rounded-lg border border-border bg-secondary/50 p-6">
                  <p className="text-sm leading-relaxed text-foreground">
                    T.C. 22/2463-1<br />
                    Ameenpur, Miyapur, Telangana

                  </p>
                </div>

                {/* Contact Info Box */}
                <div className="mt-6 flex-1 rounded-lg border border-border p-6 text-sm">
                  <div className="grid grid-cols-[120px_1fr] gap-4 sm:grid-cols-[140px_1fr]">

                    <div className="text-muted-foreground">Customer Care</div>
                    <div className="space-y-1">
                      <p>Phone: <a href="tel:+918008743531" className="text-primary hover:underline">+91 80087 43531</a></p>
                      <p>WhatsApp: <a href="https://wa.me/918008743531" className="text-primary hover:underline">+91 80087 43531</a></p>
                      <p>Email: <a href="mailto:leenaweb58@gmail.com " className="text-primary hover:underline">leenaweb58@gmail.com </a></p>
                    </div>

                    <div className="text-muted-foreground mt-4">Opening Hours</div>
                    <div className="mt-4">
                      <p>Everyday, 9:00 AM – 6:00 PM</p>
                    </div>

                    <div className="text-muted-foreground mt-4">Custom Designs</div>
                    <div className="mt-4">
                      <p>Lead Designer: <a href="tel:+918008743531" className="text-primary hover:underline">+91 80087 43531</a></p>
                    </div>

                    <div className="text-muted-foreground mt-4">Careers</div>
                    <div className="mt-4">
                      <p>Email: <a href="mailto:careers@leena.store" className="text-primary hover:underline">careers@leena.store</a></p>
                    </div>

                  </div>

                  {/* Buttons */}
                  <div className="mt-8 flex flex-wrap gap-3">
                    <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="rounded-full bg-secondary px-5 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/80">
                      Open In Google Maps
                    </a>
                    <a href="tel:+918008743531" className="rounded-full bg-secondary px-5 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/80">
                      Call Customer Care
                    </a>
                    <a href="mailto:leenaweb58@gmail.com " className="rounded-full bg-secondary px-5 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/80">
                      Email Us
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: Map */}
              <div className="relative min-h-[400px] overflow-hidden rounded-xl border border-border lg:min-h-[600px]">
                <iframe
                  title="Google Maps Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30436.50739563125!2d78.31298644977275!3d17.528341859760953!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb8d6f37b22be7%3A0xfdd9ac4ad5b0b7b2!2sAmeenpur%2C%20Miyapur%2C%20Hyderabad%2C%20Telangana!5e0!3m2!1sen!2sin!4v1779161324111!5m2!1sen!2sin"
                  className="absolute inset-0 h-full w-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
