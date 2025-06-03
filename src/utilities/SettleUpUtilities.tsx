// src/services/SettleUpUtilities.tsx

// Define types needed for debt processing
// These could also live in a central types file (e.g., src/types/debts.ts)

export type DebtsMap = Record<string, number>;

export type ParsedDebt = {
  fromId: string;
  toId: string;
  amount: number;
  fromName: string;
  toName: string;
};

export type GroupedSectionData = {
  title: string; // Usually the name of the person who owes
  data: ParsedDebt[];
};

// Helper function (internal use, might not need export)
function groupToSections(
    grouped: Record<string, ParsedDebt[]>,
    profiles: Record<string, string>,
): GroupedSectionData[] {
    return Object.entries(grouped).map(([fromId, debts]) => ({
        title: profiles[fromId] || `Unknown (${fromId})`, // Provide fallback name
        data: debts.sort((a, b) => a.toName.localeCompare(b.toName)), // Optional: sort debts within section by name
    }));
}

/**
 * Normalizes the debts map so that all values are positive and the key is always debtor#creditor (debtor owes creditor).
 * If a debt chain goes negative, the original is deleted and a reverse chain is created with a positive value.
 */
export function normalizeDebtsMap(debts: DebtsMap): DebtsMap {
    const normalized: DebtsMap = {};
    const epsilon = 0.001;
    for (const [key, value] of Object.entries(debts)) {
        const numericValue = Number(value);
        if (isNaN(numericValue) || Math.abs(numericValue) < epsilon) continue;
        const [fromId, toId] = key.split('#');
        if (!fromId || !toId) continue;
        if (numericValue > 0) {
            // Debtor owes creditor
            normalized[`${fromId}#${toId}`] = numericValue;
        } else if (numericValue < 0) {
            // Reverse: creditor owes debtor
            normalized[`${toId}#${fromId}`] = Math.abs(numericValue);
        }
    }
    return normalized;
}

/**
 * Converts the raw debts map into a sectioned list format for display.
 * Filters out zero-amount debts and empty sections.
 * @param debts Raw debts map (e.g., { "userB#userA": 50 })
 * @param members Members map for name lookup.
 * @returns Array of sections ready for SectionList.
 */
export function parseAndGroupDebts(
    debts: DebtsMap,
    profiles: Record<string, string>,
): GroupedSectionData[] {
    const grouped: Record<string, ParsedDebt[]> = {};
    const epsilon = 0.001; // Small value for float comparison
    const normalizedDebts = normalizeDebtsMap(debts);

    Object.entries(normalizedDebts).forEach(([key, amount]) => {
        const numericAmount = Number(amount);
        if (!isNaN(numericAmount) && numericAmount > epsilon) {
            const [fromId, toId] = key.split('#');
            // Basic validation
            if (!fromId || !toId) {
                 console.warn(`Skipping invalid debt key: ${key}`);
                 return;
            }

            const fromName = profiles[fromId] || `Unknown (${fromId})`;
            const toName = profiles[toId] || `Unknown (${toId})`;

            if (!grouped[fromId]) {
                 grouped[fromId] = [];
            }
            grouped[fromId].push({ fromId, toId, amount: numericAmount, fromName, toName });
        }
    });

    // Convert grouped data into sections
    const sections = groupToSections(grouped, profiles);

    // Filter 2: Remove sections that have no data after filtering zero amounts
    return sections.filter(section => section.data.length > 0);
}


/**
 * Calculates the minimum set of transactions required to settle all debts.
 * @param debts Raw debts map.
 * @returns Array of simplified transaction sections ready for SectionList.
 */
export function calculateSimplifiedDebts(
    debts: DebtsMap,
    profiles: Record<string, string>,
): GroupedSectionData[] {
    const balances: Record<string, number> = {};
    const grouped: Record<string, ParsedDebt[]> = {};
    const epsilon = 0.001; // Small value for float comparison
    const normalizedDebts = normalizeDebtsMap(debts);

    // Calculate net balances for each member
    for (const [key, amount] of Object.entries(normalizedDebts)) {
        const numericAmount = Number(amount);
        if (!isNaN(numericAmount) && numericAmount > epsilon) {
            const [debtor, creditor] = key.split('#');
            if (!debtor || !creditor) {
                console.warn(`Skipping invalid debt key during balance calculation: ${key}`);
                continue;
            }
            balances[debtor] = (balances[debtor] || 0) - numericAmount;
            balances[creditor] = (balances[creditor] || 0) + numericAmount;
        }
    }

    // Separate members into debtors (negative balance) and creditors (positive balance)
    const debtors = Object.keys(balances).filter(id => balances[id] < -epsilon);
    const creditors = Object.keys(balances).filter(id => balances[id] > epsilon);

    // Sort them to handle largest amounts first (optimization)
    debtors.sort((a, b) => balances[a] - balances[b]); // Most negative first
    creditors.sort((a, b) => balances[b] - balances[a]); // Most positive first

    let i = 0; // Pointer for debtors array
    let j = 0; // Pointer for creditors array

    // Calculate minimum transfers
    while (i < debtors.length && j < creditors.length) {
        const debtorId = debtors[i];
        const creditorId = creditors[j];
        const transferAmount = Math.min(-balances[debtorId], balances[creditorId]);

        // Create a transaction if the amount is meaningful
        if (transferAmount > epsilon) {
            const fromId = debtorId;
            const toId = creditorId;
            const fromName = profiles[fromId] || `Unknown (${fromId})`;
            const toName = profiles[toId] || `Unknown (${toId})`;

            if (!grouped[fromId]) {
                grouped[fromId] = [];
            }
            grouped[fromId].push({ fromId, toId, amount: transferAmount, fromName, toName });

            // Update balances after the transfer
            balances[debtorId] += transferAmount;
            balances[creditorId] -= transferAmount;
        }

        // Move pointers if balances are settled (close to zero)
        if (Math.abs(balances[debtorId]) < epsilon) {
            i++;
        }
        if (Math.abs(balances[creditorId]) < epsilon) {
            j++;
        }
        // Safety break for edge cases with tiny floats
        if (transferAmount <= epsilon && (i < debtors.length && j < creditors.length)) {
            console.warn("Exiting simplifyDebts loop early due to very small transfer amount.", balances);
            break;
        }
    }

    // Convert grouped transactions into sections
    const sections = groupToSections(grouped, profiles);

    // Filter: Remove sections that might be empty after simplification
    return sections.filter(section => section.data.length > 0);
}