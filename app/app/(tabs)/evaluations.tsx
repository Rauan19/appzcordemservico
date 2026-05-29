import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Rating010Picker } from "@/components/Rating010Picker";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { api } from "@/src/services/api-service";
import type { CustomerRating, RateableOrder } from "@/src/types/api";
import { colors, tablet } from "@/src/constants/theme";

export default function EvaluationsScreen() {
  const { orderId: presetOrderId } = useLocalSearchParams<{ orderId?: string }>();
  const [ratings, setRatings] = useState<CustomerRating[]>([]);
  const [rateableOrders, setRateableOrders] = useState<RateableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serviceOrderId, setServiceOrderId] = useState("");
  const [rating, setRating] = useState(10);
  const [comment, setComment] = useState("");

  const selectedOrder = useMemo(
    () => rateableOrders.find((o) => o.id === serviceOrderId),
    [rateableOrders, serviceOrderId],
  );

  const average = useMemo(() => {
    if (ratings.length === 0) return null;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / ratings.length).toFixed(1);
  }, [ratings]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mine, orders] = await Promise.all([
        api.myCustomerRatings(),
        api.rateableOrdersForRating(),
      ]);
      setRatings(mine);
      setRateableOrders(orders);
    } catch {
      setRatings([]);
      setRateableOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function openModal() {
    try {
      const orders = await api.rateableOrdersForRating();
      setRateableOrders(orders);
      if (orders.length === 0) {
        Alert.alert(
          "Sem OS disponíveis",
          "Não há ordens em execução ou finalizadas pendentes de avaliação do cliente.",
        );
        return;
      }
      const preset = presetOrderId && orders.some((o) => o.id === presetOrderId)
        ? presetOrderId
        : orders[0].id;
      setServiceOrderId(preset);
      setRating(10);
      setComment("");
      setModalOpen(true);
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível carregar as OS");
    }
  }

  useEffect(() => {
    if (presetOrderId && rateableOrders.some((o) => o.id === presetOrderId)) {
      setServiceOrderId(presetOrderId);
    }
  }, [presetOrderId, rateableOrders]);

  async function handleSave() {
    if (!serviceOrderId) {
      Alert.alert("Atenção", "Selecione uma OS.");
      return;
    }
    setSaving(true);
    try {
      await api.createCustomerRating({
        serviceOrderId,
        rating,
        comment: comment.trim() || undefined,
      });
      setModalOpen(false);
      Alert.alert("Salvo", "Avaliação do cliente registrada com sucesso.");
      load();
    } catch (e) {
      Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Suas avaliações</Text>
          <Text style={styles.summaryValue}>{ratings.length}</Text>
          {average !== null ? (
            <Text style={styles.summaryHint}>Média {average}/10</Text>
          ) : null}
        </View>
        <Button title="+ Pedir avaliação" onPress={openModal} />
      </View>

      <Text style={styles.hint}>
        Pergunte ao cliente uma nota de 0 a 10 após o atendimento e registre aqui.
      </Text>

      {loading && ratings.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={ratings}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={[styles.list, ratings.length === 0 && styles.emptyList]}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhuma avaliação registrada ainda.</Text>
          }
          renderItem={({ item }) => (
            <Card variant="accent" style={styles.card}>
              <View style={styles.cardRow}>
                <Text style={styles.code}>{item.serviceOrder?.code}</Text>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{item.rating}/10</Text>
                </View>
              </View>
              <Text style={styles.title}>{item.serviceOrder?.title}</Text>
              <Text style={styles.meta}>
                {item.serviceOrder?.customer?.fullName ?? "Cliente"}
              </Text>
              {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString("pt-BR")}
              </Text>
            </Card>
          )}
        />
      )}

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalPanel}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Avaliação do cliente</Text>
              <Pressable onPress={() => !saving && setModalOpen(false)} hitSlop={12}>
                <Ionicons name="close" size={28} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.modalHint}>
                Mostre ao cliente a escala de 0 a 10 e registre a nota que ele informar.
              </Text>

              <Text style={styles.fieldLabel}>Ordem de serviço</Text>
              {rateableOrders.map((o) => {
                const active = serviceOrderId === o.id;
                return (
                  <Pressable
                    key={o.id}
                    onPress={() => setServiceOrderId(o.id)}
                    style={[styles.orderOption, active && styles.orderOptionActive]}
                  >
                    <Text style={[styles.orderCode, active && styles.orderCodeActive]}>
                      {o.code}
                    </Text>
                    <Text style={styles.orderMeta} numberOfLines={1}>
                      {o.customer?.fullName} · {o.title}
                    </Text>
                  </Pressable>
                );
              })}

              {selectedOrder?.customer?.phone ? (
                <Text style={styles.phoneHint}>
                  Cliente: {selectedOrder.customer.fullName} ({selectedOrder.customer.phone})
                </Text>
              ) : null}

              <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Nota (0 a 10)</Text>
              <Rating010Picker value={rating} onChange={setRating} />

              <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Comentário (opcional)</Text>
              <TextInput
                style={styles.input}
                value={comment}
                onChangeText={setComment}
                placeholder="O que o cliente disse sobre o atendimento?"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancelar"
                variant="secondary"
                onPress={() => setModalOpen(false)}
                disabled={saving}
                style={styles.modalBtn}
              />
              <Button
                title={saving ? "Salvando..." : "Registrar"}
                onPress={handleSave}
                disabled={saving}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tablet.padding,
    paddingTop: 8,
    gap: 12,
  },
  summary: { flex: 1 },
  summaryLabel: { fontSize: tablet.fontSmall, color: colors.textMuted, fontWeight: "600" },
  summaryValue: { fontSize: 28, fontWeight: "800", color: colors.primary },
  summaryHint: { fontSize: tablet.fontSmall, color: colors.success, fontWeight: "600" },
  hint: {
    paddingHorizontal: tablet.padding,
    paddingBottom: 8,
    fontSize: tablet.fontSmall,
    color: colors.textMuted,
    lineHeight: 20,
  },
  loader: { marginTop: 40 },
  list: { padding: tablet.padding, paddingTop: 4, gap: 12 },
  emptyList: { flexGrow: 1, justifyContent: "center" },
  empty: { textAlign: "center", color: colors.textMuted, fontSize: tablet.fontBody },
  card: { gap: 6 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  code: { fontWeight: "800", color: colors.primary, fontSize: tablet.fontBody },
  scoreBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  scoreText: { fontWeight: "800", color: colors.primary, fontSize: tablet.fontSmall },
  title: { fontSize: tablet.fontBody, fontWeight: "600", color: colors.text },
  meta: { fontSize: tablet.fontSmall, color: colors.textMuted },
  comment: { fontSize: tablet.fontSmall, color: colors.text, marginTop: 4 },
  date: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(7,31,77,0.45)",
    justifyContent: "flex-end",
  },
  modalPanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: tablet.radiusLg,
    borderTopRightRadius: tablet.radiusLg,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tablet.padding,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: tablet.fontSubtitle, fontWeight: "800", color: colors.primary },
  modalBody: { padding: tablet.padding, gap: 8, paddingBottom: 24 },
  modalHint: { fontSize: tablet.fontSmall, color: colors.textMuted, lineHeight: 20, marginBottom: 8 },
  fieldLabel: { fontSize: tablet.fontSmall, fontWeight: "700", color: colors.text },
  fieldLabelSpaced: { marginTop: 12 },
  orderOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: tablet.radius,
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.background,
  },
  orderOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.accentLight,
  },
  orderCode: { fontWeight: "800", color: colors.text, fontSize: tablet.fontBody },
  orderCodeActive: { color: colors.primary },
  orderMeta: { fontSize: tablet.fontSmall, color: colors.textMuted, marginTop: 2 },
  phoneHint: { fontSize: tablet.fontSmall, color: colors.primary, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: tablet.radius,
    padding: 12,
    minHeight: 88,
    textAlignVertical: "top",
    fontSize: tablet.fontBody,
    color: colors.text,
    backgroundColor: colors.background,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
    padding: tablet.padding,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalBtn: { flex: 1 },
});
