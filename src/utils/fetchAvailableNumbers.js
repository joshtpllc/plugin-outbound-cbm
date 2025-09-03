import { Manager } from "@twilio/flex-ui";

const manager = Manager.getInstance();

export const fetchAvailableNumbers = async () => {
  const body = {
    Token: manager.store.getState().flex.session.ssoTokenPayload.token,
  };

  const options = {
    method: "POST",
    body: new URLSearchParams(body),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
  };
  try {
    const response = await fetch(
      `${process.env.FLEX_APP_TWILIO_SERVERLESS_DOMAIN}/getAvailableNumbers`,
      options
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching content templates:", error);
    return [];
  }
};
