import { Timestamp, addDoc, collection, getFirestore } from "firebase/firestore";
import app from "../../API";
import { getCurrentUser } from "./currentUser";

const db = getFirestore(app);

const UsuarioItemInterface = {
  idUsuario : "",
  Nome: "",
  CPF: "",
  dataNasc: new Date(),
  Cidade: "",
  Rua: "",
  CEP: "",
  email: "",
  senha: "",
  isProfessional: false

}

export async function updateUsuario(UsuarioItemInterface){

    const dbData = {
      especialidades: UsuarioItemInterface.especialidades,
        fotos: UsuarioItemInterface.fotos,
        cursos: UsuarioItemInterface.cursos,
        ...UsuarioItemInterface
    }
return await addDoc(usuarioCollection,dbData);
}
