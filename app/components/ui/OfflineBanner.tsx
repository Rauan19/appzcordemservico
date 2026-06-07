import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/src/constants/theme";
import { formatDateTime } from "@/src/utils/dates";

type Props = {
  syncedAt?: string;
  readOnly?: boolean;
};

export function OfflineBanner({ syncedAt, readOnly = true }: Props) {
  const when = syncedAt ? formatDateTime(syncedAt) : "última sincronização";

  return (
    <View style={styles.wrap}>
      <Ionicons name="cloud-offline-outline" size={18} color={colors.warning} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>Modo offline</Text>
        <Text style={styles.message}>
          Exibindo dados salvos em {when}.
          {readOnly ? " Alterações exigem internet." : ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFEDD5",
    borderWidth: 1,
    borderColor: "#FDBA74",
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.warning,
  },
  message: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: "#9A3412",
    fontWeight: "600",
  },
});
