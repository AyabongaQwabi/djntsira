import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Calendar } from "lucide-react";
import { useTracks } from "../../hooks/useTracks";
import { formatCurrency } from "../../lib/format";
import { calcDiscountedPrice } from "../../lib/pricing";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";

const TrackPreviewCard = ({ track, t }) => {
  const price = calcDiscountedPrice(
    track.price,
    track.discount_type,
    track.discount_value,
    track.discount_expires_at,
  );
  const hasDiscount = price < Number(track.price);

  return (
    <Link
      to={`/music/${track.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent/50"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-surface-2 to-primary">
        {track.cover_url ? (
          <img
            src={track.cover_url}
            alt={track.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-4xl text-accent/40">
            DN
          </div>
        )}
        {hasDiscount ? (
          <Badge variant="gold" className="absolute right-2 top-2">
            {t("music.discount")}
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-semibold text-[var(--color-text)] line-clamp-2">
          {track.title}
        </h3>
        <Badge variant="gold" className="w-fit">
          {track.category === "stem" ? t("music.stem") : t("music.full_song")}
        </Badge>
        <p className="mt-auto font-display text-xl text-accent">
          {formatCurrency(price)}
        </p>
      </div>
    </Link>
  );
};

const Home = () => {
  const { t } = useTranslation();
  const { data: tracks = [], isLoading } = useTracks({ publishedOnly: true });
  const previewTracks = tracks.slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[85vh] overflow-hidden">
        <img
          src="/images/behindthe-booth-hd.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)]/80 via-[var(--color-bg)]/60 to-[var(--color-bg)]" />

        <div className="relative mx-auto flex max-w-6xl flex-col justify-center px-4 py-16 sm:min-h-[85vh] sm:py-24">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent">
              {t("home.hero_tagline")}
            </p>
            <h1 className="font-display text-6xl leading-none text-[var(--color-text)] sm:text-8xl">
              DJ NTSIRA
            </h1>
            <div className="mt-3 h-1 w-32 bg-gradient-to-r from-accent via-accent-light to-transparent sm:w-48" />

            <p className="mt-6 max-w-lg text-lg text-muted">
              {t("home.hero_subtitle")}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link to="/music" className="w-full sm:w-auto">
                <Button fullWidth size="lg">
                  {t("home.buy_music")}
                </Button>
              </Link>
              <Link to="/book" className="w-full sm:w-auto">
                <Button variant="secondary" fullWidth size="lg">
                  {t("home.book_now")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-12 hidden sm:block">
            <img
              src="/images/portrait.webp"
              alt="DJ Ntsira"
              className="h-48 w-48 rounded-2xl border-2 border-accent/30 object-cover shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* About */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:py-16">
          <div className="overflow-hidden rounded-2xl">
            <img
              src="/images/self-portrait.webp"
              alt="DJ Ntsira"
              className="h-full min-h-[280px] w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="font-display text-4xl text-accent">
              {t("home.about_title")}
            </h2>
            <div className="mt-2 h-0.5 w-16 bg-accent" />
            <p className="mt-6 text-base leading-relaxed text-muted">
              {t("home.about_bio")}
            </p>
            <p className="mt-4 text-sm font-medium text-[var(--color-text)]">
              {t("home.social_follow")}
            </p>
            <div className="mt-3 flex gap-3">
              <a
                href="https://www.instagram.com/djntsira/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent underline-offset-4 hover:underline"
              >
                Instagram
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61556947102512"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent underline-offset-4 hover:underline"
              >
                Facebook
              </a>
              <a
                href="https://www.tiktok.com/@djntsira_sa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent underline-offset-4 hover:underline"
              >
                TikTok
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Music preview */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-4xl text-accent">
              {t("home.music_preview")}
            </h2>
            <p className="mt-2 text-muted">{t("home.music_preview_sub")}</p>
          </div>
          <Link
            to="/music"
            className="hidden min-h-touch items-center gap-1 text-sm font-semibold text-accent hover:underline sm:inline-flex"
          >
            {t("home.see_all")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <LoadingSpinner fullScreen />
        ) : previewTracks.length === 0 ? (
          <EmptyState
            title={t("home.no_tracks_title")}
            message={t("home.no_tracks_message")}
            action={
              <Link to="/music">
                <Button variant="secondary">{t("nav.music")}</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {previewTracks.map((track) => (
              <TrackPreviewCard key={track.id} track={track} t={t} />
            ))}
          </div>
        )}

        <Link to="/music" className="mt-6 block sm:hidden">
          <Button variant="secondary" fullWidth>
            {t("home.see_all")}
          </Button>
        </Link>
      </section>

      {/* Booking CTA */}
      <section className="border-t border-border bg-gradient-to-br from-surface to-primary">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-20">
          <Calendar className="h-12 w-12 text-accent" aria-hidden="true" />
          <h2 className="font-display text-4xl text-[var(--color-text)] sm:text-5xl">
            {t("home.booking_cta_title")}
          </h2>
          <p className="max-w-xl text-lg text-muted">
            {t("home.booking_cta_body")}
          </p>
          <Link to="/book">
            <Button size="lg">{t("home.book_now")}</Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
