import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, shadow } from "@/lib/theme";
import { formatClock } from "@/lib/studySession";
import { useStudyClock, useStudySession } from "./StudySessionProvider";

const MARGIN = 10;
// Movement before a touch counts as a drag (smaller ones stay taps)
const DRAG_THRESHOLD = 6;

// Floating mini timer shown on every screen while a session is open. Starts at the top,
// can be dragged anywhere and snaps to the nearer side. Tap to open the subject; the
// button pauses or resumes.
export default function StudyTimerPill({ bottomInset }: { bottomInset: number }) {
  const { session, busy, pause, resume } = useStudySession();
  const elapsed = useStudyClock();
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const startY = insets.top + 8;
  const position = useRef(new Animated.ValueXY({ x: MARGIN, y: startY })).current;
  // Where the pill rests, its measured size, and the area it may move in. Refs, because
  // the gesture handlers below are created once.
  const resting = useRef({ x: MARGIN, y: startY });
  const size = useRef({ w: 240, h: 48 });
  const bounds = useRef({ screenW, top: startY, bottom: screenH - bottomInset - MARGIN });

  // Keep it on screen and snap to the nearer side
  const settle = (x: number, y: number) => {
    const { screenW, top, bottom } = bounds.current;
    const { w, h } = size.current;
    const maxX = Math.max(MARGIN, screenW - w - MARGIN);
    const target = {
      x: x + w / 2 < screenW / 2 ? MARGIN : maxX,
      y: Math.min(Math.max(y, top), Math.max(top, bottom - h)),
    };
    resting.current = target;
    Animated.spring(position, {
      toValue: target,
      useNativeDriver: false,
      friction: 7,
      tension: 60,
    }).start();
  };

  const responder = useRef(
    PanResponder.create({
      // Capture so a drag starting on the text or the button still moves the pill
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > DRAG_THRESHOLD || Math.abs(g.dy) > DRAG_THRESHOLD,
      onPanResponderGrant: () => {
        position.setOffset(resting.current);
        position.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        position.flattenOffset();
        settle(resting.current.x + g.dx, resting.current.y + g.dy);
      },
      onPanResponderTerminate: (_, g) => {
        position.flattenOffset();
        settle(resting.current.x + g.dx, resting.current.y + g.dy);
      },
    }),
  ).current;

  // The area it may move in; on rotation or a size change, move it back inside
  useEffect(() => {
    bounds.current = {
      screenW,
      top: insets.top + 4,
      bottom: screenH - bottomInset - MARGIN,
    };
    settle(resting.current.x, resting.current.y);
    // settle only reads refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenW, screenH, bottomInset, insets.top]);

  // The subject's own screen already shows the big timer
  if (!session || (session.roadmapId && pathname.endsWith(`/${session.roadmapId}`))) {
    return null;
  }

  const open = () => {
    if (session.roadmapId) {
      router.push({
        pathname: "/(tabs)/(createroadmap)/[id]",
        params: { id: session.roadmapId },
      });
    }
  };

  return (
    <Animated.View
      style={[styles.floating, { transform: position.getTranslateTransform() }]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        size.current = { w: width, h: height };
      }}
      {...responder.panHandlers}
    >
      <Pressable
        style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={`Studying ${session.roadmapName}, ${formatClock(elapsed)}. Open timer`}
        accessibilityHint="Drag to move it"
      >
        <View style={[styles.dot, !session.running && styles.dotPaused]} />
        <Text style={styles.name} numberOfLines={1}>
          {session.roadmapName}
        </Text>
        <Text style={styles.clock}>{formatClock(elapsed)}</Text>
        <TouchableOpacity
          style={styles.btn}
          onPress={session.running ? pause : resume}
          disabled={busy}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={session.running ? "Pause timer" : "Resume timer"}
        >
          <Ionicons name={session.running ? "pause" : "play"} size={15} color={colors.primary} />
        </TouchableOpacity>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Positioned by the transform from the top-left corner
  floating: { position: "absolute", top: 0, left: 0, zIndex: 100, elevation: 12 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 44,
    maxWidth: 300,
    paddingLeft: 14,
    paddingRight: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
    ...shadow.raised,
  },
  pressed: { opacity: 0.9 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.white },
  dotPaused: { backgroundColor: "#FFE08A" },
  name: { flexShrink: 1, maxWidth: 120, fontSize: 13, fontWeight: "700", color: colors.white },
  clock: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.white,
    fontVariant: ["tabular-nums"],
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
});
