import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Animated } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Theme } from '../../constants/Theme';

interface Order {
  id: string;
  order_number: number;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  updated_at: string;
}

const ReadyCard = ({ order }: { order: Order }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.card, styles.readyCard, { transform: [{ scale: pulseAnim }] }]}>
      <Text style={[styles.orderNumber, styles.readyText]}>#{order.order_number}</Text>
      <Text style={[styles.statusText, styles.readyText]}>PRONTO</Text>
    </Animated.View>
  );
};

export default function DisplayScreen() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('display:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    // Hide served orders older than 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60000).toISOString();
    
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, status, updated_at')
      .eq('service_type', 'asporto')
      .or(`status.in.(pending,preparing,ready),and(status.eq.served,updated_at.gte.${twoMinutesAgo})`)
      .order('updated_at', { ascending: false });
    
    if (data) setOrders(data as Order[]);
  };

  const prepOrders = orders.filter(o => o.status === 'pending' || o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>CURRY&BURGER</Text>
        <Text style={styles.subtitle}>Ritiro Ordini / Order Collection</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.column}>
          <Text style={styles.colTitle}>In Preparazione / Preparing</Text>
          <FlatList
            data={prepOrders}
            keyExtractor={item => item.id}
            numColumns={2}
            renderItem={({ item }) => (
              <View style={[styles.card, styles.prepCard]}>
                <Text style={styles.orderNumber}>#{item.order_number}</Text>
              </View>
            )}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.column}>
          <Text style={[styles.colTitle, { color: Theme.colors.emerald }]}>Pronto / Ready</Text>
          <FlatList
            data={readyOrders}
            keyExtractor={item => item.id}
            numColumns={2}
            renderItem={({ item }) => <ReadyCard order={item} />}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.darkBrown,
  },
  header: {
    alignItems: 'center',
    padding: Theme.spacing.xl,
    backgroundColor: '#0a0400',
    borderBottomWidth: 1,
    borderBottomColor: '#331a00',
  },
  brand: {
    fontFamily: Theme.typography.display.fontFamily,
    fontSize: 48,
    color: Theme.colors.primaryOrange,
  },
  subtitle: {
    fontFamily: Theme.typography.heading.fontFamily,
    fontSize: 24,
    color: Theme.colors.white,
    marginTop: Theme.spacing.sm,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: Theme.spacing.xl,
  },
  column: {
    flex: 1,
    paddingHorizontal: Theme.spacing.lg,
  },
  divider: {
    width: 2,
    backgroundColor: '#331a00',
    marginHorizontal: Theme.spacing.lg,
  },
  colTitle: {
    fontFamily: Theme.typography.display.fontFamily,
    fontSize: 32,
    color: Theme.colors.amber,
    marginBottom: Theme.spacing.xl,
    textAlign: 'center',
  },
  card: {
    flex: 1,
    margin: Theme.spacing.sm,
    padding: Theme.spacing.lg,
    borderRadius: Theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    borderWidth: 2,
  },
  prepCard: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333333',
  },
  readyCard: {
    backgroundColor: Theme.colors.emerald,
    borderColor: Theme.colors.white,
  },
  orderNumber: {
    fontFamily: Theme.typography.display.fontFamily,
    fontSize: 48,
    color: Theme.colors.white,
  },
  statusText: {
    fontFamily: Theme.typography.heading.fontFamily,
    fontSize: 20,
    marginTop: Theme.spacing.xs,
  },
  readyText: {
    color: Theme.colors.white,
  }
});
