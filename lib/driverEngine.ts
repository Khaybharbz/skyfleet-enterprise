export type Driver = {
  id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: "Idle" | "Moving" | "Busy";
};

const driversState: Record<string, any> = {};
const listeners: Record<string, (d: Driver) => void> = {};

export function subscribeDriver(
  id: string,
  cb: (d: Driver) => void
) {
  listeners[id] = cb;
}

export function startDriverSimulation(
  driver: Driver
) {
  if (driversState[driver.id]) return;

  driversState[driver.id] = setInterval(
    () => {
      driver.latitude +=
        (Math.random() - 0.5) * 0.001;

      driver.longitude +=
        (Math.random() - 0.5) * 0.001;

      driver.speed =
        Math.floor(Math.random() * 60);

      driver.status =
        driver.speed > 10
          ? "Moving"
          : "Idle";

      listeners[driver.id]?.(driver);
    },
    3000
  );
}