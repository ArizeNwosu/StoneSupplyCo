import Image from "next/image";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import {
  AccessibilityIcon,
  ArrowRight,
  ArrowUpRight,
  MapPinIcon,
  PhoneIcon,
} from "@/components/Icons";
import { MapPanel } from "@/components/MapPanel";
import { MobileActionBar } from "@/components/MobileActionBar";
import { RevealController } from "@/components/RevealController";
import { TrackedLink } from "@/components/TrackedLink";
import { ReviewsSection } from "@/components/homepage/ReviewsSection";
import { MaterialCategories } from "@/components/homepage/MaterialCategories";
import { AiFinderCTA } from "@/components/homepage/AiFinderCTA";
import { business } from "@/data/business";
import { authenticPhotos } from "@/data/gallery";
import { featuredInventory, finishOptions } from "@/data/inventory";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": ["Store", "HomeAndConstructionBusiness"],
  "@id": `${siteUrl}/#business`,
  name: business.name,
  legalName: business.legalName,
  url: siteUrl,
  description: business.description,
  telephone: business.phone.e164,
  image: [authenticPhotos.hero, authenticPhotos.yard],
  address: {
    "@type": "PostalAddress",
    streetAddress: business.address.street,
    addressLocality: business.address.city,
    addressRegion: business.address.state,
    postalCode: business.address.postalCode,
    addressCountry: business.address.country,
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: business.coordinates.latitude,
    longitude: business.coordinates.longitude,
  },
  hasMap: business.googleMapsUrl,
  sameAs: [business.socialLinks.instagram],
  areaServed: business.serviceAreas.map((name) => ({
    "@type": "Place",
    name,
  })),
  amenityFeature: business.amenities.map((name) => ({
    "@type": "LocationFeatureSpecification",
    name,
    value: true,
  })),
  knowsAbout: [
    "Quartz slabs",
    "Natural marble slabs",
    "Countertop slabs",
    "Stone finishes",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Stone slab inventory",
    itemListElement: [
      {
        "@type": "OfferCatalog",
        name: "Quartz slabs",
      },
      {
        "@type": "OfferCatalog",
        name: "Natural marble slabs",
      },
    ],
  },
};

const selectionPrinciples = [
  {
    number: "01",
    title: "See the whole composition",
    text: "Full-slab views reveal movement, tone, scale, and the quiet details a small sample leaves out.",
  },
  {
    number: "02",
    title: "Compare the finish",
    text: "Current inventory spans polished, honed, brushed, matte, suede, and leather finishes.",
  },
  {
    number: "03",
    title: "Confirm the actual piece",
    text: "Live listings show dimensions, quantity, finish, and price before you make the trip to the yard.",
  },
];

const audiences = [
  ["Designers", "Compare undertone, movement, and finish at project scale."],
  ["Builders", "Review current quantities and dimensions before scheduling the next step."],
  ["Fabricators", "Start with full-slab specifications and confirm the exact material in person."],
  ["Homeowners", "Move from saved inspiration to a surface you can actually stand in front of."],
] as const;

