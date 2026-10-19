import { business } from "@/data/business";

export function MapPanel() {
  return (
    <div className="map-frame">
      <iframe
        src={business.mapEmbedUrl}
        title="Interactive map showing Stone Supply Co. in Northridge"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
