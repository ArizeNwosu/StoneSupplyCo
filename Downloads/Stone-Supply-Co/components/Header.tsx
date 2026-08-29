"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { business } from "@/data/business";
import { ArrowUpRight, CloseIcon, MenuIcon, PhoneIcon } from "./Icons";
import { TrackedLink } from "./TrackedLink";

const navItems = [
  { label: "Materials", href: "/materials" },
  { label: "Stone Finder", href: "/stone-finder" },
  { label: "Trade", href: "/trade" },
  { label: "Visit", href: "/#visit" },
];

export function Header({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 48);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const getFocusableElements = () => {
      const menuLinks = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>("a[href]") ?? [],
      );

      return [menuButtonRef.current, ...menuLinks].filter(
        (element): element is HTMLElement => Boolean(element),
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key === "Tab") {
        const focusableElements = getFocusableElements();
        const firstElement = focusableElements[0];
        const lastElement = focusableElements.at(-1);

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const focusFirstLink = window.requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    });

    document.body.classList.add("menu-is-open");
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFirstLink);
      document.body.classList.remove("menu-is-open");
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const closeOnDesktop = () => {
      if (window.innerWidth > 900) setMenuOpen(false);
    };

    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
  }, []);

  const closeMenu = () => {
    setMenuOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  return (
    <header
      className={`site-header ${solid || scrolled ? "is-solid" : ""} ${menuOpen ? "menu-open" : ""}`}
    >
      <div className="header-inner">
        <Link className="wordmark" href="/" aria-label="Stone Supply Co. home">
          <span>{business.displayName}</span>
          <small>Los Angeles</small>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <TrackedLink
            className="header-phone"
            href={business.phone.href}
            eventName="phone_click"
            eventLabel="header"
          >
            {business.phone.display}
          </TrackedLink>
          <TrackedLink
            className="header-cta"
            href={business.directionsUrl}
            eventName="directions_click"
            eventLabel="header"
            target="_blank"
            rel="noreferrer"
          >
            Visit the yard <ArrowUpRight />
          </TrackedLink>
        </div>

        <TrackedLink
          className="mobile-call"
          href={business.phone.href}
          eventName="phone_click"
          eventLabel="mobile_header"
          aria-label={`Call Stone Supply Co. at ${business.phone.display}`}
        >
          <PhoneIcon />
        </TrackedLink>

        <button
          ref={menuButtonRef}
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <div
        ref={menuRef}
        id="mobile-menu"
        className="mobile-menu"
        role="dialog"
        aria-label="Site navigation"
        aria-modal={menuOpen ? true : undefined}
        aria-hidden={!menuOpen}
        inert={!menuOpen ? true : undefined}
      >
        <nav aria-label="Mobile navigation">
          {navItems.map((item, index) => (
            <Link key={item.href} href={item.href} onClick={closeMenu}>
              <span>0{index + 1}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mobile-menu-meta">
          <p>{business.address.formatted}</p>
          <TrackedLink
            href={business.directionsUrl}
            eventName="directions_click"
            eventLabel="mobile_menu"
            target="_blank"
            rel="noreferrer"
          >
            Get directions <ArrowUpRight />
          </TrackedLink>
        </div>
      </div>
    </header>
  );
}
