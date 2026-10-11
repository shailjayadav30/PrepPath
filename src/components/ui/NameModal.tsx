import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, radius } from "@/lib/theme";

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  initialValue?: string;
  submitLabel: string;
  onSubmit: (name: string) => Promise<void> | void;
  onClose: () => void;
};

// Small dialog asking for a name (Alert.prompt only exists on iOS)
export default function NameModal({
  visible,
  title,
  message,
  placeholder,
  initialValue = "",
  submitLabel,
  onSubmit,
  onClose,
}: Props) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  // Start from the given value every time it opens
  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      setSaving(false);
    }
  }, [visible, initialValue]);

  const name = value.trim();

  const submit = async () => {
    if (!name || saving) return;
    setSaving(true);
    try {
      await onSubmit(name);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            autoFocus
            maxLength={200}
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, !name && styles.disabled]}
              onPress={submit}
              disabled={!name || saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.submitText}>{submitLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(10, 30, 22, 0.45)",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 20,
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.text },
  message: { marginTop: 6, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  input: {
    marginTop: 16,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 18 },
  cancelBtn: { height: 42, paddingHorizontal: 16, justifyContent: "center" },
  cancelText: { fontSize: 15, fontWeight: "600", color: colors.textSecondary },
  submitBtn: {
    minWidth: 96,
    height: 42,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: { fontSize: 15, fontWeight: "700", color: colors.white },
  disabled: { opacity: 0.45 },
});
