/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateTripInput = {
  id?: string | null,
  name: string,
  currency: string,
  debts?: string | null,
  totalAmtLeft?: number | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type ModelTripConditionInput = {
  name?: ModelStringInput | null,
  currency?: ModelStringInput | null,
  debts?: ModelStringInput | null,
  totalAmtLeft?: ModelFloatInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelTripConditionInput | null > | null,
  or?: Array< ModelTripConditionInput | null > | null,
  not?: ModelTripConditionInput | null,
};

export type ModelStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
  _null = "_null",
}


export type ModelSizeInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
};

export type ModelFloatInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type Trip = {
  __typename: "Trip",
  id: string,
  name: string,
  currency: string,
  members?: ModelMemberConnection | null,
  expenses?: ModelExpenseConnection | null,
  debts?: string | null,
  totalAmtLeft?: number | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type ModelMemberConnection = {
  __typename: "ModelMemberConnection",
  items:  Array<Member | null >,
  nextToken?: string | null,
};

export type Member = {
  __typename: "Member",
  id: string,
  username: string,
  fullName: string,
  tripId: string,
  trip?: Trip | null,
  amtLeft?: number | null,
  owesTotalMap?: string | null,
  createdAt: string,
  updatedAt: string,
  tripMembersId?: string | null,
};

export type ModelExpenseConnection = {
  __typename: "ModelExpenseConnection",
  items:  Array<Expense | null >,
  nextToken?: string | null,
};

export type Expense = {
  __typename: "Expense",
  id: string,
  tripId: string,
  trip?: Trip | null,
  activityName: string,
  amount: number,
  currency: string,
  paidBy: string,
  sharedWith?: ModelExpenseShareConnection | null,
  paidByAndAmounts?: string | null,
  createdAt?: string | null,
  updatedAt: string,
  tripExpensesId?: string | null,
};

export type ModelExpenseShareConnection = {
  __typename: "ModelExpenseShareConnection",
  items:  Array<ExpenseShare | null >,
  nextToken?: string | null,
};

export type ExpenseShare = {
  __typename: "ExpenseShare",
  id: string,
  expenseId: string,
  expense?: Expense | null,
  payeeName: string,
  amount: number,
  currency: string,
  createdAt: string,
  updatedAt: string,
  expenseSharedWithId?: string | null,
};

export type UpdateTripInput = {
  id: string,
  name?: string | null,
  currency?: string | null,
  debts?: string | null,
  totalAmtLeft?: number | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type DeleteTripInput = {
  id: string,
};

export type CreateMemberInput = {
  id?: string | null,
  username: string,
  fullName: string,
  tripId: string,
  amtLeft?: number | null,
  owesTotalMap?: string | null,
  tripMembersId?: string | null,
};

export type ModelMemberConditionInput = {
  username?: ModelStringInput | null,
  fullName?: ModelStringInput | null,
  tripId?: ModelIDInput | null,
  amtLeft?: ModelFloatInput | null,
  owesTotalMap?: ModelStringInput | null,
  and?: Array< ModelMemberConditionInput | null > | null,
  or?: Array< ModelMemberConditionInput | null > | null,
  not?: ModelMemberConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  tripMembersId?: ModelIDInput | null,
};

export type ModelIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export type UpdateMemberInput = {
  id: string,
  username?: string | null,
  fullName?: string | null,
  tripId?: string | null,
  amtLeft?: number | null,
  owesTotalMap?: string | null,
  tripMembersId?: string | null,
};

export type DeleteMemberInput = {
  id: string,
};

export type CreateExpenseInput = {
  id?: string | null,
  tripId: string,
  activityName: string,
  amount: number,
  currency: string,
  paidBy: string,
  paidByAndAmounts?: string | null,
  createdAt?: string | null,
  tripExpensesId?: string | null,
};

export type ModelExpenseConditionInput = {
  tripId?: ModelIDInput | null,
  activityName?: ModelStringInput | null,
  amount?: ModelFloatInput | null,
  currency?: ModelStringInput | null,
  paidBy?: ModelStringInput | null,
  paidByAndAmounts?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  and?: Array< ModelExpenseConditionInput | null > | null,
  or?: Array< ModelExpenseConditionInput | null > | null,
  not?: ModelExpenseConditionInput | null,
  updatedAt?: ModelStringInput | null,
  tripExpensesId?: ModelIDInput | null,
};

export type UpdateExpenseInput = {
  id: string,
  tripId?: string | null,
  activityName?: string | null,
  amount?: number | null,
  currency?: string | null,
  paidBy?: string | null,
  paidByAndAmounts?: string | null,
  createdAt?: string | null,
  tripExpensesId?: string | null,
};

export type DeleteExpenseInput = {
  id: string,
};

export type CreateExpenseShareInput = {
  id?: string | null,
  expenseId: string,
  payeeName: string,
  amount: number,
  currency: string,
  expenseSharedWithId?: string | null,
};

export type ModelExpenseShareConditionInput = {
  expenseId?: ModelIDInput | null,
  payeeName?: ModelStringInput | null,
  amount?: ModelFloatInput | null,
  currency?: ModelStringInput | null,
  and?: Array< ModelExpenseShareConditionInput | null > | null,
  or?: Array< ModelExpenseShareConditionInput | null > | null,
  not?: ModelExpenseShareConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  expenseSharedWithId?: ModelIDInput | null,
};

export type UpdateExpenseShareInput = {
  id: string,
  expenseId?: string | null,
  payeeName?: string | null,
  amount?: number | null,
  currency?: string | null,
  expenseSharedWithId?: string | null,
};

export type DeleteExpenseShareInput = {
  id: string,
};

export type ModelTripFilterInput = {
  id?: ModelIDInput | null,
  name?: ModelStringInput | null,
  currency?: ModelStringInput | null,
  debts?: ModelStringInput | null,
  totalAmtLeft?: ModelFloatInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelTripFilterInput | null > | null,
  or?: Array< ModelTripFilterInput | null > | null,
  not?: ModelTripFilterInput | null,
};

export type ModelTripConnection = {
  __typename: "ModelTripConnection",
  items:  Array<Trip | null >,
  nextToken?: string | null,
};

export type ModelMemberFilterInput = {
  id?: ModelIDInput | null,
  username?: ModelStringInput | null,
  fullName?: ModelStringInput | null,
  tripId?: ModelIDInput | null,
  amtLeft?: ModelFloatInput | null,
  owesTotalMap?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelMemberFilterInput | null > | null,
  or?: Array< ModelMemberFilterInput | null > | null,
  not?: ModelMemberFilterInput | null,
  tripMembersId?: ModelIDInput | null,
};

export type ModelExpenseFilterInput = {
  id?: ModelIDInput | null,
  tripId?: ModelIDInput | null,
  activityName?: ModelStringInput | null,
  amount?: ModelFloatInput | null,
  currency?: ModelStringInput | null,
  paidBy?: ModelStringInput | null,
  paidByAndAmounts?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelExpenseFilterInput | null > | null,
  or?: Array< ModelExpenseFilterInput | null > | null,
  not?: ModelExpenseFilterInput | null,
  tripExpensesId?: ModelIDInput | null,
};

export type ModelExpenseShareFilterInput = {
  id?: ModelIDInput | null,
  expenseId?: ModelIDInput | null,
  payeeName?: ModelStringInput | null,
  amount?: ModelFloatInput | null,
  currency?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelExpenseShareFilterInput | null > | null,
  or?: Array< ModelExpenseShareFilterInput | null > | null,
  not?: ModelExpenseShareFilterInput | null,
  expenseSharedWithId?: ModelIDInput | null,
};

export type ModelSubscriptionTripFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  name?: ModelSubscriptionStringInput | null,
  currency?: ModelSubscriptionStringInput | null,
  debts?: ModelSubscriptionStringInput | null,
  totalAmtLeft?: ModelSubscriptionFloatInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionTripFilterInput | null > | null,
  or?: Array< ModelSubscriptionTripFilterInput | null > | null,
  tripMembersId?: ModelSubscriptionIDInput | null,
  tripExpensesId?: ModelSubscriptionIDInput | null,
};

export type ModelSubscriptionIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionFloatInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
  in?: Array< number | null > | null,
  notIn?: Array< number | null > | null,
};

export type ModelSubscriptionMemberFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  username?: ModelSubscriptionStringInput | null,
  fullName?: ModelSubscriptionStringInput | null,
  tripId?: ModelSubscriptionIDInput | null,
  amtLeft?: ModelSubscriptionFloatInput | null,
  owesTotalMap?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionMemberFilterInput | null > | null,
  or?: Array< ModelSubscriptionMemberFilterInput | null > | null,
};

export type ModelSubscriptionExpenseFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  tripId?: ModelSubscriptionIDInput | null,
  activityName?: ModelSubscriptionStringInput | null,
  amount?: ModelSubscriptionFloatInput | null,
  currency?: ModelSubscriptionStringInput | null,
  paidBy?: ModelSubscriptionStringInput | null,
  paidByAndAmounts?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionExpenseFilterInput | null > | null,
  or?: Array< ModelSubscriptionExpenseFilterInput | null > | null,
  expenseSharedWithId?: ModelSubscriptionIDInput | null,
};

export type ModelSubscriptionExpenseShareFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  expenseId?: ModelSubscriptionIDInput | null,
  payeeName?: ModelSubscriptionStringInput | null,
  amount?: ModelSubscriptionFloatInput | null,
  currency?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionExpenseShareFilterInput | null > | null,
  or?: Array< ModelSubscriptionExpenseShareFilterInput | null > | null,
};

