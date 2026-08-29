import Link from "next/link";
import { business } from "@/data/business";
import { ArrowUpRight } from "./Icons";
import { TrackedLink } from "./TrackedLink";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Link className="wordmark footer-wordmark" href="/">
            <span>{business.displayName}</span>
            <small>Los Angeles</small>
          </Link>
          <p>{business.shortDescriptor}</p>
        </div>

        <div className="footer-column">
          <p className="footer-label">Visit</p>
          <address>
            {business.address.street}
            <br />
            {business.address.city}, {business.address.state}{" "}
            {business.address.postalCode}
          </address>
          <TrackedLink
            href={business.directionsUrl}
            eventName="directions_click"
            eventLabel="footer"
            target="_blank"
            rel="noreferrer"
          >
            Directions <ArrowUpRight />
          </TrackedLink>
        </div>

        <div className="footer-column">
          <p className="footer-label">Contact</p>
          <TrackedLink
            href={business.phone.href}
            eventName="phone_click"
            eventLabel="footer"
          >
            {business.phone.display}
          </TrackedLink>
          <TrackedLink
            href={business.googleMapsUrl}
            eventName="directions_click"
            eventLabel="footer_hours"
            target="_blank"
            rel="noreferrer"
          >
            Current yard hours <ArrowUpRight />
          </TrackedLink>
        </div>

        <div className="footer-column">
          <p className="footer-label">Explore</p>
          <Link href="/materials">All materials</Link>
          <Link href="/materials/quartzite">Quartzite</Link>
          <Link href="/materials/marble">Marble</Link>
          <Link href="/materials/granite">Granite</Link>
          <Link href="/stone-finder">Stone Finder</Link>
          <Link href="/trade">Trade portal</Link>
        </div>

        <div className="footer-column">
          <p className="footer-label">Follow</p>
          <TrackedLink
            href={business.socialLinks.instagram}
            eventName="social_click"
            eventLabel="footer_instagram"
            target="_blank"
            rel="noreferrer"
          >
            Instagram <ArrowUpRight />
          </TrackedLink>
          <TrackedLink
            href={business.inventoryUrl}
            eventName="inventory_click"
            eventLabel="footer_inventory"
            target="_blank"
            rel="noreferrer"
          >
            Live inventory <ArrowUpRight />
          </TrackedLink>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} {business.displayName}</p>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/accessibility">Accessibility</Link>
        </div>
        <a className="back-to-top" href="#top">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
