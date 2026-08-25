import Link from "next/link";
import { Star, Clock, MapPin } from "lucide-react";
import { PlaceImage } from "@/components/ui/place-image";
import { Badge } from "@/components/ui/badge";
import type { Place } from "@/lib/types";

export function PlaceCard({ place }: { place: Place }) {
  return (
    <Link
      href={`/places/${place.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/10"
    >
      <div className="relative h-44 w-full overflow-hidden">
        <PlaceImage
          src={place.coverImage}
          alt={place.name}
          tags={place.tags}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        {place.has360 && (
          <Badge tone="brand" className="absolute left-3 top-3 bg-white/90">
            360°
          </Badge>
        )}
        {place.isFeatured && (
          <Badge tone="accent" className="absolute right-3 top-3 bg-white/90">
            Nổi bật
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-base font-semibold text-foreground">{place.name}</h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">{place.address}</span>
        </p>
        <div className="mt-auto flex items-center justify-between pt-2 text-sm">
          <span className="flex items-center gap-1 font-medium text-foreground">
            <Star className="h-3.5 w-3.5 fill-warning-600 text-warning-600" />
            {place.ratingAvg?.toFixed(1) ?? "—"}
            <span className="text-xs font-normal text-muted-foreground">({place.ratingCount ?? 0})</span>
          </span>
          {place.visitDurationMinutes ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {Math.round(place.visitDurationMinutes / 60) > 0
                ? `${(place.visitDurationMinutes / 60).toFixed(1)}h`
                : `${place.visitDurationMinutes}p`}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
