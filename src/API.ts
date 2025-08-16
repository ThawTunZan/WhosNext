/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateUserInput = {
  id?: string | null,
  username: string,
  email: string,
  fullName: string,
  avatarUrl?: string | null,
  premiumStatus: PremiumStatus,
  friends?: Array< string | null > | null,
  trips?: Array< string | null > | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export enum PremiumStatus {
  free = "free",
  trial = "trial",
  premium = "premium",
}


export type ModelUserConditionInput = {
  username?: ModelStringInput | null,
  email?: ModelStringInput | null,
  fullName?: ModelStringInput | null,
  avatarUrl?: ModelStringInput | null,
  premiumStatus?: ModelPremiumStatusInput | null,
  friends?: ModelStringInput | null,
  trips?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelUserConditionInput | null > | null,
  or?: Array< ModelUserConditionInput | null > | null,
  not?: ModelUserConditionInput | null,
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

export type ModelPremiumStatusInput = {
  eq?: PremiumStatus | null,
  ne?: PremiumStatus | null,
};

export type User = {
  __typename: "User",
  id: string,
  username: string,
  email: string,
  fullName: string,
  avatarUrl?: string | null,
  premiumStatus: PremiumStatus,
  friends?: Array< string | null > | null,
  incomingFriendRequests?:  Array<FriendRequest | null > | null,
  outgoingFriendRequests?:  Array<FriendRequest | null > | null,
  trips?: Array< string | null > | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type FriendRequest = {
  __typename: "FriendRequest",
  id: string,
  username: string,
  status: RequestStatus,
  timestamp: string,
  createdAt: string,
  updatedAt: string,
};

export enum RequestStatus {
  pending = "pending",
  accepted = "accepted",
  rejected = "rejected",
}


export type UpdateUserInput = {
  id: string,
  username?: string | null,
  email?: string | null,
  fullName?: string | null,
  avatarUrl?: string | null,
  premiumStatus?: PremiumStatus | null,
  friends?: Array< string | null > | null,
  trips?: Array< string | null > | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type DeleteUserInput = {
  id: string,
};

export type CreateFriendRequestInput = {
  id?: string | null,
  username: string,
  status: RequestStatus,
  timestamp: string,
};

export type ModelFriendRequestConditionInput = {
  username?: ModelStringInput | null,
  status?: ModelRequestStatusInput | null,
  timestamp?: ModelStringInput | null,
  and?: Array< ModelFriendRequestConditionInput | null > | null,
  or?: Array< ModelFriendRequestConditionInput | null > | null,
  not?: ModelFriendRequestConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
};

export type ModelRequestStatusInput = {
  eq?: RequestStatus | null,
  ne?: RequestStatus | null,
};

export type UpdateFriendRequestInput = {
  id: string,
  username?: string | null,
  status?: RequestStatus | null,
  timestamp?: string | null,
};

export type DeleteFriendRequestInput = {
  id: string,
};

export type CreateTripInput = {
  id?: string | null,
  name: string,
  currency: string,
  createdBy: string,
  debts?: string | null,
  totalAmtLeft?: number | null,
  totalBudget?: number | null,
  startDate?: string | null,
  endDate?: string | null,
  isTripPremium: boolean,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type ModelTripConditionInput = {
  name?: ModelStringInput | null,
  currency?: ModelStringInput | null,
  createdBy?: ModelStringInput | null,
  debts?: ModelStringInput | null,
  totalAmtLeft?: ModelFloatInput | null,
  totalBudget?: ModelFloatInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  isTripPremium?: ModelBooleanInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelTripConditionInput | null > | null,
  or?: Array< ModelTripConditionInput | null > | null,
  not?: ModelTripConditionInput | null,
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

export type ModelBooleanInput = {
  ne?: boolean | null,
  eq?: boolean | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
};

export type Trip = {
  __typename: "Trip",
  id: string,
  name: string,
  currency: string,
  createdBy: string,
  members?: ModelMemberConnection | null,
  expenses?: ModelExpenseConnection | null,
  debts?: string | null,
  totalAmtLeft?: number | null,
  totalBudget?: number | null,
  startDate?: string | null,
  endDate?: string | null,
  isTripPremium: boolean,
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
  addMemberType?: AddMemberType | null,
  budget?: number | null,
  receiptsCount?: number | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export enum AddMemberType {
  friends = "friends",
  public = "public",
  private = "private",
}


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
  updatedAt?: string | null,
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
};

export type UpdateTripInput = {
  id: string,
  name?: string | null,
  currency?: string | null,
  createdBy?: string | null,
  debts?: string | null,
  totalAmtLeft?: number | null,
  totalBudget?: number | null,
  startDate?: string | null,
  endDate?: string | null,
  isTripPremium?: boolean | null,
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
  addMemberType?: AddMemberType | null,
  budget?: number | null,
  receiptsCount?: number | null,
  createdAt?: string | null,
  updatedAt?: string | null,
};

export type ModelMemberConditionInput = {
  username?: ModelStringInput | null,
  fullName?: ModelStringInput | null,
  tripId?: ModelIDInput | null,
  amtLeft?: ModelFloatInput | null,
  owesTotalMap?: ModelStringInput | null,
  addMemberType?: ModelAddMemberTypeInput | null,
  budget?: ModelFloatInput | null,
  receiptsCount?: ModelIntInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelMemberConditionInput | null > | null,
  or?: Array< ModelMemberConditionInput | null > | null,
  not?: ModelMemberConditionInput | null,
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

export type ModelAddMemberTypeInput = {
  eq?: AddMemberType | null,
  ne?: AddMemberType | null,
};

export type ModelIntInput = {
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

export type UpdateMemberInput = {
  id: string,
  username?: string | null,
  fullName?: string | null,
  tripId?: string | null,
  amtLeft?: number | null,
  owesTotalMap?: string | null,
  addMemberType?: AddMemberType | null,
  budget?: number | null,
  receiptsCount?: number | null,
  createdAt?: string | null,
  updatedAt?: string | null,
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
  updatedAt?: string | null,
};

export type ModelExpenseConditionInput = {
  tripId?: ModelIDInput | null,
  activityName?: ModelStringInput | null,
  amount?: ModelFloatInput | null,
  currency?: ModelStringInput | null,
  paidBy?: ModelStringInput | null,
  paidByAndAmounts?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelExpenseConditionInput | null > | null,
  or?: Array< ModelExpenseConditionInput | null > | null,
  not?: ModelExpenseConditionInput | null,
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
  updatedAt?: string | null,
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
};

export type UpdateExpenseShareInput = {
  id: string,
  expenseId?: string | null,
  payeeName?: string | null,
  amount?: number | null,
  currency?: string | null,
};

export type DeleteExpenseShareInput = {
  id: string,
};

export type ModelUserFilterInput = {
  id?: ModelIDInput | null,
  username?: ModelStringInput | null,
  email?: ModelStringInput | null,
  fullName?: ModelStringInput | null,
  avatarUrl?: ModelStringInput | null,
  premiumStatus?: ModelPremiumStatusInput | null,
  friends?: ModelStringInput | null,
  trips?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelUserFilterInput | null > | null,
  or?: Array< ModelUserFilterInput | null > | null,
  not?: ModelUserFilterInput | null,
};

export type ModelUserConnection = {
  __typename: "ModelUserConnection",
  items:  Array<User | null >,
  nextToken?: string | null,
};

export type ModelFriendRequestFilterInput = {
  id?: ModelIDInput | null,
  username?: ModelStringInput | null,
  status?: ModelRequestStatusInput | null,
  timestamp?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelFriendRequestFilterInput | null > | null,
  or?: Array< ModelFriendRequestFilterInput | null > | null,
  not?: ModelFriendRequestFilterInput | null,
};

export type ModelFriendRequestConnection = {
  __typename: "ModelFriendRequestConnection",
  items:  Array<FriendRequest | null >,
  nextToken?: string | null,
};

export type ModelTripFilterInput = {
  id?: ModelIDInput | null,
  name?: ModelStringInput | null,
  currency?: ModelStringInput | null,
  createdBy?: ModelStringInput | null,
  debts?: ModelStringInput | null,
  totalAmtLeft?: ModelFloatInput | null,
  totalBudget?: ModelFloatInput | null,
  startDate?: ModelStringInput | null,
  endDate?: ModelStringInput | null,
  isTripPremium?: ModelBooleanInput | null,
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
  addMemberType?: ModelAddMemberTypeInput | null,
  budget?: ModelFloatInput | null,
  receiptsCount?: ModelIntInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelMemberFilterInput | null > | null,
  or?: Array< ModelMemberFilterInput | null > | null,
  not?: ModelMemberFilterInput | null,
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
};

export enum ModelSortDirection {
  ASC = "ASC",
  DESC = "DESC",
}


export type ModelSubscriptionUserFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  username?: ModelSubscriptionStringInput | null,
  email?: ModelSubscriptionStringInput | null,
  fullName?: ModelSubscriptionStringInput | null,
  avatarUrl?: ModelSubscriptionStringInput | null,
  premiumStatus?: ModelSubscriptionStringInput | null,
  friends?: ModelSubscriptionStringInput | null,
  trips?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionUserFilterInput | null > | null,
  or?: Array< ModelSubscriptionUserFilterInput | null > | null,
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

export type ModelSubscriptionFriendRequestFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  username?: ModelSubscriptionStringInput | null,
  status?: ModelSubscriptionStringInput | null,
  timestamp?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionFriendRequestFilterInput | null > | null,
  or?: Array< ModelSubscriptionFriendRequestFilterInput | null > | null,
};

export type ModelSubscriptionTripFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  name?: ModelSubscriptionStringInput | null,
  currency?: ModelSubscriptionStringInput | null,
  createdBy?: ModelSubscriptionStringInput | null,
  debts?: ModelSubscriptionStringInput | null,
  totalAmtLeft?: ModelSubscriptionFloatInput | null,
  totalBudget?: ModelSubscriptionFloatInput | null,
  startDate?: ModelSubscriptionStringInput | null,
  endDate?: ModelSubscriptionStringInput | null,
  isTripPremium?: ModelSubscriptionBooleanInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionTripFilterInput | null > | null,
  or?: Array< ModelSubscriptionTripFilterInput | null > | null,
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

export type ModelSubscriptionBooleanInput = {
  ne?: boolean | null,
  eq?: boolean | null,
};

export type ModelSubscriptionMemberFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  username?: ModelSubscriptionStringInput | null,
  fullName?: ModelSubscriptionStringInput | null,
  tripId?: ModelSubscriptionIDInput | null,
  amtLeft?: ModelSubscriptionFloatInput | null,
  owesTotalMap?: ModelSubscriptionStringInput | null,
  addMemberType?: ModelSubscriptionStringInput | null,
  budget?: ModelSubscriptionFloatInput | null,
  receiptsCount?: ModelSubscriptionIntInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionMemberFilterInput | null > | null,
  or?: Array< ModelSubscriptionMemberFilterInput | null > | null,
};

export type ModelSubscriptionIntInput = {
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

export type CreateUserMutationVariables = {
  input: CreateUserInput,
  condition?: ModelUserConditionInput | null,
};

export type CreateUserMutation = {
  createUser?:  {
    __typename: "User",
    id: string,
    username: string,
    email: string,
    fullName: string,
    avatarUrl?: string | null,
    premiumStatus: PremiumStatus,
    friends?: Array< string | null > | null,
    incomingFriendRequests?:  Array< {
      __typename: "FriendRequest",
      id: string,
      username: string,
      status: RequestStatus,
      timestamp: string,
      createdAt: string,
      updatedAt: string,
    } | null > | null,
    outgoingFriendRequests?:  Array< {
      __typename: "FriendRequest",
      id: string,
      username: string,
      status: RequestStatus,
      timestamp: string,
      createdAt: string,
      updatedAt: string,
    } | null > | null,
    trips?: Array< string | null > | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type UpdateUserMutationVariables = {
  input: UpdateUserInput,
  condition?: ModelUserConditionInput | null,
};

export type UpdateUserMutation = {
  updateUser?:  {
    __typename: "User",
    id: string,
    username: string,
    email: string,
    fullName: string,
    avatarUrl?: string | null,
    premiumStatus: PremiumStatus,
    friends?: Array< string | null > | null,
    incomingFriendRequests?:  Array< {
      __typename: "FriendRequest",
      id: string,
      username: string,
      status: RequestStatus,
      timestamp: string,
      createdAt: string,
      updatedAt: string,
    } | null > | null,
    outgoingFriendRequests?:  Array< {
      __typename: "FriendRequest",
      id: string,
      username: string,
      status: RequestStatus,
      timestamp: string,
      createdAt: string,
      updatedAt: string,
    } | null > | null,
    trips?: Array< string | null > | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type DeleteUserMutationVariables = {
  input: DeleteUserInput,
  condition?: ModelUserConditionInput | null,
};

export type DeleteUserMutation = {
  deleteUser?:  {
    __typename: "User",
    id: string,
    username: string,
    email: string,
    fullName: string,
    avatarUrl?: string | null,
    premiumStatus: PremiumStatus,
    friends?: Array< string | null > | null,
    incomingFriendRequests?:  Array< {
      __typename: "FriendRequest",
      id: string,
      username: string,
      status: RequestStatus,
      timestamp: string,
      createdAt: string,
      updatedAt: string,
    } | null > | null,
    outgoingFriendRequests?:  Array< {
      __typename: "FriendRequest",
      id: string,
      username: string,
      status: RequestStatus,
      timestamp: string,
      createdAt: string,
      updatedAt: string,
    } | null > | null,
    trips?: Array< string | null > | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type CreateFriendRequestMutationVariables = {
  input: CreateFriendRequestInput,
  condition?: ModelFriendRequestConditionInput | null,
};

export type CreateFriendRequestMutation = {
  createFriendRequest?:  {
    __typename: "FriendRequest",
    id: string,
    username: string,
    status: RequestStatus,
    timestamp: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type UpdateFriendRequestMutationVariables = {
  input: UpdateFriendRequestInput,
  condition?: ModelFriendRequestConditionInput | null,
};

export type UpdateFriendRequestMutation = {
  updateFriendRequest?:  {
    __typename: "FriendRequest",
    id: string,
    username: string,
    status: RequestStatus,
    timestamp: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type DeleteFriendRequestMutationVariables = {
  input: DeleteFriendRequestInput,
  condition?: ModelFriendRequestConditionInput | null,
};

export type DeleteFriendRequestMutation = {
  deleteFriendRequest?:  {
    __typename: "FriendRequest",
    id: string,
    username: string,
    status: RequestStatus,
    timestamp: string,
    createdAt: string,
    updatedAt: string,
  } | null,
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
    createdBy: string,
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
    totalBudget?: number | null,
    startDate?: string | null,
    endDate?: string | null,
    isTripPremium: boolean,
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
    createdBy: string,
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
    totalBudget?: number | null,
    startDate?: string | null,
    endDate?: string | null,
    isTripPremium: boolean,
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
    createdBy: string,
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
    totalBudget?: number | null,
    startDate?: string | null,
    endDate?: string | null,
    isTripPremium: boolean,
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
      createdBy: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      totalBudget?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      isTripPremium: boolean,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    amtLeft?: number | null,
    owesTotalMap?: string | null,
    addMemberType?: AddMemberType | null,
    budget?: number | null,
    receiptsCount?: number | null,
    createdAt?: string | null,
    updatedAt?: string | null,
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
      createdBy: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      totalBudget?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      isTripPremium: boolean,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    amtLeft?: number | null,
    owesTotalMap?: string | null,
    addMemberType?: AddMemberType | null,
    budget?: number | null,
    receiptsCount?: number | null,
    createdAt?: string | null,
    updatedAt?: string | null,
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
      createdBy: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      totalBudget?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      isTripPremium: boolean,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    amtLeft?: number | null,
    owesTotalMap?: string | null,
    addMemberType?: AddMemberType | null,
    budget?: number | null,
    receiptsCount?: number | null,
    createdAt?: string | null,
    updatedAt?: string | null,
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
      createdBy: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      totalBudget?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      isTripPremium: boolean,
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
    updatedAt?: string | null,
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
      createdBy: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      totalBudget?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      isTripPremium: boolean,
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
    updatedAt?: string | null,
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
      createdBy: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      totalBudget?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      isTripPremium: boolean,
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
    updatedAt?: string | null,
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
      updatedAt?: string | null,
    } | null,
    payeeName: string,
    amount: number,
    currency: string,
    createdAt: string,
    updatedAt: string,
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
      updatedAt?: string | null,
    } | null,
    payeeName: string,
    amount: number,
    currency: string,
    createdAt: string,
    updatedAt: string,
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
      updatedAt?: string | null,
    } | null,
    payeeName: string,
    amount: number,
    currency: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type GetUserQueryVariables = {
  id: string,
};

export type GetUserQuery = {
  getUser?:  {
    __typename: "User",
    id: string,
    username: string,
    email: string,
    fullName: string,
    avatarUrl?: string | null,
    premiumStatus: PremiumStatus,
    friends?: Array< string | null > | null,
    incomingFriendRequests?:  Array< {
      __typename: "FriendRequest",
      id: string,
      username: string,
      status: RequestStatus,
      timestamp: string,
      createdAt: string,
      updatedAt: string,
    } | null > | null,
    outgoingFriendRequests?:  Array< {
      __typename: "FriendRequest",
      id: string,
      username: string,
      status: RequestStatus,
      timestamp: string,
      createdAt: string,
      updatedAt: string,
    } | null > | null,
    trips?: Array< string | null > | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type ListUsersQueryVariables = {
  filter?: ModelUserFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUsersQuery = {
  listUsers?:  {
    __typename: "ModelUserConnection",
    items:  Array< {
      __typename: "User",
      id: string,
      username: string,
      email: string,
      fullName: string,
      avatarUrl?: string | null,
      premiumStatus: PremiumStatus,
      friends?: Array< string | null > | null,
      trips?: Array< string | null > | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetFriendRequestQueryVariables = {
  id: string,
};

export type GetFriendRequestQuery = {
  getFriendRequest?:  {
    __typename: "FriendRequest",
    id: string,
    username: string,
    status: RequestStatus,
    timestamp: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type ListFriendRequestsQueryVariables = {
  filter?: ModelFriendRequestFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListFriendRequestsQuery = {
  listFriendRequests?:  {
    __typename: "ModelFriendRequestConnection",
    items:  Array< {
      __typename: "FriendRequest",
      id: string,
      username: string,
      status: RequestStatus,
      timestamp: string,
      createdAt: string,
      updatedAt: string,
    } | null >,
    nextToken?: string | null,
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
    createdBy: string,
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
    totalBudget?: number | null,
    startDate?: string | null,
    endDate?: string | null,
    isTripPremium: boolean,
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
      createdBy: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      totalBudget?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      isTripPremium: boolean,
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
      createdBy: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      totalBudget?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      isTripPremium: boolean,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    amtLeft?: number | null,
    owesTotalMap?: string | null,
    addMemberType?: AddMemberType | null,
    budget?: number | null,
    receiptsCount?: number | null,
    createdAt?: string | null,
    updatedAt?: string | null,
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
      addMemberType?: AddMemberType | null,
      budget?: number | null,
      receiptsCount?: number | null,
      createdAt?: string | null,
      updatedAt?: string | null,
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
      createdBy: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      totalBudget?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      isTripPremium: boolean,
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
    updatedAt?: string | null,
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
      updatedAt?: string | null,
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
      updatedAt?: string | null,
    } | null,
    payeeName: string,
    amount: number,
    currency: string,
    createdAt: string,
    updatedAt: string,
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
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetUserByUsernameQueryVariables = {
  username: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelUserFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type GetUserByUsernameQuery = {
  getUserByUsername?:  {
    __typename: "ModelUserConnection",
    items:  Array< {
      __typename: "User",
      id: string,
      username: string,
      email: string,
      fullName: string,
      avatarUrl?: string | null,
      premiumStatus: PremiumStatus,
      friends?: Array< string | null > | null,
      trips?: Array< string | null > | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetTripsByCreatorQueryVariables = {
  createdBy: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelTripFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type GetTripsByCreatorQuery = {
  getTripsByCreator?:  {
    __typename: "ModelTripConnection",
    items:  Array< {
      __typename: "Trip",
      id: string,
      name: string,
      currency: string,
      createdBy: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      totalBudget?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      isTripPremium: boolean,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetMembersByUsernameQueryVariables = {
  username: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelMemberFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type GetMembersByUsernameQuery = {
  getMembersByUsername?:  {
    __typename: "ModelMemberConnection",
    items:  Array< {
      __typename: "Member",
      id: string,
      username: string,
      fullName: string,
      tripId: string,
      amtLeft?: number | null,
      owesTotalMap?: string | null,
      addMemberType?: AddMemberType | null,
      budget?: number | null,
      receiptsCount?: number | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetMembersByTripQueryVariables = {
  tripId: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelMemberFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type GetMembersByTripQuery = {
  getMembersByTrip?:  {
    __typename: "ModelMemberConnection",
    items:  Array< {
      __typename: "Member",
      id: string,
      username: string,
      fullName: string,
      tripId: string,
      amtLeft?: number | null,
      owesTotalMap?: string | null,
      addMemberType?: AddMemberType | null,
      budget?: number | null,
      receiptsCount?: number | null,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetExpensesByTripQueryVariables = {
  tripId: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelExpenseFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type GetExpensesByTripQuery = {
  getExpensesByTrip?:  {
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
      updatedAt?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetSharesByExpenseQueryVariables = {
  expenseId: string,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelExpenseShareFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type GetSharesByExpenseQuery = {
  getSharesByExpense?:  {
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
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type OnCreateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
};

export type OnCreateUserSubscription = {
  onCreateUser?:  {
    __typename: "User",
    id: string,
    username: string,
    email: string,
    fullName: string,
    avatarUrl?: string | null,
    premiumStatus: PremiumStatus,
    friends?: Array< string | null > | null,
    incomingFriendRequests?:  Array< {
      __typename: "FriendRequest",
      id: string,
      username: string,
      status: RequestStatus,
      timestamp: string,
      createdAt: string,
      updatedAt: string,
    } | null > | null,
    outgoingFriendRequests?:  Array< {
      __typename: "FriendRequest",
      id: string,
      username: string,
      status: RequestStatus,
      timestamp: string,
      createdAt: string,
      updatedAt: string,
    } | null > | null,
    trips?: Array< string | null > | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnUpdateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
};

export type OnUpdateUserSubscription = {
  onUpdateUser?:  {
    __typename: "User",
    id: string,
    username: string,
    email: string,
    fullName: string,
    avatarUrl?: string | null,
    premiumStatus: PremiumStatus,
    friends?: Array< string | null > | null,
    incomingFriendRequests?:  Array< {
      __typename: "FriendRequest",
      id: string,
      username: string,
      status: RequestStatus,
      timestamp: string,
      createdAt: string,
      updatedAt: string,
    } | null > | null,
    outgoingFriendRequests?:  Array< {
      __typename: "FriendRequest",
      id: string,
      username: string,
      status: RequestStatus,
      timestamp: string,
      createdAt: string,
      updatedAt: string,
    } | null > | null,
    trips?: Array< string | null > | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnDeleteUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
};

export type OnDeleteUserSubscription = {
  onDeleteUser?:  {
    __typename: "User",
    id: string,
    username: string,
    email: string,
    fullName: string,
    avatarUrl?: string | null,
    premiumStatus: PremiumStatus,
    friends?: Array< string | null > | null,
    incomingFriendRequests?:  Array< {
      __typename: "FriendRequest",
      id: string,
      username: string,
      status: RequestStatus,
      timestamp: string,
      createdAt: string,
      updatedAt: string,
    } | null > | null,
    outgoingFriendRequests?:  Array< {
      __typename: "FriendRequest",
      id: string,
      username: string,
      status: RequestStatus,
      timestamp: string,
      createdAt: string,
      updatedAt: string,
    } | null > | null,
    trips?: Array< string | null > | null,
    createdAt?: string | null,
    updatedAt?: string | null,
  } | null,
};

export type OnCreateFriendRequestSubscriptionVariables = {
  filter?: ModelSubscriptionFriendRequestFilterInput | null,
};

export type OnCreateFriendRequestSubscription = {
  onCreateFriendRequest?:  {
    __typename: "FriendRequest",
    id: string,
    username: string,
    status: RequestStatus,
    timestamp: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnUpdateFriendRequestSubscriptionVariables = {
  filter?: ModelSubscriptionFriendRequestFilterInput | null,
};

export type OnUpdateFriendRequestSubscription = {
  onUpdateFriendRequest?:  {
    __typename: "FriendRequest",
    id: string,
    username: string,
    status: RequestStatus,
    timestamp: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};

export type OnDeleteFriendRequestSubscriptionVariables = {
  filter?: ModelSubscriptionFriendRequestFilterInput | null,
};

export type OnDeleteFriendRequestSubscription = {
  onDeleteFriendRequest?:  {
    __typename: "FriendRequest",
    id: string,
    username: string,
    status: RequestStatus,
    timestamp: string,
    createdAt: string,
    updatedAt: string,
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
    createdBy: string,
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
    totalBudget?: number | null,
    startDate?: string | null,
    endDate?: string | null,
    isTripPremium: boolean,
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
    createdBy: string,
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
    totalBudget?: number | null,
    startDate?: string | null,
    endDate?: string | null,
    isTripPremium: boolean,
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
    createdBy: string,
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
    totalBudget?: number | null,
    startDate?: string | null,
    endDate?: string | null,
    isTripPremium: boolean,
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
      createdBy: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      totalBudget?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      isTripPremium: boolean,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    amtLeft?: number | null,
    owesTotalMap?: string | null,
    addMemberType?: AddMemberType | null,
    budget?: number | null,
    receiptsCount?: number | null,
    createdAt?: string | null,
    updatedAt?: string | null,
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
      createdBy: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      totalBudget?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      isTripPremium: boolean,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    amtLeft?: number | null,
    owesTotalMap?: string | null,
    addMemberType?: AddMemberType | null,
    budget?: number | null,
    receiptsCount?: number | null,
    createdAt?: string | null,
    updatedAt?: string | null,
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
      createdBy: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      totalBudget?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      isTripPremium: boolean,
      createdAt?: string | null,
      updatedAt?: string | null,
    } | null,
    amtLeft?: number | null,
    owesTotalMap?: string | null,
    addMemberType?: AddMemberType | null,
    budget?: number | null,
    receiptsCount?: number | null,
    createdAt?: string | null,
    updatedAt?: string | null,
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
      createdBy: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      totalBudget?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      isTripPremium: boolean,
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
    updatedAt?: string | null,
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
      createdBy: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      totalBudget?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      isTripPremium: boolean,
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
    updatedAt?: string | null,
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
      createdBy: string,
      debts?: string | null,
      totalAmtLeft?: number | null,
      totalBudget?: number | null,
      startDate?: string | null,
      endDate?: string | null,
      isTripPremium: boolean,
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
    updatedAt?: string | null,
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
      updatedAt?: string | null,
    } | null,
    payeeName: string,
    amount: number,
    currency: string,
    createdAt: string,
    updatedAt: string,
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
      updatedAt?: string | null,
    } | null,
    payeeName: string,
    amount: number,
    currency: string,
    createdAt: string,
    updatedAt: string,
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
      updatedAt?: string | null,
    } | null,
    payeeName: string,
    amount: number,
    currency: string,
    createdAt: string,
    updatedAt: string,
  } | null,
};
