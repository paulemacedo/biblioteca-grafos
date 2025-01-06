import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, TouchableOpacity, Image } from "react-native";
import { createUsuario } from "../../Firebase/Usuario/Create";
import { useNavigation } from "@react-navigation/native";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import * as ImagePicker from 'expo-image-picker';

const AddUser = () => {
  const navigation = useNavigation();
  const [isProfessional, setIsProfessional] = useState(false);
  const [nome, setNome] = useState("");
  const [cpf, setCPF] = useState("");
  const [dataNasc, setDataNasc] = useState("");
  const [cidade, setCidade] = useState("");
  const [rua, setRua] = useState("");
  const [cep, setCEP] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [especialidades, setEspecialidades] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [formacao, setFormacao] = useState([]);
  const [imageUri, setImageUri] = useState(null);

  const auth = getAuth();

  async function criarUser() {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // Atualizar o perfil do usuário
      await updateProfile(user, { displayName: nome });

      const userData = {
        idUsuario: user.uid,
        Nome: nome,
        CPF: cpf,
        dataNasc: dataNasc,
        Cidade: cidade,
        Rua: rua,
        CEP: cep,
        isProfessional: isProfessional,
        especialidades: especialidades,
        cursos: cursos,
        formacao: formacao,
        imageUri: imageUri, // Adiciona a URI da imagem se existir
      };

      // Adicionar o usuário ao Firestore
      await createUsuario(userData);

      Alert.alert(
        "Conta criada",
        "Usuário criado com sucesso!",
        [
          { text: "OK", onPress: () => navigation.navigate("FormLogin") }
        ]
      );

    } catch (error) {
      console.error('Erro ao criar sua conta:', error);
      Alert.alert(
        "Erro",
        "Ocorreu um erro ao criar sua conta. Por favor, tente novamente.",
        [
          { text: "OK", onPress: () => console.log("OK Pressed") }
        ]
      );
    }
  }

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Erro', 'Permissão para acessar a galeria é necessária!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.uri);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Criar Conta</Text>
      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
      />
      <TextInput
        style={styles.input}
        placeholder="CPF"
        value={cpf}
        onChangeText={setCPF}
      />
      <TextInput
        style={styles.input}
        placeholder="Data de Nascimento"
        value={dataNasc}
        onChangeText={setDataNasc}
      />
      <TextInput
        style={styles.input}
        placeholder="Cidade"
        value={cidade}
        onChangeText={setCidade}
      />
      <TextInput
        style={styles.input}
        placeholder="Rua"
        value={rua}
        onChangeText={setRua}
      />
      <TextInput
        style={styles.input}
        placeholder="CEP"
        value={cep}
        onChangeText={setCEP}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry={true}
        value={senha}
        onChangeText={setSenha}
      />
      <View style={styles.buttonContainer}>
        <Text style={styles.buttonLabel}>Sou profissional:</Text>
        <Button
          title={isProfessional ? "Sim" : "Não"}
          onPress={() => setIsProfessional(!isProfessional)}
        />
      </View>

      {isProfessional && (
        <View style={styles.professionalFields}>
          <Text style={styles.subtitle}>Especializações</Text>
          <TextInput
            style={styles.input}
            placeholder="Adicionar especialização"
            onSubmitEditing={(event) => setEspecialidades([...especialidades, event.nativeEvent.text])}
          />
          {especialidades.map((esp, index) => (
            <Text key={index} style={styles.listItem}>{esp}</Text>
          ))}

          <Text style={styles.subtitle}>Formação Acadêmica</Text>
          <TextInput
            style={styles.input}
            placeholder="Adicionar formação acadêmica"
            onSubmitEditing={(event) => setFormacao([...formacao, event.nativeEvent.text])}
          />
          {formacao.map((f, index) => (
            <Text key={index} style={styles.listItem}>{f}</Text>
          ))}

          <Text style={styles.subtitle}>Cursos</Text>
          <TextInput
            style={styles.input}
            placeholder="Adicionar curso"
            onSubmitEditing={(event) => setCursos([...cursos, event.nativeEvent.text])}
          />
          {cursos.map((c, index) => (
            <Text key={index} style={styles.listItem}>{c}</Text>
          ))}

          <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePicker}>
            <Text style={styles.imagePickerText}>Selecionar Imagem</Text>
          </TouchableOpacity>
          {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
        </View>
      )}

      <Button title="Criar Conta" onPress={criarUser} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonLabel: {
    marginRight: 10,
  },
  professionalFields: {
    width: '100%',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  listItem: {
    fontSize: 16,
    marginVertical: 5,
  },
  imagePickerButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: 16,
    color: '#333',
  },
  image: {
    width: 100,
    height: 100,
    marginTop: 10,
  },
});

export default AddUser;
