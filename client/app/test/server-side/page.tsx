import { type SearchParams } from "nuqs/server";
import { loadLocationSearchParams } from "./search-params";
import { LocationClient } from "./location-client";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ServerSideNuqsPage({ searchParams }: PageProps) {
  const { lat, lang } = await loadLocationSearchParams(searchParams);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">NUQS Server-Side Test</h1>
        <p className="text-sm text-muted-foreground">
          This page parses <code>lat</code> and <code>lang</code> on the server via{" "}
          <code>createLoader</code>.
        </p>
      </header>

      <section className="rounded-lg border bg-card p-4">
        <h2 className="mb-2 text-lg font-medium">Server Parsed Values</h2>
        <p className="text-sm">lat: {lat}</p>
        <p className="text-sm">lang: {lang}</p>
      </section>

      <LocationClient />
    </main>
  );
}
