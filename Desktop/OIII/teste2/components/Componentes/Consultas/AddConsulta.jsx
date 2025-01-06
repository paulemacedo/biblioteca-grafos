import { useNavigation } from "@react-navigation/native";
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal } from "react-native";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import BottomBar from '../Telas_App/BottomBar';
import { Button } from "react-native-paper";
import { Picker } from '@react-native-picker/picker';
import { createConsulta } from "../../Firebase/Consultas/Create";
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import app from '../../API';
import { Calendar, LocaleConfig } from 'react-native-calendars';
function AddConsulta({ route }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState([]);
  const [pacienteId, setPacienteId] = useState(null);

  LocaleConfig.locales['pt-br'] = {
    monthNames: [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro'
    ],
    monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
    today: 'Hoje'
  };
  
  LocaleConfig.defaultLocale = 'pt-br';

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setPacienteId(user.uid);
        fetchUserData(user.uid);
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
    });

    return unsubscribe;
  }, []);

  const fetchUserData = async (uid) => {
    try {
      const db = getFirestore(app);
      const colRef = collection(db, 'Usuarios');
      const q = query(colRef, where('idUsuario', '==', uid));
      const querySnapshot = await getDocs(q);

      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setUserData(data);
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    }
  };

  const { profissionalNome, profissionalEspecialidade, profissionalId } = route.params;
  const [consulta, setConsulta] = useState(null);
  const [profissional, setProfissional] = useState(profissionalNome);
  const [especialidade, setEspecialidade] = useState(profissionalEspecialidade);
  const [horario, setHorario] = useState("09:00"); 
  const [dataConsulta, setDataConsulta] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigation = useNavigation();

  async function marcarConsulta() {
    console.log("Consulta marcada!");
    console.log("Profissional: ", profissional);
    console.log("Horário: ", horario);
    console.log("Data da consulta: ", dataConsulta);

    const consultaData = {
      idProfissional: profissionalId,
      idPaciente: currentUser.uid,
      especialidade: especialidade,
      dataConsulta: dataConsulta,
      horaConsulta: horario,
      local: '-', 
      preco: 0.0,
      completou: false
    };

    try {
      await createConsulta(consultaData);
      Alert.alert("Consulta Marcada", "A sua consulta foi marcada com sucesso!", [{ text: "OK", onPress: () => navigation.navigate("ChatRoom", { partner: profissionalId }) }]);
    } catch (error) {
      console.error('Erro ao adicionar consulta:', error);
      Alert.alert("Erro", "Ocorreu um erro ao marcar a consulta. Por favor, tente novamente.", [{ text: "OK" }]);
    }
  };

  const horariosDisponiveis = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const handleDayPress = (day) => {
    const { year, month, day: selectedDay } = day;
    const formattedDate = `${year}-${month}-${selectedDay}`;
    setDataConsulta(formattedDate);
    setProfissional(profissional);
    toggleModal();
  };

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  return (
    <>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>                Escolha a melhor data disponível:</Text>
            <Calendar
            
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#b6c1cd',
                selectedDayBackgroundColor: '#00adf5',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#00adf5',
                dayTextColor: '#2d4150',
                textDisabledColor: '#dd99ee',
              }}
     
              onDayPress={handleDayPress}
              locale={'pt-br'} 
            />
            <View style={styles.availableConsultas}></View>
          </View>
        </View>
        <Button
          style={styles.button}
          onPress={marcarConsulta}
          disabled={!profissional || !horario || !dataConsulta}
        >
          Marcar Consulta
        </Button>
      </ScrollView>
      <BottomBar />
      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Marcar Consulta</Text>
            <Text style={styles.modalText}>Data: {dataConsulta}</Text>
            <Text style={styles.modalText}>Nome do profissional: {profissional}</Text>
            <Text>Escolha o melhor horário para você:</Text>
            <Picker
              selectedValue={horario}
              onValueChange={(itemValue) => setHorario(itemValue)}
              style={styles.modalPicker}
            >
              {horariosDisponiveis.map((horarioItem, index) => (
                <Picker.Item key={index} label={horarioItem} value={horarioItem} />
              ))}
            </Picker>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  marcarConsulta();
                  toggleModal();
                }}
              >
                <Text style={styles.modalButtonText}>Marcar Consulta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={toggleModal}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  container: {
    marginTop: 50,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  calendar: {
    borderWidth: 2, 
    borderColor: 'white', 
    borderRadius: 15, 
    backgroundColor: 'white',
    elevation: 5,
    marginBottom: 20,
  },
  arrowButton: {
    padding: 10,
  },
  arrowText: {
    fontSize: 24, // Tamanho da fonte para os botões
    color: '#007AFF', // Cor dos botões
  },
  button: {
    marginVertical: 10,
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
  modalPicker: {
    marginVertical: 10,
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

export default AddConsulta;
