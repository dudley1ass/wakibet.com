import { useQuery } from "@tanstack/react-query";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SCORING_RULES } from "@wakibet/shared";
import { useAppStore } from "../state/appStore";

async function fetchHealth(): Promise<{ ok: boolean; database: string }> {
  const base = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:3000";
  const res = await fetch(`${base}/api/v1/health`);
  if (!res.ok) {
    throw new Error(`Health check failed (${res.status})`);
  }
  return res.json() as Promise<{ ok: boolean; database: string }>;
}

export function HomeScreen() {
  const ping = useAppStore((s) => s.lastPing);
  const setPing = useAppStore((s) => s.setLastPing);

  const health = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    retry: 1,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WakiBet</Text>
      <Text style={styles.sub}>Option A — Phase 1 shell</Text>
      <Text style={styles.line}>Shared scoring version: {SCORING_RULES.version}</Text>
      <Text style={styles.line}>Store ping: {ping}</Text>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => setPing(Date.now())}
        accessibilityRole="button"
      >
        <Text style={styles.buttonLabel}>Ping local store</Text>
      </Pressable>
      <Text style={styles.line}>
        API:{" "}
        {health.isPending
          ? "checking…"
          : health.isError
            ? "offline or unreachable"
            : health.data?.database === "up"
              ? "connected"
              : "reachable, DB down"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  sub: {
    fontSize: 16,
    opacity: 0.75,
    marginBottom: 12,
  },
  line: {
    fontSize: 15,
  },
  button: {
    marginVertical: 8,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonLabel: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "600",
  },
});
