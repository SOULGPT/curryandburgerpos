import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Theme } from '../../constants/Theme';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

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
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
}

interface Table {
  id: number;
  label: string;
  status: 'free' | 'occupied' | 'ready' | 'bill_requested';
}

export default function DeskScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    fetchData();

    const orderChannel = supabase
      .channel('desk:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchData)
      .subscribe();

    const tableChannel = supabase
      .channel('desk:tables')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, fetchTables)
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(tableChannel);
    };
  }, []);

  const fetchData = async () => {
    const { data: activeOrders } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .neq('status', 'served')
      .order('created_at', { ascending: false });
    
    if (activeOrders) setOrders(activeOrders as Order[]);

    // Calculate today's revenue from served orders
    const today = new Date().toISOString().split('T')[0];
    const { data: servedOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('status', 'served')
      .gte('created_at', today);

    if (servedOrders) {
      const total = servedOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
      setRevenue(total);
    }

    fetchTables();
  };

  const fetchTables = async () => {
    const { data } = await supabase.from('tables').select('*').order('id');
    if (data) setTables(data);
  };

  const handlePagato = async (orderId: string, tableId: number | null) => {
    await supabase.from('orders').update({ status: 'served' }).eq('id', orderId);
    if (tableId) {
      await supabase.from('tables').update({ status: 'free' }).eq('id', tableId);
    }
    fetchData();
  };

  const getTableColor = (status: Table['status']) => {
    switch (status) {
      case 'free': return Theme.colors.emerald;
      case 'occupied': return Theme.colors.primaryOrange;
      case 'ready': return Theme.colors.amber;
      case 'bill_requested': return Theme.colors.dangerRed;
      default: return Theme.colors.emerald;
    }
  };

  const activeTableCount = tables.filter(t => t.status !== 'free').length;
  const readyCount = orders.filter(o => o.status === 'ready').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Desk Management</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.leftCol}>
          <Text style={styles.sectionTitle}>Active Orders</Text>
          <FlatList
            data={orders}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Card style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>#{item.order_number}</Text>
                  <Badge 
                    label={item.status.toUpperCase()} 
                    type={item.status === 'ready' ? 'ready' : 'neutral'} 
                  />
                </View>
                <Text style={styles.orderTable}>
                  {item.service_type === 'asporto' ? 'ASPORTO' : `Table ${item.table_id}`}
                </Text>
                <View style={styles.orderFooter}>
                  <Text style={styles.orderTotal}>€{Number(item.total_amount).toFixed(2)}</Text>
                  <Button 
                    title="PAGATO" 
                    onPress={() => handlePagato(item.id, item.table_id)}
                  />
                </View>
              </Card>
            )}
          />
        </View>

        <View style={styles.rightCol}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>Revenue</Text>
              <Text style={styles.statValue}>€{revenue.toFixed(2)}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>Occupied</Text>
              <Text style={styles.statValue}>{activeTableCount}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statLabel}>Ready Orders</Text>
              <Text style={[styles.statValue, { color: Theme.colors.emerald }]}>{readyCount}</Text>
            </Card>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: Theme.spacing.xl }]}>Table Map</Text>
          <ScrollView>
            <View style={styles.tableMap}>
              {tables.map(table => (
                <View key={table.id} style={[styles.mapTable, { borderColor: getTableColor(table.status) }]}>
                  <View style={[styles.mapDot, { backgroundColor: getTableColor(table.status) }]} />
                  <Text style={styles.mapTableLabel}>{table.label}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    paddingTop: 60,
    backgroundColor: Theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  title: {
    fontFamily: Theme.typography.display.fontFamily,
    fontSize: 28,
    color: Theme.colors.darkBrown,
  },
  date: {
    fontFamily: Theme.typography.label.fontFamily,
    fontSize: 16,
    color: Theme.colors.mutedBrown,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  leftCol: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: Theme.colors.border,
    padding: Theme.spacing.lg,
  },
  rightCol: {
    flex: 1.2,
    padding: Theme.spacing.lg,
  },
  sectionTitle: {
    fontFamily: Theme.typography.heading.fontFamily,
    fontSize: 20,
    color: Theme.colors.darkBrown,
    marginBottom: Theme.spacing.md,
  },
  orderCard: {
    marginBottom: Theme.spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  orderNumber: {
    fontFamily: Theme.typography.heading.fontFamily,
    color: Theme.colors.primaryOrange,
  },
  orderTable: {
    fontFamily: Theme.typography.body.fontFamily,
    color: Theme.colors.mutedBrown,
    marginBottom: Theme.spacing.md,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontFamily: Theme.typography.price.fontFamily,
    fontSize: 24,
    color: Theme.colors.primaryOrange,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  statLabel: {
    fontFamily: Theme.typography.label.fontFamily,
    color: Theme.colors.mutedBrown,
    marginBottom: Theme.spacing.xs,
  },
  statValue: {
    fontFamily: Theme.typography.display.fontFamily,
    fontSize: 24,
    color: Theme.colors.darkBrown,
  },
  tableMap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
  },
  mapTable: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderRadius: Theme.radius.md,
    backgroundColor: Theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    top: 6,
    right: 6,
  },
  mapTableLabel: {
    fontFamily: Theme.typography.heading.fontFamily,
    fontSize: 18,
    color: Theme.colors.darkBrown,
  }
});