export default function Home() {
  const [leadInventory, ...secondaryInventory] = featuredInventory;

  return (
    <>
      <RevealController />
      <Header />
      <main id="main-content">
        <section id="top" className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow hero-eyebrow">
              {business.displayName} <span /> Northridge, Los Angeles
            </p>
            <h1 id="hero-title">
              See the whole slab.
              <em>Choose with certainty.</em>
            </h1>
            <p className="hero-intro">
              Natural stone and quartz, shown at full scale for designers,
              builders, fabricators, and homeowners across Los Angeles.
            </p>

            <div className="hero-actions">
              <TrackedLink
                className="button button-light"
                href={business.directionsUrl}
                eventName="directions_click"
                eventLabel="hero"
                target="_blank"
                rel="noreferrer"
              >
                Get directions <ArrowUpRight />
              </TrackedLink>
              <Link
                className="text-link text-link-on-dark"
                href="/materials"
              >
                Browse all slabs <ArrowRight />
              </Link>
            </div>

            <TrackedLink
              className="hero-phone"
              href={business.phone.href}
              eventName="phone_click"
              eventLabel="hero"
            >
              <PhoneIcon /> {business.phone.display}
            </TrackedLink>
          </div>

          <figure className="hero-visual">
            <Image
              src={authenticPhotos.hero}
              alt="Backlit blue and gold natural stone slab photographed by Stone Supply Co."
              fill
              loading="eager"
              sizes="(max-width: 767px) 100vw, 54vw"
              className="hero-image"
            />
            <div className="hero-image-shade" />
            <figcaption>
              <span>Natural marble</span>
              <span>Northridge slab yard</span>
            </figcaption>
          </figure>

          <a className="scroll-cue" href="#inventory" aria-label="Scroll to inventory">
            <span>Explore</span>
            <i aria-hidden="true" />
          </a>
        </section>

        <section className="proof-strip" aria-label="Verified business details">
          <div className="proof-item">
            <strong>{business.inventory.activeListings}</strong>
            <span>Active full-slab listings</span>
          </div>
          <div className="proof-item">
            <strong>{finishOptions.length}</strong>
            <span>Finishes in current inventory</span>
          </div>
          <div className="proof-item proof-location">
            <strong>Northridge</strong>
            <span>San Fernando Valley</span>
          </div>
          <div className="proof-item">
            <strong>Verified</strong>
            <span>Local seller on The Stone Index</span>
          </div>
        </section>

        <section id="inventory" className="inventory-section section-pad">
          <div className="section-heading inventory-heading" data-reveal>
            <p className="eyebrow">Current inventory / 01</p>
            <h2>
              The surface is the story.
              <em>Start with the actual slab.</em>
            </h2>
            <p>
              A live, slab-by-slab selection with the dimensions, finish,
              quantity, and asking price visible before you visit.
            </p>
          </div>

          <div className="inventory-editorial" data-reveal>
            <figure className="inventory-lead">
              <div className="inventory-image-wrap">
                <Image
                  src={leadInventory.image}
                  alt={leadInventory.alt}
                  fill
                  sizes="(max-width: 767px) 100vw, 66vw"
                  className="inventory-image"
                />
              </div>
              <figcaption>
                <div>
                  <span>Featured full slab</span>
                  <h3>{leadInventory.name}</h3>
                </div>
                <p>
                  {leadInventory.finish} · {leadInventory.size}
                </p>
              </figcaption>
            </figure>

            <div className="inventory-side">
              {secondaryInventory.slice(0, 2).map((item) => (
                <figure key={`${item.name}-${item.finish}`}>
                  <div className="inventory-image-wrap">
                    <Image
                      src={item.image}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 767px) 100vw, 32vw"
                      className="inventory-image"
                    />
                  </div>
                  <figcaption>
                    <h3>{item.name}</h3>
                    <span>{item.finish}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          <div className="inventory-index" data-reveal>
            <div className="inventory-index-head" aria-hidden="true">
              <span>Surface</span>
              <span>Finish</span>
              <span>Size</span>
              <span>Available</span>
              <span>Asking price</span>
            </div>
            {featuredInventory.map((item, index) => (
              <article className="inventory-row" key={`${item.name}-${item.finish}`}>
                <div className="inventory-name">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{item.name}</h3>
                </div>
                <p data-label="Finish">{item.finish}</p>
                <p data-label="Size">{item.size}</p>
                <p data-label="Available">{item.available} slabs</p>
                <p data-label="Asking price">${item.price} / slab</p>
              </article>
            ))}
          </div>

          <div className="inventory-footer" data-reveal>
            <p>
              Inventory moves. Confirm current quantity, condition, and final
              pricing before visiting or fabrication.
            </p>
            <Link
              className="button button-ink"
              href="/materials"
            >
              Browse all slabs <ArrowUpRight />
            </Link>
          </div>
        </section>

        <section id="materials" className="selection-section section-pad">
          <div className="section-heading selection-heading" data-reveal>
            <p className="eyebrow">How to choose / 02</p>
            <h2>
              Stone asks to be seen,
              <em>not sampled.</em>
            </h2>
          </div>

          <div className="selection-layout">
            <figure className="selection-photo" data-reveal>
              <div className="selection-photo-image">
                <Image
                  src={authenticPhotos.yard}
                  alt="Full stone slabs stored upright inside Stone Supply Co."
                  fill
                  sizes="(max-width: 767px) 100vw, 42vw"
                />
              </div>
              <figcaption>Inside the Northridge slab yard</figcaption>
            </figure>

            <div className="selection-principles">
              {selectionPrinciples.map((principle) => (
                <article key={principle.number} data-reveal>
                  <span>{principle.number}</span>
                  <div>
                    <h3>{principle.title}</h3>
                    <p>{principle.text}</p>
                  </div>
                </article>
              ))}

              <div className="material-note" data-reveal>
                <p className="eyebrow">Materials, stated plainly</p>
                <p>
                  Current marketplace inventory is quartz. Stone Supply Co.
                  also publishes natural marble selections through its Google
                  profile. Availability changes; confirm the material you want
                  before making the trip.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="gallery" className="gallery-section section-pad">
          <div className="section-heading gallery-heading" data-reveal>
            <p className="eyebrow">The yard / 03</p>
            <h2>
              Pattern. Movement.
              <em>Presence.</em>
            </h2>
            <p>
              Every image below is tied to Stone Supply Co.&apos;s public
              business profile or its current Northridge inventory.
            </p>
          </div>

          <div className="gallery-mosaic" data-reveal>
            <figure className="gallery-item gallery-a">
              <Image
                src={authenticPhotos.hero}
                alt="Backlit blue natural marble slab with amber veining"
                fill
                sizes="(max-width: 767px) 100vw, 58vw"
              />
              <figcaption>Natural marble / light and movement</figcaption>
            </figure>
            <figure className="gallery-item gallery-b">
              <Image
                src={authenticPhotos.slabs[4].src}
                alt={authenticPhotos.slabs[4].alt}
                fill
                sizes="(max-width: 767px) 100vw, 36vw"
              />
            </figure>
            <figure className="gallery-item gallery-c">
              <Image
                src={authenticPhotos.slabs[5].src}
                alt={authenticPhotos.slabs[5].alt}
                fill
                sizes="(max-width: 767px) 100vw, 36vw"
              />
            </figure>
            <figure className="gallery-item gallery-d">
              <Image
                src={authenticPhotos.slabs[1].src}
                alt={authenticPhotos.slabs[1].alt}
                fill
                sizes="(max-width: 767px) 100vw, 58vw"
              />
              <figcaption>Full-slab views / photographed in the yard</figcaption>
            </figure>
          </div>
        </section>

        <section className="audience-section section-pad">
          <div className="audience-intro" data-reveal>
            <p className="eyebrow">Built for the project / 04</p>
            <h2>
              One yard for everyone carrying the work
              <em>forward.</em>
            </h2>
          </div>

          <div className="audience-list">
            {audiences.map(([title, description], index) => (
              <article key={title} data-reveal>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>

          <div className="audience-cta" data-reveal>
            <p>
              Bring the dimensions, the room, and the reference. Start with
              the full slab, then confirm what fits the project.
            </p>
            <TrackedLink
              className="text-link"
              href={business.phone.href}
              eventName="phone_click"
              eventLabel="project_section"
            >
              Call the yard <ArrowRight />
            </TrackedLink>
          </div>
        </section>

        <MaterialCategories />

        <ReviewsSection />

        <AiFinderCTA />

        <section id="visit" className="visit-section section-pad">
          <div className="visit-details" data-reveal>
            <p className="eyebrow">Plan your visit / 05</p>
            <h2>
              See it in person.
              <em>See what the room could become.</em>
            </h2>

            <div className="visit-info">
              <div>
                <span>Address</span>
                <address>
                  {business.address.street}
                  <br />
                  {business.address.city}, {business.address.state}{" "}
                  {business.address.postalCode}
                </address>
              </div>
              <div>
                <span>Phone</span>
                <TrackedLink
                  href={business.phone.href}
                  eventName="phone_click"
                  eventLabel="visit_section"
                >
                  {business.phone.display}
                </TrackedLink>
              </div>
              <div>
                <span>Yard hours</span>
                <TrackedLink
                  href={business.googleMapsUrl}
                  eventName="directions_click"
                  eventLabel="current_hours"
                  target="_blank"
                  rel="noreferrer"
                >
                  {business.hoursCta} <ArrowUpRight />
                </TrackedLink>
              </div>
              <div className="access-detail">
                <AccessibilityIcon />
                <p>
                  Wheelchair-accessible entrance and parking lot are listed on
                  the Google Business Profile.
                </p>
              </div>
            </div>

            <div className="visit-actions">
              <TrackedLink
                className="button button-ink"
                href={business.directionsUrl}
                eventName="directions_click"
                eventLabel="visit_section"
                target="_blank"
                rel="noreferrer"
              >
                <MapPinIcon /> Get directions
              </TrackedLink>
              <TrackedLink
                className="button button-outline"
                href={business.phone.href}
                eventName="phone_click"
                eventLabel="visit_section"
              >
                <PhoneIcon /> Call the yard
              </TrackedLink>
            </div>
          </div>

          <div className="visit-map" data-reveal>
            <MapPanel />
          </div>
        </section>

        <section className="final-cta">
          <div className="final-cta-image" aria-hidden="true">
            <Image
              src={authenticPhotos.hero}
              alt=""
              fill
              sizes="100vw"
              className="final-cta-bg"
            />
          </div>
          <div className="final-cta-overlay" />
          <div className="final-cta-content" data-reveal>
            <p className="eyebrow">Northridge, California</p>
            <h2>Ready to see the slab?</h2>
            <div>
              <TrackedLink
                className="button button-light"
                href={business.directionsUrl}
                eventName="directions_click"
                eventLabel="final_cta"
                target="_blank"
                rel="noreferrer"
              >
                Plan your visit <ArrowUpRight />
              </TrackedLink>
              <TrackedLink
                className="final-phone"
                href={business.phone.href}
                eventName="phone_click"
                eventLabel="final_cta"
              >
                {business.phone.display}
              </TrackedLink>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <MobileActionBar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
