import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Calendar, Clock } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/theme';

const theme = Colors.dark;

const ReminderSchedulePicker = ({
  reminderTime,
  setReminderTime,
  repeatType,
  setRepeatType,
}) => {
  const openDatePicker = () => {
    DateTimePickerAndroid.open({
      value: reminderTime,
      mode: 'date',
      display: 'default',
      onChange: (event, date) => {
        if (date) setReminderTime(date);
      },
    });
  };

  const openTimePicker = () => {
    DateTimePickerAndroid.open({
      value: reminderTime,
      mode: 'time',
      display: 'default',
      onChange: (event, date) => {
        if (date) setReminderTime(date);
      },
    });
  };

  const repeatOptions = ['none', 'daily', 'weekly', 'monthly'];

  return (
    <View style={styles.container}>
      {/* Date & Time Pickers */}
      <Text style={styles.sectionLabel}>SCHEDULE</Text>
      <View style={styles.pickerRow}>
        <Pressable
          style={({ pressed }) => [
            styles.pickerButton,
            pressed && { opacity: 0.7 },
          ]}
          onPress={openDatePicker}
        >
          <Calendar size={18} color={theme.accent} />
          <Text style={styles.pickerText}>
            {reminderTime.toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.pickerButton,
            pressed && { opacity: 0.7 },
          ]}
          onPress={openTimePicker}
        >
          <Clock size={18} color={theme.accent} />
          <Text style={styles.pickerText}>
            {reminderTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </Pressable>
      </View>

      {/* Repeat Options */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>REPEAT</Text>
      <View style={styles.repeatContainer}>
        {repeatOptions.map((type) => (
          <Pressable
            key={type}
            style={[
              styles.repeatButton,
              repeatType === type && styles.repeatButtonSelected,
            ]}
            onPress={() => setRepeatType(type)}
          >
            <Text
              style={[
                styles.repeatText,
                repeatType === type && styles.repeatTextSelected,
              ]}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default ReminderSchedulePicker;

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.secondaryText,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.tertiaryBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  pickerText: {
    fontSize: 15,
    color: theme.text,
    fontWeight: '500',
  },
  repeatContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  repeatButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: theme.tertiaryBackground,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
  },
  repeatButtonSelected: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  repeatText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.secondaryText,
  },
  repeatTextSelected: {
    color: '#FFFFFF',
  },
});