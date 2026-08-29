import { business } from "@/data/business";
import type { Review } from "@/data/reviews";
import { ArrowUpRight } from "./Icons";
import { TrackedLink } from "./TrackedLink";

function ReviewStars({ rating }: { rating: number }) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <span className="review-stars" aria-label={`${safeRating} out of 5 stars`}>
      <span aria-hidden="true">
        {"★".repeat(safeRating)}
        {"☆".repeat(5 - safeRating)}
      </span>
    </span>
  );
}

function ReviewCredit({ review }: { review: Review }) {
  return (
    <footer className="review-credit">
      <cite>{review.reviewer}</cite>
      <span>
        Google Review{review.date ? ` · ${review.date}` : ""}
      </span>
    </footer>
  );
}

export function ReviewSection({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  const [featuredReview, ...supportingReviews] = reviews;

  return (
    <section id="reviews" className="reviews-section section-pad">
      <div className="reviews-heading" data-reveal>
        <p className="eyebrow">Customer perspective</p>
        <h2>
          What the experience
          <em>leaves behind.</em>
        </h2>
        <TrackedLink
          className="text-link"
          href={business.googleMapsUrl}
          eventName="review_click"
          eventLabel="reviews_section"
          target="_blank"
          rel="noreferrer"
        >
          View on Google <ArrowUpRight />
        </TrackedLink>
      </div>

      <div className="reviews-layout">
        <blockquote className="review-feature" data-reveal>
          <ReviewStars rating={featuredReview.rating} />
          <p>“{featuredReview.text}”</p>
          <ReviewCredit review={featuredReview} />
        </blockquote>

        <div className="review-grid">
          {supportingReviews.slice(0, 5).map((review) => (
            <blockquote
              className="review-card"
              key={`${review.reviewer}-${review.date ?? review.text}`}
              data-reveal
            >
              <ReviewStars rating={review.rating} />
              <p>“{review.text}”</p>
              <ReviewCredit review={review} />
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
