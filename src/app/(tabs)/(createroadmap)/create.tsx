import { ApiError, apiJson, errorMessage, uploadPdf } from "@/lib/api";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";
import type {
  AnalyzeResponse,
  AnalyzeSubject,
  GenerateBody,
  GenerateResponse,
  GenerateResult,
  SpaceDetail,
} from "../../../../types/roadmapTypes";

// Vercel rejects request bodies over 4.5 MB before they reach the backend
const MAX_SIZE = 4.5 * 1024 * 1024;
const MAX_PAGES = 100; // matches UPLOAD_LIMITS.maxPages on the backend
const MAX_SUBJECTS = 10; // matches GENERATE_LIMITS.maxSubjectsPerRequest

const GREEN = "#16A673";
const GREEN_DARK = "#0F5132";
const GREEN_TINT = "#E8F6F1";
const BORDER = "#D9EFE7";
const MUTED = "#6B7A73";
const DANGER = "#D64545";

type Phase = "idle" | "analyzing" | "picking" | "generating" | "done";
type ScreenError = { message: string; retry: (() => void) | null; retryLabel?: string };

const formatSize = (bytes?: number) => {
  if (!bytes) return "";
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const pageRange = (s: AnalyzeSubject) =>
  s.startPage === s.endPage ? `Page ${s.startPage}` : `Pages ${s.startPage}–${s.endPage}`;

// "3" -> 3; empty or invalid -> undefined (pages are optional)
const toPage = (value: string) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 1 ? n : undefined;
};

const animate = () =>
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

