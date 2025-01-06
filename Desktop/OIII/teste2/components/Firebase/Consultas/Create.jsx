import { Timestamp, addDoc, collection, documentId, getFirestore } from "firebase/firestore";
import app from "../../API";

const db = getFirestore(app);
const consultaCollection = collection(db,'Consultas');
const ConsultaItemInterface = {
    idProfissional:"",
    idPaciente: "",
    especialidade: "",
    dataConsulta: new Date(),
    horaConsulta:"",
    localConsulta: "",
    precoConsulta: 0,
    completou: false
    


}
export async function createConsulta(ConsultaItemInterface){

    const dbData = {
        createdAt: Timestamp.now(),
        completedAt:'',
        ...ConsultaItemInterface
    }
return await addDoc(consultaCollection,dbData);
}