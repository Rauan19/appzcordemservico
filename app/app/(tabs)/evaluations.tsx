import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { CustomerRatingModal } from "@/components/order/CustomerRatingModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { api } from "@/src/services/api-service";
import { showErrorAlert } from "@/src/lib/errors";
import type { CustomerRating, RateableOrder } from "@/src/types/api";
import { colors, tablet } from "@/src/constants/theme";

export default function EvaluationsScreen() {
  const { orderId: presetOrderId } = useLocalSearchParams<{ orderId?: string }>();
  const [ratings, setRatings] = useState<CustomerRating[]>([]);
  const [rateableOrders, setRateableOrders] = useState<RateableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const average =
    ratings.length === 0
      ? null
      : (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mine, orders] = await Promise.all([
        api.myCustomerRatings(),
        api.rateableOrdersForRating(),
      ]);
      setRatings(mine);
      setRateableOrders(orders);
    } catch (err) {
      setRatings([]);
      setRateableOrders([]);
      showErrorAlert(err, "loadEvaluations");
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
          "Não há ordens em execução ou finalizadas pendentes de avaliação.",
        );
        return;
      }
      setModalOpen(true);
    } catch (err) {
      showErrorAlert(err, "loadEvaluations");
    }
  }

  async function handleSave(data: {
    serviceOrderId: string;
    rating: number;
    comment: string;
  }) {
    setSaving(true);
    try {
      await api.createCustomerRating({
        serviceOrderId: data.serviceOrderId,
        rating: data.rating,
        comment: data.comment || undefined,
      });
      setModalOpen(false);
      Alert.alert("Avaliação registrada", "A nota do cliente foi salva com sucesso.");
      load();
    } catch (err) {
      showErrorAlert(err, "saveEvaluation");
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

      <CustomerRatingModal
        visible={modalOpen}
        saving={saving}
        onClose={() => !saving && setModalOpen(false)}
        onSave={handleSave}
        rateableOrders={rateableOrders}
        initialOrderId={presetOrderId}
      />
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
});
