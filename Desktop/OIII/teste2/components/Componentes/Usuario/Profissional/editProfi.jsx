import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, ScrollView } from 'react-native';

import * as ImagePicker from 'expo-image-picker';

import { createUsuario } from '../../../Firebase/Usuario/Create';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs, query, where  } from 'firebase/firestore';
import app from '../../../API';
const EditarPerfil = () => {
  const [usuario, setUsuario] = useState(null);
  const [foto, setFoto] = useState(null);
  const [especialidades, setEspecialidades] = useState([]);
  const [descricao, setDescricao] = useState('');
  const [formacoes, setFormacoes] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState([]);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        fetchUserData(user.uid);
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
    });

    return unsubscribe;
  }, []);

  const fetchUserData = async (uid) => {
    try {
      const db = getFirestore(app);
      const colRef = collection(db, 'Usuarios');
      const q = query(colRef, where('idUsuario', '==', uid));
      const querySnapshot = await getDocs(q);

      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setUserData(data);
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    }
  };
  const adicionarEspecialidade = (especialidade) => {
    setEspecialidades([...especialidades, especialidade]);
  };

  const removerEspecialidade = (index) => {
    const novasEspecialidades = [...especialidades];
    novasEspecialidades.splice(index, 1);
    setEspecialidades(novasEspecialidades);
  };

  const adicionarFormacao = (formacao) => {
    setFormacoes([...formacoes, formacao]);
  };

  const removerFormacao = (index) => {
    const novasFormacoes = [...formacoes];
    novasFormacoes.splice(index, 1);
    setFormacoes(novasFormacoes);
  };

  const adicionarCurso = (curso) => {
    setCursos([...cursos, curso]);
  };

  const removerCurso = (index) => {
    const novosCursos = [...cursos];
    novosCursos.splice(index, 1);
    setCursos(novosCursos);
  };

  const selecionarFoto = async () => {
    // Abre o seletor de imagens
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permissão de acesso à galeria de fotos negada.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setFoto(result.uri);
    }
  };

  const salvarPerfil = async () => {
    // Atualiza os dados do usuário no banco de dados
    const atualizacao = {
       especialidades,
      descricao,
      formacoes, 
      cursos,
      foto,
    };
    userData.especialidades = especialidades;
    userData.descricao = descricao;
    userData.formacoes = formacoes;
    userData.cursos = cursos;

    const addedUser = await createUsuario(userData);
    console.log('Conta criada:', addedUser);
    alert('Perfil atualizado com sucesso!');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        {foto ? (
          <Image source={{ uri: foto }} style={styles.image} />
        ) : (
          <Image source={{ uri: usuario?.foto }} style={styles.image} />
        )}
        <Button title="Selecionar foto" onPress={selecionarFoto} />
      </View>
      <View>
        <TextInput
          style={styles.input}
          placeholder="Adicionar especialidade"
          onSubmitEditing={(event) => adicionarEspecialidade(event.nativeEvent.text)}
        />
        {especialidades.map((especialidade, index) => (
          <View key={index} style={styles.itemContainer}>
            <Text>{especialidade}</Text>
            <Button title="Remover" onPress={() => removerEspecialidade(index)} />
          </View>
        ))}
      </View>
      <View>
        <TextInput
          style={styles.input}
          placeholder="Adicionar formação"
          onSubmitEditing={(event) => adicionarFormacao(event.nativeEvent.text)}
        />
        {formacoes.map((formacao, index) => (
          <View key={index} style={styles.itemContainer}>
            <Text>{formacao}</Text>
            <Button title="Remover" onPress={() => removerFormacao(index)} />
          </View>
        ))}
      </View>
      <View>
        <TextInput
          style={styles.input}
          placeholder="Adicionar curso"
          onSubmitEditing={(event) => adicionarCurso(event.nativeEvent.text)}
        />
        {cursos.map((curso, index) => (
          <View key={index} style={styles.itemContainer}>
            <Text>{curso}</Text>
            <Button title="Remover" onPress={() => removerCurso(index)} />
          </View>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Descrição"
        value={descricao}
        onChangeText={setDescricao}
        multiline
      />
      <Button title="Salvar perfil" onPress={salvarPerfil} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  image: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
});

export default EditarPerfil;