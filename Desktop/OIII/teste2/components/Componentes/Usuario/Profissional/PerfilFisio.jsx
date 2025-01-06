import {React, useState} from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity,Modal } from 'react-native';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const PerfilFisio = ({ perfis }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const openModal = (perfil) => {
    setSelectedProfile(perfil);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedProfile(null);
  }
  const navigation = useNavigation();

  const handleMarcarConsulta = (perfil) => {
    navigation.navigate('MarcarConsulta', {
      profissionalNome: perfil.Nome,
      profissionalEspecialidade: perfil.especialidades || 'Especialidade não informada',
      profissionalId: perfil.id,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {perfis.map((perfil, index) => (
        <TouchableOpacity key={index} style={styles.card} onPress={() => openModal(perfil)}>
          <Image 
            source={{ uri: perfil.fotos ? perfil.fotos[0] : 'https://via.placeholder.com/100' }} 
            style={styles.foto} 
          />
          <View style={styles.infoContainer}>
            <Text style={styles.nome}>{perfil.Nome}</Text>
            <Text style={styles.especialidade}>{perfil.especialidades || 'Especialidade não informada'}</Text>
          </View>
         
        </TouchableOpacity>
      ))}
      {selectedProfile && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedProfile.Nome}</Text>
              <Text style={styles.modalText}>Especialidade: {selectedProfile.especialidades || 'Especialidade não informada'}</Text>
              <Text style={styles.modalText}>Cursos: {selectedProfile.cursos || 'Detalhes não informados'}</Text> 
              <Button
            mode="contained"
            style={styles.button}
            onPress={() => handleMarcarConsulta(selectedProfile)}
          >
            Marcar
          </Button>
              <Button mode="contained" onPress={closeModal} style={styles.closeButton}>
                Fechar
              </Button>
            </View>
        
          </View>

        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 10,
  },
  card: {
    width: '45%', // Tamanho de cada "botão"
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  foto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  nome: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  especialidade: {
    fontSize: 14,
    color: '#777',
  },
  button: {
    width: '80%',
    backgroundColor: '#FF5A5F',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#007BFF',
  },
});

export default PerfilFisio;
