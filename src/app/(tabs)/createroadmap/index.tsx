import { authClient } from "@/lib/auth-client";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

export default function Roadmap() {
  const router = useRouter();
  const [fileInfo, setFileInfo] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  // Which subject card is expanded, and which unit/topic inside it
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>(
    {},
  );
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>(
    {},
  );
  const trimmedName = name.trim();
  const canUpload = trimmedName.length > 0 && !loading;
  const pickDocument = async () => {
    if (!trimmedName) {
      Alert.alert(
        "Name required",
        "Please give this syllabus a name before uploading.",
      );
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const selectedAsset = result.assets[0];
        setFileInfo(selectedAsset);
        generateRoadmap(selectedAsset, trimmedName);
      } else {
        Alert.alert("Canceled", "No document was selected.");
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "An error occurred while picking the document.");
    }
  };

  const uploadWithXHR = async (
    file: DocumentPicker.DocumentPickerAsset,
    syllabusName: string,
  ): Promise<any> => {
    const cookies = await authClient.getCookie();

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("POST", `${BASE_URL}/api/uploadfile`);
      if (cookies) {
        xhr.setRequestHeader("Cookie", cookies);
      }
      xhr.withCredentials = true;

      xhr.onload = () => {
        console.log("Status:", xhr.status);
        console.log("Response:", xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error("Invalid JSON response from server"));
          }
        } else {
          reject(new Error(`Server responded with ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network request failed"));

      const formData = new FormData();
      formData.append("name", syllabusName);
      formData.append("pdffile", {
        uri: file.uri,
        name: file.name || "upload.pdf",
        type: file.mimeType || "application/pdf",
      } as any);

      xhr.send(formData);
    });
  };

  const generateRoadmap = async (
    file: DocumentPicker.DocumentPickerAsset,
    syllabusName: string,
  ) => {
    setLoading(true);
    setError(null);

    try {
      let data;

      if (Platform.OS === "web") {
        const formData = new FormData();
        formData.append("name", syllabusName);
        // @ts-ignore
        if (file.file) {
          // @ts-ignore
          formData.append("file", file.file, file.name);
        } else {
          throw new Error("No file blob available for web upload");
        }

        const res = await fetch(`${BASE_URL}/api/uploadfile`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!res.ok) throw new Error(`Server responded with ${res.status}`);
        data = await res.json();
      } else {
        data = await uploadWithXHR(file, syllabusName);
      }

      if (!data.success) {
        throw new Error("Upload was not successful");
      }

      // Matches SyllabusSchema: { subjects: [{ name, units: [{ name, topics: [{ name, subTopics: [] }] }] }] }
      const subjects = data.analysis?.subjects || [];

      const normalized = subjects.map((subject: any, index: number) => {
        const units = subject.units || [];
        const topicCount = units.reduce(
          (sum: number, unit: any) => sum + (unit.topics?.length || 0),
          0,
        );

        return {
          id: String(index),
          title: subject.name,
          description: `${units.length} units covering ${topicCount} topics`,
          steps: topicCount,
          raw: subject,
        };
      });

      setRoadmaps(normalized);
      setExpandedCardId(null);
      setExpandedUnits({});
      setExpandedTopics({});
    } catch (err) {
      console.error("Error generating roadmap:", err);
      setError(
        "Something went wrong while generating your roadmap. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (id: string) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  const toggleUnit = (key: string) => {
    setExpandedUnits((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTopic = (key: string) => {
    setExpandedTopics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Feather name="map" size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Your Roadmap</Text>
          <Text style={styles.subtitle}>
            Upload your syllabus, get a step-by-step plan
          </Text>
        </View>

        {/* Form card — name + upload grouped together */}
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <View style={styles.labelWithIcon}>
              <Feather name="edit-3" size={14} color="#374151" />
              <Text style={styles.labelText}>Syllabus Name</Text>
            </View>
            <TextInput
              placeholder="e.g. Semester 3 – DBMS"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={setName}
              style={styles.input}
              editable={!loading}
            />
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelWithIcon}>
              <Feather name="file-text" size={14} color="#374151" />
              <Text style={styles.labelText}>Upload Syllabus (PDF)</Text>
            </View>

            <TouchableOpacity
              style={[styles.uploadBox, !canUpload && styles.uploadBoxDisabled]}
              onPress={pickDocument}
              activeOpacity={0.85}
              disabled={loading}
            >
              <View
                style={[
                  styles.uploadIconWrapper,
                  !canUpload && styles.uploadIconWrapperDisabled,
                ]}
              >
                <Feather
                  name="upload-cloud"
                  size={22}
                  color={canUpload ? "#16A673" : "#9CA3AF"}
                />
              </View>
              <Text style={styles.uploadTitle} numberOfLines={1}>
                {fileInfo ? fileInfo.name : "Tap to upload a PDF"}
              </Text>
              <Text style={styles.uploadSubtitle}>
                {!trimmedName
                  ? "Enter a name above first"
                  : fileInfo
                    ? "Tap to choose a different file"
                    : "PDF files only"}
              </Text>
            </TouchableOpacity>
          </View>

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#16A673" size="small" />
              <Text style={styles.loadingText}>Generating your roadmap…</Text>
            </View>
          )}

          {error && !loading && (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Generated Roadmaps */}
        {roadmaps.length > 0 && !loading && (
          <View style={styles.resultsSection}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>GENERATED ROADMAPS</Text>
              <View style={styles.dividerLine} />
            </View>

            {roadmaps.map((item) => {
              const isExpanded = expandedCardId === item.id;

              return (
                <View key={item.id} style={styles.cardWrapper}>
                  <TouchableOpacity
                    style={styles.card}
                    activeOpacity={0.85}
                    onPress={() => toggleCard(item.id)}
                  >
                    <View style={styles.cardIconWrapper}>
                      <Feather name="check-square" size={18} color="#16A673" />
                    </View>

                    <View style={styles.cardTextWrapper}>
                      <Text style={styles.cardTitle}>{item.title}</Text>
                      <Text style={styles.cardDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                      <Text style={styles.cardMeta}>{item.steps} steps</Text>
                    </View>

                    <Feather
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.expandedPanel}>
                      {item.raw.units?.map((unit: any, unitIndex: number) => {
                        const unitKey = `${item.id}-${unitIndex}`;
                        const isUnitOpen = expandedUnits[unitKey];

                        return (
                          <View key={unitKey} style={styles.unitCard}>
                            <TouchableOpacity
                              style={styles.unitHeader}
                              onPress={() => toggleUnit(unitKey)}
                              activeOpacity={0.85}
                            >
                              <View style={styles.unitIconWrapper}>
                                <Feather
                                  name="book-open"
                                  size={16}
                                  color="#16A673"
                                />
                              </View>
                              <Text style={styles.unitTitle}>{unit.name}</Text>
                              <Feather
                                name={
                                  isUnitOpen ? "chevron-up" : "chevron-down"
                                }
                                size={16}
                                color="#9CA3AF"
                              />
                            </TouchableOpacity>

                            {isUnitOpen &&
                              unit.topics?.map(
                                (topic: any, topicIndex: number) => {
                                  const topicKey = `${unitKey}-${topicIndex}`;
                                  const isTopicOpen = expandedTopics[topicKey];

                                  return (
                                    <View
                                      key={topicKey}
                                      style={styles.topicWrapper}
                                    >
                                      <TouchableOpacity
                                        style={styles.topicHeader}
                                        onPress={() => toggleTopic(topicKey)}
                                        activeOpacity={0.85}
                                      >
                                        <View style={styles.topicDot} />
                                        <Text style={styles.topicTitle}>
                                          {topic.name}
                                        </Text>
                                        <Feather
                                          name={
                                            isTopicOpen
                                              ? "chevron-up"
                                              : "chevron-down"
                                          }
                                          size={13}
                                          color="#9CA3AF"
                                        />
                                      </TouchableOpacity>

                                      {isTopicOpen && (
                                        <View style={styles.subTopicList}>
                                          {topic.subTopics?.map(
                                            (
                                              subTopic: string,
                                              subIndex: number,
                                            ) => (
                                              <View
                                                key={subIndex}
                                                style={styles.subTopicRow}
                                              >
                                                <View
                                                  style={styles.subTopicDash}
                                                />
                                                <Text
                                                  style={styles.subTopicText}
                                                >
                                                  {subTopic}
                                                </Text>
                                              </View>
                                            ),
                                          )}
                                        </View>
                                      )}
                                    </View>
                                  );
                                },
                              )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 24 },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#16A673",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#6B7280", textAlign: "center" },

  form: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  fieldGroup: { marginBottom: 18 },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  labelText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  input: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#111827",
  },

  uploadBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBoxDisabled: {
    opacity: 0.55,
  },
  uploadIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E7F6F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  uploadIconWrapperDisabled: {
    backgroundColor: "#EEF0F2",
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
    maxWidth: "90%",
  },
  uploadSubtitle: { fontSize: 12, color: "#9CA3AF" },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    gap: 8,
  },
  loadingText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 12,
  },
  errorText: { fontSize: 13, color: "#DC2626", flex: 1 },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    letterSpacing: 0.5,
  },
  resultsSection: { width: "100%" },

  cardWrapper: { marginBottom: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E7F6F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardTextWrapper: { flex: 1 },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  cardDescription: { fontSize: 13, color: "#6B7280", marginBottom: 4 },
  cardMeta: { fontSize: 12, fontWeight: "600", color: "#16A673" },

  expandedPanel: { marginTop: 10, gap: 10 },
  unitCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  unitHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
    backgroundColor: "#FAFAFA",
  },
  unitIconWrapper: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E7F6F0",
    alignItems: "center",
    justifyContent: "center",
  },
  unitTitle: { flex: 1, fontSize: 14, fontWeight: "600", color: "#111827" },
  topicWrapper: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingHorizontal: 14,
  },
  topicHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    gap: 10,
  },
  topicDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#16A673",
    marginLeft: 4,
  },
  topicTitle: { flex: 1, fontSize: 13, fontWeight: "500", color: "#374151" },
  subTopicList: { paddingLeft: 24, paddingBottom: 12, gap: 7 },
  subTopicRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  subTopicDash: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#9CA3AF",
    marginTop: 7,
  },
  subTopicText: { flex: 1, fontSize: 12.5, color: "#6B7280", lineHeight: 18 },
});
