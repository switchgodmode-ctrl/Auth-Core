import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, ScrollView, Platform } from 'react-native';
import { Theme } from '../theme/Theme';
import { useAuth } from '../context/AuthContext';
import { AuthAPI } from '../api/api';
import { Cpu, Calendar, ShieldCheck, LogOut, RefreshCcw, Activity } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function DashboardScreen() {
  const { logout, userLicence } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // In a real app, you'd call a 'getLicenceDetails' endpoint
    // For now, we use the heartbeat to check status
    const session = await AuthAPI.checkSession();
    setData(session);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <MotiView 
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.header}
        >
          <View>
            <Text style={styles.welcome}>Control Center</Text>
            <Text style={styles.licenceText}>{userLicence || 'Active License'}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <LogOut size={20} color={Theme.colors.error} />
          </TouchableOpacity>
        </MotiView>

        {/* Status Card */}
        <MotiView 
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 100 }}
          style={styles.statusCard}
        >
          <View style={styles.statusHeader}>
            <Activity size={24} color={Theme.colors.primary} />
            <Text style={styles.statusTitle}>System Status</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={[styles.dot, { backgroundColor: data?.active ? Theme.colors.success : Theme.colors.error }]} />
            <Text style={styles.statusValue}>{data?.active ? 'AUTHORIZED' : 'RESTRICTED'}</Text>
          </View>
        </MotiView>

        {/* Info Grid */}
        <View style={styles.grid}>
          <MotiView 
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ delay: 200 }}
            style={styles.gridItem}
          >
            <Calendar size={20} color={Theme.colors.primary} />
            <Text style={styles.gridLabel}>Validity</Text>
            <Text style={styles.gridValue}>30 Days</Text>
          </MotiView>

          <MotiView 
            from={{ opacity: 0, translateX: 20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ delay: 300 }}
            style={styles.gridItem}
          >
            <ShieldCheck size={20} color={Theme.colors.secondary} />
            <Text style={styles.gridLabel}>Protection</Text>
            <Text style={styles.gridValue}>Active</Text>
          </MotiView>
        </View>

        {/* HWID Forensic Card */}
        <MotiView 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 400 }}
          style={styles.forensicCard}
        >
          <View style={styles.forensicHeader}>
            <Cpu size={20} color={Theme.colors.textMuted} />
            <Text style={styles.forensicTitle}>Device Fingerprint</Text>
          </MotiView>
          <Text style={styles.hwidText}>BND-0A2F-8932-XXXX</Text>
          <Text style={styles.hwidSub}>Locked to this device</Text>
        </MotiView>

        {/* Actions */}
        <TouchableOpacity style={styles.actionBtn} onPress={fetchData}>
          <RefreshCcw size={20} color={Theme.colors.text} />
          <Text style={styles.actionBtnText}>Refresh Data</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
    marginTop: 20,
  },
  welcome: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  licenceText: {
    color: Theme.colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  logoutBtn: {
    padding: 10,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.roundness.md,
  },
  statusCard: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.lg,
    borderRadius: Theme.roundness.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.md,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusTitle: {
    color: Theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusValue: {
    color: Theme.colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  gridItem: {
    width: '48%',
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  gridLabel: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  gridValue: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  forensicCard: {
    backgroundColor: Theme.colors.surface,
    padding: Theme.spacing.md,
    borderRadius: Theme.roundness.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: Theme.spacing.xl,
  },
  forensicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  forensicTitle: {
    color: Theme.colors.textMuted,
    fontSize: 12,
    marginLeft: 8,
  },
  hwidText: {
    color: Theme.colors.text,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  hwidSub: {
    color: Theme.colors.primary,
    fontSize: 10,
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surfaceLight,
    height: 55,
    borderRadius: Theme.roundness.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  }
});
