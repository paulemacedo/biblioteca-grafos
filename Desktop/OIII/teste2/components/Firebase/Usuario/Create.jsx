import { Timestamp, addDoc, collection, getFirestore } from "firebase/firestore";
import app from "../../API";

// Obtendo a instância do Firestore
const db = getFirestore(app);
const usuarioCollection = collection(db, 'Usuarios');

// Interface para o usuário
const UsuarioItemInterface = {
  idUsuario: "",
  Nome: "",
  CPF: "",
  dataNasc: new Date(),
  Cidade: "",
  Rua: "",
  CEP: "",
  email: "",
  senha: "",
  isProfessional: false,
  especialidades: [], // Adicionado aqui
  fotos: [], // Adicionado aqui
  cursos: [] // Adicionado aqui
};

export async function createUsuario(usuarioItem) {
  // Preenche campos que podem estar undefined
  const dbData = {
    idUsuario: usuarioItem.idUsuario || '',
    Nome: usuarioItem.Nome || '',
    CPF: usuarioItem.CPF || '',
    dataNasc: usuarioItem.dataNasc || new Date(),
    Cidade: usuarioItem.Cidade || '',
    Rua: usuarioItem.Rua || '',
    CEP: usuarioItem.CEP || '',
    email: usuarioItem.email || '',
    senha: usuarioItem.senha || '',
    isProfessional: usuarioItem.isProfessional || false,
    especialidades: usuarioItem.especialidades || [], // Valor padrão se não definido
    fotos: usuarioItem.fotos || [], // Valor padrão se não definido
    cursos: usuarioItem.cursos || [] // Valor padrão se não definido
  };

  // Adiciona o documento ao Firestore
  return await addDoc(usuarioCollection, dbData);
}
