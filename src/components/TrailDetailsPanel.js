import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  AppState,
} from "react-native";
import {
  isTrailDownloaded,
  getDownloadedTrail,
  downloadTrailMap,
  deleteTrailMap,
} from "../services/offlineMapService";
import { getTrailWeather } from "../services/weatherService";
import { colors } from "../styles/theme";

export default function TrailDetailsPanel({ trail, onClose, onStartHike }) {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const trailId = trail?.trailId || trail?.id;

  const refreshDownloadStatus = useCallback(async () => {
    if (!trailId) {
      setIsDownloaded(false);
      setDownloadInfo(null);
      return;
    }
    try {
      const downloaded = await isTrailDownloaded(trailId);
      const info = downloaded ? await getDownloadedTrail(trailId) : null;
      if (isMountedRef.current) {
        setIsDownloaded(downloaded);
        setDownloadInfo(info);
      }
    } catch (err) {
      console.warn("[TrailDetailsPanel] Error checking download status:", err);
    }
  }, [trailId]);

  useEffect(() => {
    refreshDownloadStatus();
  }, [refreshDownloadStatus]);

  const fetchWeather = useCallback(
    async (showLoading = false) => {
      const lat = trail?.start?.lat;
      const lon = trail?.start?.lon;

      if (lat == null || lon == null) {
        if (isMountedRef.current) {
          setWeather(null);
          setLoadingWeather(false);
        }
        return;
      }

      if (showLoading && isMountedRef.current) {
        setLoadingWeather(true);
      }

      try {
        const data = await getTrailWeather(lat, lon);
        if (isMountedRef.current) {
          setWeather(data);
          setLoadingWeather(false);
        }
      } catch {
        if (isMountedRef.current) {
          setWeather({ unavailable: true });
          setLoadingWeather(false);
        }
      }
    },
    [trail?.start?.lat, trail?.start?.lon]
  );

  // Initial fetch on mount or trail change
  useEffect(() => {
    fetchWeather(true);
  }, [fetchWeather]);

  // Re-check when app regains focus (e.g. after toggling Wi-Fi in settings or control center)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        fetchWeather(false);
      }
    });
    return () => {
      subscription.remove();
    };
  }, [fetchWeather]);

  // Live polling check every 5 seconds to instantly reflect network connection drops/restorations
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWeather(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  if (!trail) return null;

  const handleStartDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setProgress(0);

    try {
      const record = await downloadTrailMap(
        trail,
        (status) => {
          if (isMountedRef.current) {
            setProgress(status.percentage ?? 0);
          }
        },
        (error) => {
          console.error("[TrailDetailsPanel] Download error:", error);
        }
      );

      if (isMountedRef.current) {
        setIsDownloading(false);
        setIsDownloaded(true);
        setDownloadInfo(record);
      }

      Alert.alert(
        "Map Downloaded",
        `The map area for "${trail.name}" has been saved to your device. It will display automatically when offline.`,
        [{ text: "OK" }]
      );
    } catch (err) {
      if (isMountedRef.current) {
        setIsDownloading(false);
      }
      Alert.alert(
        "Download Failed",
        err?.message || "Could not download the offline map area. Please check your internet connection.",
        [{ text: "OK" }]
      );
    }
  };

  const handleOfflineMapPress = () => {
    if (isDownloading) return;

    if (isDownloaded) {
      Alert.alert(
        "Offline Map Options",
        `Map data for "${trail.name}" is saved on your device.`,
        [
          {
            text: "Update Map",
            onPress: () => handleStartDownload(),
          },
          {
            text: "Remove from Device",
            style: "destructive",
            onPress: handleRemoveOfflineMap,
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } else {
      handleStartDownload();
    }
  };

  const handleRemoveOfflineMap = async () => {
    try {
      await deleteTrailMap(trailId);
      if (isMountedRef.current) {
        setIsDownloaded(false);
        setDownloadInfo(null);
      }
      Alert.alert(
        "Map Removed",
        `Offline map data for "${trail.name}" has been removed from this device.`
      );
    } catch (err) {
      Alert.alert("Error", "Could not remove offline map data.");
    }
  };

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {trail.name}
            </Text>
            {isDownloaded && !isDownloading && (
              <View style={styles.offlineBadge}>
                <Text style={styles.offlineBadgeText}>✓ Offline</Text>
              </View>
            )}
          </View>
          <View style={styles.subtitleRow}>
            {trail.lengthKm ? (
              <Text style={styles.subtitle}>{trail.lengthKm} km</Text>
            ) : null}
            {loadingWeather ? (
              <View style={styles.weatherBadge}>
                <ActivityIndicator size="small" color="#64748b" style={{ transform: [{ scale: 0.65 }] }} />
                <Text style={styles.weatherLoadingText}>Weather...</Text>
              </View>
            ) : weather ? (
              <TouchableOpacity
                style={styles.weatherBadge}
                activeOpacity={0.7}
                onPress={() => fetchWeather(true)}
              >
                {weather.unavailable ? (
                  <Text style={styles.weatherUnavailableText}>Weather unavailable</Text>
                ) : (
                  <Text style={styles.weatherText}>
                    {weather.icon} {weather.temp}°C {weather.condition}
                  </Text>
                )}
              </TouchableOpacity>
            ) : null}
            {isDownloaded && downloadInfo?.downloadedAt && (
              <Text style={styles.downloadedDate}>
                • Saved {new Date(downloadInfo.downloadedAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity style={{ padding: 4 }} onPress={onClose} accessibilityLabel="Close panel">
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {isDownloading && (
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Downloading map area...</Text>
            <Text style={styles.progressPercent}>{progress}%</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${Math.max(5, progress)}%` }]} />
          </View>
        </View>
      )}

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btn, styles.primaryBtn]}
          onPress={onStartHike}
          disabled={isDownloading}
        >
          <Text style={[styles.btnText, { color: "#fff" }]}>Start Hike</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.btn,
            styles.secondaryBtn,
            isDownloading && styles.btnDisabled,
            isDownloaded && styles.secondaryBtnDownloaded,
          ]}
          onPress={handleOfflineMapPress}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <View style={styles.btnLoadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.btnText, { color: colors.primary, marginLeft: 6 }]}>
                {progress}%
              </Text>
            </View>
          ) : (
            <Text
              style={[
                styles.btnText,
                { color: isDownloaded ? colors.primary : "#334155" },
              ]}
            >
              {isDownloaded ? "Update Offline Map" : "Download Offline Map"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    flexShrink: 1,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    flexWrap: "wrap",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  weatherBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
  },
  weatherText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  weatherUnavailableText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748b",
  },
  weatherLoadingText: {
    fontSize: 11,
    color: "#64748b",
    marginLeft: 4,
  },
  downloadedDate: {
    fontSize: 12,
    color: "#166534",
    marginLeft: 6,
  },
  offlineBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  offlineBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  closeText: {
    fontSize: 18,
    color: "#64748b",
    fontWeight: "bold",
  },
  progressContainer: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    fontWeight: "600",
    fontSize: 14,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
  },
  secondaryBtn: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  secondaryBtnDownloaded: {
    backgroundColor: colors.primarySoft,
    borderColor: "#A7D0B8",
  },
});
