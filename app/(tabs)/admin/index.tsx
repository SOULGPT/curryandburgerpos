import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, Modal, TouchableOpacity, Switch } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { Theme } from '../../../constants/Theme';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { MenuItem } from '../../../store/cart';

interface Room {
  id: number;
  name: string;
}

const CATEGORIES = ['burger', 'curry', 'wraps', 'sides', 'drinks', 'desserts'];
const BADGES = ['None', 'NEW', 'CHEF', 'HOT'];

export default function AdminScreen() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState('');

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formPrice, setFormPrice] = useState('');
  const [formEmoji, setFormEmoji] = useState('');
  const [formBadge, setFormBadge] = useState<string>('None');
  const [formAvailable, setFormAvailable] = useState(true);

  useEffect(() => {
    fetchRooms();
    fetchMenu();
  }, []);

  const fetchRooms = async () => {
    const { data } = await supabase.from('rooms').select('*').order('sort_order');
    if (data) setRooms(data);
  };

  const fetchMenu = async () => {
    const { data } = await supabase.from('menu_items').select('*').order('category').order('name');
    if (data) setMenuItems(data as MenuItem[]);
  };

  const addRoom = async () => {
    if (!newRoomName.trim()) return;
    const { error } = await supabase.from('rooms').insert({
      name: newRoomName,
      sort_order: rooms.length + 1
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setNewRoomName('');
      fetchRooms();
    }
  };

  const deleteRoom = async (id: number) => {
    const { data: tables } = await supabase.from('tables').select('id').eq('room_id', id);
    if (tables && tables.length > 0) {
      Alert.alert('Cannot delete', 'This room has tables assigned to it. Please reassign or delete them first.');
      return;
    }

    await supabase.from('rooms').delete().eq('id', id);
    fetchRooms();
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormName('');
    setFormCategory(CATEGORIES[0]);
    setFormPrice('');
    setFormEmoji('🍔');
    setFormBadge('None');
    setFormAvailable(true);
    setIsModalVisible(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price.toString());
    setFormEmoji(item.emoji || '');
    setFormBadge(item.badge || 'None');
    setFormAvailable(item.available);
    setIsModalVisible(true);
  };

  const saveMenuItem = async () => {
    if (!formName || !formPrice) {
      Alert.alert('Validation Error', 'Name and Price are required.');
      return;
    }

    const payload = {
      name: formName,
      category: formCategory,
      price: parseFloat(formPrice),
      emoji: formEmoji,
      badge: formBadge === 'None' ? null : formBadge,
      available: formAvailable
    };

    if (editingId) {
      const { error } = await supabase.from('menu_items').update(payload).eq('id', editingId);
      if (error) Alert.alert('Error', error.message);
    } else {
      const { error } = await supabase.from('menu_items').insert(payload);
      if (error) Alert.alert('Error', error.message);
    }

    setIsModalVisible(false);
    fetchMenu();
  };

  const deleteMenuItem = async () => {
    if (!editingId) return;
    
    Alert.alert('Confirm Delete', `Are you sure you want to delete ${formName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('menu_items').delete().eq('id', editingId);
          if (error) Alert.alert('Error', error.message);
          setIsModalVisible(false);
          fetchMenu();
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Settings</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: Theme.spacing.xl }}>
        
        {/* ROOMS SECTION */}
        <Text style={styles.sectionTitle}>Manage Rooms</Text>
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="New Room Name"
            value={newRoomName}
            onChangeText={setNewRoomName}
          />
          <Button title="Add" onPress={addRoom} />
        </View>

        {rooms.map((item) => (
          <Card key={item.id} style={styles.roomCard}>
            <Text style={styles.roomName}>{item.name}</Text>
            <Button 
              title="Delete" 
              variant="destructive" 
              onPress={() => deleteRoom(item.id)} 
            />
          </Card>
        ))}

        <View style={styles.divider} />

        {/* MENU SECTION */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Manage Menu</Text>
          <Button title="+ Add Item" onPress={openAddModal} />
        </View>

        {menuItems.map((item) => (
          <TouchableOpacity key={item.id} onPress={() => openEditModal(item)}>
            <Card style={[styles.menuItemCard, !item.available && styles.menuItemDisabled]}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemEmoji}>{item.emoji}</Text>
                <View>
                  <Text style={styles.menuItemName}>{item.name}</Text>
                  <Text style={styles.menuItemCategory}>{item.category.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.menuItemRight}>
                {item.badge && <Badge label={item.badge} type={item.badge.toLowerCase() as any} />}
                <Text style={styles.menuItemPrice}>€{item.price.toFixed(2)}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>AI Management</Text>
        <Button 
          title="Open AI Business Consultant" 
          onPress={() => router.push('/ai-chat')}
          variant="secondary"
          style={styles.aiButton}
        />
      </ScrollView>

      {/* MENU ITEM MODAL */}
      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Item' : 'New Item'}</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.modalInput} value={formName} onChangeText={setFormName} />

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Price (€)</Text>
                <TextInput style={styles.modalInput} keyboardType="numeric" value={formPrice} onChangeText={setFormPrice} />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>Emoji</Text>
                <TextInput style={styles.modalInput} value={formEmoji} onChangeText={setFormEmoji} />
              </View>
            </View>

            <Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.chip, formCategory === cat && styles.chipActive]}
                  onPress={() => setFormCategory(cat)}
                >
                  <Text style={[styles.chipText, formCategory === cat && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Badge</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {BADGES.map(b => (
                <TouchableOpacity 
                  key={b} 
                  style={[styles.chip, formBadge === b && styles.chipActive]}
                  onPress={() => setFormBadge(b)}
                >
                  <Text style={[styles.chipText, formBadge === b && styles.chipTextActive]}>
                    {b}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Available on Menu</Text>
              <Switch value={formAvailable} onValueChange={setFormAvailable} trackColor={{ true: Theme.colors.primaryOrange }} />
            </View>

            <View style={styles.modalFooter}>
              <Button title="Save Item" onPress={saveMenuItem} style={styles.saveBtn} />
              {editingId && (
                <Button title="Delete Item" variant="destructive" onPress={deleteMenuItem} />
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.cream },
  header: {
    padding: Theme.spacing.lg, paddingTop: 60, backgroundColor: Theme.colors.white,
    borderBottomWidth: 1, borderBottomColor: Theme.colors.border,
  },
  title: { fontFamily: Theme.typography.display.fontFamily, fontSize: 28, color: Theme.colors.darkBrown },
  content: { padding: Theme.spacing.lg, flex: 1 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.md },
  sectionTitle: { fontFamily: Theme.typography.heading.fontFamily, fontSize: 20, color: Theme.colors.darkBrown, marginBottom: Theme.spacing.md },
  divider: { height: 1, backgroundColor: Theme.colors.border, marginVertical: Theme.spacing.xl },
  addForm: { flexDirection: 'row', marginBottom: Theme.spacing.lg, gap: Theme.spacing.md },
  input: { flex: 1, backgroundColor: Theme.colors.white, height: 48, borderRadius: Theme.radius.sm, paddingHorizontal: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border, fontFamily: Theme.typography.body.fontFamily },
  roomCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.sm },
  roomName: { fontFamily: Theme.typography.body.fontFamily, fontSize: 18, color: Theme.colors.darkBrown },
  
  menuItemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.sm },
  menuItemDisabled: { opacity: 0.5 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.md },
  menuItemEmoji: { fontSize: 24 },
  menuItemName: { fontFamily: Theme.typography.body.fontFamily, fontSize: 16, color: Theme.colors.darkBrown },
  menuItemCategory: { fontFamily: Theme.typography.label.fontFamily, fontSize: 11, color: Theme.colors.mutedBrown },
  menuItemRight: { alignItems: 'flex-end', gap: Theme.spacing.xs },
  menuItemPrice: { fontFamily: Theme.typography.price.fontFamily, fontSize: 16, color: Theme.colors.primaryOrange },

  modalContainer: { flex: 1, backgroundColor: Theme.colors.cream },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Theme.spacing.lg, backgroundColor: Theme.colors.white, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
  modalTitle: { fontFamily: Theme.typography.heading.fontFamily, fontSize: 22, color: Theme.colors.darkBrown },
  closeText: { fontFamily: Theme.typography.body.fontFamily, fontSize: 16, color: Theme.colors.primaryOrange },
  modalBody: { padding: Theme.spacing.lg },
  label: { fontFamily: Theme.typography.label.fontFamily, fontSize: 14, color: Theme.colors.darkBrown, marginBottom: Theme.spacing.xs },
  modalInput: { backgroundColor: Theme.colors.white, height: 48, borderRadius: Theme.radius.sm, paddingHorizontal: Theme.spacing.md, borderWidth: 1, borderColor: Theme.colors.border, fontFamily: Theme.typography.body.fontFamily, marginBottom: Theme.spacing.md },
  row: { flexDirection: 'row', gap: Theme.spacing.md },
  flex1: { flex: 1 },
  chipRow: { flexDirection: 'row', marginBottom: Theme.spacing.lg },
  chip: { paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm, borderRadius: Theme.radius.pill, backgroundColor: Theme.colors.white, borderWidth: 1, borderColor: Theme.colors.border, marginRight: Theme.spacing.sm },
  chipActive: { backgroundColor: Theme.colors.darkBrown, borderColor: Theme.colors.darkBrown },
  chipText: { fontFamily: Theme.typography.label.fontFamily, color: Theme.colors.darkBrown },
  chipTextActive: { color: Theme.colors.white },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.xl, marginTop: Theme.spacing.sm },
  modalFooter: { gap: Theme.spacing.md, paddingBottom: 40 },
  saveBtn: { marginBottom: Theme.spacing.xs },
  aiButton: {
    backgroundColor: Theme.colors.darkBrown,
    borderColor: Theme.colors.amber,
    borderWidth: 1,
  }
});
