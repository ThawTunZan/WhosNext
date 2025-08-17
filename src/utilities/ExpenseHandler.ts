import {
  addExpenseAndCalculateDebts,
  updateExpense as updateExpenseSvc,
  //deleteExpense as deleteExpenseSvc,
} from '@/src/components/Trip/Expenses/utilities/expenseService';
import { Expense, MemberDDB, TripsTableDDB } from '@/src/types/DataTypes';


export class ExpenseHandler {
  static async addExpense(
    tripId: string,
    expenseData: Expense,
  ): Promise<{ success: boolean; error?: any }> {
    try {
      await addExpenseAndCalculateDebts(tripId, expenseData);
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
    members: Record<string, MemberDDB>,                 // accepts Record or array
    originalExpense: any,
    tripCurrency: string
  ): Promise<{ success: boolean; error?: any }> {
    try {
      await updateExpenseSvc(
        expenseId,
        tripId,
        updatedExpenseData,
        originalExpense,
      );
      return { success: true };
    } catch (error) {
      console.error('Error updating expense:', error);
      return { success: false, error };
    }
  }
/*
  static async deleteExpense(
    tripId: string,
    expenseId: string,
    expense: any,
    tripData: any
  ): Promise<{ success: boolean; error?: any }> {
    
    TODO:
    try {
      await deleteExpenseSvc(tripId, expenseId, expense, tripData);
      return { success: true };
    } catch (error) {
      console.error('Error deleting expense:', error);
      return { success: false, error };
    }
  }
    */

}

