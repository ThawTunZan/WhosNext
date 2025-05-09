// src/services/SettleUpUtilities.tsx

// Define types needed for debt processing
// These could also live in a central types file (e.g., src/types/debts.ts)
export type MemberInfo = { name: string };
export type MembersMap = Record<string, MemberInfo>;
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
    members: MembersMap
): GroupedSectionData[] {
    return Object.entries(grouped).map(([fromId, debts]) => ({
        title: members[fromId]?.name || `Unknown (${fromId})`, // Provide fallback name
        data: debts.sort((a, b) => a.toName.localeCompare(b.toName)), // Optional: sort debts within section by name
    }));
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
    members: MembersMap
): GroupedSectionData[] {
    const grouped: Record<string, ParsedDebt[]> = {};
    const epsilon = 0.001; // Small value for float comparison

    Object.entries(debts).forEach(([key, amount]) => {
        const numericAmount = Number(amount);
        // Filter 1: Only process debts where the amount is meaningfully positive
        if (!isNaN(numericAmount) && numericAmount > epsilon) {
            const [fromId, toId] = key.split('#');
            // Basic validation
            if (!fromId || !toId) {
                 console.warn(`Skipping invalid debt key: ${key}`);
                 return;
            }

            const fromName = members[fromId]?.name || `Unknown (${fromId})`;
            const toName = members[toId]?.name || `Unknown (${toId})`;

            if (!grouped[fromId]) {
                 grouped[fromId] = [];
            }
            grouped[fromId].push({ fromId, toId, amount: numericAmount, fromName, toName });
        }
    });

    // Convert grouped data into sections
    const sections = groupToSections(grouped, members);

    // Filter 2: Remove sections that have no data after filtering zero amounts
    return sections.filter(section => section.data.length > 0);
}


/**
 * Calculates the minimum set of transactions required to settle all debts.
 * @param debts Raw debts map.
 * @param members Members map for name lookup.
 * @returns Array of simplified transaction sections ready for SectionList.
 */
export function calculateSimplifiedDebts(
    debts: DebtsMap,
    members: MembersMap
): GroupedSectionData[] {
    const balances: Record<string, number> = {};
    const grouped: Record<string, ParsedDebt[]> = {};
    const epsilon = 0.001; // Small value for float comparison

    // Calculate net balances for each member
    for (const [key, amount] of Object.entries(debts)) {
        const numericAmount = Number(amount);
        if (!isNaN(numericAmount) && numericAmount > epsilon) { // Process only valid, positive debts
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
            const fromName = members[fromId]?.name || `Unknown (${fromId})`;
            const toName = members[toId]?.name || `Unknown (${toId})`;

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
    const sections = groupToSections(grouped, members);

    // Filter: Remove sections that might be empty after simplification
    return sections.filter(section => section.data.length > 0);
}