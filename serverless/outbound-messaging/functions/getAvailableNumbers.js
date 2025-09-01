const TokenValidator = require('twilio-flex-token-validator').functionValidator;

exports.handler = TokenValidator(async function (context, event, callback) {
  const client = context.getTwilioClient();

  const response = new Twilio.Response();
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Token');
  response.appendHeader('Content-Type', 'application/json');

  try {
    // Get phone numbers from the account
    const phoneNumbers = await client.incomingPhoneNumbers.list();

    // Filter only numbers that can send SMS messages
    const smsEnabledNumbers = phoneNumbers.filter(number =>
      number.capabilities.sms === true
    );

    let whatsappNumbers = [];
    try {
      const messagingServices = await client.messaging.services.list();
      for (const service of messagingServices) {
        const phoneNumbersList = await client.messaging
          .services(service.sid)
          .phoneNumbers
          .list();

        whatsappNumbers = phoneNumbersList
          .filter(pn => pn.capabilities.includes('whatsapp'))
          .map(pn => ({
            sid: pn.sid,
            phoneNumber: pn.phoneNumber,
            friendlyName: `${pn.phoneNumber} (WhatsApp)`,
            type: 'whatsapp',
            messagingServiceSid: service.sid
          }));
      }
    } catch (whatsappError) {
      console.log('No WhatsApp numbers found or error fetching them:', whatsappError.message);
    }

    const formattedSmsNumbers = smsEnabledNumbers.map(number => ({
      sid: number.sid,
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName || number.phoneNumber,
      type: 'sms',
      capabilities: number.capabilities
    }));

    const allAvailableNumbers = [
      ...formattedSmsNumbers,
      ...whatsappNumbers
    ];

    allAvailableNumbers.sort((a, b) => a.phoneNumber.localeCompare(b.phoneNumber));

    response.setBody({
      success: true,
      numbers: allAvailableNumbers,
      count: allAvailableNumbers.length
    });

  } catch (error) {
    console.error('Error fetching available numbers:', error);
    response.setStatusCode(500);
    response.setBody({
      success: false,
      error: error.message || 'Failed to fetch available numbers'
    });
  }

  callback(null, response);
});