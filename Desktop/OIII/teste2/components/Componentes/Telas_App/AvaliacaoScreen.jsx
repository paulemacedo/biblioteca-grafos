import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet} from "react-native";
import Slider from '@react-native-community/slider';
const Avaliacao = () => {
  const [rating, setRating] = useState(0);

  const handleRatingChange = (value) => {
    setRating(value);
  };

  const handleSubmit = () => {
    // Lógica para enviar a avaliação
    console.log("Avaliação enviada:", rating);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Avalie o profissinal Rodrigo Muniz</Text>
      <View style={styles.ratingContainer}>
        <Slider
          style={styles.slider}
          step={1}
          minimumValue={0}
          maximumValue={5}
          value={rating}
          onValueChange={handleRatingChange}
        />
        <Text style={styles.rating}>{rating.toFixed(1)}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Enviar Avaliação</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 32,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  slider: {
    flex: 1,
    marginRight: 16,
  },
  rating: {
    fontSize: 24,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "blue",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Avaliacao;