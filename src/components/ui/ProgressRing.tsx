import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { colors } from "@/lib/theme";

type Props = {
  percent: number;
  size?: number;
  stroke?: number;
  // Ring colour on a dark background (e.g. the roadmap hero card)
  inverted?: boolean;
};

export default function ProgressRing({
  percent,
  size = 64,
  stroke = 7,
  inverted,
}: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={inverted ? "rgba(255,255,255,0.22)" : colors.primaryTint}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={inverted ? colors.white : colors.primary}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          // Start the arc at 12 o'clock
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.center}>
          <Text
            style={[
              styles.label,
              { fontSize: size * 0.24 },
              inverted && { color: colors.white },
            ]}
          >
            {clamped}%
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: { fontWeight: "800", color: colors.primaryDark },
});
