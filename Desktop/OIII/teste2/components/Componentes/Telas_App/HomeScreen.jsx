import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { View, Text, ScrollView, Image, TextInput } from 'react-native';
import ProfissionaisScreen from './ProfissionaisScreen';
import Recomendacao from './Recomendacao';
import PerfilFisio from '../Usuario/Profissional/PerfilFisio';  
import BottomBar from './BottomBar';

import app from '../../API';

const HomeScreen = ({ navigation }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState([]);
  const [professionalProfiles, setProfessionalProfiles] = useState([]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserData(user.uid);
      } else {
        setCurrentUser(null);
        setUserData([]);
        setProfessionalProfiles([]);
      }
    });

    return unsubscribe;
  }, []);

  const fetchUserData = async (uid) => {
    try {
      const db = getFirestore(app);
      const colRef = collection(db, 'Usuarios');
      
      // Consulta para buscar os dados do usuário atual
      const userQuery = query(colRef, where('idUsuario', '==', uid));
      const userSnapshot = await getDocs(userQuery);
      
      // Consulta para buscar perfis profissionais
      const professionalQuery = query(colRef, where('isProfessional', '==', true));
      const professionalSnapshot = await getDocs(professionalQuery);

      // Processando os dados do usuário atual
      const userData = [];
      userSnapshot.forEach((doc) => {
        userData.push({ id: doc.id, ...doc.data() });
      });

      // Processando os perfis profissionais
      const professionalData = [];
      professionalSnapshot.forEach((doc) => {
        professionalData.push({ id: doc.id, ...doc.data() });
      });

      console.log('Dados do usuário:', userData);
      console.log('Perfis profissionais:', professionalData);

      // Atualizando o estado
      setUserData(userData);
      setProfessionalProfiles(professionalData);

    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView>
        <View style={{ backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          <Image source={require('../../imagens/logo.png')} style={{ width: 70, height: 70 }} />
          <Text style={{ fontSize: 25, marginTop: 10 }}>Bem-vindo</Text>
          {userData?.length > 0 && (
            <Text style={{ fontSize: 16, marginTop: 10 }}>{userData[0].Nome}</Text>
          )}
        </View>
        <View style={{ alignItems: 'center', marginTop: 60, marginBottom: 40 }}>
          <View style={{ width: 350, height: 45, borderRadius: 10, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center' }}>
            <Image source={require('../../imagens/lupa.png')} style={{ width: 30, height: 30, marginHorizontal: 10 }} />
            <TextInput style={{ flex: 1, padding: 8 }} placeholder="Encontre os melhores profissionais aqui" />
          </View>
        </View>

        {/* Exibir somente perfis profissionais */}
        {professionalProfiles.length > 0 ? (
  <PerfilFisio perfis={professionalProfiles} />
) : (
  <Text style={{ textAlign: 'center', marginTop: 20 }}>Nenhum perfil profissional encontrado.</Text>
)}


        <ProfissionaisScreen />
   
        <BottomBar navigation={navigation} />
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
