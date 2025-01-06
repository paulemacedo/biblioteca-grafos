import React from 'react';
import { View } from 'react-native';
import { BottomNavigation, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import Consultas from '../Consultas/Consultas';

const BottomBar = () => {
  const [index, setIndex] = React.useState(3);
  const navigation = useNavigation();

  const handleNavigation = (selectedIndex) => {
    setIndex(selectedIndex);
  };

  const theme = useTheme();

  const renderIcon = ({ route, focused, color }) => {
    let iconName;
    if(route.key == null ){

    }
    else if (route.key === 'home_button_1') {
      iconName = focused ? 'search-web' : 'search-web';
    } else if (route.key === 'home_button_2') {
      iconName = focused ? 'calendar' : 'calendar-outline';
    } else if (route.key === 'home_button_3') {
      iconName = focused ? 'message' : 'message-outline';
    } else if (route.key === 'home_button_4') {
      iconName = focused ? 'home' : 'home-outline';
    }

    return <Icon name={iconName} size={24} color={color} />;
  };

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'home_button_1':
        return (
          <View style={{ flex: 1 }}>
            {/* Conteúdo para home_button_1 */}
          </View>
        );
      case 'home_button_2':
        return (
          <View style={{ flex: 1 }}>
            <Consultas />
          </View>
        );
      case 'home_button_3':
        return (
          <View style={{ flex: 1 }}>
            {/* Conteúdo para home_button_3 */}
          </View>
        );
      case 'home_button_4':
        return (
          <View style={{ flex: 1 }}>
            {/* Conteúdo para home_button_4 */}
          </View>
        );
      default:
        return null;
    }
  };

  const handleIndexChange = (newIndex) => {
    setIndex(newIndex);

    // Realize a navegação para a tela correspondente ao novo índice
    if (newIndex === 0) {
      navigation.navigate('Agenda');
    } else if (newIndex === 1) {
      navigation.navigate('Agenda');
    } else if (newIndex === 2) {
      navigation.navigate('Contacts');
    } else if (newIndex === 3) {
      navigation.navigate('HomeScreen');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <BottomNavigation
        navigationState={{
          index,
          routes: [
            { key: 'home_button_1', title: 'Pesquisar' },
            { key: 'home_button_2', title: 'Consultas' },
            { key: 'home_button_3', title: 'Mensagens' },
            { key: 'home_button_4', title: 'Home' },
          ],
        }}
        onIndexChange={handleIndexChange}
        renderScene={renderScene}
        renderIcon={renderIcon}
        theme={{ colors: { primary: theme.colors.primary } }}
      />
    </View>
  );
};

export default BottomBar;