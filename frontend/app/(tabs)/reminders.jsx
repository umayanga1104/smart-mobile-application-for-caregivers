import {
  Bell,
  Check,
  Clock,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import LabeledInput from '../../components/LabeledInput';
import ReminderSchedulePicker from '../../components/ReminderSchedulePicker';
import { Colors } from '../../constants/theme';
import {
  addReminder,
  deleteReminder,
  getAllReminders,
  updateReminder,
} from '../../services/reminder.service';
import { clearReminderUpdateCallback, setReminderUpdateCallback } from "../../utils/notificationListener";
import { syncReminderNotifications } from '../../utils/reminderScheduler';

const theme = Colors.dark;

// ─── Modal Handle ─────────────────────────────────────
const ModalHandle = () => <View style={styles.modalHandle} />;

// ─── Add Reminder Modal ──────────────────────────────
const AddReminderModal = ({ visible, onClose, onAdded }) => {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderTime, setReminderTime] = useState(new Date());
  const [repeatType, setRepeatType] = useState('none');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setReminderTime(new Date());
    setRepeatType('none');
  };

  const handleAdd = async () => {
    if (title.trim() === '' || !reminderTime) {
      Alert.alert('Missing Info', 'Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      await addReminder(title, description, reminderTime, repeatType);
      resetForm();
      onAdded();
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
          <ModalHandle />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Reminder</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={20} color={theme.secondaryText} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <LabeledInput
              label="Title"
              placeholder="Reminder title"
              value={title}
              onChangeText={setTitle}
            />
            <LabeledInput
              label="Description"
              placeholder="Add a description (optional)"
              value={description}
              onChangeText={setDescription}
            />
            <ReminderSchedulePicker
              reminderTime={reminderTime}
              setReminderTime={setReminderTime}
              repeatType={repeatType}
              setRepeatType={setRepeatType}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.cancelButton,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.confirmButton,
                  pressed && { opacity: 0.7 },
                  loading && { opacity: 0.5 },
                ]}
                onPress={handleAdd}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? 'Adding...' : 'Add Reminder'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Update Reminder Modal ────────────────────────────
const UpdateReminderModal = ({ visible, onClose, reminder, onUpdated }) => {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderTime, setReminderTime] = useState(new Date());
  const [repeatType, setRepeatType] = useState('none');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title || '');
      setDescription(reminder.description || '');
      setReminderTime(
        reminder.reminderTime ? new Date(reminder.reminderTime) : new Date()
      );
      setRepeatType(reminder.repeatType || 'none');
    }
  }, [reminder]);

  const handleUpdate = async () => {
    if (title.trim() === '') {
      Alert.alert('Missing Info', 'Please enter a title.');
      return;
    }
    setLoading(true);
    try {
      await updateReminder(reminder._id, {
        title,
        description,
        reminderTime: reminderTime.toISOString(),
        repeatType,
      });
      onUpdated();
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}>
          <ModalHandle />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Reminder</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={20} color={theme.secondaryText} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <LabeledInput
              label="Title"
              placeholder="Reminder title"
              value={title}
              onChangeText={setTitle}
            />
            <LabeledInput
              label="Description"
              placeholder="Add a description (optional)"
              value={description}
              onChangeText={setDescription}
            />
            <ReminderSchedulePicker
              reminderTime={reminderTime}
              setReminderTime={setReminderTime}
              repeatType={repeatType}
              setRepeatType={setRepeatType}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.cancelButton,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.confirmButton,
                  pressed && { opacity: 0.7 },
                  loading && { opacity: 0.5 },
                ]}
                onPress={handleUpdate}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Status Badge ─────────────────────────────────────
const StatusBadge = ({ status, isCompleted }) => {
  let badgeColor = theme.accent;
  let textColor = '#FFFFFF';
  let badgeText = status;

  if (status === 'Completed') {
    badgeColor = theme.tertiaryBackground;
    textColor = theme.tertiaryText;
  } else if (status === 'Daily') {
    badgeColor = theme.accent + '30';
    textColor = theme.accent;
  } else if (status === 'Weekly') {
    badgeColor = theme.accent + '30';
    textColor = theme.accent;
  } else if (status === 'Monthly') {
    badgeColor = theme.accent + '30';
    textColor = theme.accent;
  }

  return (
    <View style={[styles.badge, { backgroundColor: badgeColor }]}>
      <Text style={[styles.badgeText, { color: textColor }]}>{badgeText}</Text>
    </View>
  );
};

