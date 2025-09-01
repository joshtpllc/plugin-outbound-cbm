import React, { useState, useEffect } from "react";
import { Dialer, Manager, useFlexSelector } from "@twilio/flex-ui";
import {
  Label,
  TextArea,
  RadioGroup,
  Radio,
  Text,
  Select,
  Option,
  HelpText,
  Separator,
  Box,
} from "@twilio-paste/core";
import {
  Container,
  StyledSidePanel,
  DialerContainer,
  MessageContainer,
  SendMessageContainer,
  MessageTypeContainer,
  OfflineContainer,
  ErrorIcon,
} from "./OutboundMessagePanel.Components";
import SendMessageMenu from "./SendMessageMenu";
import { onSendClickHandler, handleClose } from "./clickHandlers";
import { templates } from "../../utils/templates";
import { PhoneNumberUtil, AsYouTypeFormatter } from "google-libphonenumber";
import { fetchContentTemplates } from "../../utils/fetchContentTemplates";
import CallerIdSelector from "./CallerIdSelector";

const isWorkerAvailable = (worker) => {
  const { taskrouter_offline_activity_sid } =
    Manager.getInstance().serviceConfiguration;

  return worker.activity?.sid !== taskrouter_offline_activity_sid;
};

const isToNumberValid = (toNumber) => {
  const phoneUtil = PhoneNumberUtil.getInstance();
  try {
    const parsedToNumber = phoneUtil.parse(toNumber);
    if (phoneUtil.isPossibleNumber(parsedToNumber))
      if (phoneUtil.isValidNumber(parsedToNumber)) return true;

    return false;
  } catch (error) {
    return false;
  }
};

