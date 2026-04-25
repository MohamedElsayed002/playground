"use client";

import { useState } from "react";
import { useQueryStates } from "nuqs";
import { Button } from "@/components/ui/button";
import { locationParsers } from "./search-params";

export function LocationClient() {
  const [coords, setCoords] = useQueryStates(locationParsers);
  const [status, setStatus] = useState<string>("");

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatus("Geolocation is not supported by this browser.");
      return;
    }

    setStatus("Getting your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void setCoords({
          lat: Number(position.coords.latitude.toFixed(6)),
          lang: Number(position.coords.longitude.toFixed(6)),
        });
        setStatus("Location updated in URL.");
      },
      (error) => {
        setStatus(`Failed to get location: ${error.message}`);
      },
    );
  };

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <h2 className="text-lg font-medium">Client Actions</h2>
      <p className="text-sm text-muted-foreground">
        Click to detect your current location and sync it to query params.
      </p>
      <Button onClick={getCurrentLocation}>Use My Current Location</Button>
      <div className="text-sm text-muted-foreground">
        <p>Current URL values</p>
        <p>lat: {coords.lat}</p>
        <p>lang: {coords.lang}</p>
      </div>
      {status ? <p className="text-sm">{status}</p> : null}
    </div>
  );
}
