import React, { useState } from 'react';
import { View, TextInput, Button, Alert, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Timestamp, addDoc, collection, getFirestore } from "firebase/firestore";
const PagamentoScreen = ({route}) => {
  const { valorPagamento, idProfi, idPaci } = route.params;
  const [numeroCartao, setNumeroCartao] = useState('');
  const [nomeCartao, setNomeCartao] = useState('');
  const [dataValidade, setDataValidade] = useState('');
  const [cvv, setCvv] = useState('');


const pagamentoData = [
 { id:"",
  valorPagamento: valorPagamento,
  idProfi: idProfi,
  idPaci: idPaci,
  dataPagamento: Timestamp.now(),
  pago: false
 }

];


  const navigation = useNavigation();
  const handlePagar = () => {



    // Aqui você pode adicionar a lógica para processar o pagamento
    // usando uma API ou qualquer outro método de pagamento

    // Exemplo de validação simples para o número do cartão
    if (numeroCartao.length !== 16) {
      Alert.alert('Erro', 'Número do cartão inválido');
      return;
    }

    // Exemplo de validação simples para o nome no cartão
    if (nomeCartao.trim().length === 0) {
      Alert.alert('Erro', 'Nome no cartão inválido');
      return;
    }

    // Exemplo de validação simples para a data de validade
    if (dataValidade.length !== 5) {
      Alert.alert('Erro', 'Data de validade inválida');
      return;
    }

    // Exemplo de validação simples para o CVV
    if (cvv.length !== 3) {
      Alert.alert('Erro', 'CVV inválido');
      return;
    }

    // Se tudo estiver válido, você pode prosseguir com o processamento do pagamento
    // Aqui você pode adicionar a lógica para processar o pagamento, como chamar uma API, etc.

    Alert.alert('Sucesso', 'Pagamento processado com sucesso!');
    navigation.navigate("Avaliacao");
  };

  return (
    <View>
      <Text>Valor da consulta: {valorPagamento}</Text>
      <TextInput
        placeholder="Número do cartão"
        value={numeroCartao}
        onChangeText={setNumeroCartao}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="Nome no cartão"
        value={nomeCartao}
        onChangeText={setNomeCartao}
      />
      <TextInput
        placeholder="Data de validade (MM/AA)"
        value={dataValidade}
        onChangeText={setDataValidade}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="CVV"
        value={cvv}
        onChangeText={setCvv}
        keyboardType="numeric"
      />
      <Button title="Pagar" onPress={handlePagar} />
    </View>
  );
};

export default PagamentoScreen;