// ─── Reminder Card ────────────────────────────────────
const ReminderCard = ({ item, onEdit, onDelete, onMarkComplete }) => {
  const formattedTime = item.reminderTime
    ? new Date(item.reminderTime).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const isCompleted = item.isCompleted === true;
  const isNonRepeating = !item.repeatType || item.repeatType === 'none';
  
  // Determine status text
  let statusText = null;
  if (isNonRepeating && isCompleted) {
    statusText = 'Completed';
  } else if (!isNonRepeating) {
    statusText = item.repeatType.charAt(0).toUpperCase() + item.repeatType.slice(1);
  }
  
  const handleMarkComplete = () => {
    if (isNonRepeating && !isCompleted) {
      onMarkComplete(item._id);
    }
  };

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Reminder',
      `Are you sure you want to delete "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(item._id, item.notificationId),
        },
      ]
    );
  };

  return (
    <View style={[styles.reminderCard, isCompleted && styles.reminderCardCompleted]}>
      <View style={styles.reminderCardTop}>
        <View style={[styles.reminderIconContainer, isCompleted && styles.reminderIconContainerCompleted]}>
          <Bell size={20} color={isCompleted ? theme.tertiaryText : theme.accent} />
        </View>
        <View style={styles.reminderContent}>
          <Text style={[styles.reminderTitle, isCompleted && styles.reminderTitleCompleted]}>
            {item.title}
          </Text>
          {item.description ? (
            <Text style={[styles.reminderDescription, isCompleted && styles.reminderDescriptionCompleted]} numberOfLines={3}>
              {item.description}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.reminderBottom}>
        <View style={styles.reminderMeta}>
          <Clock size={12} color={theme.tertiaryText} />
          <Text style={[styles.reminderTime, isCompleted && styles.reminderTimeCompleted]}>{formattedTime}</Text>
          {statusText && (
            <StatusBadge status={statusText} isCompleted={isCompleted} />
          )}
        </View>
        <View style={styles.reminderActions}>
          {isNonRepeating && !isCompleted && (
            <Pressable
              style={({ pressed }) => [
                styles.iconButton,
                styles.completeButton,
                pressed && { opacity: 0.6 },
              ]}
              onPress={handleMarkComplete}
            >
              <Check size={18} color="#FFFFFF" />
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              pressed && { opacity: 0.6 },
            ]}
            onPress={() => onEdit(item)}
          >
            <Pencil size={18} color={theme.accent} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              pressed && { opacity: 0.6 },
            ]}
            onPress={handleDeletePress}
          >
            <Trash2 size={18} color={theme.destructive} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

// ─── Empty State ──────────────────────────────────────
const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIcon}>
      <Bell size={48} color={theme.tertiaryText} />
    </View>
    <Text style={styles.emptyTitle}>No Reminders</Text>
    <Text style={styles.emptySubtitle}>
      Tap the + button to create your first reminder
    </Text>
  </View>
);

// ─── Reminders Screen ─────────────────────────────────
const RemindersScreen = () => {
  const [reminders, setReminders] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ FIX: Track if sync is in progress to prevent race conditions
  const isSyncingRef = useRef(false);

  const loadReminders = useCallback(async () => {
    try {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      const data = await getAllReminders();
      setReminders(data || []);
      await syncReminderNotifications(data || []);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const handleReminderUpdate = (reminderId) => {
      getAllReminders().then(data => setReminders(data || [])).catch((error) => {
        console.error('Failed to reload reminders:', error);
      });
    };
    setReminderUpdateCallback(handleReminderUpdate);
    loadReminders();
    return () => clearReminderUpdateCallback();
  }, [loadReminders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  };

  const handleDelete = async (reminderId, notificationId) => {
    try {
      await deleteReminder(reminderId, notificationId);
      loadReminders();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete reminder');
      console.error(error.message);
    }
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setShowUpdateModal(true);
  };

  const handleMarkComplete = async (reminderId) => {
    try {
      await updateReminder(reminderId, {
        isCompleted: true,
        isNotified: true,
        notificationId: null,
      });
      await loadReminders();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark reminder as completed');
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>Reminders</Text>
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <FlatList
        data={reminders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <ReminderCard
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMarkComplete={handleMarkComplete}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          reminders.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={<EmptyState />}
        showsVerticalScrollIndicator={false}
        extraData={reminders}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
          />
        }
      />

      <AddReminderModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdded={loadReminders}
      />

      <UpdateReminderModal
        visible={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setEditingReminder(null);
        }}
        reminder={editingReminder}
        onUpdated={loadReminders}
      />
    </SafeAreaView>
  );
};

export default RemindersScreen;

// ─── Styles ───────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },

  // Header
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: theme.text,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  emptyList: {
    flex: 1,
  },

  // Reminder Card
  reminderCard: {
    backgroundColor: theme.secondaryBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  reminderCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reminderIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  reminderDescription: {
    fontSize: 14,
    color: theme.secondaryText,
    marginBottom: 4,
    lineHeight: 20,
  },
  reminderBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.separator,
  },
  reminderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  reminderTime: {
    fontSize: 12,
    color: theme.tertiaryText,
    marginRight: 8,
  },
  reminderRepeat: {
    fontSize: 12,
    color: theme.tertiaryText,
  },
  
  // Badge Styles
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  
  reminderActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.tertiaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButton: {
    backgroundColor: theme.accent,
  },

  // Completed State
  reminderCardCompleted: {
    backgroundColor: theme.secondaryBackground + '80',
    opacity: 0.7,
  },
  reminderIconContainerCompleted: {
    backgroundColor: theme.tertiaryBackground,
  },
  reminderTitleCompleted: {
    color: theme.tertiaryText,
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  reminderDescriptionCompleted: {
    color: theme.tertiaryText,
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  reminderTimeCompleted: {
    color: theme.tertiaryText,
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
  reminderRepeatCompleted: {
    color: theme.tertiaryText,
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: theme.secondaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 15,
    color: theme.secondaryText,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.secondaryBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 36,
    height: 5,
    backgroundColor: theme.tertiaryText,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.tertiaryBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.tertiaryBackground,
  },
  cancelButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: theme.accent,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});