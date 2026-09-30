import { authClient } from "@/lib/auth-client";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;
const MAX_SIZE = 5 * 1024 * 1024; // matches the multer limit on the backend

const GREEN = "#16A673";
const GREEN_DARK = "#0F5132";
const GREEN_TINT = "#E8F6F1";
const BORDER = "#D9EFE7";
const MUTED = "#6B7A73";
const DANGER = "#D64545";

const formatSize = (bytes?: number) => {
  if (!bytes) return "";
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const animate = () =>
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

export default function Roadmap() {
  const router = useRouter();
  const [fileInfo, setFileInfo] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<any | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  /* ---------------- upload logic ---------------- */

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      if (asset.size && asset.size > MAX_SIZE) {
        Alert.alert("File too large", "Please choose a PDF smaller than 5 MB.");
        return;
      }
      setFileInfo(asset);
      generateRoadmap(asset);
    } catch (e) {
      console.error("Error picking document:", e);
      Alert.alert("Error", "An error occurred while picking the document.");
    }
  };

  const uploadWithXHR = async (
    file: DocumentPicker.DocumentPickerAsset,
  ): Promise<any> => {
    const cookies = await authClient.getCookie();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE_URL}/api/uploadfile`);
      if (cookies) xhr.setRequestHeader("Cookie", cookies);
      xhr.withCredentials = true;

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error("Invalid response from server"));
          }
        } else {
          // surface the backend's message (e.g. "Could not extract a roadmap...")
          let message = `Server responded with ${xhr.status}`;
          try {
            message = JSON.parse(xhr.responseText)?.message ?? message;
          } catch {}
          reject(new Error(message));
        }
      };
      xhr.onerror = () => reject(new Error("Network request failed"));

      const formData = new FormData();
      formData.append("pdffile", {
        uri: file.uri,
        name: file.name || "upload.pdf",
        type: file.mimeType || "application/pdf",
      } as any);
      xhr.send(formData);
    });
  };

  const generateRoadmap = async (file: DocumentPicker.DocumentPickerAsset) => {
    setLoading(true);
    setError(null);
    setRoadmap(null);

    try {
      let data;

      if (Platform.OS === "web") {
        const formData = new FormData();
        // @ts-ignore
        if (!file.file) throw new Error("No file blob available for web upload");
        // @ts-ignore  (field name must match upload.single("pdffile") on the server)
        formData.append("pdffile", file.file, file.name);

        const res = await fetch(`${BASE_URL}/api/uploadfile`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        data = await res.json();
      } else {
        data = await uploadWithXHR(file);
      }

      if (!data.success) throw new Error("Upload was not successful");

      animate();
      setRoadmap(data.roadmap);
      setExpandedUnits({});
      setExpandedTopics({});
    } catch (err: any) {
      console.error("Error generating roadmap:", err);
      setError(
        err?.message && !err.message.startsWith("Server responded")
          ? err.message
          : "Something went wrong while generating your roadmap. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    animate();
    setFileInfo(null);
    setRoadmap(null);
    setError(null);
    setExpandedUnits({});
    setExpandedTopics({});
  };

  const toggleUnit = (key: string) => {
    animate();
    setExpandedUnits((p) => ({ ...p, [key]: !p[key] }));
  };
  const toggleTopic = (key: string) => {
    animate();
    setExpandedTopics((p) => ({ ...p, [key]: !p[key] }));
  };

  const openRoadmap = () => {
    if (!roadmap?.id) return;
    router.push({
      pathname: "/(tabs)/(createroadmap)/[id]",
      params: { id: roadmap.id },
    });
  };

  /* ---------------- derived stats ---------------- */

  const units: any[] = roadmap?.units ?? [];
  const topicCount = units.reduce((s, u) => s + (u.topics?.length ?? 0), 0);
  const subTopicCount = units.reduce(
    (s, u) =>
      s + (u.topics ?? []).reduce((t: number, x: any) => t + (x.subTopics?.length ?? 0), 0),
    0,
  );

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Create Roadmap</Text>
            <Text style={styles.subtitle}>
              Upload your syllabus and we'll split it into units, topics and
              subtopics.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.allBtn}
            activeOpacity={0.8}
            onPress={() => router.push("/(tabs)/(createroadmap)/allRoadmap")}
          >
            <Feather name="map" size={15} color={GREEN_DARK} />
            <Text style={styles.allText}>My roadmaps</Text>
          </TouchableOpacity>
        </View>

        {/* Upload card */}
        {!roadmap && (
          <View style={styles.uploadCard}>
            {loading ? (
              <View style={styles.stateBox}>
                <ActivityIndicator color={GREEN} size="large" />
                <Text style={styles.stateTitle}>Reading your syllabus…</Text>
                <Text style={styles.stateText}>
                  Breaking it into units and topics. This can take up to a
                  minute, so please keep the app open.
                </Text>
                {fileInfo && (
                  <View style={styles.filePill}>
                    <Feather name="file-text" size={14} color={GREEN} />
                    <Text style={styles.filePillText} numberOfLines={1}>
                      {fileInfo.name}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.dropZone}
                onPress={pickDocument}
                activeOpacity={0.85}
              >
                <View style={styles.uploadIcon}>
                  <Feather name="upload-cloud" size={28} color={GREEN} />
                </View>
                <Text style={styles.dropTitle}>
                  {fileInfo ? "Choose a different PDF" : "Tap to upload your syllabus"}
                </Text>
                <Text style={styles.dropText}>PDF only · up to 5 MB</Text>
              </TouchableOpacity>
            )}

            {fileInfo && !loading && (
              <View style={styles.fileRow}>
                <View style={styles.fileIcon}>
                  <Feather name="file-text" size={18} color={GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {fileInfo.name}
                  </Text>
                  <Text style={styles.fileSize}>{formatSize(fileInfo.size)}</Text>
                </View>
                <TouchableOpacity onPress={reset} hitSlop={10}>
                  <Feather name="x" size={20} color={MUTED} />
                </TouchableOpacity>
              </View>
            )}

            {error && !loading && (
              <View style={styles.errorBox}>
                <View style={styles.errorTop}>
                  <Feather name="alert-circle" size={18} color={DANGER} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
                {fileInfo && (
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => generateRoadmap(fileInfo)}
                    activeOpacity={0.85}
                  >
                    <Feather name="refresh-cw" size={14} color="#fff" />
                    <Text style={styles.retryText}>Try again</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* Tips (only before a file is chosen) */}
        {!roadmap && !loading && !fileInfo && (
          <View style={styles.tips}>
            <Tip icon="check-circle" text="Works best with PDFs where you can select the text." />
            <Tip icon="layers" text="Only the first subject or paper in the file is used." />
            <Tip icon="edit-3" text="You can tick off and delete items after it's created." />
          </View>
        )}

        {/* Result */}
        {roadmap && (
          <View>
            <View style={styles.successBanner}>
              <Feather name="check-circle" size={18} color={GREEN} />
              <Text style={styles.successText}>Your roadmap is ready</Text>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>{roadmap.name}</Text>

              <View style={styles.statsRow}>
                <Stat value={units.length} label="Units" />
                <View style={styles.statDivider} />
                <Stat value={topicCount} label="Topics" />
                <View style={styles.statDivider} />
                <Stat value={subTopicCount} label="Subtopics" />
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={openRoadmap}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>Open roadmap</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryBtn} onPress={reset} activeOpacity={0.7}>
                <Text style={styles.secondaryBtnText}>Upload another syllabus</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>PREVIEW</Text>

            {units.map((unit: any, ui: number) => {
              const unitKey = `u-${ui}`;
              const unitOpen = !!expandedUnits[unitKey];
              const topics = unit.topics ?? [];

              return (
                <View key={unitKey} style={styles.unitCard}>
                  <TouchableOpacity
                    style={styles.unitHeader}
                    onPress={() => toggleUnit(unitKey)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.unitBadge}>
                      <Text style={styles.unitBadgeText}>{ui + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.unitTitle}>{unit.name}</Text>
                      <Text style={styles.unitMeta}>
                        {topics.length} topic{topics.length === 1 ? "" : "s"}
                      </Text>
                    </View>
                    <Feather
                      name={unitOpen ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={MUTED}
                    />
                  </TouchableOpacity>

                  {unitOpen &&
                    topics.map((topic: any, ti: number) => {
                      const topicKey = `${unitKey}-t-${ti}`;
                      const topicOpen = !!expandedTopics[topicKey];
                      const subs = topic.subTopics ?? [];
                      const hasSubs = subs.length > 0;

                      return (
                        <View key={topicKey} style={styles.topicWrap}>
                          <TouchableOpacity
                            style={styles.topicHeader}
                            onPress={() => hasSubs && toggleTopic(topicKey)}
                            activeOpacity={hasSubs ? 0.8 : 1}
                          >
                            <View style={styles.topicDot} />
                            <Text style={styles.topicTitle}>{topic.name}</Text>
                            {hasSubs && (
                              <>
                                <View style={styles.countChip}>
                                  <Text style={styles.countChipText}>{subs.length}</Text>
                                </View>
                                <Feather
                                  name={topicOpen ? "chevron-up" : "chevron-down"}
                                  size={16}
                                  color={MUTED}
                                />
                              </>
                            )}
                          </TouchableOpacity>

                          {topicOpen && hasSubs && (
                            <View style={styles.subList}>
                              {subs.map((s: any, si: number) => (
                                <View key={si} style={styles.subRow}>
                                  <View style={styles.subDash} />
                                  <Text style={styles.subText}>
                                    {typeof s === "string" ? s : s.name}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- small components ---------------- */

function Tip({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return (
    <View style={styles.tipRow}>
      <View style={styles.tipIcon}>
        <Feather name={icon} size={15} color={GREEN} />
      </View>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ---------------- styles ---------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 48 },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 22,
  },
  title: { fontSize: 28, fontWeight: "800", color: GREEN_DARK },
  subtitle: { marginTop: 4, fontSize: 14, lineHeight: 20, color: MUTED },
  allBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: GREEN_TINT,
    marginTop: 4,
  },
  allText: { fontSize: 13, fontWeight: "600", color: GREEN_DARK },

  /* upload */
  uploadCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  dropZone: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 34,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: GREEN,
    backgroundColor: "#F5FBF8",
  },
  uploadIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GREEN_TINT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  dropTitle: { fontSize: 16, fontWeight: "700", color: GREEN_DARK },
  dropText: { marginTop: 4, fontSize: 13, color: MUTED },

  stateBox: { alignItems: "center", paddingVertical: 30, paddingHorizontal: 10 },
  stateTitle: { marginTop: 16, fontSize: 17, fontWeight: "700", color: GREEN_DARK },
  stateText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: MUTED,
    textAlign: "center",
  },
  filePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: GREEN_TINT,
    maxWidth: "100%",
  },
  filePillText: { fontSize: 12, fontWeight: "600", color: GREEN_DARK, flexShrink: 1 },

  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F7FBF9",
    borderWidth: 1,
    borderColor: BORDER,
  },
  fileIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: GREEN_TINT,
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: { fontSize: 14, fontWeight: "600", color: "#17201C" },
  fileSize: { marginTop: 2, fontSize: 12, color: MUTED },

  errorBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FAD4D4",
  },
  errorTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  errorText: { flex: 1, fontSize: 13, lineHeight: 19, color: "#B42318" },
  retryBtn: {
    marginTop: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: DANGER,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  /* tips */
  tips: { marginTop: 22, gap: 12 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  tipIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: GREEN_TINT,
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18, color: MUTED },

  /* result */
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  successText: { fontSize: 15, fontWeight: "700", color: GREEN_DARK },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: BORDER,
    borderLeftWidth: 5,
    borderLeftColor: GREEN,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  resultTitle: { fontSize: 20, fontWeight: "800", color: GREEN_DARK },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F5FBF8",
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800", color: GREEN },
  statLabel: { marginTop: 2, fontSize: 12, color: MUTED },
  statDivider: { width: 1, height: 28, backgroundColor: BORDER },

  primaryBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: GREEN,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryBtn: { height: 44, alignItems: "center", justifyContent: "center", marginTop: 4 },
  secondaryBtnText: { fontSize: 14, fontWeight: "600", color: GREEN },

  sectionLabel: {
    marginTop: 26,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: MUTED,
  },

  /* tree */
  unitCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
    overflow: "hidden",
  },
  unitHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    backgroundColor: "#F7FBF9",
  },
  unitBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  unitBadgeText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  unitTitle: { fontSize: 15, fontWeight: "700", color: GREEN_DARK },
  unitMeta: { marginTop: 2, fontSize: 12, color: MUTED },

  topicWrap: {
    borderTopWidth: 1,
    borderTopColor: "#EEF5F1",
    paddingHorizontal: 14,
  },
  topicHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  topicDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN },
  topicTitle: { flex: 1, fontSize: 14, fontWeight: "600", color: "#25302B" },
  countChip: {
    minWidth: 24,
    height: 20,
    paddingHorizontal: 7,
    borderRadius: 10,
    backgroundColor: GREEN_TINT,
    alignItems: "center",
    justifyContent: "center",
  },
  countChipText: { fontSize: 11, fontWeight: "700", color: GREEN_DARK },

  subList: {
    marginLeft: 3,
    paddingLeft: 14,
    paddingBottom: 12,
    gap: 8,
    borderLeftWidth: 2,
    borderLeftColor: GREEN_TINT,
  },
  subRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  subDash: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#A9B8B1",
    marginTop: 8,
  },
  subText: { flex: 1, fontSize: 13, lineHeight: 20, color: "#4A5A53" },
});