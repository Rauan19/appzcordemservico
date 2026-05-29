import { Alert, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Logo } from "@/components/brand/Logo";
import { brandName } from "@/src/constants/brand";
import { Screen } from "@/components/ui/Screen";
import { Card, CardDivider } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/src/contexts/AuthContext";
import type { UserRole } from "@/src/types/api";
import { colors, tablet } from "@/src/constants/theme";

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  STOCK: "Estoque",
  TECHNICIAN: "Técnico de campo",
};

const roleIcons: Record<UserRole, ComponentProps<typeof Ionicons>["name"]> = {
  ADMIN: "shield-checkmark-outline",
  MANAGER: "briefcase-outline",
  STOCK: "cube-outline",
  TECHNICIAN: "construct-outline",
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  function handleLogout() {
    Alert.alert("Sair da conta", "Deseja encerrar sua sessão neste dispositivo?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => signOut() },
    ]);
  }

  const initials = user?.name
    ?.split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const role = user?.role ?? "TECHNICIAN";
  const roleLabel = roleLabels[role] ?? role;
  const isActive = user?.active !== false;

  return (
    <Screen scroll padded={false}>
      <View style={styles.hero}>
        <View style={styles.heroDecor} />
        <View style={styles.heroDecor2} />
      </View>

      <View style={styles.profileHead}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials ?? "?"}</Text>
          </View>
          {isActive && (
            <View style={styles.statusDot}>
              <View style={styles.statusInner} />
            </View>
          )}
        </View>
        <Text style={styles.name}>{user?.name ?? ""}</Text>
        <Text style={styles.email}>{user?.email ?? ""}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name={roleIcons[role]} size={18} color={colors.primary} />
          <Text style={styles.roleText}>{roleLabel}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Card variant="elevated" title="Minha conta" showChevron={false}>
          <InfoRow icon="person-outline" label="Nome completo" value={user?.name ?? ""} />
          <CardDivider />
          <InfoRow icon="mail-outline" label="E-mail" value={user?.email ?? ""} />
          <CardDivider />
          <InfoRow icon="id-card-outline" label="Perfil de acesso" value={roleLabel} />
          <CardDivider />
          <InfoRow
            icon="checkmark-circle-outline"
            label="Status da conta"
            value={isActive ? "Ativa" : "Inativa"}
          />
        </Card>

        <Card variant="muted" showChevron={false} style={styles.appCard}>
          <View style={styles.appRow}>
            <Logo size="sm" />
            <View style={styles.appInfo}>
              <Text style={styles.appName}>{brandName}</Text>
              <Text style={styles.appDesc}>Gestão de ordens de serviço e estoque</Text>
            </View>
          </View>
        </Card>

        <Button
          title="Sair da conta"
          variant="danger"
          onPress={handleLogout}
          style={styles.logoutBtn}
        />
        <Text style={styles.footerHint}>Sua sessão será encerrada neste tablet.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 120,
    backgroundColor: colors.headerBg,
    overflow: "hidden",
  },
  heroDecor: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(43, 140, 255, 0.2)",
    top: -50,
    right: -30,
  },
  heroDecor2: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(30, 91, 184, 0.35)",
    bottom: -20,
    left: 20,
  },
  profileHead: {
    alignItems: "center",
    marginTop: -52,
    paddingHorizontal: tablet.padding,
    marginBottom: 8,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 52,
    backgroundColor: colors.surface,
    ...{
      shadowColor: colors.primaryDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1,
  },
  statusDot: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  statusInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
  },
  name: {
    fontSize: tablet.fontTitle,
    fontWeight: "800",
    color: colors.text,
    marginTop: 14,
    textAlign: "center",
  },
  email: {
    fontSize: tablet.fontBody,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: "center",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: colors.accentLight,
    borderWidth: 1,
    borderColor: "#C7D9F5",
  },
  roleText: {
    fontSize: tablet.fontSmall,
    fontWeight: "700",
    color: colors.primary,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { flex: 1 },
  infoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: tablet.fontBody,
    fontWeight: "600",
    color: colors.text,
    marginTop: 2,
  },
  appCard: { marginTop: 4 },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  appInfo: { flex: 1 },
  appName: {
    fontSize: tablet.fontSubtitle,
    fontWeight: "800",
    color: colors.primary,
  },
  appDesc: {
    fontSize: tablet.fontSmall,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 20,
  },
  logoutBtn: { marginTop: 20 },
  footerHint: {
    textAlign: "center",
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 12,
  },
});
