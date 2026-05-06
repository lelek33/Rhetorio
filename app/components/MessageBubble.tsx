import { StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";
import { ConversationMessage } from "../types/message";

type Props = {
  message: ConversationMessage;
};

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <View style={[styles.bubble, isUser ? styles.user : styles.assistant]}>
      <Text style={[styles.text, isUser && styles.userText]}>{message.content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: "88%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22
  },
  user: {
    alignSelf: "flex-end",
    backgroundColor: "#E5E8FF",
    borderWidth: 1,
    borderColor: "#D6DBFF",
    borderBottomRightRadius: 8
  },
  assistant: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFFE6",
    borderWidth: 1,
    borderColor: "#EEF0F5",
    borderBottomLeftRadius: 8
  },
  text: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21
  },
  userText: {
    color: "#1E2746"
  }
});
