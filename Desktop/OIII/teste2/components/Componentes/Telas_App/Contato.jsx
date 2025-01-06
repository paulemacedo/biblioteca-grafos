import React from "react";
import { TouchableOpacity, View, Image, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";

const Contato = ({ contatos }) => {
  const navigation = useNavigation();

  const onPress = () => {
    navigation.navigate("Mensagem", { contato: contatos });
  };

  return (
    <TouchableOpacity
      style={{ width: 400, height: 100, marginRight: 5, borderRadius: 20, marginBottom: 15 }}
      onPress={onPress}
    >
      <View
        style={{
          width: 400,
          height: "100%",
          marginLeft: 10,
          marginRight: 10,
          backgroundColor: "#FFFFFF",
         
          justifyContent: "center",
        }}
      >
        <Image style={{ width: 50, height: "50%" }} source={require("../../imagens/f.png")} />
        <Text >{contatos.nome}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default Contato;