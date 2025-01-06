import React from "react";
import { View, Text, StyleSheet } from 'react-native';

const Consulta = ({
  dataConsulta,
  especialidade,
  horaConsulta,
  idConsulta,
  idPaciente,
  idProfissional,
  local,
  preco
}) => {
  return (
    <View style={styles.consultaItem}>
      <View>
        <Text style={styles.especialidade}>{especialidade}</Text>
        <Text style={styles.local}>{local}</Text>
      </View>
      <View style={styles.dateTimeContainer}>
        <Text style={styles.dataConsulta}>{dataConsulta}</Text>
        <Text style={styles.horaConsulta}>{horaConsulta}</Text>
      </View>

        <Text style={styles.preco}>{preco}</Text>

    </View>
  );
};

export default Consulta;

const styles = StyleSheet.create({
  consultaItem: {
    width: 380,
    height: 80,
    marginTop: 10,
    backgroundColor: '#D8D2D2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  especialidade: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  local: {
    fontSize: 16,
  },
  dateTimeContainer: {
    alignItems: 'center',
  },
  dataConsulta: {
    fontSize: 16,
  },
  horaConsulta: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  preco: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});