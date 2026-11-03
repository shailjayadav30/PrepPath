import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "@/lib/theme";

type IconName = keyof typeof Ionicons.glyphMap;

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  // Red button and icon, for actions that delete or discard something
  destructive?: boolean;
  icon?: IconName;
};

export type MenuOption<K extends string> = {
  key: K;
  label: string;
  icon?: IconName;
  destructive?: boolean;
};

export type MenuOptions<K extends string> = {
  title?: string;
  options: MenuOption<K>[];
};

type Request =
  | { kind: "confirm"; options: ConfirmOptions; resolve: (ok: boolean) => void }
  | { kind: "menu"; options: MenuOptions<string>; resolve: (key: string | null) => void };

// Set by the mounted DialogHost
let show: ((request: Request) => void) | null = null;

// Resolve after the closing animation, so the caller can open another modal right away
// (iOS can't present a modal while another one is still dismissing)
const CLOSE_DELAY_MS = 300;

// Themed replacements for Alert.alert, callable from anywhere (DialogHost must be mounted):
//   if (await dialog.confirm({ title: "Delete space?", destructive: true })) ...
//   const choice = await dialog.menu({ options: [{ key: "rename", label: "Rename" }] });
export const dialog = {
  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      if (!show) return resolve(false);
      show({ kind: "confirm", options, resolve });
    });
  },

  // Bottom sheet of options; resolves with the chosen key, or null when cancelled
  menu<K extends string>(options: MenuOptions<K>): Promise<K | null> {
    return new Promise((resolve) => {
      if (!show) return resolve(null);
      show({
        kind: "menu",
        options,
        resolve: resolve as (key: string | null) => void,
      });
    });
  },
};

// Renders the dialog and the menu sheet; mount once at the app root
export function DialogHost() {
  const insets = useSafeAreaInsets();
  const [request, setRequest] = useState<Request | null>(null);
  const [visible, setVisible] = useState(false);
  // The open request, for handlers (state can lag a render behind)
  const current = useRef<Request | null>(null);

  useEffect(() => {
    show = (next) => {
      // A new request replaces an open one, which counts as cancelled
      const prev = current.current;
      if (prev?.kind === "confirm") prev.resolve(false);
      else if (prev?.kind === "menu") prev.resolve(null);
      current.current = next;
      setRequest(next);
      setVisible(true);
    };
    return () => {
      show = null;
    };
  }, []);

  const closeThen = (settle: () => void) => {
    current.current = null;
    setVisible(false);
    setTimeout(settle, CLOSE_DELAY_MS);
  };

  const cancel = () => {
    const req = current.current;
    if (!req) return;
    closeThen(() => (req.kind === "confirm" ? req.resolve(false) : req.resolve(null)));
  };

  const accept = () => {
    const req = current.current;
    if (req?.kind !== "confirm") return;
    closeThen(() => req.resolve(true));
  };

  const pick = (key: string) => {
    const req = current.current;
    if (req?.kind !== "menu") return;
    closeThen(() => req.resolve(key));
  };

  // Kept while closing so the content doesn't vanish mid-animation
  const confirm = request?.kind === "confirm" ? request.options : null;
  const menu = request?.kind === "menu" ? request.options : null;

  return (
    <>
      <Modal
        visible={visible && !!confirm}
        transparent
        animationType="fade"
        onRequestClose={cancel}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={cancel}
            accessibilityLabel="Close"
          />
          {confirm && (
            <View style={styles.card} accessibilityRole="alert">
              <View style={[styles.iconCircle, confirm.destructive && styles.iconCircleDanger]}>
                <Ionicons
                  name={
                    confirm.icon ??
                    (confirm.destructive ? "trash-outline" : "help-circle-outline")
                  }
                  size={26}
                  color={confirm.destructive ? colors.danger : colors.primary}
                />
              </View>
              <Text style={styles.title}>{confirm.title}</Text>
              {confirm.message ? <Text style={styles.message}>{confirm.message}</Text> : null}

              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    styles.cancelButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={cancel}
                  accessibilityRole="button"
                >
                  <Text style={styles.cancelText}>{confirm.cancelText ?? "Cancel"}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    confirm.destructive ? styles.dangerButton : styles.primaryButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={accept}
                  accessibilityRole="button"
                >
                  <Text style={styles.confirmText}>{confirm.confirmText ?? "OK"}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </Modal>

      <Modal
        visible={visible && !!menu}
        transparent
        animationType="slide"
        onRequestClose={cancel}
      >
        <Pressable style={styles.sheetBackdrop} onPress={cancel} accessibilityLabel="Close" />
        {menu && (
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.handle} />
            {menu.title ? (
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {menu.title}
              </Text>
            ) : null}

            {menu.options.map((option) => (
              <Pressable
                key={option.key}
                onPress={() => pick(option.key)}
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                accessibilityRole="button"
              >
                <View style={[styles.optionIcon, option.destructive && styles.iconCircleDanger]}>
                  <Ionicons
                    name={option.icon ?? "ellipse-outline"}
                    size={20}
                    color={option.destructive ? colors.danger : colors.primary}
                  />
                </View>
                <Text style={[styles.optionText, option.destructive && styles.dangerText]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}

            <Pressable
              style={({ pressed }) => [styles.sheetCancel, pressed && styles.pressed]}
              onPress={cancel}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },

  // Confirm dialog
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
    backgroundColor: "rgba(10, 30, 22, 0.45)",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  iconCircleDanger: { backgroundColor: colors.dangerTint },
  title: { fontSize: 18, fontWeight: "800", color: colors.text, textAlign: "center" },
  message: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 22, alignSelf: "stretch" },
  button: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: { backgroundColor: "#F3F5F4" },
  primaryButton: { backgroundColor: colors.primary },
  dangerButton: { backgroundColor: colors.danger },
  cancelText: { fontSize: 15, fontWeight: "600", color: colors.textSecondary },
  confirmText: { fontSize: 15, fontWeight: "700", color: colors.white },

  // Menu sheet (same look as the profile photo sheet)
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(15, 81, 50, 0.35)" },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#DDE7E2",
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: colors.primaryDark, marginBottom: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  optionPressed: { backgroundColor: colors.primarySoft },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryTint,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { fontSize: 16, fontWeight: "500", color: colors.text },
  dangerText: { color: colors.danger },
  sheetCancel: {
    marginTop: 10,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#F3F5F4",
    alignItems: "center",
    justifyContent: "center",
  },
});
