import React, { useState } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { Button, Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Expense } from '@/src/types/DataTypes';
import { parse, format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface DateButtonProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

const DateButton: React.FC<DateButtonProps> = ({ value, onChange, label = 'Date', style }) => {

  return (
    <View style={style}>
      {label && <Text style={{ marginBottom: 8 }}>{label}</Text>}
        <DateTimePicker
          value={value}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            if (selectedDate) onChange(selectedDate);
          }}
        />
    </View>
  );
};

export default DateButton;

type WithCreatedAt = { createdAt: Timestamp | Date | string | undefined };

export function groupByDate<T extends WithCreatedAt>(items: T[]) {
  const groups: { [date: string]: T[] } = {};
  items.forEach(item => {
    const dateStr = getDateString(item.createdAt);
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(item);
  });
  // Sort dates descending (most recent first)
  const sortedDates = Object.keys(groups).sort((a, b) => {
    const aDate = new Date(a);
    const bDate = new Date(b);
    return bDate.getTime() - aDate.getTime();
  });
  return sortedDates.map(date => ({ title: date, data: groups[date] }));
}

// Helper to format date for grouping
export function getDateString(date: Timestamp | Date | string | undefined): string {
  if (!date) {
    return "Unknown Date";
  }

  let jsDate: Date;
  if (typeof date === "string") {
    // Try parsing as D/M/YYYY
    jsDate = parse(date, 'd/M/yyyy', new Date());
    if (isNaN(jsDate.getTime())) {
      // Try parsing as D/MM/YYYY
      jsDate = parse(date, 'dd/MM/yyyy', new Date());
    }
    if (isNaN(jsDate.getTime())) {
      // Try ISO or fallback
      jsDate = new Date(date);
    }
  } else if (date instanceof Date) {
    jsDate = date;
  } else if (date instanceof Timestamp) {
    jsDate = date.toDate();
  } else if (date && typeof (date as any).toDate === "function") {
    jsDate = (date as any).toDate();
  } else {
    return "Unknown Date";
  }
  if (isNaN(jsDate.getTime())) {
    return "Unknown Date";
  }
  return format(jsDate, "MMM d, yyyy");
}
 