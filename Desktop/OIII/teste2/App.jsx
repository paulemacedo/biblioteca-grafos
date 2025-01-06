import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { NativeBaseProvider } from 'native-base';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './components/Componentes/Telas_App/HomeScreen';
import FormLogin from './components/Componentes/Usuario/FormLogin';
import AppBarMain from './components/Componentes/Telas_App/AppBarMain';
import Consultas from './components/Componentes/Consultas/Consultas';
import PesquisarProfi from './components/Componentes/Telas_App/PesquisarProfi';
import Mensagens from './components/Componentes/Telas_App/Mensagens';
import Mensagem from './components/Componentes/Telas_App/Mensagem';
import Contato from './components/Componentes/Telas_App/Contato';
import Fisioterapeutas from './components/Componentes/Usuario/Profissional/Fisioterapeutas';
import PerfilFisio from './components/Componentes/Usuario/Profissional/PerfilFisio';
import AddConsulta from './components/Componentes/Consultas/AddConsulta';
import AddPaga from './components/AddPaga';
import HomeMensagens from './components/Componentes/Chat/HomeMensagens';
import Avaliacao from './components/Componentes/Telas_App/AvaliacaoScreen';
import Cadastro from './components/Componentes/Usuario/AddUser';
import EditarPerfil from './components/Componentes/Usuario/Profissional/editProfi';
import firebaseConfig from './components/API';
import HomeMsg from './components/Componentes/Chat/ChatList';
import Infinity from './components/Componentes/Telas_App/Infinity';
import ContactsScreen from './components/Componentes/Chat/ContactsScreen';
import ChatRoom from './components/Componentes/Chat/ChatList';
import Agenda from './components/Componentes/Consultas/Agenda'
const Stack = createStackNavigator();

const App = () => {
  return (
    <NativeBaseProvider>
      <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="FormLogin" component={FormLogin} />
          <Stack.Screen name="HomeScreen" component={HomeScreen} />
          <Stack.Screen name="AppBarMain" component={AppBarMain} />
          <Stack.Screen name="Consultas" component={Consultas} />
          <Stack.Screen name="Pesquisa" component={PesquisarProfi} />
          <Stack.Screen name="Mensagens" component={Mensagens} />
          <Stack.Screen name="Contato" component={Contato} />
          <Stack.Screen name="Mensagem" component={Mensagem} />
          <Stack.Screen name="Fisioterapeutas" component={Fisioterapeutas} />
          <Stack.Screen name="Perfil" component={PerfilFisio} />
          <Stack.Screen name="MarcarConsulta" component={AddConsulta} />
          <Stack.Screen name="Pagamentos" component={AddPaga} />
          <Stack.Screen name="Avaliacao" component={Avaliacao} />
          <Stack.Screen name="Cadastro" component={Cadastro} />
          <Stack.Screen name="EditarPerfil" component={EditarPerfil} />
          <Stack.Screen name="HomeMensagens" component={HomeMensagens} />
          <Stack.Screen name="HomeMsg" component={HomeMsg} />
          <Stack.Screen name="Infinity" component={Infinity} />
          <Stack.Screen name="Contacts" component={ContactsScreen} />
          <Stack.Screen name="ChatRoom" component={ChatRoom} />
          <Stack.Screen name="Agenda" component={Agenda} />
        </Stack.Navigator>
      </NavigationContainer>
    </NativeBaseProvider>
  );
};

export default App;
