import { addExpenseAndCalculateDebts, updateExpense, deleteExpense } from '@/src/components/Trip/Expenses/utilities/expenseService';
import { Expense, Member, FirestoreTrip } from '@/src/types/DataTypes';

export class ExpenseHandler {
  static async addExpense(
    tripId: string, 
    expenseData: Expense, 
    members: Record<string, Member>, 
    trip: FirestoreTrip
  ): Promise<{ success: boolean; error?: any }> {
    try {
      await addExpenseAndCalculateDebts(tripId, expenseData, members, trip);
      return { success: true };
    } catch (error) {
      console.error('Error adding expense:', error);
      return { success: false, error };
    }
  }

  static async updateExpense(
    expenseId: string,
    tripId: string,
    updatedExpenseData: Expense,
    members: Record<string, Member>,
    originalExpense: any,
    tripCurrency: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      await updateExpense(expenseId, tripId, updatedExpenseData, members, originalExpense, tripCurrency);
      return { success: true };
    } catch (error) {
      console.error('Error updating expense:', error);
      return { success: false, error };
    }
  }

  static async deleteExpense(
    tripId: string,
    expenseId: string,
    expense: any,
    tripData: any
  ): Promise<{ success: boolean; error?: any }> {
    try {
      await deleteExpense(tripId, expenseId, expense, tripData);
      return { success: true };
    } catch (error) {
      console.error('Error deleting expense:', error);
      return { success: false, error };
    }
  }
} 