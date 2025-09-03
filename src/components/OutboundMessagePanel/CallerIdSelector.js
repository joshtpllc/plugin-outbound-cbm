import React, { useState, useEffect } from 'react';
import { Flex, Select, Option, Label, Spinner, Text } from '@twilio-paste/core';
import { Manager } from '@twilio/flex-ui';
import { fetchAvailableNumbers } from '../../utils/fetchAvailableNumbers';

const CallerIdSelector = ({
  selectedCallerId,
  onCallerIdChange,
  disabled = false,
  messageType = 'sms', // 'sms', 'whatsapp', or 'both'
  theme
}) => {
  const [availableNumbers, setAvailableNumbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNumbers();
  }, []);

  const fetchNumbers = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchAvailableNumbers();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch numbers');
      }

      let filteredNumbers = data.numbers;
      if (messageType === 'sms') {
        filteredNumbers = data.numbers.filter(num => num.type === 'sms');
      } else if (messageType === 'whatsapp') {
        filteredNumbers = data.numbers.filter(num => num.type === 'whatsapp');
      }

      setAvailableNumbers(filteredNumbers);
      // Auto-select the first number if none is selected
      if (!selectedCallerId && filteredNumbers.length > 0) {
        onCallerIdChange(filteredNumbers[0].phoneNumber, filteredNumbers[0]);
      }
    } catch (err) {
      console.error('Error fetching available numbers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionChange = (event) => {
    const value = event.target.value;
    const selectedNumber = availableNumbers.find(num => num.phoneNumber === value);
    onCallerIdChange(value, selectedNumber);
  };

  if (loading) {
    return (
      <Flex
        vAlignContent="center"
        hAlignContent="left"
        marginBottom="space50"
      >
        <Spinner decorative size="sizeIcon20" />
        <Text marginLeft="space20" fontSize="fontSize20">
          Loading available numbers...
        </Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <div>
        <Label htmlFor="caller-id-error">From Number</Label>
        <Text
          color="colorTextError"
          fontSize="fontSize30"
          marginTop="space20"
        >
          Error: {error}
        </Text>
      </div>
    );
  }

  if (availableNumbers.length === 0) {
    return (
      <div>
        <Label htmlFor="caller-id-empty">From Number</Label>
        <Text
          color="colorTextWeak"
          fontSize="fontSize30"
          marginTop="space20"
        >
          No numbers available for {messageType} messaging
        </Text>
      </div>
    );
  }

  return (
    <div style={{
      marginBottom: theme?.tokens?.spacings?.space50 || '1rem'
    }}>
      <Label htmlFor="caller-id-select">From Number</Label>
      <Select
        id="caller-id-select"
        value={selectedCallerId || ''}
        onChange={handleSelectionChange}
        disabled={disabled}
      >
        {!selectedCallerId && (
          <Option value="">Select a number</Option>
        )}
        {availableNumbers.map((number) => (
          <Option key={number.sid} value={number.phoneNumber}>
            {number.friendlyName} ({number.phoneNumber})
            {number.type === 'whatsapp' && ' - WhatsApp'}
          </Option>
        ))}
      </Select>
    </div>
  );
};

export default CallerIdSelector;