import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Dialog, List, Searchbar, IconButton } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { SUPPORTED_CURRENCIES } from '@/src/utilities/CurrencyUtilities';

interface CurrencyModalProps {
    visible: boolean;
    onDismiss: () => void;
    selectedCurrency: string;
    onSelectCurrency: (currency: string) => void;
}

const CurrencyModal: React.FC<CurrencyModalProps> = ({
    visible,
    onDismiss,
    selectedCurrency,
    onSelectCurrency,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter currencies based on search
    const filteredCurrencies = SUPPORTED_CURRENCIES.filter(currency =>
        currency.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCurrencySelect = (currency: string) => {
        onSelectCurrency(currency);
        setSearchQuery(''); // Reset search when selection is made
        onDismiss();
    };

    return (
        <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
            <View style={styles.header}>
                <Dialog.Title style={styles.title}>Select Currency</Dialog.Title>
                <IconButton
                    icon="close"
                    size={24}
                    onPress={onDismiss}
                    style={styles.closeButton}
                />
            </View>
            <Searchbar
                placeholder="Search currency"
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
            />
            <Dialog.ScrollArea style={styles.scrollArea}>
                <ScrollView>
                    {filteredCurrencies.map((currency) => (
                        <List.Item
                            key={currency}
                            title={currency}
                            onPress={() => handleCurrencySelect(currency)}
                            right={props =>
                                selectedCurrency === currency ? (
                                    <List.Icon {...props} icon="check" />
                                ) : null
                            }
                        />
                    ))}
                    {filteredCurrencies.length === 0 && (
                        <List.Item
                            title="No currencies found"
                            description="Try a different search term"
                        />
                    )}
                </ScrollView>
            </Dialog.ScrollArea>
        </Dialog>
    );
};

const styles = StyleSheet.create({
    dialog: {
        zIndex: 999, // Ensure it's always on top
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 4,
    },
    title: {
        flex: 1,
    },
    closeButton: {
        margin: 0,
    },
    searchBar: {
        margin: 16,
        marginTop: 0,
    },
    scrollArea: {
        maxHeight: 400,
    },
});

export default CurrencyModal; 