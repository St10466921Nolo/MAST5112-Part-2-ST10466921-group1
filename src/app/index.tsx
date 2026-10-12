import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

export default function HomeScreen() {
  const colors = Colors.light;

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Nolistic</Text>
        <Text style={styles.title}>Nolistic foods</Text>
        <Text style={styles.subtitle}>
           Welcome have a Nolistic experience with our app. Explore the menu and discover new dishes to try.
        </Text>
      </View>

      <View style={styles.cardGrid}>
        {[
          ['Overview', 'Keep the app centered on useful, mobile-first interactions.'],
          ['Explore', 'Browse the curated sections in the explore tab.'],
          ['Build', 'Use this as a clean base for your next feature.'],
        ].map(([title, description]) => (
          <View key={title} style={[styles.card, { borderColor: colors.backgroundElement }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>{description}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 32,
    backgroundColor: '#ffffff73',
  },
  hero: {
    paddingVertical: 24,
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: '#60646C',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: '#5d4949',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#5a5a5f',
  },
  cardGrid: {
    gap: 16,
    marginTop: 12,
  },
  card: {
    padding: 18,
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: '#dbdbe4',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
  },
});