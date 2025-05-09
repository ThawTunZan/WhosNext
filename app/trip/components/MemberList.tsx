import { View, Text, Pressable, StyleSheet } from "react-native";
import { Card, Button, TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

import { Member, MembersMap } from '@/src/types/DataTypes'; // Adjust path if needed

type MemberListProps = {
  members: { [id: string]: Member };
  onAddMember: (id: string, name: string, budget: number) => void;
  onRemoveMember: (name: string) => void;
};

export default function MemberList({ members, onAddMember, onRemoveMember }: MemberListProps) {
  const [newMember, setNewMember] = useState("");
  const [newMemberBudget, setNewMemberBudget] = useState(0);
  const [showAddCard, setShowAddCard] = useState(false);

  // Process the string input
  const handleAdd = () => {
    const trimmedName = newMember.trim();
    if (trimmedName && newMemberBudget > 0) {
      const memberId = `${trimmedName}-${Date.now()}`;
      onAddMember(memberId,trimmedName, newMemberBudget);
      setNewMember("");
      setNewMemberBudget(0);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>👥 Members:</Text>

      {(Object.entries(members) as [string, Member][]).map(([id, member]) => (
        <View key={id} style={styles.memberRow}>
          <Text>{member.name}</Text>
          <Pressable onPress={() => onRemoveMember(id)}>
            <Ionicons name="remove-circle-outline" size={20} color="red" />
          </Pressable>
        </View>  
      ))}


      <Button mode="contained" onPress={() => setShowAddCard(true)}>
        ADD A MEMBER
      </Button>
      {showAddCard && (
        <Card style={{ marginTop: 16, padding: 16 }}>
          <Card.Title title="Add New Member" />
          <Card.Content>
            <TextInput
              label="Member Name"
              value={newMember}
              onChangeText={setNewMember}
              style={{ marginBottom: 10 }}
            />
            <TextInput
              label="Budget"
              value={String(newMemberBudget)}
              onChangeText={(text) => setNewMemberBudget(Number(text))}
              keyboardType="numeric"
              style={{ marginBottom: 10 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Button onPress={() => setShowAddCard(false)}>Cancel</Button>
              <Button onPress={() => {
                handleAdd();
                setShowAddCard(false);
              }} mode="contained">
                Add
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}

    </View>
    
    
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 6,
    marginVertical: 10,
  },
});