const OutboundMessagePanel = (props) => {
  const [toNumber, setToNumber] = useState("+1");
  const [messageBody, setMessageBody] = useState("");
  const [messageType, setMessageType] = useState("sms");
  const [contentTemplateSid, setContentTemplateSid] = useState("");
  const [contentTemplates, setContentTemplates] = useState([]);

  const [selectedCallerId, setSelectedCallerId] = useState("");
  const [selectedCallerIdData, setSelectedCallerIdData] = useState(null);
  const [isValidCallerId, setIsValidCallerId] = useState(false);
  const [callerIdError, setCallerIdError] = useState(null);

  const useContentTemplates = process.env.FLEX_APP_USE_CONTENT_TEMPLATES
    ? process.env.FLEX_APP_USE_CONTENT_TEMPLATES.toLowerCase() === "true"
    : false;

  const isOutboundMessagePanelOpen = useFlexSelector(
    (state) =>
      state.flex.view.componentViewStates?.outboundMessagePanel
        ?.isOutboundMessagePanelOpen
  );
  const worker = useFlexSelector((state) => state.flex.worker);

  let disableSend = true;
  const toNumberValid = isToNumberValid(toNumber);

  if (toNumberValid && messageBody.length && isValidCallerId) {
    disableSend = false;
  }

  if (messageType === "whatsapp" && useContentTemplates) {
    if (toNumberValid && contentTemplateSid && isValidCallerId) {
      disableSend = false;
    } else {
      disableSend = true;
    }
  }

  let friendlyPhoneNumber = null;
  const formatter = new AsYouTypeFormatter();
  [...toNumber].forEach((c) => (friendlyPhoneNumber = formatter.inputDigit(c)));

  const handleCallerIdChange = (callerId, numberData) => {
    setSelectedCallerId(callerId);
    setSelectedCallerIdData(numberData);
  };

  const handleSendClicked = (menuItemClicked) => {
    if (!selectedCallerId) {
      console.error('No caller ID selected');
      return;
    }

    onSendClickHandler(
      menuItemClicked,
      toNumber,
      messageType,
      messageBody,
      contentTemplateSid,
      selectedCallerId,
      selectedCallerIdData
    );
  };

  useEffect(() => {
    if (selectedCallerId && selectedCallerIdData) {
      if (messageType === "whatsapp" && selectedCallerIdData.type !== "whatsapp") {
        setCallerIdError("Selected number does not support WhatsApp");
        setIsValidCallerId(false);
      } else if (messageType === "sms" && selectedCallerIdData.type !== "sms") {
        setCallerIdError("Selected number does not support SMS");
        setIsValidCallerId(false);
      } else {
        setCallerIdError(null);
        setIsValidCallerId(true);
      }
    } else if (selectedCallerId) {
      setIsValidCallerId(true);
      setCallerIdError(null);
    } else {
      setIsValidCallerId(false);
      setCallerIdError(null);
    }
  }, [selectedCallerId, selectedCallerIdData, messageType]);

  useEffect(() => {
    if (messageType === "whatsapp") {
      fetchContentTemplates().then((templates) =>
        setContentTemplates(templates || [])
      );
    } else {
      // Clear content templates if messageType is not WhatsApp
      setContentTemplates([]);
      setContentTemplateSid("");
    }

    if (selectedCallerIdData) {
      if (messageType === "whatsapp" && selectedCallerIdData.type !== "whatsapp") {
        setSelectedCallerId("");
        setSelectedCallerIdData(null);
      } else if (messageType === "sms" && selectedCallerIdData.type !== "sms") {
        setSelectedCallerId("");
        setSelectedCallerIdData(null);
      }
    }
  }, [messageType]);

  if (!isOutboundMessagePanelOpen) {
    if (toNumber !== "+1") setToNumber("+1");
    if (messageBody.length) setMessageBody("");
    if (selectedCallerId) {
      setSelectedCallerId("");
      setSelectedCallerIdData(null);
    }
    return null;
  }

  return (
    <Container>
      <StyledSidePanel
        displayName="Message"
        themeOverride={props.theme && props.theme.OutboundDialerPanel}
        handleCloseClick={handleClose}
        title="Message"
      >
        {isWorkerAvailable(worker) && (
          <>
            {/* Message Type Selection */}
            <MessageTypeContainer theme={props.theme}>
              <RadioGroup
                name="messageType"
                value={messageType}
                legend="Message type"
                onChange={(newValue) => {
                  setMessageType(newValue);
                  setMessageBody("");
                  setContentTemplateSid("");
                }}
                orientation="horizontal"
              >
                <Radio id="sms" value="sms" name="sms">
                  SMS
                </Radio>
                <Radio id="whatsapp" value="whatsapp" name="whatsapp">
                  WhatsApp
                </Radio>
              </RadioGroup>
              <Text
                paddingTop={props.theme.tokens.spacings.space20}
                color={
                  toNumberValid
                    ? props.theme.tokens.textColors.colorTextSuccess
                    : props.theme.tokens.textColors.colorTextErrorLight
                }
              >
                {messageType === "whatsapp"
                  ? "whatsapp:" + toNumber
                  : friendlyPhoneNumber}
              </Text>
            </MessageTypeContainer>

            {/* Caller ID Selector */}
            <CallerIdSelector
              selectedCallerId={selectedCallerId}
              onCallerIdChange={handleCallerIdChange}
              disabled={false}
              messageType={messageType === "whatsapp" ? "whatsapp" : "sms"}
              theme={props.theme}
            />

            {callerIdError && (
              <Text
                color={props.theme.tokens.textColors.colorTextError}
                fontSize="fontSize20"
                marginBottom="space30"
              >
                {callerIdError}
              </Text>
            )}

            {/* Dialer */}
            <DialerContainer theme={props.theme}>
              <Dialer
                key="dialer"
                onDial={setToNumber}
                defaultPhoneNumber={toNumber}
                onPhoneNumberChange={setToNumber}
                hideActions
                disabled={false}
                defaultCountryAlpha2Code={"US"}
              />
            </DialerContainer>

            {/* Conditional Rendering Based on Message Type */}
            <MessageContainer theme={props.theme}>
              {messageType === "whatsapp" && useContentTemplates ? (
                <>
                  {/* Content Templates Dropdown for WhatsApp */}
                  <Label htmlFor="select_content_template">
                    Select a Content Template
                  </Label>
                  <Select
                    id="select_content_template"
                    onChange={(e) => setContentTemplateSid(e.target.value)}
                    value={contentTemplateSid}
                  >
                    <Option value="">Select a template</Option>
                    {contentTemplates.map((template) => (
                      <Option value={template.sid} key={template.sid}>
                        {template.name}
                      </Option>
                    ))}
                  </Select>
                  <HelpText>
                    Choose a content template to send via WhatsApp.
                  </HelpText>
                </>
              ) : (
                <>
                  {/* Message Input and Message selector*/}
                  <Label htmlFor="message-body">Message to send</Label>
                  <TextArea
                    theme={props.theme}
                    onChange={(event) => {
                      setMessageBody(event.target.value);
                    }}
                    id="message-body"
                    name="message-body"
                    placeholder="Type message"
                    value={messageBody}
                  />

                  <Box backgroundColor="colorBackgroundBody" padding="space50">
                    <Separator
                      orientation="horizontal"
                      verticalSpacing="space50"
                    />
                  </Box>

                  <Label htmlFor="select_template">Select a Message</Label>
                  <Select
                    id="select_template"
                    onChange={(e) => setMessageBody(e.target.value)}
                    value={messageBody}
                  >
                    {templates.map((template) => (
                      <Option value={template} key={template}>
                        {template || "Type message"}
                      </Option>
                    ))}
                  </Select>
                  <HelpText>Choose a predefined message to send.</HelpText>
                </>
              )}
            </MessageContainer>

            <SendMessageContainer theme={props.theme}>
              <SendMessageMenu
                disableSend={disableSend}
                onClickHandler={handleSendClicked}
              />
            </SendMessageContainer>
          </>
        )}
        {!isWorkerAvailable(worker) && (
          <OfflineContainer theme={props.theme}>
            <ErrorIcon />
            {`To send a message, please change your status from ${worker.activity.name}`}
          </OfflineContainer>
        )}
      </StyledSidePanel>
    </Container>
  );
};

export default OutboundMessagePanel;