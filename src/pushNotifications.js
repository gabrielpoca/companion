import assert from "assert";
import WebPush from "web-push";

assert(process.env.VAPID_PUBLIC_KEY);
assert(process.env.VAPID_PRIVATE_KEY);

WebPush.setVapidDetails(
  "mailto:me@gabrielpoca.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export const send = subscription => {
  return WebPush.sendNotification(
    JSON.parse(subscription),
    JSON.stringify({ type: "reminder" })
  );
};
