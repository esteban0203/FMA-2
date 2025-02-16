import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Options Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarOption}>
          <Ionicons name="flash-outline" size={24} color="#333333" />
          <Text style={styles.topBarText}>Quick Meals</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.topBarOption}>
          <Ionicons name="calendar-outline" size={24} color="#333333" />
          <Text style={styles.topBarText}>Meal Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.topBarOption}>
          <Ionicons name="list-outline" size={24} color="#333333" />
          <Text style={styles.topBarText}>Inventory</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* What to eat now section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What to eat now?</Text>
          <View style={styles.quickOptions}>
            <TouchableOpacity style={styles.quickOption}>
              <Text style={styles.quickOptionText}>Leftovers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickOption}>
              <Text style={styles.quickOptionText}>Quick Meal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickOption}>
              <Text style={styles.quickOptionText}>Snacks</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Current Meal Plan Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meal Plan Status</Text>
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>5 meals planned</Text>
            <Text style={styles.statusText}>3 complete • 2 missing ingredients</Text>
          </View>
        </View>

        {/* Inventory Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Overview</Text>
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>12 items running low</Text>
            <Text style={styles.statusText}>3 items expired</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topBarOption: {
    alignItems: 'center',
  },
  topBarText: {
    fontSize: 12,
    color: '#333333',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  quickOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  quickOption: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickOptionText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
}); 