export type CreateTripMutationVariables = {
  input: CreateTripInput,
  condition?: ModelTripConditionInput | null,
};

export type CreateTripMutation = {
  createTrip?:  {
    __typename: "Trip",
    id: string,
    name: string,
    currency: string,
    members?:  {
      __typename: "ModelMemberConnection",
      nextToken?: string | null,
    } | null,
    expenses?:  {
      __typename: "ModelExpenseConnection",
      nextToken?: string | null,
    } | null,
    debts?: string | null,
    totalAmtLeft?: number | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type UpdateTripMutationVariables = {
  input: UpdateTripInput,
  condition?: ModelTripConditionInput | null,
};

export type UpdateTripMutation = {
  updateTrip?:  {
    __typename: "Trip",
    id: string,
    name: string,
    currency: string,
    members?:  {
      __typename: "ModelMemberConnection",
      nextToken?: string | null,
    } | null,
    expenses?:  {
      __typename: "ModelExpenseConnection",
      nextToken?: string | null,
    } | null,
    debts?: string | null,
    totalAmtLeft?: number | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type DeleteTripMutationVariables = {
  input: DeleteTripInput,
  condition?: ModelTripConditionInput | null,
};

export type DeleteTripMutation = {
  deleteTrip?:  {
    __typename: "Trip",
    id: string,
    name: string,
    currency: string,
    members?:  {
      __typename: "ModelMemberConnection",
      nextToken?: string | null,
    } | null,
    expenses?:  {
      __typename: "ModelExpenseConnection",
      nextToken?: string | null,
    } | null,
    debts?: string | null,
    totalAmtLeft?: number | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type CreateMemberMutationVariables = {
  input: CreateMemberInput,
  condition?: ModelMemberConditionInput | null,
};

export type CreateMemberMutation = {
  createMember?:  {
    __typename: "Member",
    id: string,
    username: string,
    fullName: string,
    tripId: string,
    trip?:  {
      __typename: "Trip",
      id: string,
      name: string,
      currency: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    amtLeft?: number | null,
    owesTotalMap?: string | null,
    createdAt: string,
    updatedAt: string,
    tripMembersId?: string | null,
  } | null,
};

export type UpdateMemberMutationVariables = {
  input: UpdateMemberInput,
  condition?: ModelMemberConditionInput | null,
};

export type UpdateMemberMutation = {
  updateMember?:  {
    __typename: "Member",
    id: string,
    username: string,
    fullName: string,
    tripId: string,
    trip?:  {
      __typename: "Trip",
      id: string,
      name: string,
      currency: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    amtLeft?: number | null,
    owesTotalMap?: string | null,
    createdAt: string,
    updatedAt: string,
    tripMembersId?: string | null,
  } | null,
};

export type DeleteMemberMutationVariables = {
  input: DeleteMemberInput,
  condition?: ModelMemberConditionInput | null,
};

export type DeleteMemberMutation = {
  deleteMember?:  {
    __typename: "Member",
    id: string,
    username: string,
    fullName: string,
    tripId: string,
    trip?:  {
      __typename: "Trip",
      id: string,
      name: string,
      currency: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    amtLeft?: number | null,
    owesTotalMap?: string | null,
    createdAt: string,
    updatedAt: string,
    tripMembersId?: string | null,
  } | null,
};

export type CreateExpenseMutationVariables = {
  input: CreateExpenseInput,
  condition?: ModelExpenseConditionInput | null,
};

export type CreateExpenseMutation = {
  createExpense?:  {
    __typename: "Expense",
    id: string,
    tripId: string,
    trip?:  {
      __typename: "Trip",
      id: string,
      name: string,
      currency: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    activityName: string,
    amount: number,
    currency: string,
    paidBy: string,
    sharedWith?:  {
      __typename: "ModelExpenseShareConnection",
      nextToken?: string | null,
    } | null,
    paidByAndAmounts?: string | null,
    createdAt?: string | null,
    updatedAt: string,
    tripExpensesId?: string | null,
  } | null,
};

export type UpdateExpenseMutationVariables = {
  input: UpdateExpenseInput,
  condition?: ModelExpenseConditionInput | null,
};

export type UpdateExpenseMutation = {
  updateExpense?:  {
    __typename: "Expense",
    id: string,
    tripId: string,
    trip?:  {
      __typename: "Trip",
      id: string,
      name: string,
      currency: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    activityName: string,
    amount: number,
    currency: string,
    paidBy: string,
    sharedWith?:  {
      __typename: "ModelExpenseShareConnection",
      nextToken?: string | null,
    } | null,
    paidByAndAmounts?: string | null,
    createdAt?: string | null,
    updatedAt: string,
    tripExpensesId?: string | null,
  } | null,
};

export type DeleteExpenseMutationVariables = {
  input: DeleteExpenseInput,
  condition?: ModelExpenseConditionInput | null,
};

export type DeleteExpenseMutation = {
  deleteExpense?:  {
    __typename: "Expense",
    id: string,
    tripId: string,
    trip?:  {
      __typename: "Trip",
      id: string,
      name: string,
      currency: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    activityName: string,
    amount: number,
    currency: string,
    paidBy: string,
    sharedWith?:  {
      __typename: "ModelExpenseShareConnection",
      nextToken?: string | null,
    } | null,
    paidByAndAmounts?: string | null,
    createdAt?: string | null,
    updatedAt: string,
    tripExpensesId?: string | null,
  } | null,
};

export type CreateExpenseShareMutationVariables = {
  input: CreateExpenseShareInput,
  condition?: ModelExpenseShareConditionInput | null,
};

export type CreateExpenseShareMutation = {
  createExpenseShare?:  {
    __typename: "ExpenseShare",
    id: string,
    expenseId: string,
    expense?:  {
      __typename: "Expense",
      id: string,
      tripId: string,
      activityName: string,
      amount: number,
      currency: string,
      paidBy: string,
      paidByAndAmounts?: string | null,
      createdAt?: string | null,
      updatedAt: string,
      tripExpensesId?: string | null,
    } | null,
    payeeName: string,
    amount: number,
    currency: string,
    createdAt: string,
    updatedAt: string,
    expenseSharedWithId?: string | null,
  } | null,
};

export type UpdateExpenseShareMutationVariables = {
  input: UpdateExpenseShareInput,
  condition?: ModelExpenseShareConditionInput | null,
};

export type UpdateExpenseShareMutation = {
  updateExpenseShare?:  {
    __typename: "ExpenseShare",
    id: string,
    expenseId: string,
    expense?:  {
      __typename: "Expense",
      id: string,
      tripId: string,
      activityName: string,
      amount: number,
      currency: string,
      paidBy: string,
      paidByAndAmounts?: string | null,
      createdAt?: string | null,
      updatedAt: string,
      tripExpensesId?: string | null,
    } | null,
    payeeName: string,
    amount: number,
    currency: string,
    createdAt: string,
    updatedAt: string,
    expenseSharedWithId?: string | null,
  } | null,
};

export type DeleteExpenseShareMutationVariables = {
  input: DeleteExpenseShareInput,
  condition?: ModelExpenseShareConditionInput | null,
};

export type DeleteExpenseShareMutation = {
  deleteExpenseShare?:  {
    __typename: "ExpenseShare",
    id: string,
    expenseId: string,
    expense?:  {
      __typename: "Expense",
      id: string,
      tripId: string,
      activityName: string,
      amount: number,
      currency: string,
      paidBy: string,
      paidByAndAmounts?: string | null,
      createdAt?: string | null,
      updatedAt: string,
      tripExpensesId?: string | null,
    } | null,
    payeeName: string,
    amount: number,
    currency: string,
    createdAt: string,
    updatedAt: string,
    expenseSharedWithId?: string | null,
  } | null,
};

export type GetTripQueryVariables = {
  id: string,
};

export type GetTripQuery = {
  getTrip?:  {
    __typename: "Trip",
    id: string,
    name: string,
    currency: string,
    members?:  {
      __typename: "ModelMemberConnection",
      nextToken?: string | null,
    } | null,
    expenses?:  {
      __typename: "ModelExpenseConnection",
      nextToken?: string | null,
    } | null,
    debts?: string | null,
    totalAmtLeft?: number | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type ListTripsQueryVariables = {
  filter?: ModelTripFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListTripsQuery = {
  listTrips?:  {
    __typename: "ModelTripConnection",
    items:  Array< {
      __typename: "Trip",
      id: string,
      name: string,
      currency: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetMemberQueryVariables = {
  id: string,
};

export type GetMemberQuery = {
  getMember?:  {
    __typename: "Member",
    id: string,
    username: string,
    fullName: string,
    tripId: string,
    trip?:  {
      __typename: "Trip",
      id: string,
      name: string,
      currency: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    amtLeft?: number | null,
    owesTotalMap?: string | null,
    createdAt: string,
    updatedAt: string,
    tripMembersId?: string | null,
  } | null,
};

export type ListMembersQueryVariables = {
  filter?: ModelMemberFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListMembersQuery = {
  listMembers?:  {
    __typename: "ModelMemberConnection",
    items:  Array< {
      __typename: "Member",
      id: string,
      username: string,
      fullName: string,
      tripId: string,
      amtLeft?: number | null,
      owesTotalMap?: string | null,
      createdAt: string,
      updatedAt: string,
      tripMembersId?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetExpenseQueryVariables = {
  id: string,
};

export type GetExpenseQuery = {
  getExpense?:  {
    __typename: "Expense",
    id: string,
    tripId: string,
    trip?:  {
      __typename: "Trip",
      id: string,
      name: string,
      currency: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    activityName: string,
    amount: number,
    currency: string,
    paidBy: string,
    sharedWith?:  {
      __typename: "ModelExpenseShareConnection",
      nextToken?: string | null,
    } | null,
    paidByAndAmounts?: string | null,
    createdAt?: string | null,
    updatedAt: string,
    tripExpensesId?: string | null,
  } | null,
};

export type ListExpensesQueryVariables = {
  filter?: ModelExpenseFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListExpensesQuery = {
  listExpenses?:  {
    __typename: "ModelExpenseConnection",
    items:  Array< {
      __typename: "Expense",
      id: string,
      tripId: string,
      activityName: string,
      amount: number,
      currency: string,
      paidBy: string,
      paidByAndAmounts?: string | null,
      createdAt?: string | null,
      updatedAt: string,
      tripExpensesId?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetExpenseShareQueryVariables = {
  id: string,
};

export type GetExpenseShareQuery = {
  getExpenseShare?:  {
    __typename: "ExpenseShare",
    id: string,
    expenseId: string,
    expense?:  {
      __typename: "Expense",
      id: string,
      tripId: string,
      activityName: string,
      amount: number,
      currency: string,
      paidBy: string,
      paidByAndAmounts?: string | null,
      createdAt?: string | null,
      updatedAt: string,
      tripExpensesId?: string | null,
    } | null,
    payeeName: string,
    amount: number,
    currency: string,
    createdAt: string,
    updatedAt: string,
    expenseSharedWithId?: string | null,
  } | null,
};

export type ListExpenseSharesQueryVariables = {
  filter?: ModelExpenseShareFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListExpenseSharesQuery = {
  listExpenseShares?:  {
    __typename: "ModelExpenseShareConnection",
    items:  Array< {
      __typename: "ExpenseShare",
      id: string,
      expenseId: string,
      payeeName: string,
      amount: number,
      currency: string,
      createdAt: string,
      updatedAt: string,
      expenseSharedWithId?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type OnCreateTripSubscriptionVariables = {
  filter?: ModelSubscriptionTripFilterInput | null,
};

export type OnCreateTripSubscription = {
  onCreateTrip?:  {
    __typename: "Trip",
    id: string,
    name: string,
    currency: string,
    members?:  {
      __typename: "ModelMemberConnection",
      nextToken?: string | null,
    } | null,
    expenses?:  {
      __typename: "ModelExpenseConnection",
      nextToken?: string | null,
    } | null,
    debts?: string | null,
    totalAmtLeft?: number | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnUpdateTripSubscriptionVariables = {
  filter?: ModelSubscriptionTripFilterInput | null,
};

export type OnUpdateTripSubscription = {
  onUpdateTrip?:  {
    __typename: "Trip",
    id: string,
    name: string,
    currency: string,
    members?:  {
      __typename: "ModelMemberConnection",
      nextToken?: string | null,
    } | null,
    expenses?:  {
      __typename: "ModelExpenseConnection",
      nextToken?: string | null,
    } | null,
    debts?: string | null,
    totalAmtLeft?: number | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnDeleteTripSubscriptionVariables = {
  filter?: ModelSubscriptionTripFilterInput | null,
};

export type OnDeleteTripSubscription = {
  onDeleteTrip?:  {
    __typename: "Trip",
    id: string,
    name: string,
    currency: string,
    members?:  {
      __typename: "ModelMemberConnection",
      nextToken?: string | null,
    } | null,
    expenses?:  {
      __typename: "ModelExpenseConnection",
      nextToken?: string | null,
    } | null,
    debts?: string | null,
    totalAmtLeft?: number | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnCreateMemberSubscriptionVariables = {
  filter?: ModelSubscriptionMemberFilterInput | null,
};

export type OnCreateMemberSubscription = {
  onCreateMember?:  {
    __typename: "Member",
    id: string,
    username: string,
    fullName: string,
    tripId: string,
    trip?:  {
      __typename: "Trip",
      id: string,
      name: string,
      currency: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    amtLeft?: number | null,
    owesTotalMap?: string | null,
    createdAt: string,
    updatedAt: string,
    tripMembersId?: string | null,
  } | null,
};

export type OnUpdateMemberSubscriptionVariables = {
  filter?: ModelSubscriptionMemberFilterInput | null,
};

export type OnUpdateMemberSubscription = {
  onUpdateMember?:  {
    __typename: "Member",
    id: string,
    username: string,
    fullName: string,
    tripId: string,
    trip?:  {
      __typename: "Trip",
      id: string,
      name: string,
      currency: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    amtLeft?: number | null,
    owesTotalMap?: string | null,
    createdAt: string,
    updatedAt: string,
    tripMembersId?: string | null,
  } | null,
};

export type OnDeleteMemberSubscriptionVariables = {
  filter?: ModelSubscriptionMemberFilterInput | null,
};

export type OnDeleteMemberSubscription = {
  onDeleteMember?:  {
    __typename: "Member",
    id: string,
    username: string,
    fullName: string,
    tripId: string,
    trip?:  {
      __typename: "Trip",
      id: string,
      name: string,
      currency: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    amtLeft?: number | null,
    owesTotalMap?: string | null,
    createdAt: string,
    updatedAt: string,
    tripMembersId?: string | null,
  } | null,
};

export type OnCreateExpenseSubscriptionVariables = {
  filter?: ModelSubscriptionExpenseFilterInput | null,
};

export type OnCreateExpenseSubscription = {
  onCreateExpense?:  {
    __typename: "Expense",
    id: string,
    tripId: string,
    trip?:  {
      __typename: "Trip",
      id: string,
      name: string,
      currency: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    activityName: string,
    amount: number,
    currency: string,
    paidBy: string,
    sharedWith?:  {
      __typename: "ModelExpenseShareConnection",
      nextToken?: string | null,
    } | null,
    paidByAndAmounts?: string | null,
    createdAt?: string | null,
    updatedAt: string,
    tripExpensesId?: string | null,
  } | null,
};

export type OnUpdateExpenseSubscriptionVariables = {
  filter?: ModelSubscriptionExpenseFilterInput | null,
};

export type OnUpdateExpenseSubscription = {
  onUpdateExpense?:  {
    __typename: "Expense",
    id: string,
    tripId: string,
    trip?:  {
      __typename: "Trip",
      id: string,
      name: string,
      currency: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    activityName: string,
    amount: number,
    currency: string,
    paidBy: string,
    sharedWith?:  {
      __typename: "ModelExpenseShareConnection",
      nextToken?: string | null,
    } | null,
    paidByAndAmounts?: string | null,
    createdAt?: string | null,
    updatedAt: string,
    tripExpensesId?: string | null,
  } | null,
};

export type OnDeleteExpenseSubscriptionVariables = {
  filter?: ModelSubscriptionExpenseFilterInput | null,
};

export type OnDeleteExpenseSubscription = {
  onDeleteExpense?:  {
    __typename: "Expense",
    id: string,
    tripId: string,
    trip?:  {
      __typename: "Trip",
      id: string,
      name: string,
      currency: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    activityName: string,
    amount: number,
    currency: string,
    paidBy: string,
    sharedWith?:  {
      __typename: "ModelExpenseShareConnection",
      nextToken?: string | null,
    } | null,
    paidByAndAmounts?: string | null,
    createdAt?: string | null,
    updatedAt: string,
    tripExpensesId?: string | null,
  } | null,
};

export type OnCreateExpenseShareSubscriptionVariables = {
  filter?: ModelSubscriptionExpenseShareFilterInput | null,
};

export type OnCreateExpenseShareSubscription = {
  onCreateExpenseShare?:  {
    __typename: "ExpenseShare",
    id: string,
    expenseId: string,
    expense?:  {
      __typename: "Expense",
      id: string,
      tripId: string,
      activityName: string,
      amount: number,
      currency: string,
      paidBy: string,
      paidByAndAmounts?: string | null,
      createdAt?: string | null,
      updatedAt: string,
      tripExpensesId?: string | null,
    } | null,
    payeeName: string,
    amount: number,
    currency: string,
    createdAt: string,
    updatedAt: string,
    expenseSharedWithId?: string | null,
  } | null,
};

export type OnUpdateExpenseShareSubscriptionVariables = {
  filter?: ModelSubscriptionExpenseShareFilterInput | null,
};

export type OnUpdateExpenseShareSubscription = {
  onUpdateExpenseShare?:  {
    __typename: "ExpenseShare",
    id: string,
    expenseId: string,
    expense?:  {
      __typename: "Expense",
      id: string,
      tripId: string,
      activityName: string,
      amount: number,
      currency: string,
      paidBy: string,
      paidByAndAmounts?: string | null,
      createdAt?: string | null,
      updatedAt: string,
      tripExpensesId?: string | null,
    } | null,
    payeeName: string,
    amount: number,
    currency: string,
    createdAt: string,
    updatedAt: string,
    expenseSharedWithId?: string | null,
  } | null,
};

export type OnDeleteExpenseShareSubscriptionVariables = {
  filter?: ModelSubscriptionExpenseShareFilterInput | null,
};

export type OnDeleteExpenseShareSubscription = {
  onDeleteExpenseShare?:  {
    __typename: "ExpenseShare",
    id: string,
    expenseId: string,
    expense?:  {
      __typename: "Expense",
      id: string,
      tripId: string,
      activityName: string,
      amount: number,
      currency: string,
      paidBy: string,
      paidByAndAmounts?: string | null,
      createdAt?: string | null,
      updatedAt: string,
      tripExpensesId?: string | null,
    } | null,
    payeeName: string,
    amount: number,
    currency: string,
    createdAt: string,
    updatedAt: string,
    expenseSharedWithId?: string | null,
  } | null,
};
