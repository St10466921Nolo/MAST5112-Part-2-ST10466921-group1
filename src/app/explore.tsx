import { ScrollView, StyleSheet, Text,TextInput, View } from 'react-native';

const sections = [
  'Starter',
  'Popular now',
  'Recently added',
  'Quick picks',
];

export default function ExploreScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Chefs Page</Text>
      <Text style={styles.subtitle}>Enter type of food/dishes you are interested in.</Text>
      <TextInput
        style={styles.input}
        placeholder="Search for dishes..."
      />
      <TextInput
        style={styles.input}
        placeholder="Add dish price..."
      />
      <TextInput
        style={styles.input}
        placeholder="Add dish description..."
      />




      {sections.map((section, index) => (
        <View key={section} style={styles.card}>
          <Text style={styles.cardLabel}>Section {index + 1}</Text>
          <Text style={styles.cardTitle}>{section}</Text>
          <Text style={styles.cardText}>
            A simple content block for your next idea, panel, or collection.
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 32,
    backgroundColor: '#ffffff',
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#60646C',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#F0F0F3',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E0E1E6',
  },
  cardLabel: {
    color: '#60646C',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#60646C',
  },
});