import { apiJson, errorMessage } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GREEN = "#16A673";
const GREEN_DARK = "#0F5132";
const MUTED = "#6B7A73";
const A4_RATIO = 1 / 1.414; // until a page's real size is known

// GET /api/syllabus/uploads/:uploadId/pdf
type UploadPdf = {
  url: string; // original PDF, short-lived
  fileName: string;
  pageCount: number;
  pages: string[] | null; // one image per page, when the storage can render them
};

// Shows a syllabus PDF inside the app as page images
export default function SyllabusPdf() {
  const { uploadId } = useLocalSearchParams<{ uploadId: string }>();
  const router = useRouter();
  const [pdf, setPdf] = useState<UploadPdf | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const data = await apiJson<UploadPdf>(`/syllabus/uploads/${uploadId}/pdf`);
        if (!cancelled) setPdf(data);
      } catch (err) {
        console.error("Failed to load syllabus PDF:", err);
        if (!cancelled) setError(errorMessage(err, "Couldn't load this PDF."));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uploadId, reloadKey]);

  // The original's link expires after a few minutes, so fetch a fresh one when opening
  const openOriginal = async () => {
    try {
      const { url } = await apiJson<UploadPdf>(`/syllabus/uploads/${uploadId}/pdf`);
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert("Couldn't open the PDF", errorMessage(err, "Please try again."));
    }
  };

  const header = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
        <Ionicons name="arrow-back" size={24} color={GREEN_DARK} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>
          {pdf?.fileName ?? "Syllabus"}
        </Text>
        {pdf && (
          <Text style={styles.meta}>
            {pdf.pageCount} page{pdf.pageCount === 1 ? "" : "s"}
          </Text>
        )}
      </View>
      {pdf && (
        <TouchableOpacity onPress={openOriginal} hitSlop={10} style={styles.openBtn}>
          <Ionicons name="open-outline" size={16} color={GREEN_DARK} />
          <Text style={styles.openText}>Open PDF</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        {header}
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={44} color="#C45B5B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setReloadKey((k) => k + 1)}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!pdf) {
    return (
      <SafeAreaView style={styles.container}>
        {header}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      </SafeAreaView>
    );
  }

  // Storage that can't render pages: only the original can be opened
  if (!pdf.pages) {
    return (
      <SafeAreaView style={styles.container}>
        {header}
        <View style={styles.center}>
          <Ionicons name="document-text-outline" size={48} color={GREEN} />
          <Text style={styles.infoText}>
            This PDF can't be previewed here. Open it in your PDF viewer instead.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={openOriginal}>
            <Text style={styles.primaryBtnText}>Open PDF</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {header}
      <FlatList
        data={pdf.pages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        initialNumToRender={2}
        windowSize={5}
        renderItem={({ item, index }) => (
          <PdfPage uri={item} pageNumber={index + 1} onPress={openOriginal} />
        )}
      />
    </SafeAreaView>
  );
}

function PdfPage({
  uri,
  pageNumber,
  onPress,
}: {
  uri: string;
  pageNumber: number;
  onPress: () => void;
}) {
  const [ratio, setRatio] = useState(A4_RATIO);
  const [failed, setFailed] = useState(false);

  return (
    <View style={styles.page}>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        {failed ? (
          <View style={[styles.pageImage, styles.pageFailed, { aspectRatio: ratio }]}>
            <Ionicons name="image-outline" size={32} color={MUTED} />
            <Text style={styles.meta}>Couldn't load this page</Text>
          </View>
        ) : (
          <Image
            source={{ uri }}
            style={[styles.pageImage, { aspectRatio: ratio }]}
            resizeMode="contain"
            onLoad={(e) => {
              const { width, height } = e.nativeEvent.source;
              if (width && height) setRatio(width / height);
            }}
            onError={() => setFailed(true)}
          />
        )}
      </TouchableOpacity>
      <Text style={styles.pageNumber}>Page {pageNumber}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EEF2F0" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#D9EFE7",
  },
  title: { fontSize: 17, fontWeight: "700", color: GREEN_DARK },
  meta: { fontSize: 12, color: MUTED, marginTop: 2 },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8F6F1",
  },
  openText: { fontSize: 13, fontWeight: "600", color: GREEN_DARK },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  errorText: { fontSize: 15, color: "#C45B5B", textAlign: "center" },
  retryText: { fontSize: 15, fontWeight: "600", color: GREEN },
  infoText: { fontSize: 15, color: MUTED, textAlign: "center", lineHeight: 21 },
  primaryBtn: {
    height: 46,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },

  list: { padding: 12, gap: 16 },
  page: { alignItems: "center" },
  pageImage: { width: "100%", backgroundColor: "#FFFFFF", borderRadius: 4 },
  pageFailed: { alignItems: "center", justifyContent: "center", gap: 6 },
  pageNumber: { marginTop: 6, fontSize: 12, color: MUTED },
});
