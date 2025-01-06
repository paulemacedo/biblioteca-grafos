import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TextInput } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { Button } from "react-native-paper";

const PerfilFisioCadastro = () => {
  const navigation = useNavigation();
  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [especializacao, setEspecializacao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [formacao, setFormacao] = useState("");
  const [cursos, setCursos] = useState("");

  const cadastrarPerfil = () => {
    const novoPerfil = {
      nome: nome,
      idade: idade,
      especializacao: especializacao,
      fotos: [
        require("./imagens/f.png"),
        require("./imagens/f.png"),
        require("./imagens/f.png"),
      ],
      descricao: descricao,
      formacao: [formacao],
      cursos: [cursos],
    };

    // Aqui você pode adicionar a lógica para salvar o novo perfil no banco de dados ou em algum estado compartilhado.
    // Por exemplo, você pode enviar o novo perfil para uma API ou armazená-lo em um estado global como o Redux.

    // Após cadastrar o perfil, você pode navegar para a tela de exibição do perfil ou realizar alguma outra ação.
    navigation.navigate("PerfilFisio");
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <Text style={styles.label}>Nome:</Text>
        <TextInput
          style={styles.input}
          value={nome}
          onChangeText={(text) => setNome(text)}
        />

        <Text style={styles.label}>Idade:</Text>
        <TextInput
          style={styles.input}
          value={idade}
          onChangeText={(text) => setIdade(text)}
        />

        <Text style={styles.label}>Especialização:</Text>
        <TextInput
          style={styles.input}
          value={especializacao}
          onChangeText={(text) => setEspecializacao(text)}
        />

        <Text style={styles.label}>Descrição:</Text>
        <TextInput
          style={styles.input}
          value={descricao}
          onChangeText={(text) => setDescricao(text)}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Formação acadêmica:</Text>
        <TextInput
          style={styles.input}
          value={formacao}
          onChangeText={(text) => setFormacao(text)}
        />

        <Text style={styles.label}>Cursos:</Text>
        <TextInput
          style={styles.input}
          value={cursos}
          onChangeText={(text) => setCursos(text)}
        />

        <Button
          mode="contained"
          style={styles.button}
          onPress={cadastrarPerfil}
        >
          Cadastrar
        </Button>
      </View>
    </ScrollView>
  );
};

// Estilos CSS

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    backgroundColor: "purple",
    paddingVertical: 10,
    borderRadius: 10,
  },
});

export default PerfilFisioCadastro;