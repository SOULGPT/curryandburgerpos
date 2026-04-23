import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Theme } from '../../../constants/Theme';
import { supabase } from '../../../lib/supabase';
import { useCartStore, MenuItem } from '../../../store/cart';
import { useAuthStore } from '../../../store/auth';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

const CATEGORIES = ['burger', 'curry', 'wraps', 'sides', 'drinks', 'desserts'];

function MenuItemCard({ item, addItem }: { item: MenuItem; addItem: (item: MenuItem) => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handleAdd = () => {
    addItem(item);
    scale.value = withSequence(
      withSpring(1.1, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
  };

  return (
    <Animated.View style={[styles.menuCardWrapper, animatedStyle]}>
      <TouchableOpacity onPress={handleAdd}>
        <Card style={styles.menuCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.emoji}>{item.emoji || '🍔'}</Text>
            {item.badge && <Badge label={item.badge} type={item.badge.toLowerCase() as any} />}
          </View>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>€{item.price.toFixed(2)}</Text>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function WaiterMenuScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { items, tableId, serviceType, addItem, removeItem, updateQuantity, getCartTotal, clearCart } = useCartStore();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    const { data } = await supabase.from('menu_items').select('*').eq('available', true).order('sort_order');
    if (data) setMenuItems(data as MenuItem[]);
  };

  const handleSendOrder = async () => {
    if (items.length === 0) return;
    
    const { data: order, error: orderError } = await supabase.from('orders').insert({
      table_id: tableId,
      service_type: serviceType,
      status: 'pending',
      waiter_id: session?.user?.id,
      total_amount: getCartTotal(),
    }).select().single();

    if (orderError || !order) {
      Alert.alert('Error', 'Failed to create order');
      return;
    }

    const orderItems = items.map(item => ({
      order_id: order.id,
      menu_item_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    
    if (itemsError) {
      Alert.alert('Error', 'Failed to add items to order');
      return;
    }

    if (tableId) {
      await supabase.from('tables').update({ status: 'occupied' }).eq('id', tableId);
    }

    clearCart();
    Alert.alert('Success', 'Order sent successfully!');
    router.back();
  };

  const filteredMenu = menuItems.filter(item => item.category === activeCategory);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{serviceType === 'tavolo' ? `Table ${tableId}` : 'Asporto'}</Text>
        <TouchableOpacity onPress={() => setIsCartOpen(!isCartOpen)} style={styles.cartIcon}>
          <Text style={styles.cartCount}>{totalItems}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoryBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredMenu}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.menuGrid}
        renderItem={({ item }) => <MenuItemCard item={item} addItem={addItem} />}
      />

      {isCartOpen && (
        <View style={styles.cartDrawer}>
          <Text style={styles.cartTitle}>Current Order</Text>
          <ScrollView style={styles.cartItems}>
            {items.map(item => (
              <View key={item.id} style={styles.cartItemRow}>
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <Text style={styles.cartItemPrice}>€{(item.price * item.quantity).toFixed(2)}</Text>
                </View>
                <View style={styles.quantityControls}>
                  <TouchableOpacity style={styles.qBtn} onPress={() => updateQuantity(item.id, -1)}>
                    <Text style={styles.qBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qText}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qBtn} onPress={() => updateQuantity(item.id, 1)}>
                    <Text style={styles.qBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.cartFooter}>
            <Text style={styles.totalText}>Total: €{getCartTotal().toFixed(2)}</Text>
            <Button title="Invia Ordine" onPress={handleSendOrder} disabled={items.length === 0} />
          </View>
        </View>
      )}
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
  },
  backButton: {
    fontFamily: Theme.typography.label.fontFamily,
    color: Theme.colors.darkBrown,
  },
  title: {
    fontFamily: Theme.typography.heading.fontFamily,
    fontSize: Theme.typography.heading.fontSize,
    color: Theme.colors.darkBrown,
  },
  cartIcon: {
    backgroundColor: Theme.colors.primaryOrange,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCount: {
    color: Theme.colors.white,
    fontFamily: Theme.typography.label.fontFamily,
    fontWeight: '800',
  },
  categoryBar: {
    backgroundColor: Theme.colors.white,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  categoryPill: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.pill,
    marginHorizontal: Theme.spacing.xs,
  },
  categoryPillActive: {
    backgroundColor: Theme.colors.darkBrown,
  },
  categoryText: {
    fontFamily: Theme.typography.label.fontFamily,
    color: Theme.colors.mutedBrown,
  },
  categoryTextActive: {
    color: Theme.colors.white,
  },
  menuGrid: {
    padding: Theme.spacing.sm,
  },
  menuCardWrapper: {
    flex: 1,
    padding: Theme.spacing.xs,
  },
  menuCard: {
    height: 120,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  emoji: {
    fontSize: 28,
  },
  itemName: {
    fontFamily: Theme.typography.body.fontFamily,
    fontSize: 14,
    color: Theme.colors.darkBrown,
  },
  itemPrice: {
    fontFamily: Theme.typography.price.fontFamily,
    color: Theme.colors.primaryOrange,
  },
  cartDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: Theme.colors.white,
    borderTopLeftRadius: Theme.radius.lg,
    borderTopRightRadius: Theme.radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    padding: Theme.spacing.lg,
  },
  cartTitle: {
    fontFamily: Theme.typography.heading.fontFamily,
    fontSize: Theme.typography.heading.fontSize,
    color: Theme.colors.darkBrown,
    marginBottom: Theme.spacing.md,
  },
  cartItems: {
    flex: 1,
  },
  cartItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontFamily: Theme.typography.body.fontFamily,
    color: Theme.colors.darkBrown,
  },
  cartItemPrice: {
    fontFamily: Theme.typography.label.fontFamily,
    color: Theme.colors.mutedBrown,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.cream,
    borderRadius: Theme.radius.pill,
  },
  qBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qBtnText: {
    fontSize: 18,
    color: Theme.colors.primaryOrange,
  },
  qText: {
    fontFamily: Theme.typography.label.fontFamily,
    paddingHorizontal: Theme.spacing.sm,
  },
  cartFooter: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingTop: Theme.spacing.md,
    marginTop: Theme.spacing.md,
  },
  totalText: {
    fontFamily: Theme.typography.heading.fontFamily,
    fontSize: 20,
    color: Theme.colors.darkBrown,
    marginBottom: Theme.spacing.md,
    textAlign: 'right',
  }
});
