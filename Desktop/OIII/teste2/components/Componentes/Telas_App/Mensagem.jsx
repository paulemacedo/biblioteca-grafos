import { Icon } from 'native-base';
import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ImageBackground,
} from 'react-native';
import moment from 'moment';
import MsgComponent from './Mensagens';
import { COLORS } from '../Chat/Color';
import ChatHeader from './MensagensHeader';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import auth from '@react-native-firebase/auth';
import SimpleToast from 'react-native-simple-toast';

const SingleChat = props => {
  const userData = auth().currentUser; // Pegando o usuário autenticado diretamente do Firebase
  const { receiverData } = props.route.params;

  const [msg, setMsg] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [allChat, setAllChat] = useState([]);
  const db = getFirestore(); // Inicializando Firestore

  useEffect(() => {
    const chatQuery = query(
      collection(getFirestore(), 'messages', receiverData.roomId, 'chat'), // Acessa a coleção de mensagens
      orderBy('sendTime', 'desc') // Ordena por tempo de envio
    );
  
    const unsubscribe = onSnapshot(chatQuery, (snapshot) => { // Escuta as alterações em tempo real
      const messages = snapshot.docs.map(doc => doc.data()); // Mapeia os dados das mensagens
      setallChat(messages); // Atualiza o estado com as mensagens
    });
  
    return () => unsubscribe(); // Remove o listener ao sair do componente
  }, [receiverData.roomId]);
  

  const msgValid = txt => txt && txt.replace(/\s/g, '').length;

  const sendMsg = async () => {
    if (!msg || msgValid(msg) === 0) {
      SimpleToast.show('Enter something....');
      return;
    }

    setDisabled(true);

    let msgData = {
      roomId: receiverData.roomId,
      message: msg,
      from: userData?.uid, // Usando o UID do usuário autenticado
      to: receiverData.id,
      sendTime: moment().format(), // Usando a função moment para timestamp
      msgType: 'text',
    };

    try {
      // Adiciona o documento à coleção de mensagens do Firestore
      await addDoc(collection(db, 'messages', receiverData.roomId, 'chat'), msgData);

      // Atualizando a lista de chats
      const chatListUpdate = {
        lastMsg: msg,
        sendTime: msgData.sendTime,
      };

      await addDoc(collection(db, 'chatlist', receiverData?.id, userData?.uid), chatListUpdate);
      await addDoc(collection(db, 'chatlist', userData?.uid, receiverData?.id), chatListUpdate);

      setMsg('');
    } catch (error) {
      console.error('Erro ao enviar mensagem: ', error);
    }

    setDisabled(false);
  };

  return (
    <View style={styles.container}>
      <ChatHeader data={receiverData} />
     
        <FlatList
          style={{ flex: 1 }}
          data={allChat}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          inverted
          renderItem={({ item }) => (
            <MsgComponent
              sender={item.from === userData.uid}
              item={item}
            />
          )}
        />


      <View style={styles.footer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message"
          placeholderTextColor={COLORS.black}
          multiline
          value={msg}
          onChangeText={setMsg}
        />
        <TouchableOpacity disabled={disabled} onPress={sendMsg}>
          <Icon
            style={styles.sendIcon}
            name="paper-plane-sharp"
            type="Ionicons"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footer: {
    backgroundColor: COLORS.theme,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    justifyContent: 'space-evenly',
  },
  input: {
    backgroundColor: COLORS.white,
    width: '80%',
    borderRadius: 25,
    borderWidth: 0.5,
    borderColor: COLORS.white,
    paddingHorizontal: 15,
    color: COLORS.black,
  },
  sendIcon: {
    color: COLORS.white,
  },
});

export default SingleChat;
