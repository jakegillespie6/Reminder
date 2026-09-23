import { useEffect, useState } from "react";

const POINTS_URL = "https://api.weather.gov/points/33.6469,-117.6892";
const REFRESH_INTERVAL = 4 * 60 * 60 * 1000;

interface ForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  icon: string;
  shortForecast: string;
  detailedForecast: string;
  probabilityOfPrecipitation: {
    value: number | null;
  };
}

interface ForecastData {
  properties: {
    updated: string;
    periods: ForecastPeriod[];
  };
}

interface DailyForecast {
  day: ForecastPeriod;
  night: ForecastPeriod | undefined;
}

function createDailyForecasts(periods: ForecastPeriod[]): DailyForecast[] {
  return periods
    .map((period, index) => {
      if (!period.isDaytime) return null;

      const followingPeriod = periods[index + 1];
      const night =
        followingPeriod && !followingPeriod.isDaytime
          ? followingPeriod
          : undefined;

      return { day: period, night };
    })
    .filter((forecast): forecast is DailyForecast => forecast !== null)
    .slice(0, 7);
}

export default function WeatherForecast() {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchForecast() {
      try {
        const headers = { Accept: "application/geo+json" };

        const pointsResponse = await fetch(POINTS_URL, { headers });
        if (!pointsResponse.ok) {
          throw new Error("Unable to locate forecast.");
        }

        const points = await pointsResponse.json();
        const forecastResponse = await fetch(points.properties.forecast, {
          headers,
          cache: "no-store",
        });

        if (!forecastResponse.ok) {
          throw new Error("Unable to retrieve forecast.");
        }

        const data: ForecastData = await forecastResponse.json();

        if (active) {
          setForecast(data);
          setError("");
        }
      } catch (error) {
        if (active) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load the forecast.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void fetchForecast();
    const interval = window.setInterval(fetchForecast, REFRESH_INTERVAL);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600"
          aria-label="Loading forecast"
        />
      </div>
    );
  }

  const dailyForecasts = forecast
    ? createDailyForecasts(forecast.properties.periods)
    : [];

  return (
    <section className="w-full p-4">
      <header className="mb-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 p-4 text-white shadow">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-100">
          National Weather Service
        </p>
        <h2 className="mt-1 text-2xl font-bold">Lake Forest, California</h2>

        {forecast && (
          <p className="mt-2 text-xs text-sky-200">
            Updated{" "}
            {new Date(forecast.properties.updated).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        )}
      </header>

      {error && (
        <div
          className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="space-y-3">
        {dailyForecasts.map(({ day, night }) => {
          const precipitation = day.probabilityOfPrecipitation.value;

          return (
            <article
              key={day.number}
              className="rounded-xl border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex gap-4">
                <img
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                  src={day.icon}
                  alt={day.shortForecast}
                  width={80}
                  height={80}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">
                        {day.name}
                      </h3>
                      <p className="font-medium text-text-secondary">
                        {day.shortForecast}
                      </p>
                    </div>

                    <div className="flex gap-3 text-right">
                      <div>
                        <p className="text-xs uppercase text-text-secondary">
                          High
                        </p>
                        <p className="text-2xl font-bold text-orange-500">
                          {day.temperature}°{day.temperatureUnit}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase text-text-secondary">
                          Low
                        </p>
                        <p className="text-2xl font-bold text-sky-500">
                          {night
                            ? `${night.temperature}°${night.temperatureUnit}`
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-text-secondary">
                    <span>
                      Precipitation:{" "}
                      <strong className="text-text-primary">
                        {precipitation === null ? "—" : `${precipitation}%`}
                      </strong>
                    </span>
                    <span>
                      Wind:{" "}
                      <strong className="text-text-primary">
                        {day.windDirection} {day.windSpeed}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-3 border-t border-border pt-3 text-sm leading-relaxed text-text-secondary">
                {day.detailedForecast}
              </p>
            </article>
          );
        })}
      </div>

      <p className="mt-4 text-center text-xs text-text-secondary">
        Forecast refreshes automatically every four hours.
      </p>
    </section>
  );
}