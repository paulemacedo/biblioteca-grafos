import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { View, Text, ScrollView, Image, TextInput } from 'react-native';
import PerfilFisio from '../Usuario/Profissional/PerfilFisio'; // Importando o componente de perfis
import app from '../../API';

const Infinity = ({ navigation }) => {
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
    
        {/* Exibir somente perfis profissionais */}
        {professionalProfiles.length > 0 ? (
          <PerfilFisio perfis={professionalProfiles} />
        ) : (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>Nenhum perfil profissional encontrado.</Text>
        )}
      </ScrollView>
    </View>
  );
};

export default Infinity;
