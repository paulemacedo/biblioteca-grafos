import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TextInput, Button, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";




const FormLogin = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = getAuth();

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate('HomeScreen');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCadastro = () => {
    navigation.navigate('Cadastro');
  };

  return (
    <ScrollView>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 10 }}>
        <Image source={require('../../imagens/logo.png')} style={{ width: 115, height: 95 }} />
      </View>

      <View style={{ margin: 20 }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: 'purple' }}>Bem-vindo!</Text>
        <Text style={{ opacity: 0.7 }}>Por favor, preencha os campos</Text>
        <View style={{ height: 30 }} />

        <Text style={{ opacity: 0.7, fontWeight: 'bold' }}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
        />

        <View style={{ height: 20 }} />

        <Text style={{ opacity: 0.7, fontWeight: 'bold' }}>Senha</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
          secureTextEntry
        />

        <View style={{ height: 10 }} />

        <Button title="Entrar" onPress={handleSignIn} />

        <View style={{ height: 10 }} />
        <Text style={{ opacity: 0.7 }}>Ou entre com</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <Image source={require('../../imagens/google.png')} style={{ width: 40, height: 40, margin: 12 }} />
          <Image source={require('../../imagens/linkedin.png')} style={{ width: 40, height: 40, margin: 12 }} />
          <Image source={require('../../imagens/face.png')} style={{ width: 40, height: 40, margin: 12 }} />
        </View>

        <Button style={{ color: 'purple', fontWeight: 'bold' }} title='Cadastre-se' onPress={handleCadastro} />
      </View>
    </ScrollView>
  );
};

export default FormLogin;