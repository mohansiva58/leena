import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { 
  Mail, 
  MapPin, 
  Phone, 
  ShieldAlert, 
  Ban, 
  AlertTriangle, 
  Clock, 
  Video, 
  Info, 
  FileText, 
  Lock,
  CreditCard,
  Globe
} from 'lucide-react';

type PolicyPageProps = {
  title: string;
  intro: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
};

const getSectionIcon = (heading: string) => {
  const h = heading.toLowerCase();
  if (h.includes('return') || h.includes('exchange')) return <ShieldAlert className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
  if (h.includes('cancel')) return <Ban className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
  if (h.includes('damage') && !h.includes('report')) return <AlertTriangle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
  if (h.includes('report') || h.includes('time') || h.includes('hour')) return <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
  if (h.includes('video') || h.includes('parcel')) return <Video className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
  if (h.includes('collect') || h.includes('information')) return <Lock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
  if (h.includes('use') || h.includes('how we')) return <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
  if (h.includes('sharing') || h.includes('data')) return <Globe className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
  if (h.includes('pricing') || h.includes('payment') || h.includes('product')) return <CreditCard className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
  return <FileText className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />;
};

export function PolicyPage({ title, intro, sections }: PolicyPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <section className="container mx-auto max-w-4xl px-4">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-blue-600">
            Leena
          </p>
          <h1 className="font-serif text-4xl font-bold text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {intro}
          </p>

          <div className="mt-10 space-y-6">
            {sections.map((section) => (
              <article key={section.heading} className="rounded-lg border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex gap-4">
                  {getSectionIcon(section.heading)}
                  <div>
                    <h2 className="mb-2 text-xl font-semibold text-foreground">
                      {section.heading}
                    </h2>
                    <p className="leading-relaxed text-muted-foreground text-sm sm:text-base">
                      {section.body}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Help Banner */}
          <div className="mt-12 rounded-xl border border-blue-100 bg-blue-50/30 p-6 md:p-8 text-center">
            <h3 className="text-lg font-semibold text-foreground">Need Assistance?</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
              If you have any questions about our policy, need to report a damaged product, or want to submit an unboxing video, please contact our customer support team.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm font-medium">
              <a href="tel:+919032624257" className="flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-blue-600 transition-colors hover:bg-blue-50">
                <Phone className="h-4 w-4" />
                <span>9032624257</span>
              </a>
              <a href="mailto:leenabyalekhya@gmail.com" className="flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-blue-600 transition-colors hover:bg-blue-50">
                <Mail className="h-4 w-4" />
                <span>leenabyalekhya@gmail.com</span>
              </a>
            </div>
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
      intro="We respect your privacy and protect the personal information you share with us while browsing, shopping, or contacting Leena."
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
          body: 'For privacy questions, contact us at leenabyalekhya@gmail.com or 9032624257.',
        },
      ]}
    />
  );
}

export function TermsPage() {
  return (
    <PolicyPage
      title="Terms & Conditions"
      intro="By using Leena, you agree to the terms below for browsing, ordering, payment, and customer support."
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
          body: 'We do not accept returns or exchanges for issues related to satisfaction, color variation, or size, as all product details are clearly mentioned in the product description. Kindly review all details carefully before placing your order.',
        },
        {
          heading: 'Order Cancellation',
          body: 'Orders once placed cannot be cancelled.',
        },
        {
          heading: 'Damaged Products',
          body: 'Returns or exchanges will be accepted only if a damaged product is received.',
        },
        {
          heading: 'Reporting Damage',
          body: 'Any damage claim must be reported within 24–48 hours of receiving the product.',
        },
        {
          heading: 'Mandatory Parcel Opening Video',
          body: 'A clear 360° parcel opening video is mandatory to process any damage claim.',
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
                  Leena
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
                      <p>Phone: <a href="tel:+919032624257" className="text-blue-600 hover:text-blue-700 hover:underline">9032624257</a></p>
                      <p>WhatsApp: <a href="https://wa.me/919032624257" className="text-blue-600 hover:text-blue-700 hover:underline">9032624257</a></p>
                      <p>Email: <a href="mailto:leenabyalekhya@gmail.com" className="text-blue-600 hover:text-blue-700 hover:underline">leenabyalekhya@gmail.com</a></p>
                    </div>

                    <div className="text-muted-foreground mt-4">Opening Hours</div>
                    <div className="mt-4">
                      <p>Everyday, 9:00 AM – 6:00 PM</p>
                    </div>

                  

                    <div className="text-muted-foreground mt-4">Careers</div>
                    <div className="mt-4">
                      <p>Email: <a href="mailto:careers@leena.store" className="text-blue-600 hover:text-blue-700 hover:underline">careers@leena.store</a></p>
                    </div>

                  </div>

                  {/* Buttons */}
                  <div className="mt-8 flex flex-wrap gap-3">
                    <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="rounded-full bg-secondary px-5 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200">
                      Open In Google Maps
                    </a>
                    <a href="tel:+919032624257" className="rounded-full bg-secondary px-5 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200">
                      Call Customer Care
                    </a>
                    <a href="mailto:leenabyalekhya@gmail.com" className="rounded-full bg-secondary px-5 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200">
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
