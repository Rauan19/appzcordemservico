import { useCallback, useState } from "react";

import {

  ActivityIndicator,

  Alert,

  StyleSheet,

  Text,

  View,

} from "react-native";

import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import {

  MaterialPickerModal,

  type MaterialSelection,

} from "@/components/order/MaterialPickerModal";

import { Button } from "@/components/ui/Button";

import { Badge } from "@/components/ui/Badge";

import { Card } from "@/components/ui/Card";

import { Screen } from "@/components/ui/Screen";

import { api } from "@/src/services/api-service";

import type { Product, ServiceOrder, ServiceOrderStatus } from "@/src/types/api";

import { priorityLabels, statusColors, statusLabels } from "@/src/utils/status";

import { colors, tablet } from "@/src/constants/theme";



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

      setProducts(p.filter((x) => x.active));

      const map: Record<string, number> = {};

      for (const b of balances) map[b.productId] = b.balance;

      setStockByProduct(map);

    } catch {

      Alert.alert("Erro", "Não foi possível carregar a OS.");

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

    } catch (e: unknown) {

      Alert.alert("Erro", e instanceof Error ? e.message : "Falha ao atualizar status");

    } finally {

      setActionLoading(false);

    }

  }



  function openPicker(mode: "item" | "defect") {

    setPickerMode(mode);

    setPickerVisible(true);

  }



  async function confirmMaterials(items: MaterialSelection[], reason: string) {

    if (!order) return;



    if (items.length === 0) {

      Alert.alert("Atenção", "Selecione ao menos um produto.");

      return;

    }



    for (const item of items) {

      if (!item.quantity || item.quantity <= 0) {

        Alert.alert("Atenção", "Informe quantidade válida para todos os produtos.");

        return;

      }

    }



    if (pickerMode === "defect" && reason.trim().length < 3) {

      Alert.alert("Atenção", "Descreva o motivo do defeito (mín. 3 caracteres).");

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

    } catch (e: unknown) {

      Alert.alert("Erro", e instanceof Error ? e.message : "Operação falhou");

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



  const canWork = order.status !== "DONE" && order.status !== "CANCELED";
  const canStart = order.status === "OPEN" || order.status === "ASSIGNED";
  const canFinish = order.status === "IN_PROGRESS";



  return (

    <>

      <Screen scroll>

        <Card variant="elevated" showChevron={false} style={styles.topCard}>
          <View style={styles.header}>
            <Text style={styles.code}>{order.code}</Text>
            <Badge label={statusLabels[order.status]} color={statusColors[order.status]} />
          </View>
          <Text style={styles.title}>{order.title}</Text>
        </Card>

        {order.description ? <Text style={styles.desc}>{order.description}</Text> : null}



        <Card variant="accent" title="Cliente">

          <Text style={styles.value}>{order.customer?.fullName}</Text>

          <Text style={styles.meta}>{order.customer?.phone}</Text>

          {order.address ? (

            <Text style={styles.meta}>

              {[order.address.street, order.address.number, order.address.district, order.address.city]

                .filter(Boolean)

                .join(" · ")}

            </Text>

          ) : null}

          <Text style={styles.meta}>Prioridade: {priorityLabels[order.priority] ?? order.priority}</Text>

        </Card>



        {canWork && (

          <Card variant="elevated" title="Ações da OS">

            {canStart && (

              <Text style={styles.meta}>

                Status atual: {statusLabels[order.status]}. Toque abaixo para iniciar o atendimento.

              </Text>

            )}

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

          </Card>

        )}

        {(order.status === "IN_PROGRESS" || order.status === "DONE") && (
          <Card variant="elevated" title="Avaliação do cliente">
            {order.customerRating ? (
              <>
                <Text style={styles.value}>Nota: {order.customerRating.rating}/10</Text>
                {order.customerRating.comment ? (
                  <Text style={styles.meta}>{order.customerRating.comment}</Text>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.meta}>
                  Pergunte ao cliente uma nota de 0 a 10 e registre o resultado.
                </Text>
                <Button
                  title="Pedir avaliação ao cliente"
                  variant="secondary"
                  onPress={() => router.push(`/(tabs)/evaluations?orderId=${order.id}`)}
                  style={{ marginTop: 12 }}
                />
              </>
            )}
          </Card>
        )}

        {canWork && (

          <Card variant="elevated" title="Materiais / estoque">

            <Text style={styles.meta}>

              Selecione vários produtos de uma vez e informe a quantidade de cada.

            </Text>

            <Button title="Lançar produtos utilizados" onPress={() => openPicker("item")} />

            <Button

              title="Registrar defeitos"

              variant="secondary"

              onPress={() => openPicker("defect")}

              style={{ marginTop: 12 }}

            />

          </Card>

        )}



        <Text style={styles.section}>Itens utilizados</Text>

        {(order.items ?? []).length === 0 ? (

          <Text style={styles.meta}>Nenhum item lançado ainda.</Text>

        ) : (

          (order.items ?? []).map((item) => (

            <Card key={item.id} variant="muted" compact showChevron={false}>

              <Text style={styles.value}>{item.product?.name ?? item.description ?? "Item"}</Text>

              <Text style={styles.meta}>

                Qtd: {item.quantity ?? ""}

                {item.product?.unit ? ` ${item.product.unit}` : ""}

              </Text>

            </Card>

          ))

        )}

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

    </>

  );

}



const styles = StyleSheet.create({

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  topCard: { marginBottom: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },

  code: { fontSize: tablet.fontSmall, fontWeight: "800", color: colors.primary },

  title: { fontSize: tablet.fontTitle, fontWeight: "800", color: colors.text, lineHeight: 32 },

  desc: { fontSize: tablet.fontBody, color: colors.textMuted, marginBottom: 16 },

  section: {
    fontSize: tablet.fontSubtitle,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 8,
    marginTop: 4,
  },

  value: { fontSize: tablet.fontBody, fontWeight: "600", color: colors.text },

  meta: { fontSize: tablet.fontSmall, color: colors.textMuted, marginTop: 4, marginBottom: 8 },

  actions: { gap: 12 },

});


