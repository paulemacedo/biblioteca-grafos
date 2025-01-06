import { Timestamp, addDoc, collection, getDocs, getFirestore, query, where } from "firebase/firestore";
import app from "../../API";

const db = getFirestore(app);
const consultaCollection = collection(db,'Consultas');


export async function FetchMinhasConsultas() {
    try {
      const querySnapshot = await getDocs(consultaCollection);
      return querySnapshot;
    } catch (error) {
      console.error("Error fetching consultations:", error);
      throw error;
    }
  }