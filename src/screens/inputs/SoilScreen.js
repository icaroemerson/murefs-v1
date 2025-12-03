// src/screens/inputs/SoilScreen.js
import React, { useMemo, useState } from 'react';
import {
  ScrollView, View, StyleSheet, Modal, FlatList,
  TextInput as RNTextInput, TouchableOpacity, Text as RNText, Platform
} from 'react-native';
import { Text, TextInput, Button, Divider, Switch } from 'react-native-paper';
import { SOILS } from '../../data/soils';
import { useProject } from '../../state/ProjectContext';

export default function SoilScreen() {
  const {
    soilGamma, setSoilGamma,
    soilPhi, setSoilPhi,
    soilQa, setSoilQa,
    hasWaterTable, setHasWaterTable,
  } = useProject();

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = (q || '').toLowerCase().trim();
    if (!s) return SOILS;
    return SOILS.filter(it => it.name.toLowerCase().includes(s));
  }, [q]);

  const onPick = (item) => {
    setSoilGamma(String(item.gamma));
    setSoilPhi(String(item.phi));
    setSoilQa(String(item.qa));
    setOpen(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="titleLarge" style={{ marginBottom: 8 }}>Solo</Text>

      <Button mode="outlined" onPress={() => setOpen(true)} style={{ marginBottom: 12 }}>
        Escolher tipo de solo
      </Button>

      <Divider style={{ marginVertical: 8 }} />

      <View style={styles.row}>
        <TextInput
          label="Peso específico γ (kN/m³)"
          value={String(soilGamma ?? '')}
          onChangeText={setSoilGamma}
          keyboardType="numeric"
          mode="outlined"
          style={styles.col}
        />
        <TextInput
          label="Ângulo de atrito φ (°)"
          value={String(soilPhi ?? '')}
          onChangeText={setSoilPhi}
          keyboardType="numeric"
          mode="outlined"
          style={styles.col}
        />
      </View>

      <View style={styles.row}>
        <TextInput
          label="Capacidade admissível qa (kPa)"
          value={String(soilQa ?? '')}
          onChangeText={setSoilQa}
          keyboardType="numeric"
          mode="outlined"
          style={styles.col}
        />
        <View style={[styles.col, styles.switchLine]}>
          <Text>Presença de nível d'água</Text>
          <Switch value={!!hasWaterTable} onValueChange={setHasWaterTable} />
        </View>
      </View>

      <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 8 }}>
        Dica: selecionar um tipo preenche γ, φ e qa. Você pode editar depois.
      </Text>

      <Text variant="bodySmall" style={{ opacity: 0.7, marginTop: 4 }}>
        Fonte dos dados dos solos: JOPPERT (2001).
      </Text>

      {/* Modal nativo */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <RNText style={styles.title}>Tipos de solo</RNText>
            <RNTextInput
              placeholder="Buscar..."
              value={q}
              onChangeText={setQ}
              style={styles.search}
            />
            <FlatList
              data={filtered}
              keyExtractor={(it) => it.id}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.item} onPress={() => onPick(item)}>
                  <RNText style={styles.itemTitle}>{item.name}</RNText>
                  <RNText style={styles.itemDesc}>
                    γ={item.gamma} kN/m³ · φ={item.phi}° · qa={item.qa} kPa
                  </RNText>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <RNText style={{ textAlign: 'center', paddingVertical: 16, opacity: 0.6 }}>
                  Nada encontrado
                </RNText>
              }
            />
            <Button onPress={() => setOpen(false)} style={{ marginTop: 8 }}>
              Fechar
            </Button>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  col: { flex: 1 },
  switchLine: {
    justifyContent: 'space-between',
    padding: 12, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 6,
  },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', paddingHorizontal: 16,
  },
  card: {
    backgroundColor: 'white', borderRadius: 12, padding: 16,
    ...Platform.select({
      android: { elevation: 6 },
      ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
    }),
  },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  search: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8,
  },
  item: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  itemTitle: { fontSize: 15, fontWeight: '600' },
  itemDesc: { fontSize: 13, opacity: 0.75, marginTop: 2 },
});
