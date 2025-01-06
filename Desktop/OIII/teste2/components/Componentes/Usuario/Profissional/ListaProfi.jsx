import React, { useEffect, useState } from "react";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import PerfilFisio from "./PerfilFisio"; // Componente que renderiza os perfis de fisioterapeutas
import app from "../../../API"; // Certifique-se de que está importando corretamente a instância do Firebase

const Fisioterapeutas = () => {
  const [perfisCadastrados, setPerfisCadastrados] = useState([]);

  useEffect(() => {
    const fetchProfissionais = async () => {
      try {
        const db = getFirestore(app);
        const colRef = collection(db, "Usuarios");
        const q = query(colRef, where("isProfessional", "==", true));
        const querySnapshot = await getDocs(q);
        const perfis = [];
        querySnapshot.forEach((doc) => {
          perfis.push({ id: doc.id, ...doc.data() });
        });
        setPerfisCadastrados(perfis); 
      } catch (error) {
        console.error("Erro ao buscar perfis de profissionais: ", error);
      }
    };

    fetchProfissionais();
  }, []);

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.text}>Bem-vindo(a), Esses são os nossos profissionais disponíveis:</Text>
      </View>
      <PerfilFisio perfis={perfisCadastrados} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },
});

export default Fisioterapeutas;