export default function CreateRoadmap() {
  // Roadmaps are always created in a space; uploadId starts from a PDF already in it
  const { spaceId, uploadId } = useLocalSearchParams<{ spaceId?: string; uploadId?: string }>();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(uploadId ? "analyzing" : "idle");
  const [spaceName, setSpaceName] = useState<string | null>(null);
  const [fileInfo, setFileInfo] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  // Name of the PDF when it wasn't picked on this screen (a PDF already in the space)
  const [sourceName, setSourceName] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [generated, setGenerated] = useState<GenerateResponse | null>(null);
  const [generatingCount, setGeneratingCount] = useState(0);
  const [error, setError] = useState<ScreenError | null>(null);

  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Space name for the header, and the subjects of a PDF already in the space
  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    (async () => {
      try {
        const { space } = await apiJson<{ space: SpaceDetail }>(`/spaces/${spaceId}`);
        if (cancelled) return;
        setSpaceName(space.name);
        if (!uploadId) return;
        const upload = space.uploads.find((u) => u.id === uploadId);
        if (!upload || !upload.canGenerate) {
          setPhase("idle");
          setError({
            message: "This PDF is no longer available. Upload it again to pick more subjects.",
            retry: null,
          });
          return;
        }
        setSourceName(upload.fileName ?? "Syllabus PDF");
        setAnalysis({
          uploadId: upload.id,
          expiresAt: null,
          pageCount: upload.pageCount,
          fromCache: true,
          documentType: null,
          examOrBoard: upload.examOrBoard,
          language: null,
          subjects: upload.subjects,
        });
        animate();
        setPhase("picking");
      } catch (err) {
        console.error("Error loading space:", err);
        if (!cancelled && uploadId) {
          setPhase("idle");
          setError({ message: errorMessage(err, "Couldn't load this PDF."), retry: null });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spaceId, uploadId]);

  /* ---------------- flow: pick -> analyze -> choose subjects -> generate ---------------- */

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      if (asset.size && asset.size > MAX_SIZE) {
        Alert.alert("File too large", "Please choose a PDF smaller than 4.5 MB.");
        return;
      }
      setFileInfo(asset);
      setSourceName(null);
      analyze(asset);
    } catch (e) {
      console.error("Error picking document:", e);
      Alert.alert("Error", "An error occurred while picking the document.");
    }
  };

  const analyze = async (file: DocumentPicker.DocumentPickerAsset) => {
    animate();
    setPhase("analyzing");
    setError(null);
    setAnalysis(null);
    setGenerated(null);
    setSelected([]);
    resetCustom();

    try {
      const data = await uploadPdf<AnalyzeResponse>("/syllabus/analyze", file, {
        spaceId: spaceId!,
      });
      setAnalysis(data);
      // Nothing to choose from: generate the only subject straight away
      if (data.subjects.length === 1 && !data.subjects[0].roadmapId) {
        setSelected([0]);
        await generate(data, { subjectIndexes: [0] }, file);
      } else {
        animate();
        setPhase("picking");
      }
    } catch (err) {
      console.error("Error analyzing syllabus:", err);
      animate();
      setPhase("idle");
      setError({
        message: errorMessage(
          err,
          "Something went wrong while reading your syllabus. Please try again.",
        ),
        retry: () => analyze(file),
      });
    }
  };

  const generate = async (
    upload: AnalyzeResponse,
    body: GenerateBody,
    // Absent when picking from a PDF already in the space
    file: DocumentPicker.DocumentPickerAsset | null,
  ) => {
    animate();
    setGeneratingCount("subjectIndexes" in body ? body.subjectIndexes.length : 1);
    setPhase("generating");
    setError(null);

    try {
      const data = await apiJson<GenerateResponse>(
        `/syllabus/${upload.uploadId}/roadmaps`,
        { method: "POST", body },
      );
      animate();
      setGenerated(data);
      // Subjects just created are shown as added when picking more from this PDF
      const created = new Map(
        data.results.flatMap((r) =>
          r.status === "SUCCEEDED" && r.index !== null ? [[r.index, r.roadmap.id]] : [],
        ),
      );
      setAnalysis((prev) =>
        prev && {
          ...prev,
          subjects: prev.subjects.map((s) =>
            created.has(s.index) ? { ...s, roadmapId: created.get(s.index) } : s,
          ),
        },
      );
      setPhase("done");
    } catch (err) {
      console.error("Error generating roadmaps:", err);
      animate();
      // The uploaded PDF expired on the server: upload again (its analysis is cached, so it's quick)
      if (err instanceof ApiError && err.status === 410) {
        setAnalysis(null);
        setPhase("idle");
        setError({
          message: err.message,
          retry: file ? () => analyze(file) : pickDocument,
          retryLabel: "Upload again",
        });
        return;
      }
      setPhase("picking");
      setError({
        message: errorMessage(
          err,
          "Something went wrong while creating your roadmaps. Please try again.",
        ),
        retry: () => generate(upload, body, file),
      });
    }
  };

  const generateSelected = () => {
    if (!analysis || selected.length === 0) return;
    const subjectIndexes = [...selected].sort((a, b) => a - b);
    generate(analysis, { subjectIndexes }, fileInfo);
  };

  const generateCustom = () => {
    if (!analysis) return;
    const name = customName.trim();
    if (!name) {
      Alert.alert("Subject name needed", "Type the name of the subject you want.");
      return;
    }
    const startPage = toPage(customStart);
    const endPage = toPage(customEnd);
    generate(
      analysis,
      {
        custom: {
          name,
          ...(startPage !== undefined && { startPage }),
          ...(endPage !== undefined && { endPage }),
        },
      },
      fileInfo,
    );
  };

  const toggleSubject = (index: number) => {
    // Subjects that already have a roadmap in this space can't be picked again
    if (analysis?.subjects[index]?.roadmapId) return;
    setSelected((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index);
      if (prev.length >= MAX_SUBJECTS) {
        Alert.alert(
          "Too many subjects",
          `You can create up to ${MAX_SUBJECTS} roadmaps at a time.`,
        );
        return prev;
      }
      return [...prev, index];
    });
  };

  // After generating, go back to the list to create more roadmaps from the same PDF
  const pickMore = () => {
    animate();
    setGenerated(null);
    setSelected([]);
    resetCustom();
    setPhase("picking");
  };

  const resetCustom = () => {
    setShowCustom(false);
    setCustomName("");
    setCustomStart("");
    setCustomEnd("");
  };

  const reset = () => {
    animate();
    setPhase("idle");
    setFileInfo(null);
    setSourceName(null);
    setAnalysis(null);
    setSelected([]);
    setGenerated(null);
    setError(null);
    resetCustom();
  };

  const openRoadmap = (id: string) =>
    router.push({ pathname: "/(tabs)/(createroadmap)/[id]", params: { id } });

  /* ---------------- derived ---------------- */

  // Subjects grouped by their group ("Semester 3", "Paper I", ...), in document order
  const subjectGroups = useMemo(() => {
    const groups = new Map<string, AnalyzeSubject[]>();
    for (const subject of analysis?.subjects ?? []) {
      const key = subject.group ?? "";
      groups.set(key, [...(groups.get(key) ?? []), subject]);
    }
    return [...groups.entries()];
  }, [analysis]);

  const busy = phase === "analyzing" || phase === "generating";
  const succeeded = generated?.results.filter((r) => r.status === "SUCCEEDED") ?? [];
  const failed = generated?.results.filter((r) => r.status === "FAILED") ?? [];

  /* ---------------- UI ---------------- */

  const errorBox = error && !busy && (
    <View style={styles.errorBox}>
      <View style={styles.errorTop}>
        <Feather name="alert-circle" size={18} color={DANGER} />
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
      {error.retry && (
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={error.retry}
          activeOpacity={0.85}
        >
          <Feather name="refresh-cw" size={14} color="#fff" />
          <Text style={styles.retryText}>{error.retryLabel ?? "Try again"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Opened without a space (e.g. an old link): pick or create one first
  if (!spaceId) {
    return <Redirect href="/(tabs)/(createroadmap)" />;
  }

  const backToSpace = () => {
    if (router.canGoBack()) router.back();
    else
      router.replace({
        pathname: "/(tabs)/(createroadmap)/space/[spaceId]",
        params: { spaceId },
      });
  };

  const pdfName = fileInfo?.name ?? sourceName;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.headerWrap}>
          <ScreenHeader
            title="Add roadmap"
            subtitle={spaceName ? `In ${spaceName}` : undefined}
            fallback={{
              pathname: "/(tabs)/(createroadmap)/space/[spaceId]",
              params: { spaceId },
            }}
          />
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Upload / progress card */}
          {(phase === "idle" || busy) && (
            <View style={styles.uploadCard}>
              {busy ? (
                <View style={styles.stateBox}>
                  <ActivityIndicator color={GREEN} size="large" />
                  <Text style={styles.stateTitle}>
                    {phase === "generating"
                      ? `Creating ${plural(generatingCount, "roadmap")}…`
                      : fileInfo
                        ? "Reading your syllabus…"
                        : "Loading subjects…"}
                  </Text>
                  <Text style={styles.stateText}>
                    {phase === "generating"
                      ? "Breaking each subject into units and topics. This can take a minute or two, so please keep the app open."
                      : fileInfo
                        ? "Finding the subjects in your PDF. This can take up to a minute, so please keep the app open."
                        : "Getting the subjects of this PDF."}
                  </Text>
                  {pdfName && (
                    <View style={styles.filePill}>
                      <Feather name="file-text" size={14} color={GREEN} />
                      <Text style={styles.filePillText} numberOfLines={1}>
                        {pdfName}
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
                  <Text style={styles.dropText}>
                    PDF only · up to 4.5 MB · {MAX_PAGES} pages
                  </Text>
                </TouchableOpacity>
              )}

              {fileInfo && !busy && (
                <FileRow file={fileInfo} onClear={reset} />
              )}

              {errorBox}
            </View>
          )}

          {/* Tips (only before a file is chosen) */}
          {phase === "idle" && !fileInfo && (
            <View style={styles.tips}>
              <Tip icon="check-circle" text="Works best with PDFs where you can select the text." />
              <Tip icon="layers" text="Got the whole syllabus in one PDF? Pick only the subjects you're studying now. You can add more later without uploading again." />
              <Tip icon="edit-3" text="You can tick off and delete items after it's created." />
            </View>
          )}

          {/* Choose subjects */}
          {phase === "picking" && analysis && (
            <View>
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>
                  {analysis.examOrBoard ?? pdfName?.replace(/\.pdf$/i, "") ?? "Your syllabus"}
                </Text>
                <Text style={styles.resultMeta}>
                  {plural(analysis.subjects.length, "subject")} found ·{" "}
                  {plural(analysis.pageCount, "page")}
                </Text>
                {fileInfo ? (
                  <FileRow file={fileInfo} onClear={reset} />
                ) : (
                  <TouchableOpacity onPress={reset} hitSlop={8} style={styles.otherPdf}>
                    <Text style={styles.linkText}>Upload a different PDF instead</Text>
                  </TouchableOpacity>
                )}
              </View>

              {errorBox}

              <View style={styles.pickHeader}>
                <Text style={styles.sectionLabel}>CHOOSE SUBJECTS</Text>
                {selected.length > 0 && (
                  <TouchableOpacity onPress={() => setSelected([])} hitSlop={8}>
                    <Text style={styles.linkText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.pickHint}>
                Pick only what you're studying; each subject becomes its own roadmap (up to{" "}
                {MAX_SUBJECTS} at a time). Subjects marked Added are already in this space.
              </Text>

              {subjectGroups.map(([group, subjects]) => (
                <View key={group || "__none"} style={styles.subjectGroup}>
                  {(group || subjectGroups.length > 1) && (
                    <Text style={styles.groupTitle}>{group || "Other subjects"}</Text>
                  )}
                  {subjects.map((subject) => (
                    <SubjectRow
                      key={subject.index}
                      subject={subject}
                      checked={selected.includes(subject.index)}
                      onPress={() => toggleSubject(subject.index)}
                    />
                  ))}
                </View>
              ))}

              <TouchableOpacity
                style={[styles.primaryBtn, selected.length === 0 && styles.btnDisabled]}
                onPress={generateSelected}
                disabled={selected.length === 0}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>
                  {selected.length === 0
                    ? "Select subjects"
                    : `Create ${plural(selected.length, "roadmap")}`}
                </Text>
                {selected.length > 0 && (
                  <Feather name="arrow-right" size={18} color="#fff" />
                )}
              </TouchableOpacity>

              {/* Custom subject */}
              <View style={styles.customCard}>
                <TouchableOpacity
                  style={styles.customToggle}
                  onPress={() => {
                    animate();
                    setShowCustom((v) => !v);
                  }}
                  activeOpacity={0.8}
                >
                  <Feather name="search" size={16} color={GREEN_DARK} />
                  <Text style={styles.customToggleText}>Can't find your subject?</Text>
                  <Feather
                    name={showCustom ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={MUTED}
                  />
                </TouchableOpacity>

                {showCustom && (
                  <View style={styles.customForm}>
                    <Text style={styles.inputLabel}>Subject name</Text>
                    <TextInput
                      style={styles.input}
                      value={customName}
                      onChangeText={setCustomName}
                      placeholder="e.g. Engineering Mathematics III"
                      placeholderTextColor="#A3B1AA"
                      maxLength={200}
                      returnKeyType="next"
                    />
                    <Text style={styles.inputLabel}>
                      Pages (optional, helps find it faster)
                    </Text>
                    <View style={styles.pageRow}>
                      <TextInput
                        style={[styles.input, styles.pageInput]}
                        value={customStart}
                        onChangeText={setCustomStart}
                        placeholder="From"
                        placeholderTextColor="#A3B1AA"
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                      <Text style={styles.pageDash}>–</Text>
                      <TextInput
                        style={[styles.input, styles.pageInput]}
                        value={customEnd}
                        onChangeText={setCustomEnd}
                        placeholder="To"
                        placeholderTextColor="#A3B1AA"
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.secondaryFilledBtn, !customName.trim() && styles.btnDisabled]}
                      onPress={generateCustom}
                      disabled={!customName.trim()}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.secondaryFilledText}>Create this roadmap</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Results */}
          {phase === "done" && generated && (
            <View>
              <View style={styles.successBanner}>
                <Feather name="check-circle" size={18} color={GREEN} />
                <Text style={styles.successText}>
                  {failed.length === 0
                    ? succeeded.length === 1
                      ? "Your roadmap is ready"
                      : `${succeeded.length} roadmaps are ready`
                    : `${succeeded.length} of ${generated.results.length} roadmaps are ready`}
                </Text>
              </View>

              {succeeded.map((result) => (
                <SucceededCard
                  key={result.roadmap.id}
                  result={result}
                  onOpen={() => openRoadmap(result.roadmap.id)}
                />
              ))}

              {failed.map((result) => (
                <View key={`failed-${result.index ?? result.name}`} style={styles.failedCard}>
                  <Feather name="alert-circle" size={18} color={DANGER} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.failedTitle}>{result.name}</Text>
                    <Text style={styles.failedText}>{result.error}</Text>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 8 }]}
                onPress={backToSpace}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText} numberOfLines={1}>
                  {spaceName ? `Back to ${spaceName}` : "Back to space"}
                </Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </TouchableOpacity>

              {analysis && analysis.subjects.some((s) => !s.roadmapId) && (
                <TouchableOpacity style={styles.secondaryBtn} onPress={pickMore} activeOpacity={0.7}>
                  <Text style={styles.secondaryBtnText}>Pick more subjects from this PDF</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.secondaryBtn} onPress={reset} activeOpacity={0.7}>
                <Text style={styles.secondaryBtnText}>Upload another syllabus</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------------- small components ---------------- */

function FileRow({
  file,
  onClear,
}: {
  file: DocumentPicker.DocumentPickerAsset;
  onClear: () => void;
}) {
  return (
    <View style={styles.fileRow}>
      <View style={styles.fileIcon}>
        <Feather name="file-text" size={18} color={GREEN} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.fileName} numberOfLines={1}>
          {file.name}
        </Text>
        <Text style={styles.fileSize}>{formatSize(file.size)}</Text>
      </View>
      <TouchableOpacity onPress={onClear} hitSlop={10}>
        <Feather name="x" size={20} color={MUTED} />
      </TouchableOpacity>
    </View>
  );
}

function SubjectRow({
  subject,
  checked,
  onPress,
}: {
  subject: AnalyzeSubject;
  checked: boolean;
  onPress: () => void;
}) {
  // Already has a roadmap in this space: shown, but can't be picked again
  const added = Boolean(subject.roadmapId);
  return (
    <TouchableOpacity
      style={[
        styles.subjectRow,
        checked && styles.subjectRowOn,
        added && styles.subjectRowAdded,
      ]}
      onPress={onPress}
      disabled={added}
      activeOpacity={0.8}
      accessibilityState={{ checked: checked || added, disabled: added }}
    >
      <View
        style={[
          styles.checkbox,
          checked && styles.checkboxOn,
          added && styles.checkboxAdded,
        ]}
      >
        {(checked || added) && <Feather name="check" size={14} color="#fff" />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.subjectName, added && styles.subjectNameAdded]}>
          {subject.name}
        </Text>
        <Text style={styles.subjectMeta}>{pageRange(subject)}</Text>
      </View>
      {added && (
        <View style={styles.addedBadge}>
          <Text style={styles.addedBadgeText}>Added</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function SucceededCard({
  result,
  onOpen,
}: {
  result: Extract<GenerateResult, { status: "SUCCEEDED" }>;
  onOpen: () => void;
}) {
  const units = result.roadmap.units;
  const topicCount = units.reduce((n, u) => n + u.topics.length, 0);
  const subTopicCount = units.reduce(
    (n, u) => n + u.topics.reduce((m, t) => m + t.subTopics.length, 0),
    0,
  );

  return (
    <TouchableOpacity style={styles.resultCard} onPress={onOpen} activeOpacity={0.85}>
      <View style={styles.resultTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.resultTitle}>{result.roadmap.name}</Text>
          {result.group && <Text style={styles.resultMeta}>{result.group}</Text>}
        </View>
        <Feather name="arrow-right" size={20} color={GREEN} />
      </View>

      <View style={styles.statsRow}>
        <Stat value={units.length} label="Units" />
        <View style={styles.statDivider} />
        <Stat value={topicCount} label="Topics" />
        <View style={styles.statDivider} />
        <Stat value={subTopicCount} label="Subtopics" />
      </View>

      {result.warnings.map((warning) => (
        <View key={warning} style={styles.warningRow}>
          <Feather name="info" size={13} color="#9A6B00" />
          <Text style={styles.warningText}>{warning}</Text>
        </View>
      ))}
    </TouchableOpacity>
  );
}

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
  safeArea: { flex: 1, backgroundColor: colors.bg },
  headerWrap: { paddingHorizontal: 20 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 48 },

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

  /* choose subjects */
  pickHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
  },
  pickHint: { fontSize: 13, color: MUTED, marginTop: 4, marginBottom: 12 },
  linkText: { fontSize: 13, fontWeight: "600", color: GREEN },
  subjectGroup: { marginBottom: 14, gap: 8 },
  groupTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: GREEN_DARK,
    marginBottom: 2,
  },
  subjectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FFFFFF",
  },
  subjectRowOn: { borderColor: GREEN, backgroundColor: "#F5FBF8" },
  subjectRowAdded: { backgroundColor: colors.bg, borderColor: colors.divider },
  subjectNameAdded: { color: MUTED },
  checkboxAdded: { backgroundColor: "#A9D9C5", borderColor: "#A9D9C5" },
  addedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: GREEN_TINT,
  },
  addedBadgeText: { fontSize: 12, fontWeight: "700", color: GREEN_DARK },
  otherPdf: { marginTop: 12, alignSelf: "flex-start" },
  subjectName: { fontSize: 15, fontWeight: "600", color: "#17201C" },
  subjectMeta: { marginTop: 2, fontSize: 12, color: MUTED },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxOn: { backgroundColor: GREEN },
  btnDisabled: { opacity: 0.45 },

  customCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  customToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: "#F7FBF9",
  },
  customToggleText: { flex: 1, fontSize: 14, fontWeight: "600", color: GREEN_DARK },
  customForm: { padding: 14, gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: MUTED, marginTop: 4 },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#17201C",
    backgroundColor: "#FFFFFF",
  },
  pageRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pageInput: { flex: 1 },
  pageDash: { fontSize: 16, color: MUTED },
  secondaryFilledBtn: {
    marginTop: 10,
    height: 46,
    borderRadius: 12,
    backgroundColor: GREEN_TINT,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryFilledText: { fontSize: 15, fontWeight: "700", color: GREEN_DARK },

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
    marginBottom: 12,
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
  resultTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  resultTitle: { fontSize: 20, fontWeight: "800", color: GREEN_DARK },
  resultMeta: { marginTop: 4, fontSize: 13, color: MUTED },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F5FBF8",
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800", color: GREEN },
  statLabel: { marginTop: 2, fontSize: 12, color: MUTED },
  statDivider: { width: 1, height: 28, backgroundColor: BORDER },
  warningRow: { flexDirection: "row", gap: 6, marginTop: 10, alignItems: "flex-start" },
  warningText: { flex: 1, fontSize: 12, lineHeight: 17, color: "#9A6B00" },

  failedCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    padding: 14,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FAD4D4",
  },
  failedTitle: { fontSize: 15, fontWeight: "700", color: "#7A1F1F" },
  failedText: { marginTop: 2, fontSize: 13, lineHeight: 18, color: "#B42318" },

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
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: MUTED,
  },
});
