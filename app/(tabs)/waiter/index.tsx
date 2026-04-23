import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '../../../constants/Theme';
import { supabase } from '../../../lib/supabase';
import { useCartStore } from '../../../store/cart';
import { Button } from '../../../components/ui/Button';

interface Table {
  id: number;
  label: string;
  status: 'free' | 'occupied' | 'ready' | 'bill_requested';
  room_id: number;
}

interface Room {
  id: number;
  name: string;
}

export default function WaiterTableScreen() {
  const router = useRouter();
  const { setTableId, setServiceType, serviceType } = useCartStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [activeRoom, setActiveRoom] = useState<number | null>(null);

  useEffect(() => {
    fetchRoomsAndTables();
  }, []);

  const fetchRoomsAndTables = async () => {
    const { data: roomsData } = await supabase.from('rooms').select('*').order('sort_order');
    if (roomsData) {
      setRooms(roomsData);
      if (roomsData.length > 0) setActiveRoom(roomsData[0].id);
    }
    const { data: tablesData } = await supabase.from('tables').select('*');
    if (tablesData) {
      setTables(tablesData);
    }
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

  const handleTableSelect = (table: Table) => {
    setServiceType('tavolo');
    setTableId(table.id);
    router.push('/(tabs)/waiter/menu');
  };

  const handleAsportoSelect = () => {
    setServiceType('asporto');
    setTableId(null);
    router.push('/(tabs)/waiter/menu');
  };

  const currentTables = tables.filter(t => t.room_id === activeRoom);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Table</Text>
        <Button 
          title="Asporto" 
          onPress={handleAsportoSelect} 
          variant={serviceType === 'asporto' ? 'primary' : 'secondary'}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomTabs}>
        {rooms.map(room => (
          <TouchableOpacity 
            key={room.id} 
            style={[styles.roomTab, activeRoom === room.id && styles.roomTabActive]}
            onPress={() => setActiveRoom(room.id)}
          >
            <Text style={[styles.roomTabText, activeRoom === room.id && styles.roomTabTextActive]}>
              {room.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={currentTables}
        numColumns={3}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.tableGrid}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.tableCard, { borderColor: getTableColor(item.status) }]}
            onPress={() => handleTableSelect(item)}
          >
            <View style={[styles.statusDot, { backgroundColor: getTableColor(item.status) }]} />
            <Text style={styles.tableLabel}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
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
    fontFamily: Theme.typography.heading.fontFamily,
    fontSize: Theme.typography.heading.fontSize,
    color: Theme.colors.darkBrown,
  },
  roomTabs: {
    padding: Theme.spacing.md,
    maxHeight: 70,
  },
  roomTab: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.radius.pill,
    backgroundColor: Theme.colors.white,
    marginRight: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  roomTabActive: {
    backgroundColor: Theme.colors.darkBrown,
    borderColor: Theme.colors.darkBrown,
  },
  roomTabText: {
    fontFamily: Theme.typography.label.fontFamily,
    fontSize: Theme.typography.label.fontSize,
    color: Theme.colors.darkBrown,
  },
  roomTabTextActive: {
    color: Theme.colors.white,
  },
  tableGrid: {
    padding: Theme.spacing.md,
  },
  tableCard: {
    flex: 1,
    margin: Theme.spacing.xs,
    aspectRatio: 1,
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.radius.md,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  tableLabel: {
    fontFamily: Theme.typography.display.fontFamily,
    fontSize: 24,
    color: Theme.colors.darkBrown,
  }
});
