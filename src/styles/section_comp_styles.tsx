import { StyleSheet } from 'react-native';

export const HEADER_HEIGHT = 56;           // adjust to taste
export const HEADER_HORIZONTAL_PADDING = 20;

export const sectionStyles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,                 // fixed height
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HEADER_HORIZONTAL_PADDING,
    borderBottomWidth: 1,
    // borderBottomColor will come from theme.colors.border
  },
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