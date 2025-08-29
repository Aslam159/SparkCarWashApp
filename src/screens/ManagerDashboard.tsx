import React, { useState, useContext, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert, FlatList
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import { format, addMonths, subMonths, startOfDay } from 'date-fns';
import DatePicker from 'react-native-date-picker';

// Import the LocationContext
import { LocationContext } from '../context/LocationContext';

const API_URL = 'https://spark-car-wash-api.onrender.com';

// Define types for our data for better code quality
type Booking = { id: string; startTimeSAST: string; userName: string; serviceName: string; status: string; };
type ScheduleItem = { time: string; bookings: Booking[]; isBlocked: boolean; };
type MonthlySummary = { topServices: { serviceName: string, count: number }[], topClients: { userName: string, count: number }[] };

const ManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for daily data
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [activeBays, setActiveBays] = useState(1);
  const [blockedSlots, setBlockedSlots] = useState<string[]>([]);

  // State for monthly summary
  const [summaryDate, setSummaryDate] = useState(new Date());
  const [summaryData, setSummaryData] = useState<MonthlySummary | null>(null);

  // State for UI tabs
  const [activeTab, setActiveTab] = useState('dailySchedule');

  const { selectedLocation } = useContext(LocationContext);
  const currentUser = auth().currentUser;

  const fetchData = useCallback(async () => {
    if (!currentUser || !selectedLocation) return;
    setLoading(true);
    setError(null);
    try {
      const token = await currentUser.getIdToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const month = format(summaryDate, 'M');
      const year = format(summaryDate, 'yyyy');

      // Fetch all data in parallel
      const [
        dailyBookingsRes,
        settingsRes,
        blockedSlotsRes,
        summaryRes
      ] = await Promise.all([
        axios.get(`${API_URL}/api/manager/bookings?date=${formattedDate}`, config),
        axios.get(`${API_URL}/api/manager/settings?date=${formattedDate}`, config),
        axios.get(`${API_URL}/api/manager/blocked-slots?date=${formattedDate}`, config),
        axios.get(`${API_URL}/api/manager/bookings/summary?month=${month}&year=${year}`, config)
      ]);

      // Process daily schedule
      const dailyBookings = dailyBookingsRes.data;
      const allPossibleSlots = generateAllSlots();
      const newSchedule = allPossibleSlots.map(slot => ({
        time: slot,
        bookings: dailyBookings.filter((b: Booking) => b.startTimeSAST === slot),
        isBlocked: blockedSlotsRes.data.includes(slot),
      }));

      setSchedule(newSchedule);
      setActiveBays(settingsRes.data.activeBays);
      setBlockedSlots(blockedSlotsRes.data);
      setSummaryData(summaryRes.data);

    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load manager data.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, summaryDate, selectedLocation, currentUser]);

  useFocusEffect(fetchData);

  const generateAllSlots = () => {
    const slots = [];
    let currentTime = new Date();
    currentTime.setHours(8, 0, 0, 0);
    const closingTime = new Date();
    closingTime.setHours(16, 0, 0, 0);
    while (currentTime < closingTime) {
      slots.push(format(currentTime, 'HH:mm'));
      currentTime.setMinutes(currentTime.getMinutes() + 15);
    }
    return slots;
  };

  const handleSetBays = async (count: number) => {
    if (!currentUser || !selectedLocation) return;
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  
    if (count === 1) {
        const conflicts = schedule.filter(item => item.bookings.length > 1);
        if (conflicts.length > 0) {
            Alert.alert(
                "Warning: Double Bookings Exist",
                "This day has time slots with more than one booking. Reducing to one bay may cause operational issues. Are you sure you want to continue?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Continue", onPress: () => proceedWithBayChange(count, formattedDate) }
                ]
            );
            return;
        }
    }
    proceedWithBayChange(count, formattedDate);
  };
  
  const proceedWithBayChange = async (count: number, date: string) => {
    if (!currentUser) return;
    try {
        const token = await currentUser.getIdToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        await axios.post(`${API_URL}/api/manager/settings/activeBays`, { count, date }, config);
        Alert.alert("Success", `Active bays for ${date} set to ${count}.`);
        fetchData();
    } catch (error) {
        Alert.alert("Error", "Failed to update bay settings.");
    }
  };

  const handleToggleBlockSlot = async (slot: string) => {
    if (!currentUser || !selectedLocation) return;

    const hasBooking = schedule.some(item => item.time === slot && item.bookings.length > 0);
    if (hasBooking && !blockedSlots.includes(slot)) {
        Alert.alert("Cannot Block Slot", "This time slot has a customer booking and cannot be blocked.");
        return;
    }

    try {
        const token = await currentUser.getIdToken();
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        await axios.post(`${API_URL}/api/manager/blocked-slots`, { date: formattedDate, slot }, config);
        fetchData(); // Refresh data
    } catch (error) {
        Alert.alert("Error", "Failed to update time slot.");
    }
  };
  
  const handleLogout = () => auth().signOut();

  const renderTabContent = () => {
    switch (activeTab) {
        case 'dailySchedule':
            return <DailyScheduleView schedule={schedule} />;
        case 'dailyManagement':
            return <DailyManagementView activeBays={activeBays} onSetBays={handleSetBays} allSlots={generateAllSlots()} blockedSlots={blockedSlots} onToggleBlockSlot={handleToggleBlockSlot} />;
        case 'monthlyStats':
            return <MonthlyStatsView summaryData={summaryData} summaryDate={summaryDate} setSummaryDate={setSummaryDate} />;
        default:
            return null;
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }
  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text><Button title="Retry" onPress={fetchData} /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manager Dashboard</Text>
      <Text style={styles.locationTitle}>{selectedLocation?.name}</Text>
      
      <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'dailySchedule' && styles.activeTab]} onPress={() => setActiveTab('dailySchedule')}><Text style={styles.tabText}>Schedule</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'dailyManagement' && styles.activeTab]} onPress={() => setActiveTab('dailyManagement')}><Text style={styles.tabText}>Manage Day</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'monthlyStats' && styles.activeTab]} onPress={() => setActiveTab('monthlyStats')}><Text style={styles.tabText}>Stats</Text></TouchableOpacity>
      </View>
      
      {activeTab !== 'monthlyStats' && (
        <TouchableOpacity onPress={() => setOpenDatePicker(true)} style={styles.datePickerButton}>
            <Text style={styles.datePickerButtonText}>Viewing Day: {format(selectedDate, 'dd MMMM yyyy')}</Text>
        </TouchableOpacity>
      )}

      <DatePicker modal open={openDatePicker} date={selectedDate} mode="date" onConfirm={(d) => { setOpenDatePicker(false); setSelectedDate(d); }} onCancel={() => setOpenDatePicker(false)} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        {renderTabContent()}
      </ScrollView>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- Sub-components for each tab for better organization ---

