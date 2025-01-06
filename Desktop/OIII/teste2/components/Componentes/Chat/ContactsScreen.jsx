import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import app, { databaseApp } from '../../API';

const auth = getAuth(app);

const ContactsScreen = ({ navigation }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        // Cria uma referência para a coleção de usuários
        const contactsRef = collection(databaseApp, 'Usuarios');
        
        // Cria uma consulta para buscar usuários cujo idUsuario não é o do usuário atual
        const q = query(contactsRef, where('idUsuario', '!=', user.uid));
        
        // Obtém os documentos da consulta
        const querySnapshot = await getDocs(q);
        
        // Mapeia os documentos para criar uma lista de contatos
        const contactsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Atualiza o estado com a lista de contatos
        setContacts(contactsList);
      } catch (error) {
        console.error('Erro ao buscar contatos: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  const handleContactPress = (contact) => {
    navigation.navigate('ChatRoom', { partner: contact.idUsuario });
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.contactItem} onPress={() => handleContactPress(item)}>
            <Image
              source={{ uri: item.photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png' }}
              style={styles.avatar}
            />
            <Text style={styles.contactName}>{item.Nome}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  contactName: {
    fontSize: 18,
  },
});

export default ContactsScreen;
