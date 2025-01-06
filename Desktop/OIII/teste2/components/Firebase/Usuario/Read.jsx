import { Timestamp, addDoc, collection, getDocs, getFirestore, query, where } from "firebase/firestore";
import app from "../../API";

const db = getFirestore(app);
const usuariosCollection = collection(db,'Usuarios');


export async function FetchMeusUsuarios() {
    try {
      const querySnapshot = await getDocs(usuariosCollection);
      return querySnapshot;
    } catch (error) {
      console.error("Error fetching consultations:", error);
      throw error;
    }
  }