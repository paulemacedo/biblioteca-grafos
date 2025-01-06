import React from 'react';
import { View, Text, Image } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import StarRating from 'react-native-star-rating';

const Recomendacao = () => {
  return (
    <View>
      <Text style={{ marginLeft: 10, marginTop: 30, fontSize: 20 }}>
        Profissionais recomendados
      </Text>

      <View style={{ flexDirection: 'row' }}>
        <Card style={{ width: '50%', height: 253, marginTop: 20, borderRadius: 10 }}>
          <Image style={{ width: '100%', height: '100%', resizeMode: 'cover' }} source={require('../../imagens/face.png')} />
          <StarRating disabled={false} maxStars={5} rating={0} starSize={20} />
        </Card>

        <Card style={{ width: '50%', height: 253, marginLeft: 5, marginTop: 20, borderRadius: 10 }}>
          <Image style={{ width: '100%', height: '100%', resizeMode: 'cover' }} source={require('../../imagens/face.png')} />
          <StarRating disabled={true} maxStars={5} rating={0} starSize={20} />
        </Card>

        <Card style={{ width: '50%', height: 253, marginLeft: 5, marginTop: 20, borderRadius: 10 }}>
        <StarRating disabled={true} maxStars={5} rating={0} starSize={20} />
          <Image style={{ width: '100%', height: '100%', resizeMode: 'cover' }} source={require('../../imagens/face.png')} />
         
        </Card>
      </View>
    </View>
  );
};

export default Recomendacao;