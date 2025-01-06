import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

const ProfissionaisScreen = () => {
const navigation = useNavigation();
const  handleOnPress= ()=>{
navigation.navigate("Fisioterapeutas")
} 


  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: '100%', height: 411, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          <TouchableOpacity style={{ width: 100, height: 100, marginRight: 5, borderRadius: 20 } } onPress={handleOnPress} >
            <View style={{ width: 100, height: '100%', marginLeft: 10, marginRight: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <Image style={{ width: '100%', height: '50%' }} source={require('../../imagens/f.png')} />
              <Text style={{ textAlign: 'center' }}>Fisioterapeuta</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={{ width: 100, height: 100, marginRight: 5, borderRadius: 20 } } onPress={handleOnPress} >
            <View style={{ width: 100, height: '100%', marginLeft: 10, marginRight: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <Image style={{ width: '100%', height: '50%' }} source={require('../../imagens/f.png')} />
              <Text style={{ textAlign: 'center' }}>Fisioterapeuta</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={{ width: 100, height: 100, marginRight: 5, borderRadius: 20 } } onPress={handleOnPress} >
            <View style={{ width: 100, height: '100%', marginLeft: 10, marginRight: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <Image style={{ width: '100%', height: '50%' }} source={require('../../imagens/f.png')} />
              <Text style={{ textAlign: 'center' }}>Fisioterapeuta</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <TouchableOpacity style={{ width: 100, height: 100, marginRight: 5, borderRadius: 20 } } onPress={handleOnPress} >
            <View style={{ width: 100, height: '100%', marginLeft: 10, marginRight: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <Image style={{ width: '100%', height: '50%' }} source={require('../../imagens/f.png')} />
              <Text style={{ textAlign: 'center' }}>Fisioterapeuta</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={{ width: 100, height: 100, marginRight: 5, borderRadius: 20 } } onPress={handleOnPress} >
            <View style={{ width: 100, height: '100%', marginLeft: 10, marginRight: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <Image style={{ width: '100%', height: '50%' }} source={require('../../imagens/f.png')} />
              <Text style={{ textAlign: 'center' }}>Fisioterapeuta</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={{ width: 100, height: 100, marginRight: 5, borderRadius: 20 } } onPress={handleOnPress} >
            <View style={{ width: 100, height: '100%', marginLeft: 10, marginRight: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <Image style={{ width: '100%', height: '50%' }} source={require('../../imagens/f.png')} />
              <Text style={{ textAlign: 'center' }}>Fisioterapeuta</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <TouchableOpacity style={{ width: 100, height: 100, marginRight: 5, borderRadius: 20 } } onPress={handleOnPress} >
            <View style={{ width: 100, height: '100%', marginLeft: 10, marginRight: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <Image style={{ width: '100%', height: '50%' }} source={require('../../imagens/f.png')} />
              <Text style={{ textAlign: 'center' }}>Fisioterapeuta</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={{ width: 100, height: 100, marginRight: 5, borderRadius: 20 } } onPress={handleOnPress} >
            <View style={{ width: 100, height: '100%', marginLeft: 10, marginRight: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <Image style={{ width: '100%', height: '50%' }} source={require('../../imagens/f.png')} />
              <Text style={{ textAlign: 'center' }}>Fisioterapeuta</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={{ width: 100, height: 100, marginRight: 5, borderRadius: 20 } } onPress={handleOnPress} >
            <View style={{ width: 100, height: '100%', marginLeft: 10, marginRight: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
              <Image style={{ width: '100%', height: '50%' }} source={require('../../imagens/f.png')} />
              <Text style={{ textAlign: 'center' }}>Fisioterapeuta</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ProfissionaisScreen;