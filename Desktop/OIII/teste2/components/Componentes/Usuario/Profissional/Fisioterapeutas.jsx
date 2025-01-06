import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import PerfilFisio from "./PerfilFisio"; // Importa o PerfilFisio estilizado
import perfisCadastrados from './ListaProfi'; // Lista de perfis cadastrados
import Infinity from "../../Telas_App/Infinity";
const Fisioterapeutas = () => {
  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.text}>Bem-vindo(a), Esses são os nossos profissionais disponíveis:</Text>
      </View>
      <Infinity />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    marginTop: 50
  },
  text: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },
});

export default Fisioterapeutas;
