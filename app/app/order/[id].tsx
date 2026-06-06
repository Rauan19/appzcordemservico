import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { CustomerRatingModal } from "@/components/order/CustomerRatingModal";
import {
  MaterialPickerModal,
  type MaterialSelection,
} from "@/components/order/MaterialPickerModal";
import { DetailInfoRow, OrderDetailSection } from "@/components/order/OrderDetailSection";
import { OrderStatusTimeline } from "@/components/order/OrderStatusTimeline";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Screen } from "@/components/ui/Screen";
import { api } from "@/src/services/api-service";
import { showErrorAlert } from "@/src/lib/errors";
import type { Product, ServiceOrder, ServiceOrderStatus } from "@/src/types/api";
import {
  priorityColors,
  priorityLabels,
  statusBackgroundColors,
  statusBorderColors,
  statusColors,
  statusLabels,
} from "@/src/utils/status";
import { colors, shadows, tablet } from "@/src/constants/theme";
import { formatDate, formatDateTime } from "@/src/utils/dates";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockByProduct, setStockByProduct] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<"item" | "defect">("item");
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingSaving, setRatingSaving] = useState(false);
  const [reportDraft, setReportDraft] = useState("");
  const [reportSaving, setReportSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [o, p, balances] = await Promise.all([
        api.getOrder(id),
        api.listProducts(),
        api.stockBalance(),
      ]);
      setOrder(o);
      setReportDraft(o.technicianReport ?? "");
      setProducts(p.filter((x) => x.active));
      const map: Record<string, number> = {};
      for (const b of balances) map[b.productId] = b.balance;
      setStockByProduct(map);
    } catch (err) {
      showErrorAlert(err, "loadOrder");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function changeStatus(status: ServiceOrderStatus) {
    if (!order) return;
    setActionLoading(true);
    try {
      await api.updateOrderStatus(order.id, status);
      await load();
    } catch (err) {
      showErrorAlert(err, "updateOrderStatus");
    } finally {
      setActionLoading(false);
    }
  }

  function openPicker(mode: "item" | "defect") {
    setPickerMode(mode);
    setPickerVisible(true);
  }

  function openRatingModal() {
    setRatingModalVisible(true);
  }

  async function handleSaveRating(data: {
    serviceOrderId: string;
    rating: number;
    comment: string;
  }) {
    setRatingSaving(true);
    try {
      await api.createCustomerRating({
        serviceOrderId: data.serviceOrderId,
        rating: data.rating,
        comment: data.comment || undefined,
      });
      setRatingModalVisible(false);
      await load();
      Alert.alert("Avaliação registrada", "A nota do cliente foi salva nesta OS.");
    } catch (err) {
      showErrorAlert(err, "saveEvaluation");
    } finally {
      setRatingSaving(false);
    }
  }

  async function handleSaveReport() {
    if (!order) return;
    setReportSaving(true);
    try {
      await api.updateTechnicianReport(order.id, reportDraft);
      await load();
      Alert.alert("Relatório salvo", "O relatório do atendimento foi registrado nesta OS.");
    } catch (err) {
      showErrorAlert(err, "saveTechnicianReport");
    } finally {
      setReportSaving(false);
    }
  }

  async function confirmMaterials(items: MaterialSelection[], reason: string) {
    if (!order) return;
    if (items.length === 0) {
      Alert.alert("Nenhum produto", "Selecione ao menos um produto para continuar.");
      return;
    }
    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        Alert.alert("Quantidade inválida", "Informe uma quantidade maior que zero para todos os produtos.");
        return;
      }
    }
    if (pickerMode === "defect" && reason.trim().length < 3) {
      Alert.alert("Motivo obrigatório", "Descreva o motivo do defeito com pelo menos 3 caracteres.");
      return;
    }

    setActionLoading(true);
    try {
      if (pickerMode === "item") {
        await api.addOrderItemsBatch(order.id, {
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          reason: reason.trim() || "Uso na OS",
        });
      } else {
        for (const item of items) {
          await api.registerDefect(order.id, {
            productId: item.productId,
            quantity: item.quantity,
            reason: reason.trim(),
          });
        }
      }
      setPickerVisible(false);
      await load();
      Alert.alert(
        "Sucesso",
        pickerMode === "item"
          ? `${items.length} produto(s) lançado(s) na OS.`
          : `${items.length} defeito(s) registrado(s).`,
      );
    } catch (err) {
      showErrorAlert(err, "orderMaterials");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading || !order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const accent = statusColors[order.status];
  const priorityColor = priorityColors[order.priority] ?? colors.textMuted;
  const canWork = order.status !== "DONE" && order.status !== "CANCELED";
  const canEditReport = order.status !== "CANCELED";
  const reportChanged = reportDraft.trim() !== (order.technicianReport ?? "").trim();
  const canStart = order.status === "OPEN" || order.status === "ASSIGNED";
  const canFinish = order.status === "IN_PROGRESS";
  const assigneeNames =
    order.assignees?.map((a) => a.user.name).join(", ") ?? order.assignedTo?.name ?? "";
  const fullAddress = order.address
    ? [order.address.street, order.address.number, order.address.district, order.address.city, order.address.state]
        .filter(Boolean)
        .join(", ")
    : null;

  return (
    <>
      <Screen scroll padded={false}>
        <View
          style={[
            styles.hero,
            {
              backgroundColor: statusBackgroundColors[order.status],
              borderColor: statusBorderColors[order.status],
            },
          ]}
        >
          <View style={[styles.heroGlow, { backgroundColor: `${accent}18` }]} />
          <View style={[styles.heroGlow2, { backgroundColor: `${accent}10` }]} />

          <View style={styles.heroTop}>
            <View style={[styles.codePill, { borderColor: `${accent}55`, backgroundColor: "rgba(255,255,255,0.75)" }]}>
              <Ionicons name="receipt-outline" size={14} color={accent} />
              <Text style={[styles.heroCode, { color: accent }]}>{order.code}</Text>
            </View>
            <Badge label={statusLabels[order.status]} color={accent} />
          </View>

          <Text style={styles.heroTitle}>{order.title}</Text>

          {order.description ? (
            <Text style={styles.heroDesc}>{order.description}</Text>
          ) : null}

          <View style={styles.heroMeta}>
            <View style={[styles.priorityChip, { backgroundColor: `${priorityColor}16` }]}>
              <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
              <Text style={[styles.priorityText, { color: priorityColor }]}>
                Prioridade {priorityLabels[order.priority] ?? order.priority}
              </Text>
            </View>
            {order.scheduledAt ? (
              <View style={[styles.scheduleChip, { backgroundColor: `${accent}16` }]}>
                <Ionicons name="calendar-outline" size={13} color={accent} />
                <Text style={[styles.scheduleText, { color: accent }]}>
                  {formatDate(order.scheduledAt)}
                </Text>
              </View>
            ) : null}
          </View>
          {order.createdAt ? (
            <Text style={styles.createdAtText}>Criada em {formatDateTime(order.createdAt)}</Text>
          ) : null}
        </View>

        <View style={styles.content}>
          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Progresso</Text>
            <OrderStatusTimeline status={order.status} />
          </View>

          <OrderDetailSection icon="person-circle-outline" title="Cliente" accent={accent}>
            <DetailInfoRow icon="person-outline" label="Nome" value={order.customer?.fullName ?? ""} />
            <DetailInfoRow icon="call-outline" label="Telefone" value={order.customer?.phone ?? ""} />
            {order.customerPppoePassword ? (
              <DetailInfoRow
                icon="key-outline"
                label="Senha PPPoE"
                value={order.customerPppoePassword}
              />
            ) : null}
            <DetailInfoRow
              icon="people-outline"
              label="Técnicos"
              value={assigneeNames}
              isLast
            />
          </OrderDetailSection>

          <OrderDetailSection icon="calendar-outline" title="Datas" accent={accent}>
            <DetailInfoRow
              icon="time-outline"
              label="Criada em"
              value={order.createdAt ? formatDateTime(order.createdAt) : ""}
            />
            <DetailInfoRow
              icon="calendar-outline"
              label="Agendada para"
              value={order.scheduledAt ? formatDate(order.scheduledAt) : "Não agendada"}
              isLast
            />
          </OrderDetailSection>

          {fullAddress ? (
            <OrderDetailSection icon="location-outline" title="Endereço" accent={accent}>
              <DetailInfoRow icon="navigate-outline" label="Local" value={fullAddress} isLast />
            </OrderDetailSection>
          ) : null}

          {canEditReport && (
            <OrderDetailSection icon="document-text-outline" title="Relatório do técnico" accent={colors.info}>
              <Text style={styles.sectionHint}>
                Opcional. Descreva o que encontrou no local e o que foi feito no atendimento.
              </Text>
              <TextInput
                style={styles.reportInput}
                value={reportDraft}
                onChangeText={setReportDraft}
                placeholder="Ex.: cabo rompido no poste, troca de conector, sinal normalizado…"
                placeholderTextColor={colors.textMuted}
                multiline
                textAlignVertical="top"
              />
              <Button
                title="Salvar relatório"
                variant="secondary"
                onPress={handleSaveReport}
                loading={reportSaving}
                disabled={!reportChanged}
                style={{ marginTop: 12 }}
              />
            </OrderDetailSection>
          )}

          {!canEditReport && order.technicianReport ? (
            <OrderDetailSection icon="document-text-outline" title="Relatório do técnico" accent={colors.info}>
              <Text style={styles.reportSavedText}>{order.technicianReport}</Text>
            </OrderDetailSection>
          ) : null}

          {canWork && (
            <View style={[styles.actionCard, { borderColor: `${accent}33` }]}>
              <View style={styles.actionHeader}>
                <View style={[styles.actionIcon, { backgroundColor: `${accent}14` }]}>
                  <Ionicons name="flash-outline" size={20} color={accent} />
                </View>
                <View style={styles.actionHeaderText}>
                  <Text style={styles.actionTitle}>Ações da OS</Text>
                  <Text style={styles.actionSub}>
                    {canStart
                      ? "Inicie o atendimento quando chegar no local."
                      : "Finalize quando concluir o serviço."}
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                {canStart && (
                  <Button
                    title="Iniciar serviço"
                    onPress={() => changeStatus("IN_PROGRESS")}
                    loading={actionLoading}
                  />
                )}
                {canFinish && (
                  <Button
                    title="Finalizar OS"
                    onPress={() => changeStatus("DONE")}
                    loading={actionLoading}
                  />
                )}
              </View>
            </View>
          )}

          {(order.status === "IN_PROGRESS" || order.status === "DONE") && (
            <OrderDetailSection icon="star-outline" title="Avaliação do cliente" accent={colors.warning}>
              {order.customerRating ? (
                <>
                  <View style={styles.ratingBox}>
                    <Text style={styles.ratingScore}>{order.customerRating.rating}</Text>
                    <Text style={styles.ratingMax}>/10</Text>
                  </View>
                  {order.customerRating.comment ? (
                    <Text style={styles.ratingComment}>{order.customerRating.comment}</Text>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={styles.sectionHint}>
                    Pergunte ao cliente uma nota de 0 a 10 e registre o resultado.
                  </Text>
                  <Button
                    title="Pedir avaliação ao cliente"
                    variant="secondary"
                    onPress={openRatingModal}
                    style={{ marginTop: 12 }}
                  />
                </>
              )}
            </OrderDetailSection>
          )}

          {canWork && (
            <OrderDetailSection icon="cube-outline" title="Materiais / estoque" accent={colors.info}>
              <Text style={styles.sectionHint}>
                Selecione vários produtos de uma vez e informe a quantidade de cada.
              </Text>
              <Button title="Lançar produtos utilizados" onPress={() => openPicker("item")} style={{ marginTop: 12 }} />
              <Button
                title="Registrar defeitos"
                variant="secondary"
                onPress={() => openPicker("defect")}
                style={{ marginTop: 10 }}
              />
            </OrderDetailSection>
          )}

          <Text style={styles.itemsTitle}>Itens utilizados</Text>
          {(order.items ?? []).length === 0 ? (
            <View style={styles.emptyItems}>
              <Ionicons name="layers-outline" size={28} color={colors.textMuted} />
              <Text style={styles.emptyItemsText}>Nenhum item lançado ainda.</Text>
            </View>
          ) : (
            (order.items ?? []).map((item, idx) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={[styles.itemIndex, { backgroundColor: `${accent}14` }]}>
                  <Text style={[styles.itemIndexText, { color: accent }]}>{idx + 1}</Text>
                </View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemName}>{item.product?.name ?? item.description ?? "Item"}</Text>
                  <Text style={styles.itemQty}>
                    Qtd: {item.quantity ?? ""}
                    {item.product?.unit ? ` ${item.product.unit}` : ""}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </Screen>

      <MaterialPickerModal
        visible={pickerVisible}
        mode={pickerMode}
        products={products}
        stockByProduct={stockByProduct}
        loading={actionLoading}
        onClose={() => setPickerVisible(false)}
        onConfirm={confirmMaterials}
      />

      <CustomerRatingModal
        visible={ratingModalVisible}
        saving={ratingSaving}
        onClose={() => !ratingSaving && setRatingModalVisible(false)}
        onSave={handleSaveRating}
        fixedOrder={{
          id: order.id,
          code: order.code,
          title: order.title,
          customer: order.customer
            ? { fullName: order.customer.fullName, phone: order.customer.phone }
            : undefined,
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -60,
    right: -40,
  },
  heroGlow2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -30,
    left: -20,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
  },
  codePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  heroCode: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  heroDesc: {
    fontSize: tablet.fontBody,
    color: colors.textMuted,
    marginTop: 10,
    lineHeight: 22,
  },
  heroMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 8,
  },
  scheduleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  scheduleText: {
    fontSize: 12,
    fontWeight: "800",
  },
  createdAtText: {
    marginTop: 10,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  priorityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  timelineCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
    ...shadows.card,
  },
  timelineTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    ...shadows.cardElevated,
  },
  actionHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionHeaderText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: tablet.fontSubtitle,
    fontWeight: "800",
    color: colors.text,
  },
  actionSub: {
    fontSize: tablet.fontSmall,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 20,
  },
  actions: { gap: 10 },
  sectionHint: {
    fontSize: tablet.fontSmall,
    color: colors.textMuted,
    lineHeight: 20,
  },
  reportInput: {
    marginTop: 12,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: tablet.fontBody,
    color: colors.text,
    backgroundColor: colors.background,
    lineHeight: 22,
  },
  reportSavedText: {
    fontSize: tablet.fontBody,
    color: colors.text,
    lineHeight: 22,
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginBottom: 8,
  },
  ratingScore: {
    fontSize: 40,
    fontWeight: "900",
    color: colors.warning,
    lineHeight: 44,
  },
  ratingMax: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 6,
  },
  ratingComment: {
    fontSize: tablet.fontBody,
    color: colors.text,
    lineHeight: 22,
  },
  itemsTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 4,
  },
  emptyItems: {
    alignItems: "center",
    paddingVertical: 28,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  emptyItemsText: {
    marginTop: 8,
    fontSize: tablet.fontSmall,
    color: colors.textMuted,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 8,
    ...shadows.card,
  },
  itemIndex: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemIndexText: {
    fontSize: 14,
    fontWeight: "800",
  },
  itemBody: {
    flex: 1,
  },
  itemName: {
    fontSize: tablet.fontBody,
    fontWeight: "700",
    color: colors.text,
  },
  itemQty: {
    fontSize: tablet.fontSmall,
    color: colors.textMuted,
    marginTop: 2,
  },
});
