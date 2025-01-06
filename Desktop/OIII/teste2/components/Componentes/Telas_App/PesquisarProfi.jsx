import React from "react";
import { View, TextInput, Button,ScrollView } from "react-native";
import ProfissionaisScreen from "./ProfissionaisScreen";

const PesquisarProfi = () => {
  const [searchText, setSearchText] = React.useState("");

  const handleSearch = () => {
    // Lógica para realizar a pesquisa de profissionais com base no texto digitado
    // Você pode chamar uma função de pesquisa aqui ou navegar para outra tela com os resultados da pesquisa
    console.log("Realizando pesquisa por profissionais: ", searchText);
  };

  return (
    <>
          <ScrollView >
      <View style={{ flex: 1, alignItems: "center" }}>
        <TextInput
          style={{ width: 350, height: 40, borderColor: "gray", borderWidth: 1, marginBottom: 16 }}
          onChangeText={text => setSearchText(text)}
          value={searchText}
          placeholder="Digite sua pesquisa"
        />
        <Button title="Pesquisar" onPress={handleSearch} />
      </View>
      <View style={{ flex: 1, alignItems: "center" }}>
        <ProfissionaisScreen />
      </View>
      </ScrollView>
    </>
  );
};

export default PesquisarProfi;