const DailyScheduleView = ({ schedule }: { schedule: ScheduleItem[] }) => (
    <View>
        <Text style={styles.header}>Daily Schedule</Text>
        {schedule.length > 0 ? schedule.map(item => {
            if (item.bookings.length === 0 && !item.isBlocked) return null;
            return (
                <View key={item.time} style={[styles.scheduleItem, item.isBlocked && styles.blockedItem]}>
                    <Text style={styles.scheduleTime}>{item.time}</Text>
                    {item.isBlocked ? <Text style={styles.blockedText}>SLOT BLOCKED</Text> : null}
                    {item.bookings.map(booking => (
                        <View key={booking.id} style={styles.bookingDetails}>
                            <Text>{booking.userName} - {booking.serviceName} (Bay {booking.bayId})</Text>
                        </View>
                    ))}
                </View>
            );
        }) : <Text style={styles.emptyText}>No bookings for this day.</Text>}
    </View>
);

const DailyManagementView = ({ activeBays, onSetBays, allSlots, blockedSlots, onToggleBlockSlot }: any) => (
    <View>
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Bay Management</Text>
            <Text>Active Bays for this day: {activeBays}</Text>
            <View style={styles.buttonRow}>
                <Button title="Set to 1 Bay" onPress={() => onSetBays(1)} disabled={activeBays === 1} />
                <Button title="Set to 2 Bays" onPress={() => onSetBays(2)} disabled={activeBays === 2} />
            </View>
        </View>
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Block Time Slots</Text>
            <FlatList
                data={allSlots}
                keyExtractor={item => item}
                numColumns={4}
                renderItem={({ item }) => (
                    <TouchableOpacity style={[styles.slotContainer, blockedSlots.includes(item) && styles.blockedSlot]} onPress={() => onToggleBlockSlot(item)}>
                        <Text style={styles.slotText}>{item}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    </View>
);

const MonthlyStatsView = ({ summaryData, summaryDate, setSummaryDate }: any) => (
    <View>
        <View style={styles.monthSelector}>
            <Button title="< Prev" onPress={() => setSummaryDate(subMonths(summaryDate, 1))} />
            <Text style={styles.monthText}>{format(summaryDate, 'MMMM yyyy')}</Text>
            <Button title="Next >" onPress={() => setSummaryDate(addMonths(summaryDate, 1))} />
        </View>
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Top 5 Clients</Text>
            {summaryData?.topClients.length > 0 ? summaryData.topClients.map((client: any, index: number) => (
                <Text key={index} style={styles.listItem}>{index + 1}. {client.userName} ({client.count} washes)</Text>
            )) : <Text style={styles.emptyText}>No client data for this month.</Text>}
        </View>
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Most Booked Services</Text>
            {summaryData?.topServices.length > 0 ? summaryData.topServices.map((service: any, index: number) => (
                <Text key={index} style={styles.listItem}>{service.serviceName} ({service.count} washes)</Text>
            )) : <Text style={styles.emptyText}>No service data for this month.</Text>}
        </View>
    </View>
);


// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 15 },
  locationTitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 15 },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  tab: { paddingVertical: 10, paddingHorizontal: 15 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#007bff' },
  tabText: { fontSize: 16, fontWeight: '500' },
  datePickerButton: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', margin: 15 },
  datePickerButtonText: { fontSize: 16, color: '#007bff', fontWeight: 'bold' },
  header: { fontSize: 20, fontWeight: 'bold', marginTop: 15, marginBottom: 10, paddingHorizontal: 15 },
  scheduleItem: { backgroundColor: '#fff', padding: 10, marginHorizontal: 15, marginBottom: 5, borderRadius: 5, borderWidth: 1, borderColor: '#eee' },
  blockedItem: { backgroundColor: '#ffe3e3' },
  scheduleTime: { fontSize: 16, fontWeight: 'bold' },
  bookingDetails: { marginLeft: 10, marginTop: 5 },
  blockedText: { color: 'red', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 15, marginHorizontal: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  slotContainer: { flex: 1, margin: 4, padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, alignItems: 'center', backgroundColor: '#fff' },
  blockedSlot: { backgroundColor: '#dc3545' },
  slotText: { fontSize: 14 },
  monthSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  monthText: { fontSize: 18, fontWeight: 'bold' },
  listItem: { fontSize: 16, paddingVertical: 4 },
  emptyText: { textAlign: 'center', fontStyle: 'italic', color: '#888', padding: 10 },
  logoutButton: { position: 'absolute', bottom: 10, left: 15, right: 15, backgroundColor: '#6c757d', padding: 12, borderRadius: 8, alignItems: 'center' },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorText: { color: 'red', textAlign: 'center' },
});

export default ManagerDashboard;