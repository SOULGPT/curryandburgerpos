import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Theme } from '../../constants/Theme';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  order_number: number;
  table_id: number | null;
  service_type: string;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  created_at: string;
  order_items: OrderItem[];
}

export default function KitchenScreen() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders:all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .in('status', ['pending', 'preparing'])
      .order('created_at', { ascending: true });
    
    if (data) setOrders(data as Order[]);
  };

  const markPronto = async (orderId: string, tableId: number | null) => {
    await supabase.from('orders').update({ status: 'ready' }).eq('id', orderId);
    if (tableId) {
      await supabase.from('tables').update({ status: 'ready' }).eq('id', tableId);
    }
    fetchOrders();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cucina</Text>
        <Text style={styles.countText}>{orders.length} Active Orders</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <Card style={styles.ticket}>
            <View style={styles.ticketHeader}>
              <Text style={styles.orderNumber}>#{item.order_number}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.service_type === 'asporto' ? 'ASPORTO' : `TAVOLO ${item.table_id}`}
                </Text>
              </View>
            </View>
            
            <View style={styles.itemsList}>
              {item.order_items.map(oi => (
                <View key={oi.id} style={styles.itemRow}>
                  <Text style={styles.itemQty}>{oi.quantity}x</Text>
                  <Text style={styles.itemName}>{oi.name}</Text>
                </View>
              ))}
            </View>

            <Button 
              title="PRONTO" 
              variant="kitchenPronto"
              onPress={() => markPronto(item.id, item.table_id)}
            />
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111111', // Dark background for kitchen
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    paddingTop: 60,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontFamily: Theme.typography.display.fontFamily,
    fontSize: 32,
    color: Theme.colors.white,
  },
  countText: {
    fontFamily: Theme.typography.heading.fontFamily,
    color: Theme.colors.primaryOrange,
    fontSize: 20,
  },
  grid: {
    padding: Theme.spacing.md,
  },
  ticket: {
    flex: 1,
    margin: Theme.spacing.sm,
    backgroundColor: Theme.colors.white,
    maxWidth: '31%',
    minHeight: 250,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    paddingBottom: Theme.spacing.sm,
  },
  orderNumber: {
    fontFamily: Theme.typography.display.fontFamily,
    fontSize: 24,
    color: Theme.colors.darkBrown,
  },
  badge: {
    backgroundColor: Theme.colors.darkBrown,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.sm,
  },
  badgeText: {
    color: Theme.colors.white,
    fontFamily: Theme.typography.label.fontFamily,
    fontSize: 12,
  },
  itemsList: {
    flex: 1,
    marginBottom: Theme.spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.sm,
  },
  itemQty: {
    fontFamily: Theme.typography.heading.fontFamily,
    fontSize: 18,
    color: Theme.colors.primaryOrange,
    width: 30,
  },
  itemName: {
    fontFamily: Theme.typography.body.fontFamily,
    fontSize: 18,
    color: Theme.colors.darkBrown,
    flex: 1,
  }
});
