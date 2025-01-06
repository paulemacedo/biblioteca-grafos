import React, { useRef, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, Image } from 'react-native';
import { getAuth } from 'firebase/auth';
import { addDoc, collection, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { useAuthState, useSignInWithGoogle } from "react-firebase-hooks/auth";
import app, { databaseApp } from '../../API';

const auth = getAuth(app);

const ChatRoom = ({ route }) => {
  const { partner } = route.params || {};
  const dummy = useRef();
  const [user] = useAuthState(auth);

  if (!partner) {
    return <Text>Erro: parceiro não especificado.</Text>;
  }

  const chatId = [user.uid, partner].sort().join('_');
  const messagesRef = collection(databaseApp, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('createdAt'));
  const [messages] = useCollectionData(q, { idField: 'id' });

  const [formValue, setFormValue] = useState('');

  const sendMessage = async () => {
    if (!user || !partner) return;

    await addDoc(messagesRef, {
      text: formValue,
      uid: user.uid,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
    });

    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  };

  const ChatMessage = ({ message }) => {
    const { text, uid, photoURL } = message;
    const currentUserUid = auth.currentUser.uid;
    const messageClass = uid === currentUserUid ? styles.sent : styles.received;
  
  
    return (
      <View style={[styles.message, messageClass]}>
        <Image
          source={{ uri: photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png' }}
          style={styles.avatar}
        />
        <Text style={styles.messageText}>{text}</Text>
      </View>
    );
  };

  return (
    <View style={styles.chatRoom}>
      <ScrollView
        contentContainerStyle={styles.messagesContainer}
        ref={dummy}
      >
        {messages && messages.map((msg, index) => <ChatMessage key={index} message={msg} />)}
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={formValue}
          onChangeText={setFormValue}
          placeholder="Digite uma mensagem..."
        />
        <Button title="Enviar" onPress={sendMessage} disabled={!formValue} />
      </View>
    </View>
  );
};


  
const styles = StyleSheet.create({
    chatRoom: {
      flex: 1,
    },
    messagesContainer: {
      flexGrow: 1,
      padding: 10,
    },
    message: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 5,
      padding: 10,
      borderRadius: 10,
      // Adicione mais propriedades se necessário
    },
    sent: {
      backgroundColor: '#d1ffd1',
      alignSelf: 'flex-end',
    },
    received: {
      backgroundColor: '#e5e5e5',
      alignSelf: 'flex-start',
    },
    avatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      marginRight: 10,
    },
    messageText: {
      fontSize: 16,
      color:'#white'
    },
    inputContainer: {
      flexDirection: 'row',
      padding: 10,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: '#ddd',
    },
    textInput: {
      flex: 1,
      borderColor: '#white',
      borderWidth: 1,
      borderRadius: 5,
      padding: 10,
      marginRight: 10,
    },
  });
  

export default ChatRoom;
