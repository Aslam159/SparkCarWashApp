// src/screens/ManagerDashboard.tsx
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Button, StyleSheet, FlatList, ActivityIndicator, Alert, ScrollView, TouchableOpacity } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import { format, addMonths, subMonths, getMonth, getYear, startOfDay, addMinutes } from 'date-fns';
import DatePicker from 'react-native-date-picker';

// --- Interface Definitions ---
interface Booking {
  id: string;
  startTimeSAST: string;
  userName: string;
  serviceName: string;
  status: string;
  type: 'booking';
}

interface BlockedSlot {
    id: string;
    startTimeSAST: string;
    type: 'blocked';
}

type ScheduleItem = Booking | BlockedSlot;

interface MonthlySummary {
  serviceName: string;
  count: number;
}

const ManagerDashboard = () => {
  // State for monthly summary
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // State for daily management
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [isDailyLoading, setIsDailyLoading] = useState(false);
  const [activeBays, setActiveBays] = useState<number | null>(null);
  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(new Set());
  const [allDaySlots, setAllDaySlots] = useState<string[]>([]);

  const getAuthToken = async () => {
    const currentUser = auth().currentUser;
    if (!currentUser) throw new Error("Manager not logged in.");
    return await currentUser.getIdToken();
  };

  // --- Data Fetching ---
  const fetchSummaryForMonth = useCallback(async (dateInMonth: Date) => {
    setIsSummaryLoading(true);
    setMonthlySummary([]);
    try {
        const idToken = await getAuthToken();
        const month = getMonth(dateInMonth) + 1;
        const year = getYear(dateInMonth);
        const response = await fetch(`https://spark-car-wash-api.onrender.com/api/manager/bookings/summary?month=${month}&year=${year}`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
        });
        if (!response.ok) throw new Error('Failed to fetch monthly summary.');
        const data = await response.json();
        setMonthlySummary(data);
    } catch (error: any) {
        Alert.alert("Error", error.message);
    } finally {
        setIsSummaryLoading(false);
    }
  }, []);

  const fetchDailyData = useCallback(async (date: Date) => {
    setIsDailyLoading(true);
    setScheduleItems([]);
    setBlockedSlots(new Set());
    try {
      const idToken = await getAuthToken();
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const [bookingsRes, blockedSlotsRes, settingsRes] = await Promise.all([
        fetch(`https://spark-car-wash-api.onrender.com/api/manager/bookings?date=${formattedDate}`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
        fetch(`https://spark-car-wash-api.onrender.com/api/manager/blocked-slots?date=${formattedDate}`, { headers: { 'Authorization': `Bearer ${idToken}` } }),
        fetch(`https://spark-car-wash-api.onrender.com/api/manager/settings?date=${formattedDate}`, { headers: { 'Authorization': `Bearer ${idToken}` } })
      ]);

      if (!bookingsRes.ok || !blockedSlotsRes.ok || !settingsRes.ok) {
        throw new Error('Failed to fetch daily schedule.');
      }

      const bookingsData: Booking[] = await bookingsRes.json();
      const blockedSlotsData: string[] = await blockedSlotsRes.json();
      const settingsData = await settingsRes.json();

      const combinedItems: ScheduleItem[] = [
        ...bookingsData.map(b => ({ ...b, type: 'booking' as const })),
        ...blockedSlotsData.map(s => ({ id: s, startTimeSAST: s, type: 'blocked' as const }))
      ];
      combinedItems.sort((a, b) => a.startTimeSAST.localeCompare(b.startTimeSAST));
      
      setScheduleItems(combinedItems);
      setBlockedSlots(new Set(blockedSlotsData));
      setActiveBays(settingsData.activeBays);

    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsDailyLoading(false);
    }
  }, []);

  // Generate all possible time slots for the day (runs once)
  useEffect(() => {
    const slots = [];
    let time = startOfDay(new Date());
    time.setHours(8, 0, 0, 0);
    const closingTime = startOfDay(new Date());
    closingTime.setHours(16, 0, 0, 0);
    while (time < closingTime) {
        slots.push(format(time, 'HH:mm'));
        time = addMinutes(time, 15);
    }
    setAllDaySlots(slots);
  }, []);

  // Refetch data when the screen comes into focus or dates change
  useFocusEffect(
    useCallback(() => {
      fetchSummaryForMonth(currentMonth);
      fetchDailyData(selectedDate);
    }, [currentMonth, selectedDate, fetchSummaryForMonth, fetchDailyData])
  );
  
  // --- Handlers ---
  const handleMonthChange = (direction: 'next' | 'prev') => {
    setCurrentMonth(current => direction === 'next' ? addMonths(current, 1) : subMonths(current, 1));
  };
  
  const handleToggleBlockSlot = async (slot: string) => {
    // --- THIS IS THE FIX ---
    // Check if the slot has an existing booking before trying to block it.
    const isSlotBooked = scheduleItems.some(item => item.type === 'booking' && item.startTimeSAST === slot);
    if (isSlotBooked && !blockedSlots.has(slot)) {
        Alert.alert("Action Denied", "This slot has an existing booking and cannot be blocked.");
        return;
    }

    try {
        const idToken = await getAuthToken();
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        await fetch('https://spark-car-wash-api.onrender.com/api/manager/blocked-slots', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date: formattedDate, slot }),
        });
        // Refetch data to update the UI immediately
        fetchDailyData(selectedDate);
    } catch (error: any) {
        Alert.alert("Error", "Could not update the slot.");
    }
  };

  const updateBayCount = async (count: number) => {
    try {
        const idToken = await getAuthToken();
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        const response = await fetch('https://spark-car-wash-api.onrender.com/api/manager/settings/activeBays', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ count, date: formattedDate }),
        });
        if (!response.ok) {
            throw new Error("Failed to update settings.");
        }
        Alert.alert("Success", `Active bays for ${format(selectedDate, 'dd MMMM')} have been set to ${count}.`);
        setActiveBays(count);
    } catch (error: any) {
        Alert.alert("Error", error.message);
    }
  };

  const handleSetBays = async (count: number) => {
    if (count === 1) {
        // Check for conflicts before reducing bays
        const slotCounts = scheduleItems.reduce((acc, item) => {
            if (item.type === 'booking') {
                acc[item.startTimeSAST] = (acc[item.startTimeSAST] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const hasConflict = Object.values(slotCounts).some(c => c > 1);

        if (hasConflict) {
            Alert.alert(
                "Warning: Double Bookings Found",
                "This day has time slots where both bays are booked. Reducing to one bay may cause operational issues. Are you sure you want to continue?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Continue", onPress: () => updateBayCount(1) }
                ]
            );
            return;
        }
    }
    // If no conflict or setting to 2 bays, update immediately
    updateBayCount(count);
  };

  const handleLogout = () => {
    auth().signOut();
  };

  // --- Render Items ---
  const renderSummaryItem = ({ item }: { item: MonthlySummary }) => (
    <View style={styles.summaryRow}>
        <Text style={styles.serviceName}>{item.serviceName}</Text>
        <Text style={styles.serviceCount}>{item.count}</Text>
    </View>
  );

  const renderScheduleItem = ({ item }: { item: ScheduleItem }) => {
    if (item.type === 'blocked') {
        return (
            <View style={[styles.bookingCard, styles.blockedCard]}>
                <Text style={styles.bookingTime}>{item.startTimeSAST}</Text>
                <Text style={styles.blockedText}>SLOT BLOCKED</Text>
            </View>
        );
    }
    return (
        <View style={styles.bookingCard}>
            <Text style={styles.bookingTime}>{item.startTimeSAST}</Text>
            <View style={styles.bookingDetails}>
                <Text style={styles.serviceName}>{item.serviceName}</Text>
                <Text style={styles.userName}>Client: {item.userName}</Text>
            </View>
            <Text style={styles.bookingStatus}>{item.status}</Text>
        </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Manager Dashboard</Text>
      
      {/* Monthly Summary Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Monthly Booking Summary</Text>
        <View style={styles.monthSelector}>
            <Button title="< Prev" onPress={() => handleMonthChange('prev')} />
            <Text style={styles.monthText}>{format(currentMonth, 'MMMM yyyy')}</Text>
            <Button title="Next >" onPress={() => handleMonthChange('next')} />
        </View>
        {isSummaryLoading ? <ActivityIndicator/> : <FlatList data={monthlySummary} renderItem={renderSummaryItem} keyExtractor={(item) => item.serviceName} ListEmptyComponent={<Text style={styles.emptyText}>No bookings for this month.</Text>} scrollEnabled={false}/>}
      </View>

      {/* Daily Management Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Management</Text>
        <Button title={`Viewing: ${format(selectedDate, 'dd MMMM yyyy')}`} onPress={() => setOpenDatePicker(true)} />
        <DatePicker modal open={openDatePicker} date={selectedDate} mode="date" onConfirm={(d) => { setOpenDatePicker(false); setSelectedDate(d); }} onCancel={() => setOpenDatePicker(false)} />
      </View>
      
      {/* Bay Management */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bay Management for {format(selectedDate, 'dd MMMM')}</Text>
        <Text style={styles.statusText}>Currently Active Bays: {activeBays ?? 'Loading...'}</Text>
        <View style={styles.buttonContainer}>
            <Button title="Set to 1 Bay" onPress={() => handleSetBays(1)} disabled={activeBays === 1} />
            <Button title="Set to 2 Bays" onPress={() => handleSetBays(2)} disabled={activeBays === 2} />
        </View>
      </View>

      {/* Slot Blocking */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Block Time Slots for {format(selectedDate, 'dd MMMM')}</Text>
        <View style={styles.slotsGrid}>
            {allDaySlots.map(slot => (
                <TouchableOpacity key={slot} style={[styles.slotButton, blockedSlots.has(slot) && styles.slotButtonBlocked]} onPress={() => handleToggleBlockSlot(slot)}>
                    <Text style={[styles.slotButtonText, blockedSlots.has(slot) && styles.slotButtonTextBlocked]}>{slot}</Text>
                </TouchableOpacity>
            ))}
        </View>
      </View>

      {/* Daily Schedule */}
      <Text style={styles.title}>Schedule for {format(selectedDate, 'dd MMMM')}</Text>
      {isDailyLoading ? <ActivityIndicator size="large" /> : <FlatList data={scheduleItems} renderItem={renderScheduleItem} keyExtractor={(item) => item.id} ListEmptyComponent={<Text style={styles.emptyText}>No bookings or blocked slots for this day.</Text>} scrollEnabled={false}/>}

      <View style={styles.footer}>
        <Button title="Logout" onPress={handleLogout} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', paddingVertical: 15 },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 15, marginHorizontal: 15, marginBottom: 10, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  monthText: { fontSize: 16, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  serviceName: { fontSize: 16 },
  serviceCount: { fontSize: 16, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', padding: 20, fontStyle: 'italic', color: '#6c757d' },
  footer: { padding: 15, marginTop: 20 },
  statusText: { fontSize: 16, textAlign: 'center', marginBottom: 15 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around' },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  slotButton: { backgroundColor: '#e9ecef', padding: 8, borderRadius: 5, margin: 4 },
  slotButtonBlocked: { backgroundColor: '#dc3545' },
  slotButtonText: { fontSize: 14, color: '#212529' },
  slotButtonTextBlocked: { color: '#fff' },
  bookingCard: { backgroundColor: '#fff', borderRadius: 8, padding: 15, marginHorizontal: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  bookingTime: { fontSize: 18, fontWeight: 'bold', color: '#007bff', marginRight: 15 },
  bookingDetails: { flex: 1 },
  bookingStatus: { fontSize: 12, fontWeight: 'bold', color: '#fff', backgroundColor: '#28a745', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, overflow: 'hidden' },
  blockedCard: { backgroundColor: '#f8d7da', borderColor: '#f5c6cb', borderWidth: 1 },
  blockedText: { fontSize: 16, fontWeight: 'bold', color: '#721c24' },
});

export default ManagerDashboard;
