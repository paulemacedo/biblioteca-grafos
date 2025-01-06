import React from 'react';
import { View, Text, Image, ImageBackground } from 'react-native';

const ProfissionaisRecomendadosScreen = () => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ marginLeft: 10, marginTop: 30, fontSize: 20 }}>PROFISSIONAIS RECOMENDADOS DA CIDADE</Text>

      <View style={{ width: 380, height: 390 }}>
        <ImageBackground
          style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
          source={require('./imagens/face.png')}
        >
          <View style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10 }}>
            {/* Conteúdo adicional do ViewFlipper */}
          </View>
        </ImageBackground>

        <View style={{ width: 300, height: 50, marginLeft: 15, marginTop: 30, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 10 }}>
          <Text style={{ marginLeft: 50, color: '#FFFFFF' }}>Rodrigo Muniz</Text>
          <Text style={{ marginLeft: 60, marginBottom: 5, color: '#FFFFFF' }}>1km de distância</Text>

          <View style={{ width: 50, height: 50, marginLeft: 0, borderRadius: 5 }}>
            <Image style={{ width: 50, height: 50 }} source={require('./imagens/face.png')} />
          </View>
        </View>
      </View>
    </View>
  );
};

export default ProfissionaisRecomendadosScreen;