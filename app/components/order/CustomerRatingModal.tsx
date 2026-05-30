import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Rating010Picker } from "@/components/Rating010Picker";
import { Button } from "@/components/ui/Button";
import { colors, tablet } from "@/src/constants/theme";

export type RatingOrderInfo = {
  id: string;
  code: string;
  title: string;
  customer?: { fullName: string; phone?: string };
};

type Props = {
  visible: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (data: { serviceOrderId: string; rating: number; comment: string }) => void;
  /** OS fixa  modal aberto dentro do detalhe da ordem */
  fixedOrder?: RatingOrderInfo;
  /** Lista de OS  modal da aba Avaliações */
  rateableOrders?: RatingOrderInfo[];
  initialOrderId?: string;
};

export function CustomerRatingModal({
  visible,
  saving,
  onClose,
  onSave,
  fixedOrder,
  rateableOrders = [],
  initialOrderId,
}: Props) {
  const [rating, setRating] = useState(10);
  const [comment, setComment] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const orders = fixedOrder ? [fixedOrder] : rateableOrders;

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId),
    [orders, selectedOrderId],
  );

  useEffect(() => {
    if (!visible) return;
    setRating(10);
    setComment("");
    if (fixedOrder) {
      setSelectedOrderId(fixedOrder.id);
      return;
    }
    const preset =
      initialOrderId && rateableOrders.some((o) => o.id === initialOrderId)
        ? initialOrderId
        : rateableOrders[0]?.id ?? "";
    setSelectedOrderId(preset);
  }, [visible, fixedOrder, initialOrderId, rateableOrders]);

  function handleSave() {
    if (!selectedOrderId) return;
    onSave({
      serviceOrderId: selectedOrderId,
      rating,
      comment: comment.trim(),
    });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalPanel}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Avaliação do cliente</Text>
            <Pressable onPress={() => !saving && onClose()} hitSlop={12}>
              <Ionicons name="close" size={28} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.modalHint}>
              Mostre ao cliente a escala de 0 a 10 e registre a nota que ele informar.
            </Text>

            {fixedOrder ? (
              <View style={styles.fixedOrderCard}>
                <View style={styles.fixedOrderTop}>
                  <Ionicons name="receipt-outline" size={16} color={colors.primary} />
                  <Text style={styles.fixedOrderCode}>{fixedOrder.code}</Text>
                </View>
                <Text style={styles.fixedOrderTitle}>{fixedOrder.title}</Text>
                {fixedOrder.customer ? (
                  <Text style={styles.fixedOrderCustomer}>
                    {fixedOrder.customer.fullName}
                    {fixedOrder.customer.phone ? ` · ${fixedOrder.customer.phone}` : ""}
                  </Text>
                ) : null}
              </View>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Ordem de serviço</Text>
                {rateableOrders.map((o) => {
                  const active = selectedOrderId === o.id;
                  return (
                    <Pressable
                      key={o.id}
                      onPress={() => setSelectedOrderId(o.id)}
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
              </>
            )}

            {selectedOrder?.customer?.phone && !fixedOrder ? (
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
              onPress={onClose}
              disabled={saving}
              style={styles.modalBtn}
            />
            <Button
              title={saving ? "Salvando..." : "Registrar"}
              onPress={handleSave}
              disabled={saving || !selectedOrderId}
              style={styles.modalBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  modalHint: {
    fontSize: tablet.fontSmall,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 8,
  },
  fixedOrderCard: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: tablet.radius,
    padding: 14,
    backgroundColor: colors.accentLight,
    marginBottom: 4,
  },
  fixedOrderTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  fixedOrderCode: {
    fontWeight: "800",
    color: colors.primary,
    fontSize: tablet.fontBody,
  },
  fixedOrderTitle: {
    fontSize: tablet.fontBody,
    fontWeight: "700",
    color: colors.text,
  },
  fixedOrderCustomer: {
    fontSize: tablet.fontSmall,
    color: colors.textMuted,
    marginTop: 4,
  },
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
