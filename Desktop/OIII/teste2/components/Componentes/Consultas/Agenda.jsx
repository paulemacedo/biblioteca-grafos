import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, Button, TextInput } from 'react-native';
import { getFirestore, collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import app from '../../API';

const Consultas = () => {
  const [consultations, setConsultations] = useState([]);
  const [isShowingFuture, setIsShowingFuture] = useState(true); 
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null); 
  const [isModalVisible, setIsModalVisible] = useState(false); 
  const [comments, setComments] = useState([]); 
  const [newComment, setNewComment] = useState('');

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

  // Função para separar consultas passadas e futuras
  const getConsultationsByDate = () => {
    const today = new Date();
    const pastConsultations = [];
    const futureConsultations = [];

    consultations.forEach((consultation) => {
      const consultationDate = new Date(consultation.dataConsulta);
      if (consultationDate < today) {
        pastConsultations.push(consultation);
      } else {
        futureConsultations.push(consultation);
      }
    });

    return { pastConsultations, futureConsultations };
  };

  const { pastConsultations, futureConsultations } = getConsultationsByDate();

  const handleConsultationPress = (consulta) => {
    setSelectedConsultation(consulta);
    fetchComments(consulta.id);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedConsultation(null);
    setComments([]);
    setNewComment('');
  };

  const handleFinalize = async () => {
    // Adicione aqui a lógica para finalizar a consulta
    console.log('Finalizar consulta', selectedConsultation.id);
    handleCloseModal();
  };

  const fetchComments = async (consultaId) => {
    try {
      const db = getFirestore(app);
      const colRef = collection(db, 'Consultas', consultaId, 'Comments');
      const querySnapshot = await getDocs(colRef);

      const fetchedComments = [];
      querySnapshot.forEach((doc) => {
        fetchedComments.push(doc.data().text);
      });
      setComments(fetchedComments);
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim() === '') return;

    try {
      const db = getFirestore(app);
      const colRef = collection(db, 'Consultas', selectedConsultation.id, 'Comments');
      await addDoc(colRef, { text: newComment });

      setComments([...comments, newComment]);
      setNewComment('');
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Botões de alternância */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isShowingFuture && styles.activeButton]}
          onPress={() => setIsShowingFuture(true)}
        >
          <Text style={[styles.buttonText, isShowingFuture && styles.activeButtonText]}>
            Futuras
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !isShowingFuture && styles.activeButton]}
          onPress={() => setIsShowingFuture(false)}
        >
          <Text style={[styles.buttonText, !isShowingFuture && styles.activeButtonText]}>
            Passadas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Exibição das consultas com base no botão ativo */}
      <ScrollView style={styles.consultaList}>
        {isShowingFuture ? (
          futureConsultations.length > 0 ? (
            futureConsultations.map((consulta) => (
              <TouchableOpacity
                key={consulta.id}
                style={styles.consultaItem}
                onPress={() => handleConsultationPress(consulta)}
              >
                <View style={styles.consultaHeader}>
                  <Text style={styles.consultaDate}>Data: {consulta.dataConsulta}</Text>
                  <Text style={styles.consultaTime}>Horário: {consulta.horaConsulta}</Text>
                </View>
                <Text style={styles.consultaSpeciality}>{consulta.especialidade}</Text>
                <View style={styles.professionalInfo}>
                  <Image
                    source={{ uri: consulta.professionalImage }} // Supondo que `professionalImage` é o URL da imagem
                    style={styles.professionalImage}
                  />
                  <View style={styles.professionalDetails}>
                    <Text style={styles.professionalName}>{consulta.professionalName}</Text>
                    <Text style={styles.professionalOccupation}>{consulta.professionalOccupation}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noConsultasText}>Nenhuma consulta futura.</Text>
          )
        ) : (
          pastConsultations.length > 0 ? (
            pastConsultations.map((consulta) => (
              <TouchableOpacity
                key={consulta.id}
                style={styles.consultaItem}
                onPress={() => handleConsultationPress(consulta)}
              >
                <View style={styles.consultaHeader}>
                  <Text style={styles.consultaDate}>Data: {consulta.dataConsulta}</Text>
                  <Text style={styles.consultaTime}>Horário: {consulta.horaConsulta}</Text>
                </View>
                <Text style={styles.consultaSpeciality}>{consulta.especialidade}</Text>
                <View style={styles.professionalInfo}>
                  <Image
                    source={{ uri: consulta.professionalImage }} 
                    style={styles.professionalImage}
                  />
                  <View style={styles.professionalDetails}>
                    <Text style={styles.professionalName}>{consulta.professionalName}</Text>
                    <Text style={styles.professionalOccupation}>{consulta.professionalOccupation}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noConsultasText}>Nenhuma consulta passada.</Text>
          )
        )}
      </ScrollView>

      {/* Modal de detalhes da consulta */}
      {selectedConsultation && (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
            <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.closeButtonText}>X</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Detalhes da Consulta</Text>
              <Text style={styles.modalDate}>Data: {selectedConsultation.dataConsulta}</Text>
              <Text style={styles.modalTime}>Horário: {selectedConsultation.horaConsulta}</Text>
              <Text style={styles.modalSpeciality}>Especialidade: {selectedConsultation.especialidade}</Text>
              <View style={styles.commentsSection}>
                <Text style={styles.commentsTitle}>Comentários:</Text>
                <ScrollView style={styles.commentsList}>
                  {comments.length > 0 ? (
                    comments.map((comment, index) => (
                      <Text key={index} style={styles.comment}>
                        {comment}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.noCommentsText}>Nenhum comentário ainda.</Text>
                  )}
                </ScrollView>
                {currentUser?.isProfessional==='true' ? (
                  <>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Adicionar um comentário..."
                      value={newComment}
                      onChangeText={setNewComment}
                    />
                    <Button title="Adicionar Comentário" onPress={handleAddComment} />
                  </>
                ) : (
                    <Text style={styles.commentInput}>Você não tem permissão para comentar.</Text>
                )}
              </View>
            
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f9f9f9',
      },
      buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        marginTop: 30,
        height:30
      },
      button: {
        flex: 1,
        backgroundColor: '#D9D9D9',
        paddingVertical: 5,
        borderRadius: 5,
        marginHorizontal: -4,
        alignItems: 'center',
      },
      buttonText: {
        color: 'black',
        fontSize: 13,
        fontFamily: 'SemiBold',
      },
  activeButton: {
    backgroundColor: '#25C5A5',
  },

  consultaList: {
    flex: 1,
  },
  consultaItem: {
    padding: 16,
    marginBottom: 10,
    backgroundColor: '#D5B5FF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  consultaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  consultaDate: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  consultaTime: {
    fontSize: 16,
  },
  consultaSpeciality: {
    fontSize: 16,
    color: '#333',
  },
  professionalInfo: {
    flexDirection: 'row',
    marginTop: 10,
  },
  professionalImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  professionalDetails: {
    justifyContent: 'center',
  },
  professionalName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  professionalOccupation: {
    fontSize: 14,
    color: '#666',
  },
  noConsultasText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '90%',
    height:'90%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalDate: {
    fontSize: 16,
    marginBottom: 5,
  },
  modalTime: {
    fontSize: 16,
    marginBottom: 5,
  },
  modalSpeciality: {
    fontSize: 16,
    marginBottom: 10,
  },
  commentsSection: {
    marginTop: 10,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  commentsList: {
    maxHeight: 150,
    marginBottom: 10,
  },
  comment: {
    fontSize: 14,
    padding: 5,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  noCommentsText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
  },
  commentInput: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 30,
    color: 'black',
  },
});

export default Consultas;
