import { Actions, Manager } from "@twilio/flex-ui";

export const onSendClickHandler = (
  menuItemClicked,
  toNumber,
  messageType,
  messageBody,
  contentTemplateSid = null,
  selectedCallerId = null,
  selectedCallerIdData = null
) => {
  console.log('Sending message with caller ID:', selectedCallerId);

  if (!selectedCallerId) {
    console.error('No caller ID selected');
    return;
  }

  let payload = {
    destination: toNumber,
    callerId: selectedCallerId,
    callerIdData: selectedCallerIdData,
    messageType: messageType,
  };

  if (messageType === "whatsapp" && contentTemplateSid) {
    payload.contentTemplateSid = contentTemplateSid;
    payload.body = "";
  } else {
    payload.body = messageBody;
  }

  switch (menuItemClicked) {
    case "send-message-open-chat":
      payload.openChat = true;
      payload.routeToMe = true;
      break;
    case "send-message-route-to-me":
      payload.openChat = false;
      payload.routeToMe = true;
      break;
    case "send-message-route-to-anyone":
      payload.openChat = false;
      payload.routeToMe = false;
      break;
    default:
      payload.openChat = false;
      payload.routeToMe = false;
  }

  console.log('SendOutboundMessage payload:', payload);

  Actions.invokeAction("SendOutboundMessage", payload)
    .then((result) => {
      console.log('Message sent successfully:', result);
      
      Actions.invokeAction("ToggleOutboundMessagePanel");
    })
    .catch((error) => {
      console.error('Error sending message:', error);
    });
};

export const handleClose = () => {
  Actions.invokeAction("ToggleOutboundMessagePanel");
};