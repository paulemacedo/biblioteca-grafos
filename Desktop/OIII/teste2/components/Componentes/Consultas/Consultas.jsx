import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Calendar } from 'react-native-calendars';
import app from '../../API';

const Consultas = () => {
  const [selectedConsulta, setSelectedConsulta] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const pagamento = () => {
    navigation.navigate('Pagamentos', {
      valorPagamento: selectedConsulta.preco,
      idProfi: selectedConsulta.idProfissional,
      idPaci: selectedConsulta.idPaciente
    });
  };

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserData(user.uid);
      } else {
        setCurrentUser(null);
      }
    });

    return unsubscribe;
  }, []);

  const fetchUserData = async (uid) => {
    try {
      const db = getFirestore(app);
      const colRef = collection(db, 'Consultas');
      const q = query(colRef, where('idPaciente', '==', uid));
      const querySnapshot = await getDocs(q);

      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setConsultations(data);
    } catch (error) {
      console.error('Erro ao buscar dados das consultas:', error);
    }
  };

  // Função para gerar a marcação das datas
  const getMarkedDates = () => {
    const markedDates = {};
  
    consultations.forEach(consultation => {
      const date = new Date(consultation.dataConsulta);
      const dateString = date.toISOString().split('T')[0]; // Formata a data para YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0]; // Data atual formatada
  
      // Exemplo de marcação de dias de consulta
      markedDates[dateString] = {
        startingDay: true,
        endingDay: true,
        color: 'green',
        textColor: 'white',
        ...(dateString === today && {
          selected: true,
          selectedColor: 'red', // Fundo vermelho se for hoje
        })
      };
    });
  
    return markedDates;
  };
  

  const handleDayPress = (day) => {
    const selectedDate = new Date(day.dateString);
    const formattedDate = selectedDate.toISOString().split('T')[0];

    const consultationsForDay = consultations.filter(consultation =>
      new Date(consultation.dataConsulta).toISOString().split('T')[0] === formattedDate
    );

    // Exibe as consultas do dia selecionado
    if (consultationsForDay.length > 0) {
      setSelectedConsulta(consultationsForDay[0]); // Ajuste se precisar mostrar várias consultas
      toggleModal();
    }
  };

  return (
    <View style={styles.container}>
      <Calendar
        markingType={'period'}
        markedDates={getMarkedDates()}
        onDayPress={handleDayPress}
        style={styles.calendar}
      />

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Consulta</Text>
            {selectedConsulta && (
              <>
                <Text style={styles.modalText}>Data: {selectedConsulta.dataConsulta}</Text>
                <Text style={styles.modalText}>Especialidade: {selectedConsulta.especialidade}</Text>
                <Text style={styles.modalText}>Horário: {selectedConsulta.horaConsulta}</Text>
                <Text style={styles.modalText}>Endereço: {selectedConsulta.local}</Text>
                <Text style={styles.modalText}>Preco: {selectedConsulta.preco}</Text>
              </>
            )}
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={toggleModal}
              >
                <Text style={styles.modalButtonText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={pagamento}
              >
                <Text style={styles.modalButtonText}>Pagar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop:50
  },
  calendar: {
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  modalCancelButton: {
    backgroundColor: '#ccc',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default Consultas;
