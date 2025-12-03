// src/screens/HomeScreen.js
import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert, Modal, Pressable } from 'react-native';
import { Text, Button } from 'react-native-paper';

export default function HomeScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);

  function handleStartProject() {
    // abre o popup de aviso
    setModalVisible(true);
  }

  function confirmStart() {
    setModalVisible(false);
    navigation.navigate("Inputs", { screen: "Geometry" });
  }

  return (
    <View style={styles.container}>
      {/* BRASÃO */}
      <Image
        source={require('../../assets/brasao-uefs.png')}
        style={styles.brasao}
        resizeMode="contain"
      />

      {/* TEXTO INSTITUCIONAL */}
      <Text style={styles.title}>
        UNIVERSIDADE ESTADUAL DE FEIRA DE SANTANA
      </Text>
      <Text style={styles.subtitle}>DEPARTAMENTO DE TECNOLOGIA</Text>
      <Text style={styles.subtitle}>ENGENHARIA CIVIL</Text>

      <Text style={styles.authors}>
        AUTORES: Emerson Ícaro Mota Bastos {"\n"}
        Antônio Ribeiro Santos Júnior
      </Text>

      {/* BOTÃO */}
      <Button 
        mode="contained" 
        style={styles.button} 
        onPress={handleStartProject}
      >
        Iniciar novo projeto
      </Button>

      {/* POPUP DE AVISO */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            
            <Text style={styles.modalTitle}>Aviso Importante</Text>

            <Text style={styles.modalText}>
              Este aplicativo possui fins exclusivamente didáticos.{"\n\n"}
              Os autores não se responsabilizam por qualquer uso profissional
              ou aplicação em projetos reais.
            </Text>

            {/* BOTÕES DO POPUP */}
            <View style={styles.modalButtonsRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>

              <Pressable style={styles.okBtn} onPress={confirmStart}>
                <Text style={styles.okText}>Entendi</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  brasao: {
    width: 140,
    height: 140,
    marginBottom: 12,
    marginTop: 20
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center'
  },
  authors: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8
  },
  button: {
    marginTop: 30,
    paddingVertical: 6,
    width: '70%',
    borderRadius: 8
  },

  // modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalBox: {
    width: '82%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 10
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12
  },
  modalText: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  cancelText: {
    color: '#dc2626',
    fontSize: 15
  },
  okBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  okText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '700'
  }
});