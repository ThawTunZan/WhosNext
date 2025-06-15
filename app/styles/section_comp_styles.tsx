import { StyleSheet } from 'react-native';

export const sectionStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  listContentContainer: {
    flexGrow: 1,
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    marginLeft: 5,
    marginTop: 10,
  },
  errorText: {
    textAlign: 'center',
  },
  actionButton: {
    margin: 16,
  },
  nextPayerChip: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  nextPayerChipText: {
    fontSize: 14,
  },
}); 