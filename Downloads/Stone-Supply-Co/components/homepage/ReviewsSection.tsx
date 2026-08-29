import Link from "next/link";
import { reviews, googleReviewSummary } from "@/data/reviews";
import { ArrowUpRight } from "@/components/Icons";

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="review-stars" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(Math.round(rating))}
    </span>
  );
}

export function ReviewsSection() {
  const featured = reviews.filter((r) => r.featured);
  // Show up to 4 non-featured reviews in the grid
  const gridReviews = reviews.filter((r) => !r.featured).slice(0, 4);

  if (featured.length === 0) return null;
  const hero = featured[0];

  return (
    <section className="reviews-section section-pad">
      <div className="reviews-heading">
        <div />
        <h2>
          What our clients
          <em>say</em>
        </h2>
        <Link
          className="text-link text-link-on-dark"
          href={googleReviewSummary.profileUrl}
          target="_blank"
          rel="noreferrer"
        >
          {googleReviewSummary.count} reviews on Google{" "}
          <ArrowUpRight />
        </Link>
      </div>

      <div className="reviews-layout">
        {/* Feature review */}
        <figure className="review-feature">
          <StarRating rating={hero.rating} />
          <p>&ldquo;{hero.text}&rdquo;</p>
          <figcaption className="review-credit">
            <cite>{hero.reviewer}</cite>
            <span>Verified Google review · {googleReviewSummary.rating} ★ average</span>
          </figcaption>
        </figure>

        {/* Grid of secondary reviews */}
        <div className="review-grid">
          {gridReviews.map((review) => (
            <figure key={review.reviewer} className="review-card">
              <StarRating rating={review.rating} />
              <p>
                &ldquo;
                {review.text.length > 200
                  ? review.text.slice(0, 200).trimEnd() + "…"
                  : review.text}
                &rdquo;
              </p>
              <figcaption className="review-credit">
                <cite>{review.reviewer}</cite>
                <span>Google review</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
