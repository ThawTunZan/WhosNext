// src/services/SettleUpUtilities.tsx

// Define types needed for debt processing
import { Debt } from '@/src/types/DataTypes';
import { convertCurrency } from '@/src/services/CurrencyService';

export type ParsedDebt = {
  fromId: string;
  toId: string;
  amount: number;
  currency: string;
  fromName: string;
  toName: string;
};

/**
 * Shows the full debts in all currencies
 * Converts the raw debts array into a sectioned list format for display.
 * Filters out zero-amount debts and empty sections.
 */
export async function standardCalculateSimplifiedDebts(
    debts: Debt[],
): Promise<Debt[]> {
    const standardSimplifiedDebts: Debt[] = [];
    const epsilon = 0.001; // Small value for float comparison

    for (const debt of debts) {
        if (!isNaN(debt.amount) && debt.amount > epsilon) {
            // Find existing debt with same users and currency
            const existingDebt = standardSimplifiedDebts.find(
                simplifiedDebt => 
                    simplifiedDebt.fromUserName === debt.fromUserName && 
                    simplifiedDebt.fromUserName === debt.toUserName && 
                    simplifiedDebt.currency === debt.currency
            );

            if (!existingDebt) {
                standardSimplifiedDebts.push({
                    fromUserName: debt.fromUserName,
                    toUserName: debt.toUserName,
                    amount: debt.amount,
                    currency: debt.currency,
                });
            } else {
                existingDebt.amount += debt.amount;
            }
        }
    }

    return standardSimplifiedDebts;
}

/**
 * Calculates the minimum set of transactions required to settle all debts,
 * converting all amounts to the trip's currency first.
 */
export async function calculateSimplifiedDebtsToTripCurrency(
    debts: Debt[],
    tripCurrency: string
): Promise<Debt[]> {
    const simplifiedDebts: Debt[] = [];
    const epsilon = 0.001;

    // Convert all debts to trip currency and calculate net balances
    const balances: Record<string, number> = {};
    
    // Convert and sum all debts
    for (const debt of debts) {
        if (!isNaN(debt.amount) && debt.amount > epsilon) {
            const convertedAmount = await convertCurrency(debt.amount, debt.currency, tripCurrency);
            //  const convertedAmount = debt.amount;
            if (!balances[debt.fromUserName]) balances[debt.fromUserName] = 0;
            if (!balances[debt.toUserName]) balances[debt.toUserName] = 0;
            
            balances[debt.fromUserName] -= convertedAmount;
            balances[debt.toUserName] += convertedAmount;
        }
    }

    // Separate users into debtors and creditors
    const debtors = Object.entries(balances)
        .filter(([userId, balance]) => balance < -epsilon)
        .sort(([, balanceA], [, balanceB]) => balanceA - balanceB);
    
    const creditors = Object.entries(balances)
        .filter(([userId, balance]) => balance > epsilon)
        .sort(([, balanceA], [, balanceB]) => balanceB - balanceA);

    // Match debtors with creditors
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const [debtorId, debtorBalance] = debtors[i];
        const [creditorId, creditorBalance] = creditors[j];
        
        const amount = Math.min(-debtorBalance, creditorBalance);
        
        if (amount > epsilon) {
            simplifiedDebts.push({
                fromUserName: debtorId,
                toUserName: creditorId,
                amount,
                currency: tripCurrency
            });
        }

        const newDebtorBalance = debtorBalance + amount;
        const newCreditorBalance = creditorBalance - amount;

        if (Math.abs(newDebtorBalance) < epsilon) i++;
        if (Math.abs(newCreditorBalance) < epsilon) j++;
    }

    return simplifiedDebts;
}

/**
 * Calculates the minimum set of transactions required to settle all debts,
 * keeping each currency separate (no conversion).
 */
export function calculateSimplifiedDebtsPerCurrency(
    debts: Debt[],
): Debt[] {
    const simplifiedDebts: Debt[] = [];
    const epsilon = 0.001;

    // Initialize balances structure dynamically based on existing debts
    const balances: Partial<Record<string, Record<string, number>>> = {};

    // Calculate net balances for each member per currency
    for (const debt of debts) {
        if (!isNaN(debt.amount) && debt.amount > epsilon) {
            // Initialize currency balance if it doesn't exist
            if (!balances[debt.currency]) {
                balances[debt.currency] = {};
            }
            
            // Initialize balances for both users if they don't exist
            if (!balances[debt.currency]![debt.fromUserName]) {
                balances[debt.currency]![debt.fromUserName] = 0;
            }
            if (!balances[debt.currency]![debt.toUserName]) {
                balances[debt.currency]![debt.toUserName] = 0;
            }

            // Update balances
            balances[debt.currency]![debt.fromUserName] -= debt.amount;
            balances[debt.currency]![debt.toUserName] += debt.amount;
        }
    }

    // Process each currency independently
    Object.entries(balances).forEach(([currency, currencyBalances]) => {
        // Skip if no balances in this currency
        if (Object.keys(currencyBalances).length === 0) return;

        // Separate members into debtors and creditors for this currency
        const debtors = Object.keys(currencyBalances)
            .filter(id => currencyBalances[id] < -epsilon)
            .sort((a, b) => currencyBalances[a] - currencyBalances[b]);

        const creditors = Object.keys(currencyBalances)
            .filter(id => currencyBalances[id] > epsilon)
            .sort((a, b) => currencyBalances[b] - currencyBalances[a]);

        let i = 0;
        let j = 0;

        // Calculate minimum transfers for this currency
        while (i < debtors.length && j < creditors.length) {
            const debtorId = debtors[i];
            const creditorId = creditors[j];
            const transferAmount = Math.min(-currencyBalances[debtorId], currencyBalances[creditorId]);

            if (transferAmount > epsilon) {
                const fromId = debtorId;
                const toId = creditorId;

                // Find existing debt or create new one
                const existingDebt = simplifiedDebts.find(
                    debt => debt.fromUserName === fromId && 
                           debt.toUserName === toId && 
                           debt.currency === currency
                );

                if (!existingDebt) {
                    simplifiedDebts.push({
                        fromUserName: fromId,
                        toUserName: toId,
                        amount: transferAmount,
                        currency: currency,
                    });
                } else {
                    existingDebt.amount += transferAmount;
                }

                currencyBalances[debtorId] += transferAmount;
                currencyBalances[creditorId] -= transferAmount;
            }

            if (Math.abs(currencyBalances[debtorId]) < epsilon) i++;
            if (Math.abs(currencyBalances[creditorId]) < epsilon) j++;
        }
    });

    return simplifiedDebts;
}